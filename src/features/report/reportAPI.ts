import { apiClient } from '../../store/api-client';

export type ReportStatus = 'SENT' | 'PENDING' | 'FAILED' | 'NO_ACTIVITY';

export interface Report {
  _id: string;
  userId: string;
  period: string;
  sentDate: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllReportResponse {
  message: string;
  reports: Report[];
  pagination: {
    pageSize: number;
    pageNumber: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface UpdateReportSettingParams {
  isEnabled: boolean;
}

export const reportApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getAllReports: builder.query<
      GetAllReportResponse,
      { pageNumber?: number; pageSize?: number }
    >({
      query: (params) => {
        const { pageNumber = 1, pageSize = 10 } = params;
        return {
          url: '/report/all',
          method: 'GET',
          params: { pageNumber, pageSize },
        };
      },
      providesTags: ['reports'],
    }),

    updateReportSetting: builder.mutation<void, UpdateReportSettingParams>({
      query: (payload) => ({
        url: '/report/update-setting',
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['reports'],
    }),
  }),
});

export const {
  useGetAllReportsQuery,
  useUpdateReportSettingMutation,
} = reportApi;
