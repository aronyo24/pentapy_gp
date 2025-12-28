import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "@/api/notifications";
import { followUser } from "@/api/users";
import type { NotificationItem } from "@/types/interface";
import { useNotifications, NOTIFICATIONS_QUERY_KEY } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";

const Notifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [pendingFollowId, setPendingFollowId] = useState<number | null>(null);

  const {
    notifications,
    isLoading,
    isError,
  } = useNotifications({ enabled: Boolean(user) });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Unable to mark notifications as read");
    },
  });

  const followBackMutation = useMutation({
    mutationFn: async ({ username, notificationId }: { username: string; notificationId: number }) => {
      await followUser(username);
      await markNotificationRead(notificationId);
      return username;
    },
    onSuccess: async (username) => {
      toast.success(`You are now following ${username}`);
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    onError: () => {
      toast.error("Unable to follow back. Please try again.");
    },
    onSettled: () => {
      setPendingFollowId(null);
    },
  });

  const formatRelativeTime = useMemo(() => {
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    return (isoDate: string) => {
      const target = new Date(isoDate);
      if (Number.isNaN(target.getTime())) {
        return "";
      }

      const now = new Date();
      const diffSeconds = Math.round((target.getTime() - now.getTime()) / 1000);
      const absSeconds = Math.abs(diffSeconds);

      const units: Array<{ limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
        { limit: 60, divisor: 1, unit: "second" },
        { limit: 3600, divisor: 60, unit: "minute" },
        { limit: 86_400, divisor: 3600, unit: "hour" },
        { limit: 604_800, divisor: 86_400, unit: "day" },
        { limit: 2_629_800, divisor: 604_800, unit: "week" },
        { limit: 31_557_600, divisor: 2_629_800, unit: "month" },
        { limit: Number.POSITIVE_INFINITY, divisor: 31_557_600, unit: "year" },
      ];

      for (const { limit, divisor, unit } of units) {
        if (absSeconds < limit) {
          const value = Math.round(diffSeconds / divisor);
          return formatter.format(value, unit);
        }
      }
      return formatter.format(0, "second");
    };
  }, []);

  const handleFollowBack = (notification: NotificationItem) => {
    setPendingFollowId(notification.id);
    followBackMutation.mutate({
      username: notification.actor.username,
      notificationId: notification.id,
    });
  };

  const renderTimestamp = (notification: NotificationItem) => {
    const relative = formatRelativeTime(notification.created_at);
    if (!relative) {
      return new Date(notification.created_at).toLocaleString();
    }
    return relative;
  };

  const content = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Unable to load notifications.</p>
        </div>
      );
    }

    if (!notifications.length) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">You have no notifications yet.</p>
        </div>
      );
    }

    return notifications.map((notification) => (
      <div
        key={notification.id}
        className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-base"
      >
        <Avatar
          src={notification.actor.avatar ?? undefined}
          alt={notification.actor.username}
        />
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-semibold">{notification.actor.display_name || notification.actor.username}</span>
            {' '}
            <span className="text-muted-foreground">{notification.message}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {renderTimestamp(notification)}
          </p>
        </div>
        {notification.notification_type === 'follow' && notification.can_follow_back && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleFollowBack(notification)}
            disabled={followBackMutation.isPending && pendingFollowId === notification.id}
          >
            {followBackMutation.isPending && pendingFollowId === notification.id ? 'Following...' : 'Follow Back'}
          </Button>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40 h-14">
        <div className="flex items-center h-full px-4 max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
      </header>

      <main className="pt-14 max-w-2xl mx-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || !notifications.length}
          >
            {markAllMutation.isPending ? 'Marking...' : 'Mark all read'}
          </Button>
        </div>
        <div className="divide-y divide-border">
          {content()}
        </div>
      </main>

      <Navbar />
    </div>
  );
};

export default Notifications;
