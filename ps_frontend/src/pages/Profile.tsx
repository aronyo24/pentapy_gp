import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Grid3x3 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { updateProfile } from "@/api/auth";
import { getPosts } from "@/api/feed";
import { fetchUserProfile } from "@/api/users";
import { Avatar } from "@/components/Avatar";
import LeftSidebar from "@/components/LeftSidebar";
import { Navbar } from "@/components/Navbar";
import PostModal from "@/components/PostModal";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfilePostGrid } from "@/components/ProfilePostGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { resolveDisplayName, resolveUserAvatar } from "@/lib/avatar";
import type { Post, ProfileSummary } from "@/types/interface";

const Profile = () => {
  const navigate = useNavigate();
  const { user, refresh, logout, loading, refreshing } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const username = user?.username;
  const {
    data: publicProfile,
    isFetching: profileFetching,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: () => fetchUserProfile(username as string),
    enabled: Boolean(username),
    staleTime: 30_000,
  });

  const hasStoredAvatar = Boolean(user?.profile.avatar || publicProfile?.profile.avatar);

  const postsQuery = useQuery({
    queryKey: ["feed", "posts", "profile", username],
    queryFn: () => getPosts({ username: username as string }),
    enabled: Boolean(username),
    staleTime: 15_000,
  });

  const userPosts = postsQuery.data ?? ([] as Post[]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setDisplayName(user.profile.display_name ?? "");
      setPhoneNumber(user.profile.phone_number ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (isEditing && user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setDisplayName(user.profile.display_name ?? "");
      setPhoneNumber(user.profile.phone_number ?? "");
      setAvatarFile(null);
      setAvatarPreview(null);
      setRemoveAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isEditing, user]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!user && !loading) {
      void refresh();
    }
  }, [user, loading, refresh]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async ({ detail }) => {
      toast.success(detail ?? "Profile updated successfully");
      await refresh();
      if (username) {
        await queryClient.invalidateQueries({ queryKey: ["userProfile", username] });
      }
      await postsQuery.refetch();
      setAvatarFile(null);
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(null);
      setRemoveAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Unable to update profile. Please try again.");
    },
  });

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setRemoveAvatar(false);
    } else {
      setAvatarFile(null);
      setAvatarPreview(null);
    }

    event.target.value = "";
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    if (avatarFile) {
      setAvatarFile(null);
      setAvatarPreview(null);
      setRemoveAvatar(false);
    } else if (hasStoredAvatar) {
      setRemoveAvatar((prev) => !prev);
      setAvatarPreview(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      phone_number: phoneNumber,
      avatar: avatarFile,
      remove_avatar: removeAvatar,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setDisplayName(user.profile.display_name ?? "");
      setPhoneNumber(user.profile.phone_number ?? "");
    }
  };

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

  const fallbackAvatar = useMemo(
    () => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.username ?? "pentapy")}`,
    [user?.username],
  );

  const profileUser = useMemo<ProfileSummary | null>(() => {
    if (!user) {
      return null;
    }

    const avatarSource = publicProfile ?? user;
    const avatar = resolveUserAvatar(avatarSource, user.username) || fallbackAvatar;
    const name = resolveDisplayName(avatarSource) || user.username;
    const bio = user.profile.display_name || publicProfile?.profile.display_name || undefined;
    const postsTotal = userPosts.length || publicProfile?.posts_count || 0;

    return {
      id: String(user.id),
      username: user.username,
      name,
      avatar,
      bio,
      followers: publicProfile?.followers_count ?? 0,
      following: publicProfile?.following_count ?? 0,
      posts: postsTotal,
      isVerified: user.profile.email_verified,
      isSelf: true,
      isFollowing: false,
    };
  }, [fallbackAvatar, publicProfile, user, userPosts.length]);

  const headerAvatarOverride = removeAvatar ? fallbackAvatar : avatarPreview ?? undefined;
  const editingAvatarPreview = removeAvatar ? fallbackAvatar : avatarPreview ?? profileUser?.avatar ?? fallbackAvatar;

  if (loading || refreshing || profileLoading || profileFetching || !profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40 h-14">
        <div className="flex items-center justify-center h-full px-4 max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold">{profileUser.username}</h2>
        </div>
      </header>

      <div className="pt-16 lg:pt-20">
        <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 lg:px-6">
          <LeftSidebar />

          <main className="flex-1 space-y-6 pb-16 lg:pb-6">
            <ProfileHeader
              user={profileUser}
              isOwnProfile
              onEditProfile={!isEditing ? () => setIsEditing(true) : undefined}
              avatarOverride={headerAvatarOverride}
            />

            <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
              <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Account details</h3>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (isEditing) {
                        handleCancelEdit();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    disabled={mutation.isPending}
                  >
                    {isEditing ? "Close" : "Edit profile"}
                  </Button>
                </div>

                {isEditing ? (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="avatar-upload">Profile photo</Label>
                      <div className="flex flex-wrap items-center gap-4">
                        <Avatar
                          src={editingAvatarPreview}
                          alt={`${profileUser.username} avatar`}
                          size="lg"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={fileInputRef}
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            Choose photo
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleRemoveAvatar}
                            disabled={!hasStoredAvatar && !avatarFile && !removeAvatar}
                          >
                            {removeAvatar ? "Undo remove" : "Remove photo"}
                          </Button>
                        </div>
                      </div>
                      {avatarFile && <p className="text-xs text-muted-foreground">Selected: {avatarFile.name}</p>}
                      {removeAvatar && hasStoredAvatar && (
                        <p className="text-xs text-muted-foreground">Current profile photo will be removed after saving.</p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input
                          id="first-name"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input
                          id="last-name"
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display-name">Display name</Label>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="How your profile appears"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone-number">Phone number</Label>
                      <Input
                        id="phone-number"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={mutation.isPending}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : "Save changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Full name:</span> {profileUser.name}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Display name:</span> {user.profile.display_name || "Not set"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Email:</span> {user.email}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Phone:</span> {user.profile.phone_number || "Not set"}
                    </p>
                  </div>
                )}
              </section>

              <aside className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Quick actions</h4>
                  <p className="text-sm text-muted-foreground">Manage your account, privacy and security.</p>
                </div>
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full" onClick={() => navigate("/settings")}>
                    Open settings
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </Button>
                </div>
              </aside>
            </div>

            <div className="border-b border-border">
              <div className="flex">
                <button className="flex-1 py-3 flex items-center justify-center gap-2 border-b-2 border-foreground">
                  <Grid3x3 className="h-5 w-5" />
                  <span className="text-sm font-semibold">Posts</span>
                </button>
              </div>
            </div>
              {postsQuery.isError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  We couldn’t load your posts. Try again in a moment.
                </div>
              )}

              <ProfilePostGrid
                posts={userPosts}
                isLoading={postsQuery.isLoading && !userPosts.length}
                emptyLabel="You haven’t shared any posts yet."
                onSelect={setSelectedPost}
              />
          </main>
        </div>
      </div>

      <Navbar />

        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
};

export default Profile;
