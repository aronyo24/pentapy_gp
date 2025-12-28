import { useQuery } from "@tanstack/react-query";

import { mockExplorePosts, currentUser } from "@/data/mockData";
import { searchUsers } from "@/api/users";
import { Avatar } from "./Avatar";
import UserResultCard from "@/components/UserResultCard";
import { useAuth } from "@/context/AuthContext";
import { resolveDisplayName, resolveUserAvatar } from "@/lib/avatar";

export const RightSidebar = () => {
  const { user } = useAuth();

  const avatarUrl = resolveUserAvatar(user);
  const username = user?.username ?? currentUser.username;
  const displayName = resolveDisplayName(user) || user?.email || currentUser.name;

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["userRecommendations"],
    queryFn: () => searchUsers(undefined, 12),
    staleTime: 60_000,
  });

  return (
    <aside className="hidden xl:flex flex-col w-80 p-4 sticky top-20 h-[calc(100vh-80px)] gap-4">
      <div className="bg-card rounded-lg p-3 shadow-soft-md">
        <div className="flex items-center gap-3">
          <Avatar src={avatarUrl} alt={username} />
          <div>
            <div className="font-semibold">{username}</div>
            <div className="text-sm text-muted-foreground">{displayName}</div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-3 shadow-soft-md">
        <h3 className="font-semibold mb-2">Who to follow</h3>
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading suggestions…</p>
          ) : recommendations.length ? (
            recommendations.slice(0, 4).map((person) => (
              <UserResultCard key={person.id} user={person} variant="compact" />
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No suggestions available right now.</p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg p-3 shadow-soft-md">
        <h3 className="font-semibold mb-2">Trending</h3>
        <div className="flex flex-wrap gap-2">
          {mockExplorePosts.slice(0, 8).map((src, i) => (
            <span key={i} className="text-sm px-2 py-1 rounded bg-secondary text-foreground">#tag{i + 1}</span>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
