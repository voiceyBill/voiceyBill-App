import { apiClient } from '../../store/api-client';

// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserResponse {
  message: string;
  data: {
    user: User;
  };
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  avatar?: string;
}

export const userApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query<{ message: string; data: { user: User } }, void>({
      query: () => ({
        url: '/user/profile',
        method: 'GET',
      }),
      providesTags: ['user'],
    }),

    updateUser: builder.mutation<UpdateUserResponse, FormData>({
      query: (formData) => ({
        url: '/user/update',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['user', 'transactions', 'analytics'],
    }),

    updateUserProfile: builder.mutation<UpdateUserResponse, UpdateUserPayload>({
      query: (payload) => ({
        url: '/user/update',
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['user'],
    }),

    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (payload) => ({
        url: '/user/change-password',
        method: 'PUT',
        body: payload,
      }),
    }),

    uploadAvatar: builder.mutation<UpdateUserResponse, FormData>({
      query: (formData) => ({
        url: '/user/upload-avatar',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['user'],
    }),

    sendDeleteAccountOtp: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/user/account/otp',
        method: 'POST',
      }),
    }),

    deleteUser: builder.mutation<{ message: string }, { otp: string }>({
      query: (payload) => ({
        url: '/user/account',
        method: 'DELETE',
        body: payload,
      }),
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useUpdateUserMutation,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
  useUploadAvatarMutation,
  useSendDeleteAccountOtpMutation,
  useDeleteUserMutation,
} = userApi;
