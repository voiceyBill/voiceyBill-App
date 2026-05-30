import { apiClient } from "../../store/api-client";

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
    getCurrentUser: builder.query<
      { message: string; data: { user: User } },
      void
    >({
      query: () => ({
        url: "/user/profile",
        method: "GET",
      }),
      providesTags: ["user"],
    }),

    updateUser: builder.mutation<UpdateUserResponse, FormData>({
      query: (formData) => ({
        url: "/user/update",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["user"],
    }),

    updateUserProfile: builder.mutation<UpdateUserResponse, UpdateUserPayload>({
      query: (payload) => ({
        url: "/user/update",
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["user"],
    }),

    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (payload) => ({
        url: "/user/change-password",
        method: "PUT",
        body: payload,
      }),
    }),

    uploadAvatar: builder.mutation<UpdateUserResponse, FormData>({
      query: (formData) => ({
        url: "/user/upload-avatar",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["user"],
    }),

    registerPushToken: builder.mutation<
      { message: string },
      { token: string; platform: "ANDROID" | "IOS"; deviceId?: string }
    >({
      query: (payload) => ({
        url: "/user/push-token",
        method: "POST",
        body: payload,
      }),
    }),

    unregisterPushToken: builder.mutation<
      { message: string },
      { token: string }
    >({
      query: (payload) => ({
        url: "/user/push-token",
        method: "DELETE",
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
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
} = userApi;
