import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useGoogleLoginMutation } from '../authAPI';
import { setCredentials } from '../authSlice';
import { setRefreshToken } from '../../../lib/tokenStorage';
import { useAppDispatch } from '../../../store/hooks';

WebBrowser.maybeCompleteAuthSession();

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
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  scopes: ['openid', 'profile', 'email'],
  selectAccount: true,
};

const getGoogleProfile = async (accessToken?: string): Promise<GoogleProfile | null> => {
  if (!accessToken) return null;

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

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
  if (typeof message === 'string' && message.trim()) return message;
  if (error?.status === 'FETCH_ERROR') return 'Network error. Check your connection and try again.';
  return 'Google sign-in failed. Please try again.';
};

export const useGoogleAuth = () => {
  const dispatch = useAppDispatch();
  const [googleLogin, { isLoading: isExchangingToken }] = useGoogleLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [isPrompting, setIsPrompting] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleConfig);

  const isConfigured = useMemo(
    () => Boolean(googleConfig.webClientId && googleConfig.androidClientId && googleConfig.iosClientId),
    []
  );

  useEffect(() => {
    let isMounted = true;

    const completeGoogleAuth = async () => {
      if (!response || response.type !== 'success') return;

      const idToken = response.params.id_token;
      const accessToken = response.authentication?.accessToken ?? response.params.access_token;

      if (!idToken && !accessToken) {
        setError('Google did not return a usable sign-in token.');
        setIsPrompting(false);
        return;
      }

      try {
        const profile = await getGoogleProfile(accessToken);
        const authResult = await googleLogin({ idToken, accessToken, user: profile }).unwrap();

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
      setError('Google sign-in is not configured for this app.');
      return;
    }

    if (!request) {
      setError('Google sign-in is still loading. Please try again in a moment.');
      return;
    }

    if (request.redirectUri.startsWith('exp://')) {
      setError('Google sign-in needs an Expo development build. Expo Go cannot use the native Google OAuth redirect.');
      return;
    }

    setIsPrompting(true);
    try {
      const result = await promptAsync();

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setError('Google sign-in was cancelled.');
        setIsPrompting(false);
        return;
      }

      if (result.type !== 'success') {
        setError('Google sign-in did not complete. Please try again.');
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
