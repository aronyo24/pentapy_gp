import { ArrowLeft, Moon, Lock, Bell, HelpCircle, LogOut, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { deleteAccount } from "@/api/auth";

const Settings = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async (response) => {
      toast.success(response?.detail ?? "Account deleted successfully");
      await logout();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to delete account. Please try again.";
      toast.error(message);
    },
  });

  const settingsItems = [
    { icon: Moon, label: "Dark Mode", hasSwitch: true },
    { icon: Lock, label: "Privacy" },
    { icon: Bell, label: "Notifications" },
    { icon: HelpCircle, label: "Help & Support" },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Unable to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteAccountMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(
      "This will permanently remove your account, messages, and posts. This action cannot be undone. Continue?",
    );

    if (!confirmed) {
      return;
    }

    deleteAccountMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40 h-14">
        <div className="flex items-center h-full px-4 max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
      </header>

      <main className="pt-14 max-w-2xl mx-auto">
        <div className="divide-y divide-border">
          {settingsItems.map((item) => {
            const content = (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                {item.hasSwitch ? (
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                ) : (
                  <span className="text-muted-foreground">›</span>
                )}
              </>
            );

            if (item.hasSwitch) {
              return (
                <div key={item.label} className="flex items-center justify-between w-full p-4">
                  {content}
                </div>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-base"
              >
                {content}
              </button>
            );
          })}

          {/* Delete account */}
          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-3 w-full p-4 hover:bg-destructive/10 transition-base text-destructive disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={deleteAccountMutation.isPending}
          >
            <Trash2 className="h-5 w-5" />
            <span>{deleteAccountMutation.isPending ? "Deleting account..." : "Delete Account"}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-4 hover:bg-muted/50 transition-base text-destructive disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoggingOut}
          >
            <LogOut className="h-5 w-5" />
            <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
