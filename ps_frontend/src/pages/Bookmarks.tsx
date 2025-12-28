import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getBookmarks } from "@/api/feed";
import { fetchUserProfile } from "@/api/users";
import LeftSidebar from "@/components/LeftSidebar";
import { Navbar } from "@/components/Navbar";
import PostModal from "@/components/PostModal";
import { ProfilePostGrid } from "@/components/ProfilePostGrid";
import RightSidebar from "@/components/RightSidebar";
import { Topbar } from "@/components/Topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import type { Post } from "@/types/interface";

const Bookmarks = () => {
  const { user } = useAuth();

  const bookmarksQuery = useQuery({
    queryKey: ["feed", "bookmarks"],
    queryFn: getBookmarks,
    staleTime: 30_000,
  });

  const profileQuery = useQuery({
    queryKey: ["userProfile", user?.username],
    queryFn: () => fetchUserProfile(user!.username),
    enabled: Boolean(user?.username),
    staleTime: 60_000,
  });

  const savedPosts = bookmarksQuery.data ?? ([] as Post[]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const activityStats = useMemo(() => {
    const totalSaves = savedPosts.length;
    const totalLikes = savedPosts.reduce((acc, post) => acc + post.likes_count, 0);
    const totalComments = savedPosts.reduce((acc, post) => acc + post.comments_count, 0);

    return {
      totalSaves,
      totalLikes,
      totalComments,
      followers: profileQuery.data?.followers_count ?? 0,
      following: profileQuery.data?.following_count ?? 0,
    };
  }, [profileQuery.data, savedPosts]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Topbar />

      <div className="pt-16 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[240px,1fr,320px] gap-6">
        <LeftSidebar />

        <main className="pt-4 space-y-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Bookmarks</h1>
            <p className="text-sm text-muted-foreground">
              Everything you have saved for later, plus a snapshot of your recent activity.
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity highlights</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Saved posts</p>
                <p className="text-xl font-semibold">{activityStats.totalSaves}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Likes on saved posts</p>
                <p className="text-xl font-semibold">{activityStats.totalLikes}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comments on saved posts</p>
                <p className="text-xl font-semibold">{activityStats.totalComments}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Followers • Following</p>
                <p className="text-xl font-semibold">
                  {activityStats.followers}
                  <span className="text-muted-foreground"> / </span>
                  {activityStats.following}
                </p>
              </div>
            </CardContent>
          </Card>

          <ProfilePostGrid
            posts={savedPosts}
            isLoading={bookmarksQuery.isLoading && !savedPosts.length}
            emptyLabel="You haven’t saved any posts yet. Tap the bookmark icon on a post to keep it here."
            onSelect={setSelectedPost}
          />
        </main>

        <RightSidebar />
      </div>

      <Navbar />

      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
};

export default Bookmarks;
