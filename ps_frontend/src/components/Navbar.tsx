import { Home, Search, PlusSquare, Bell, User } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";

export const Navbar = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications({ enabled: Boolean(user) });
  const formattedUnread = unreadCount > 99 ? "99+" : String(unreadCount);

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Search, label: "Explore", path: "/explore" },
    { icon: PlusSquare, label: "Create", path: "/create" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 md:hidden shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground transition-smooth group"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "p-2 rounded-xl transition-all relative",
                    isActive ? "bg-primary/10" : "group-hover:bg-secondary"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-6 w-6 transition-all",
                      isActive && "stroke-[2.5px]"
                    )}
                  />
                  {item.path === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-h-[16px] min-w-[16px] rounded-full bg-primary text-[10px] font-semibold text-primary-foreground px-1 flex items-center justify-center shadow">
                      {formattedUnread}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
