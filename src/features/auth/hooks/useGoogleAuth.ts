import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { useGoogleLoginMutation } from "../authAPI";
import { setCredentials } from "../authSlice";
import { setRefreshToken } from "../../../lib/tokenStorage";
import { useAppDispatch } from "../../../store/hooks";

// ─── Why we migrated away from expo-auth-session ─────────────────────────────
//
// expo-auth-session's Google provider opened a Chrome Custom Tab and relied on
// an OAuth redirect URI to return the auth code to the app.  Every redirect
// path is now blocked by Google:
//
//   • Android-type OAuth clients → Google removed custom URI scheme support:
//     "Custom URI schemes are no longer supported on Android and Chrome apps."
//
//   • Web application OAuth clients → Google Cloud Console rejects non-http/s
//     URIs: "Invalid Origin: must use either http or https as the scheme."
//
// @react-native-google-signin/google-signin uses the native Android Google
// Sign-In SDK (GmsCore).  Authentication is proved by the device-level
// package-name + SHA-1 fingerprint check that Google already has on file —
// no redirect URI, no browser, no Cloud Console configuration change needed.
//
// webClientId is still required so that Google returns an idToken the backend
// can verify with the Google Auth Library.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Expo Go compatibility ───────────────────────────────────────────────────
//
// @react-native-google-signin/google-signin ships a native module
// (RNGoogleSignin) that is NOT bundled in Expo Go.  A static `import` would run
// TurboModuleRegistry.getEnforcing('RNGoogleSignin') at module-load time and
// crash the entire app on boot in Expo Go (Invariant Violation, before any
// try/catch can help).  We therefore `require()` the package lazily inside a
// try/catch: in a dev-client / standalone build it loads normally; in Expo Go
// the require throws, we catch it, and Google Sign-In is disabled while every
// other feature (incl. email/password login) keeps working.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GoogleSignin: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let statusCodes: any;
let isErrorWithCode: ((e: unknown) => boolean) | undefined;
let isSuccessResponse: ((r: unknown) => boolean) | undefined;
let googleSignInAvailable = false;

try {
  // Lazy require (not a static import) so the native-module load happens here,
  // inside the try/catch, instead of crashing at module-evaluation time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const mod = require("@react-native-google-signin/google-signin");
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes;
  isErrorWithCode = mod.isErrorWithCode;
  isSuccessResponse = mod.isSuccessResponse;

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    ...(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID &&
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID !== "your_ios_client_id_here" && {
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      }),
    scopes: ["profile", "email"],
    offlineAccess: false,
  });
  googleSignInAvailable = true;
} catch (e) {
  // Expected in Expo Go (native module missing); also covers a missing iOS
  // client ID. Google Sign-In stays disabled; the rest of the app runs.
  console.warn(
    "[GoogleAuth] Native Google Sign-In unavailable — Google login disabled. " +
      "This is expected in Expo Go; use a development build for Google login.",
    e,
  );
}

// Fields match GoogleUserProfile in authAPI.ts (string | undefined, no null).
// The native SDK returns string | null for optional fields, so we convert
// null → undefined at the assignment site below.
type GoogleProfile = {
  id?: string;
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
};

const getFriendlyError = (err: unknown): string => {
  // ── Google Sign-In SDK errors (device-level) ────────────────────────────────
  if (isErrorWithCode && isErrorWithCode(err)) {
    switch ((err as any).code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return "Google sign-in was cancelled.";
      case statusCodes.IN_PROGRESS:
        return "Google sign-in is already in progress. Please wait.";
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return "Google Play Services is not available or outdated on this device.";
      default:
        // Unrecognised SDK error code — surface it in DEV so we can see it.
        if (__DEV__)
          return `Google SDK error (code: ${(err as any).code}). Check logs.`;
        return "Google sign-in failed. Please try again.";
    }
  }

  // ── Backend / network errors (RTK Query FetchBaseQueryError) ────────────────
  const e = err as any;

  // Network-level failures
  if (e?.status === "FETCH_ERROR")
    return "Network error. Check your connection and try again.";
  if (e?.status === "TIMEOUT_ERROR")
    return "Request timed out. Check your connection and try again.";

  // HTTP error — extract whatever message the backend returned
  const backendMessage =
    e?.data?.message ?? // { message: "..." }  — most common
    e?.data?.error ?? // { error: "..." }
    e?.data?.detail ?? // { detail: "..." }  — DRF / FastAPI style
    e?.message; // plain Error object

  if (typeof backendMessage === "string" && backendMessage.trim()) {
    return backendMessage;
  }

  // HTTP status code hint for developers
  if (__DEV__ && typeof e?.status === "number") {
    return `Server returned ${e.status}. Check logs for details.`;
  }

  return "Google sign-in failed. Please try again.";
};

export const useGoogleAuth = () => {
  const dispatch = useAppDispatch();
  const [googleLogin, { isLoading: isExchangingToken }] =
    useGoogleLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setError(null);

    // Native module isn't present (e.g. Expo Go) — fail fast with guidance.
    if (!googleSignInAvailable) {
      setError(
        "Google sign-in isn't available in Expo Go. Please use email & password, " +
          "or run a development build for Google login.",
      );
      return;
    }

    setIsSigningIn(true);

    try {
      // Verify Google Play Services are available (Android only — no-op on iOS).
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Opens the native Google account picker. No browser, no redirect URI.
      const response = await GoogleSignin.signIn();

      // v14 returns { type: 'success' | 'cancelled' | ..., data: ... }
      if (!isSuccessResponse!(response)) {
        setError("Google sign-in was cancelled.");
        return;
      }

      const idToken = response.data?.idToken ?? undefined;
      if (!idToken) {
        setError("Google did not return a sign-in token. Please try again.");
        return;
      }

      const googleUser = response.data?.user;
      const profile: GoogleProfile = {
        id: googleUser?.id,
        email: googleUser?.email,
        // The SDK returns string | null; coerce to string | undefined so the
        // type matches GoogleUserProfile in authAPI.ts.
        name: googleUser?.name ?? undefined,
        givenName: googleUser?.givenName ?? undefined,
        familyName: googleUser?.familyName ?? undefined,
        picture: googleUser?.photo ?? undefined,
      };

      // Exchange idToken for app credentials via the backend.
      const authResult = await googleLogin({ idToken, user: profile }).unwrap();
      await setRefreshToken(authResult.refreshToken);
      dispatch(setCredentials(authResult));
    } catch (err) {
      // Log the full error so we can diagnose backend/SDK failures.
      // Check Metro (dev build) or Logcat (production) for these lines.
      console.error("[GoogleAuth] sign-in failed:", err);
      if (__DEV__) {
        console.error(
          "[GoogleAuth] error detail:",
          JSON.stringify(err, null, 2),
        );
      }
      setError(getFriendlyError(err));
    } finally {
      setIsSigningIn(false);
    }
  }, [dispatch, googleLogin]);

  return {
    error,
    isGoogleReady:
      googleSignInAvailable &&
      Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) &&
      (Platform.OS !== "ios" ||
        (Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) &&
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID !==
            "your_ios_client_id_here")),
    isGoogleLoading: isSigningIn || isExchangingToken,
    signInWithGoogle,
  };
};
