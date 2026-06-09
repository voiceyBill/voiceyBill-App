import { useCallback, useEffect, useMemo, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { useGoogleLoginMutation } from "../authAPI";
import { setCredentials } from "../authSlice";
import { setRefreshToken } from "../../../lib/tokenStorage";
import { useAppDispatch } from "../../../store/hooks";

WebBrowser.maybeCompleteAuthSession();

// ─── Root-cause fix: Android redirect URI ────────────────────────────────────
//
// ERROR:  "Error 400: Custom URI scheme is not enabled for your Android client"
//
// WHY IT HAPPENS:
//   expo-auth-session v7 (SDK 54) computes the redirect URI inside
//   useAuthRequest() as:
//
//     makeRedirectUri({ native: `${Application.applicationId}:/oauthredirect` })
//     → "com.voiceybill.mobile:/oauthredirect"   (in EAS / bare builds)
//
//   This URI is then sent to Google's authorization endpoint as the
//   `redirect_uri` query parameter alongside `client_id = androidClientId`.
//
//   Google's OAuth server enforces a strict rule for Android-type OAuth clients
//   (created in Google Cloud Console → "Android" application type):
//   the ONLY accepted redirect_uri scheme is the CLIENT'S OWN reverse-domain:
//
//     com.googleusercontent.apps.{hash}:/...
//
//   "com.voiceybill.mobile" is the app's package name, NOT the reverse domain
//   of the Android client ID.  Google rejects it immediately with the 400.
//
// THE FIX:
//   Pass an explicit `redirectUri` in googleConfig that matches what Google's
//   Android client actually expects: the reverse-domain of the Android client ID.
//
//   "747929251420-lrvmm7c2vbm1g4f7shn2kgj4f9o8eq53.apps.googleusercontent.com"
//   → reverse split on "." →
//   "com.googleusercontent.apps.747929251420-lrvmm7c2vbm1g4f7shn2kgj4f9o8eq53"
//
//   makeRedirectUri({ native: "<scheme>:/oauthredirect" }) returns the `native`
//   value in Standalone / Bare builds (EAS production + dev-client) and falls
//   back to exp:// in Expo Go, which lets the Expo-Go guard message still fire.
//
// REQUIRED COMPANION CHANGE (app.json):
//   The "scheme" array must include the reverse-domain string so that Android's
//   intent-filter system routes the OAuth redirect back into this app when
//   Chrome Custom Tabs navigates to it.
//   See the "scheme" property change in app.json.
//
// NOTE – DEPRECATION WARNING:
//   Google.useIdTokenAuthRequest / expo-auth-session's Google provider is marked
//   @deprecated in SDK 54.  The officially recommended library is:
//   @react-native-google-signin/google-signin  (native, no redirect-URI issues).
//   Consider migrating once the immediate production issue is resolved.
// ─────────────────────────────────────────────────────────────────────────────

const _rawAndroidClientId =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";

/**
 * Reverses a Google OAuth client ID into its URI scheme form.
 *
 * "747929251420-abc.apps.googleusercontent.com"
 *   → "com.googleusercontent.apps.747929251420-abc"
 */
function deriveReverseScheme(clientId: string): string {
  if (!clientId) return "";
  // Split on ".", reverse the parts, rejoin.
  return clientId.split(".").reverse().join(".");
}

/**
 * On Android EAS/bare builds, returns the Google-spec reverse-domain redirect URI
 * that the Android OAuth client accepts.
 * On iOS or Expo Go, returns undefined so expo-auth-session falls back to its
 * own defaults (allowing the Expo-Go guard to remain effective).
 */
const androidRedirectUri: string | undefined =
  Platform.OS === "android" && _rawAndroidClientId
    ? makeRedirectUri({
        // "native" is used by makeRedirectUri in Standalone & Bare environments
        // (production EAS + dev-client builds). Falls back to exp:// in Expo Go.
        native: `${deriveReverseScheme(_rawAndroidClientId)}:/oauthredirect`,
      })
    : undefined;

// ─────────────────────────────────────────────────────────────────────────────

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

type GoogleProfile = {
  id?: string;
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
};

const googleConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  // Coerce empty-string env vars to undefined so invariantClientId doesn't throw
  // on platforms whose client isn't configured yet (e.g. iOS here).
  androidClientId: _rawAndroidClientId || undefined,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
  scopes: ["openid", "profile", "email"],
  selectAccount: true,
  // Overrides expo-auth-session's auto-computed redirect URI.
  // On Android: the Google-spec reverse-domain URI (see explanation above).
  // On iOS / Expo Go: undefined → expo-auth-session computes its own default.
  redirectUri: androidRedirectUri,
};

const getGoogleProfile = async (
  accessToken?: string,
): Promise<GoogleProfile | null> => {
  if (!accessToken) return null;

  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) return null;

  const user = (await response.json()) as GoogleUserInfo;
  return {
    id: user.sub,
    email: user.email,
    name: user.name,
    givenName: user.given_name,
    familyName: user.family_name,
    picture: user.picture,
  };
};

const getFriendlyGoogleError = (error: any) => {
  const message = error?.data?.message ?? error?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error?.status === "FETCH_ERROR")
    return "Network error. Check your connection and try again.";
  return "Google sign-in failed. Please try again.";
};

export const useGoogleAuth = () => {
  const dispatch = useAppDispatch();
  const [googleLogin, { isLoading: isExchangingToken }] =
    useGoogleLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [isPrompting, setIsPrompting] = useState(false);

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest(googleConfig);

  const isConfigured = useMemo(
    () => Boolean(googleConfig.webClientId && googleConfig.androidClientId),
    [],
  );

  // ── Temporary debug logging (remove before release) ────────────────────────
  // Logs fire in __DEV__ builds only (Metro dev server or EAS internal/preview).
  // They let you verify that the computed redirect URI matches what's registered
  // in the Google Cloud Console Android client before shipping.
  useEffect(() => {
    if (!__DEV__) return;
    console.log("[GoogleAuth] ── OAuth config snapshot ──────────────────");
    console.log("[GoogleAuth] platform              :", Platform.OS);
    console.log(
      "[GoogleAuth] webClientId           :",
      googleConfig.webClientId
        ? `${googleConfig.webClientId.slice(0, 24)}…`
        : "⚠  MISSING – check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
    );
    console.log(
      "[GoogleAuth] androidClientId       :",
      googleConfig.androidClientId
        ? `${googleConfig.androidClientId.slice(0, 30)}…`
        : "⚠  MISSING – check EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID",
    );
    console.log(
      "[GoogleAuth] iosClientId           :",
      googleConfig.iosClientId ??
        "(not set – iOS only, safe to ignore on Android)",
    );
    console.log(
      "[GoogleAuth] configured redirectUri:",
      googleConfig.redirectUri ??
        "(using expo-auth-session default – WRONG for Android client)",
    );
    console.log("[GoogleAuth] ─────────────────────────────────────────────");
  }, []);

  useEffect(() => {
    if (!__DEV__ || !request) return;
    console.log("[GoogleAuth] ── AuthRequest loaded ──────────────────────");
    console.log("[GoogleAuth] request.redirectUri   :", request.redirectUri);
    console.log(
      "[GoogleAuth] request.codeVerifier  :",
      request.codeVerifier
        ? `${request.codeVerifier.slice(0, 12)}… (length: ${request.codeVerifier.length})`
        : "none (implicit / IdToken flow)",
    );
    // Verify the redirect URI is the Google reverse-domain scheme, not the app scheme.
    // If it still shows "com.voiceybill.mobile:/oauthredirect" the explicit redirectUri
    // override in googleConfig did not take effect — check the env var is set.
    const expectedPrefix = "com.googleusercontent.apps.";
    const isCorrect = request.redirectUri.startsWith(expectedPrefix);
    console.log(
      "[GoogleAuth] redirectUri looks correct:",
      isCorrect
        ? "✓ YES – starts with com.googleusercontent.apps.*"
        : `✗ NO  – got "${request.redirectUri}" (Google will reject with Error 400)`,
    );
    console.log("[GoogleAuth] ─────────────────────────────────────────────");
  }, [request]);
  // ── End debug logging ──────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const completeGoogleAuth = async () => {
      if (!response || response.type !== "success") return;

      const idToken = response.params.id_token;
      const accessToken =
        response.authentication?.accessToken ?? response.params.access_token;

      if (!idToken && !accessToken) {
        setError("Google did not return a usable sign-in token.");
        setIsPrompting(false);
        return;
      }

      try {
        const profile = await getGoogleProfile(accessToken);
        const authResult = await googleLogin({
          idToken,
          accessToken,
          user: profile,
        }).unwrap();

        await setRefreshToken(authResult.refreshToken);
        dispatch(setCredentials(authResult));
      } catch (err) {
        if (isMounted) setError(getFriendlyGoogleError(err));
      } finally {
        if (isMounted) setIsPrompting(false);
      }
    };

    completeGoogleAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch, googleLogin, response]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);

    if (!isConfigured) {
      setError("Google sign-in is not configured for this app.");
      return;
    }

    if (!request) {
      setError(
        "Google sign-in is still loading. Please try again in a moment.",
      );
      return;
    }

    // Guard: if we're still in Expo Go the redirect URI will be exp://, which means
    // the reverse-domain scheme wasn't applied (makeRedirectUri fell back to exp://).
    // Google OAuth cannot complete in Expo Go because it requires a native build.
    if (request.redirectUri.startsWith("exp://")) {
      setError(
        "Google sign-in needs an Expo development build. Expo Go cannot use the native Google OAuth redirect.",
      );
      return;
    }

    setIsPrompting(true);
    try {
      const result = await promptAsync();

      if (result.type === "cancel" || result.type === "dismiss") {
        setError("Google sign-in was cancelled.");
        setIsPrompting(false);
        return;
      }

      if (result.type !== "success") {
        setError("Google sign-in did not complete. Please try again.");
        setIsPrompting(false);
        return;
      }
    } catch (err) {
      setError(getFriendlyGoogleError(err));
      setIsPrompting(false);
    }
  }, [isConfigured, promptAsync, request]);

  return {
    error,
    isGoogleLoading: isPrompting || isExchangingToken,
    isGoogleReady: Boolean(request) && isConfigured,
    signInWithGoogle,
  };
};
