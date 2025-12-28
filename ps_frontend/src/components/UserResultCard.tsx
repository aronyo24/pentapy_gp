import { MouseEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { followUser, unfollowUser } from "@/api/users";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { resolveDisplayName, resolveUserAvatar } from "@/lib/avatar";
import type { PublicUserSummary } from "@/types/interface";

interface UserResultCardProps {
  user: PublicUserSummary;
  variant?: "list" | "compact";
}

export const UserResultCard = ({ user, variant = "list" }: UserResultCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const displayName = resolveDisplayName(user) || user.username;
  const avatar = resolveUserAvatar(user, user.username);
  const bio = user.profile.display_name || displayName;
  const isSelf = user.is_self;

  const mutation = useMutation({
    mutationFn: () => (user.is_following ? unfollowUser(user.username) : followUser(user.username)),
    onSuccess: (updated) => {
      const updater = (existing?: PublicUserSummary[]) =>
        existing?.map((item) => (item.username === updated.username ? updated : item));

      queryClient.setQueriesData<PublicUserSummary[]>({ queryKey: ["userSearch"] }, updater);
      queryClient.setQueryData<PublicUserSummary[]>(["userRecommendations"], (existing) => updater(existing));
      queryClient.setQueryData<PublicUserSummary>(["userProfile", updated.username], updated);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: () => {
      toast.error("Unable to update follow status. Please try again.");
    },
  });

  const handleClick = () => {
    navigate(`/profile/${encodeURIComponent(user.username)}`);
  };

  const handleFollow = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    mutation.mutate();
  };

  const followLabel = user.is_following ? "Following" : "Follow";
  const followDisabled = mutation.isPending;

  if (variant === "compact") {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-base hover:bg-card/80 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <Avatar src={avatar} alt={user.username} size="sm" />
          <div>
            <div className="text-sm font-semibold text-foreground">{displayName}</div>
            <div className="text-xs text-muted-foreground">@{user.username}</div>
          </div>
        </div>
        {!isSelf && (
          <Button size="sm" variant={user.is_following ? "secondary" : "default"} onClick={handleFollow} disabled={followDisabled}>
            {followDisabled ? "…" : followLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-soft-md transition-base hover:bg-card/90 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        <Avatar src={avatar} alt={user.username} size="lg" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">{displayName}</span>
            <span className="text-sm text-muted-foreground">@{user.username}</span>
          </div>
          {bio && <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">{bio}</p>}
          <p className="text-xs text-muted-foreground">
            {user.followers_count} follower{user.followers_count === 1 ? "" : "s"} · {user.following_count} following
          </p>
        </div>
      </div>
      {!isSelf && (
        <Button
          variant={user.is_following ? "secondary" : "default"}
          className="min-w-[120px]"
          onClick={handleFollow}
          disabled={followDisabled}
        >
          {followDisabled ? "Please wait…" : followLabel}
        </Button>
      )}
    </div>
  );
};

export default UserResultCard;
