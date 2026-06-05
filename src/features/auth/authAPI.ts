import { apiClient } from '../../store/api-client';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
}

interface ReportSetting {
  isEnabled: boolean;
  frequency?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  reportSetting?: ReportSetting | null;
}

interface GoogleUserProfile {
  id?: string;
  email?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}

interface GoogleAuthCredentials {
  idToken?: string;
  accessToken?: string;
  user?: GoogleUserProfile | null;
}

const GOOGLE_AUTH_ENDPOINT = process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENDPOINT ?? '/auth/google';

interface RegisterResponse {
  message: string;
  data: {
    user: AuthUser;
    verificationRequired: boolean;
  };
}

interface VerifyOtpResponse {
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    reportSetting: ReportSetting | null;
    verified: boolean;
  };
}

export const authApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterCredentials>({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    googleLogin: builder.mutation<AuthResponse, GoogleAuthCredentials>({
      query: (credentials) => ({
        url: GOOGLE_AUTH_ENDPOINT,
        method: 'POST',
        body: {
          provider: 'google',
          ...credentials,
        },
      }),
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, { email: string; otp: string }>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    resendOtp: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body,
      }),
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<{ message: string }, { email: string; otp: string; password: string }>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    refresh: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/auth/refresh-token',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGoogleLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useRefreshMutation,
  useLogoutMutation,
} = authApi;
