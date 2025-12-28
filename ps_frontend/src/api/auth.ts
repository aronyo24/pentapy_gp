import axios from "axios";

import { apiClient } from "@/api/apiClient";
import type {
  AuthUser,
  LoginResponse,
  RegisterResponse,
  ResendOtpResponse,
  VerifyOtpPayload,
} from "@/types/interface";

const USER_DIRECTORY_BASE = "/userdirectory";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  password: string;
}

export type VerifyOtpRequest = VerifyOtpPayload;

export interface ResendOtpPayload {
  email?: string;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  email: string;
  otp_code: string;
  new_password: string;
  confirm_password: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone_number?: string;
  avatar?: File | null;
  remove_avatar?: boolean;
}

export const registerUser = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const { data } = await apiClient.post("/auth/register/", payload);
  return data;
};

export const loginUser = async (payload: LoginPayload): Promise<LoginResponse> => {
  const { data } = await apiClient.post("/auth/login/", payload);
  return data;
};

export const verifyOtp = async (payload: VerifyOtpRequest): Promise<{ detail: string }> => {
  const { data } = await apiClient.post("/auth/verify-otp/", payload);
  return data;
};

export const resendOtp = async (payload: ResendOtpPayload): Promise<ResendOtpResponse> => {
  const { data } = await apiClient.post("/auth/resend-otp/", payload);
  return data;
};

export const requestPasswordReset = async (
  payload: PasswordResetRequestPayload,
): Promise<{ detail: string }> => {
  const { data } = await apiClient.post("/auth/forgot-password/", payload);
  return data;
};

export const resetPassword = async (
  payload: PasswordResetConfirmPayload,
): Promise<{ detail: string }> => {
  const { data } = await apiClient.post("/auth/password-reset-verify/", payload);
  return data;
};

export const logoutUser = async (): Promise<{ detail: string }> => {
  const { data } = await apiClient.post("/auth/logout/");
  return data;
};

export const deleteAccount = async (): Promise<{ detail: string }> => {
  const { data } = await apiClient.delete("/auth/account/me/");
  return data;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<{ detail: string; user: AuthUser }> => {
  const formData = new FormData();

  if (payload.first_name !== undefined) {
    formData.append("first_name", payload.first_name);
  }
  if (payload.last_name !== undefined) {
    formData.append("last_name", payload.last_name);
  }
  if (payload.display_name !== undefined) {
    formData.append("display_name", payload.display_name);
  }
  if (payload.phone_number !== undefined) {
    formData.append("phone_number", payload.phone_number);
  }

  if (payload.avatar instanceof File) {
    formData.append("avatar", payload.avatar);
  }

  if (payload.remove_avatar) {
    formData.append("remove_avatar", "true");
  }

  const { data } = await apiClient.patch(`${USER_DIRECTORY_BASE}/profile/update/`, formData);
  return data;
};

export const fetchDashboard = async (): Promise<AuthUser | null> => {
  try {
    const { data } = await apiClient.get(`${USER_DIRECTORY_BASE}/dashboard/`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
};

export const getGoogleAuthUrl = (redirectPath = "/home"): string => {
  const baseUrl = import.meta.env.VITE_GOOGLE_LOGIN_URL ?? "http://localhost:8000/account/google/login/";
  const frontendOrigin = import.meta.env.VITE_FRONTEND_ORIGIN ?? window.location.origin;
  const url = new URL(baseUrl);
  url.searchParams.set("process", "login");

  if (redirectPath) {
    const resolvedRedirect = new URL(redirectPath, frontendOrigin).toString();
    url.searchParams.set("next", resolvedRedirect);
  }

  return url.toString();
};

export const ensureCsrfCookie = async (): Promise<void> => {
  try {
    await apiClient.get("/auth/home/");
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to prefetch CSRF cookie", error);
    }
  }
};
