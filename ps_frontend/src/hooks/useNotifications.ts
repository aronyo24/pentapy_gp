import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchNotifications } from "@/api/notifications";
import type { NotificationItem } from "@/types/interface";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

interface UseNotificationsOptions {
  enabled?: boolean;
}

export const useNotifications = ({ enabled = true }: UseNotificationsOptions = {}) => {
  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    staleTime: 30_000,
    refetchInterval: enabled ? 20_000 : false,
    refetchOnWindowFocus: true,
    enabled,
  });

  const unreadCount = useMemo(
    () => (query.data ?? []).filter((notification) => !notification.is_read).length,
    [query.data],
  );

  return {
    ...query,
    notifications: query.data ?? ([] as NotificationItem[]),
    unreadCount,
  };
};
