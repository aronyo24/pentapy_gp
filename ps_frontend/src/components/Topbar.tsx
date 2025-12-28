import { Bell, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { Avatar } from "./Avatar";
import { useAuth } from "@/context/AuthContext";
import { resolveDisplayName, resolveUserAvatar } from "@/lib/avatar";
import pentapy from '@/assets/pentapy-logo.svg';
import { useNotifications } from "@/hooks/useNotifications";

interface TopbarProps {
  showActions?: boolean;
}

export const Topbar = ({ showActions = true }: TopbarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications({ enabled: Boolean(user) });

  const avatarUrl = resolveUserAvatar(user);
  const displayName = resolveDisplayName(user);
  const username = user?.username ?? displayName ?? "profile";
  const hasUnread = unreadCount > 0;
  const formattedUnread = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <header className="fixed top-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-b border-border z-40 h-16 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 transition-smooth hover:opacity-90"
          aria-label="Go to home"
        >
          <h1 className="text-2xl font-extrabold tracking-tight  bg-clip-text text-transparent">
            PentaPy
            <img className="inline-block h-15 w-15 ml-1 -mt-1" src={pentapy} alt="PentaPy Logo" />
          </h1>
        </button>

        {showActions && (
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-full hover:bg-secondary transition-base relative"
              aria-label={hasUnread ? `Notifications (${formattedUnread} unread)` : "Notifications"}
            >
              <Bell className="h-5 w-5 text-foreground" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 min-h-[16px] min-w-[16px] rounded-full bg-primary text-[10px] font-semibold text-primary-foreground px-1 flex items-center justify-center shadow">
                  {formattedUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="p-2 rounded-full hover:bg-secondary transition-base"
              aria-label="Messages"
            >
              <Send className="h-5 w-5 text-foreground" />
            </button>

            <button onClick={() => navigate('/profile')} className="flex items-center gap-2 p-1 rounded-md hover:bg-secondary transition-base" aria-label="Open profile">
              <Avatar src={avatarUrl} alt={username} size="sm" />
              <span className="hidden md:inline text-sm font-medium text-foreground">{username}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
