import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { getPosts } from "@/api/feed";
import { fetchUserProfile, followUser, unfollowUser } from "@/api/users";
import LeftSidebar from "@/components/LeftSidebar";
import { Navbar } from "@/components/Navbar";
import PostModal from "@/components/PostModal";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfilePostGrid } from "@/components/ProfilePostGrid";
import { Button } from "@/components/ui/button";
import { resolveDisplayName, resolveUserAvatar } from "@/lib/avatar";
import type { Post, ProfileSummary, PublicUserSummary } from "@/types/interface";

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: () => fetchUserProfile(username as string),
    enabled: Boolean(username),
    staleTime: 15_000,
  });

  const postsQuery = useQuery({
    queryKey: ["feed", "posts", "profile", username],
    queryFn: () => getPosts({ username: username as string }),
    enabled: Boolean(username),
    staleTime: 15_000,
  });

  const userPosts = postsQuery.data ?? ([] as Post[]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (data?.is_self) {
      navigate("/profile", { replace: true });
    }
  }, [data, navigate]);

  const profileSummary = useMemo<ProfileSummary | null>(() => {
    if (!data) {
      return null;
    }

    const postsTotal = userPosts.length || data.posts_count || 0;

    return {
      id: String(data.id),
      username: data.username,
      name: resolveDisplayName(data) || data.username,
      avatar: resolveUserAvatar(data, data.username),
      bio: data.profile.display_name || undefined,
      followers: data.followers_count,
      following: data.following_count,
      posts: postsTotal,
      isVerified: data.profile.email_verified,
      isSelf: data.is_self,
      isFollowing: data.is_following,
    };
  }, [data, userPosts.length]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!data) {
        throw new Error("Profile not loaded");
      }

      return data.is_following ? unfollowUser(data.username) : followUser(data.username);
    },
    onSuccess: (updated) => {
      const updater = (existing?: PublicUserSummary[]) =>
        existing?.map((item) => (item.username === updated.username ? updated : item));

      queryClient.setQueriesData<PublicUserSummary[]>({ queryKey: ["userSearch"] }, updater);
      queryClient.setQueryData<PublicUserSummary[]>(["userRecommendations"], (existing) => updater(existing));
      queryClient.setQueryData(["userProfile", updated.username], updated);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: () => {
      toast.error("Unable to update follow status. Please try again.");
    },
  });

  if (!username) {
    return null;
  }

  if (data?.is_self) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">We couldn’t find that profile.</p>
        <Button onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40 h-14">
        <div className="flex items-center justify-center h-full px-4 max-w-6xl mx-auto">
          <h2 className="text-lg font-semibold">{data.username}</h2>
        </div>
      </header>

      <div className="pt-16 lg:pt-20">
        <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 lg:px-6">
          <LeftSidebar />

          <main className="flex-1 space-y-6 pb-16 lg:pb-6">
            {profileSummary && (
              <ProfileHeader
                user={profileSummary}
                isOwnProfile={profileSummary.isSelf}
                onToggleFollow={() => mutation.mutate()}
                followLoading={mutation.isPending}
              />
            )}

            <section className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-3">
              <h3 className="text-lg font-semibold">About</h3>
              <p className="text-sm text-muted-foreground">
                {profileSummary?.bio || `${profileSummary?.name ?? data.username} hasn’t added a bio yet.`}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>{data.followers_count} follower{data.followers_count === 1 ? "" : "s"}</span>
                <span>{data.following_count} following</span>
                <span>{data.posts_count} posts</span>
              </div>
            </section>

            <div className="border-b border-border">
              <div className="flex">
                <button className="flex-1 py-3 flex items-center justify-center gap-2 border-b-2 border-foreground">
                  <span className="text-sm font-semibold">Posts</span>
                </button>
              </div>
            </div>

              {postsQuery.isError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  We couldn’t load posts for this profile.
                </div>
              )}

              <ProfilePostGrid
                posts={userPosts}
                isLoading={postsQuery.isLoading && !userPosts.length}
                emptyLabel="No posts from this user yet."
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

export default UserProfile;
