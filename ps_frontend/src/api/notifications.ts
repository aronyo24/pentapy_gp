import { apiClient } from "@/api/apiClient";
import type { NotificationItem } from "@/types/interface";

const USER_DIRECTORY_BASE = "/userdirectory";

export const fetchNotifications = async (): Promise<NotificationItem[]> => {
  const { data } = await apiClient.get<NotificationItem[]>(`${USER_DIRECTORY_BASE}/notifications/`);
  return data;
};

export const markNotificationRead = async (id: number): Promise<NotificationItem> => {
  const { data } = await apiClient.post<NotificationItem>(
    `${USER_DIRECTORY_BASE}/notifications/${id}/mark_read/`,
  );
  return data;
};

export const markAllNotificationsRead = async (): Promise<{ detail: string }> => {
  const { data } = await apiClient.post<{ detail: string }>(
    `${USER_DIRECTORY_BASE}/notifications/mark_all_read/`,
  );
  return data;
};
