import { apiClient } from "../../store/api-client";

export interface Category {
  _id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const categoryApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<{ message: string; data: Category[] }, void>({
      query: () => ({
        url: "/category",
        method: "GET",
      }),
      providesTags: ["categories"],
    }),

    createCategory: builder.mutation<
      { message: string; data: Category },
      { name: string; color: string }
    >({
      query: (body) => ({
        url: "/category",
        method: "POST",
        body,
      }),
      invalidatesTags: ["categories"],
    }),

    updateCategory: builder.mutation<
      { message: string; data: Category },
      { id: string; name: string; color: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/category/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["categories", "transactions", "analytics", "budget"],
    }),

    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["categories", "transactions", "analytics", "budget"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
