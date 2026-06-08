import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  baseCurrency?: string;
  createdAt: string;
}

export interface ReportSetting {
  isEnabled: boolean;
  frequency?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  reportSetting: ReportSetting | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  reportSetting: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; reportSetting?: ReportSetting | null }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.reportSetting = action.payload.reportSetting ?? null;
    },
    updateCredentials: (
      state,
      action: PayloadAction<{ reportSetting?: Partial<ReportSetting> }>
    ) => {
      if (action.payload.reportSetting) {
        state.reportSetting = state.reportSetting
          ? { ...state.reportSetting, ...action.payload.reportSetting }
          : (action.payload.reportSetting as ReportSetting);
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.reportSetting = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, updateCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
