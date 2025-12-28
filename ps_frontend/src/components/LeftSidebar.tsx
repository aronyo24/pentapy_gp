import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Compass, Film, MessageSquare, Bookmark, List, User } from "lucide-react";

import { searchUsers } from "@/api/users";
import UserResultCard from "@/components/UserResultCard";
import { NavLink } from "./NavLink";

export const LeftSidebar = () => {
  const items = [
    { icon: Home, label: "Home", to: "/home" },
    { icon: User, label: "Profile", to: "/profile" },
    { icon: Compass, label: "Explore", to: "/explore" },
    { icon: Film, label: "Videos", to: "/videos" },
    { icon: MessageSquare, label: "Messages", to: "/messages" },
    { icon: Bookmark, label: "Bookmarks", to: "/bookmarks" },
    { icon: List, label: "Activity", to: "/lists" },
  ];

  const {
    data: allUsers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["userDirectory"],
    queryFn: () => searchUsers(undefined, 50, true),
    staleTime: 60_000,
  });

  const communityUsers = useMemo(() => {
    if (!allUsers.length) {
      return [];
    }

    const sorted = [...allUsers];
    sorted.sort((a, b) => {
      if (a.is_self && !b.is_self) {
        return -1;
      }
      if (!a.is_self && b.is_self) {
        return 1;
      }
      return a.username.localeCompare(b.username);
    });

    return sorted;
  }, [allUsers]);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:w-60 xl:w-64 p-4 sticky top-20 h-[calc(100vh-80px)]">
      <div className="flex flex-col gap-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-base"
            activeClassName="bg-primary/10"
          >
            {({ isActive }) => (
              <>
                <it.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-foreground"}`} />
                <span className="font-medium">{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-card px-3 py-4 shadow-soft-md">
        <h3 className="text-sm font-semibold text-foreground mb-3">All users</h3>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading users…</p>
        ) : isError ? (
          <p className="text-xs text-muted-foreground">Unable to load users.</p>
        ) : communityUsers.length ? (
          <div className="space-y-2">
            {communityUsers.map((user) => (
              <UserResultCard key={user.id} user={user} variant="compact" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No users found.</p>
        )}
      </div> */}

      <div className="text-xs leading-relaxed pt-3 border-t border-border/60 text-muted-foreground">
        <div>© PentaPy</div>
        <a
          href="https://www.aronyomojumder.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-wrap items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Designed &amp; developed by</span>
          <span className="font-semibold text-primary hover:text-primary/90">Aronyo Mojumder</span>
        </a>
      </div>
    </aside>
  );
};

export default LeftSidebar;
