import { apiClient } from "@/api/apiClient";
import type { PublicUserSummary } from "@/types/interface";

const USER_DIRECTORY_BASE = "/userdirectory";

const encodeUsername = (username: string) => encodeURIComponent(username);

export const searchUsers = async (
  query?: string,
  limit?: number,
  includeSelf = false,
): Promise<PublicUserSummary[]> => {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (limit !== undefined) {
    params.set("limit", String(limit));
  }
  if (includeSelf) {
    params.set("include_self", "true");
  }

  const queryString = params.toString();
  const path = queryString
    ? `${USER_DIRECTORY_BASE}/users/?${queryString}`
    : `${USER_DIRECTORY_BASE}/users/`;
  const { data } = await apiClient.get<PublicUserSummary[]>(path);
  return data;
};

export const fetchUserProfile = async (username: string): Promise<PublicUserSummary> => {
  const { data } = await apiClient.get<PublicUserSummary>(
    `${USER_DIRECTORY_BASE}/users/${encodeUsername(username)}/`,
  );
  return data;
};

export const followUser = async (username: string): Promise<PublicUserSummary> => {
  const { data } = await apiClient.post<PublicUserSummary>(
    `${USER_DIRECTORY_BASE}/users/${encodeUsername(username)}/follow/`,
  );
  return data;
};

export const unfollowUser = async (username: string): Promise<PublicUserSummary> => {
  const { data } = await apiClient.post<PublicUserSummary>(
    `${USER_DIRECTORY_BASE}/users/${encodeUsername(username)}/unfollow/`,
  );
  return data;
};
