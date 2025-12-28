import { useMemo } from "react";
import {
  Sparkles,
  BarChart3,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Users2,
  ArrowUpRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Topbar } from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/Avatar";
import { resolveDisplayName, resolveUserAvatar } from "@/lib/avatar";
import { useAuth } from "@/context/AuthContext";
import { getPosts } from "@/api/feed";
import { fetchUserProfile } from "@/api/users";
import type { Post } from "@/types/interface";

const Lists = () => {
  const { user } = useAuth();

  const postsQuery = useQuery({
    queryKey: ["activity", "posts", user?.id],
    queryFn: () => getPosts({ userId: user!.id }),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  const profileQuery = useQuery({
    queryKey: ["activity", "profile", user?.username],
    queryFn: () => fetchUserProfile(user!.username),
    enabled: Boolean(user?.username),
    staleTime: 60_000,
  });

  const posts = postsQuery.data ?? ([] as Post[]);

  const activitySummary = useMemo(() => {
    const totals = posts.reduce(
      (acc, post) => {
        acc.totalLikes += post.likes_count;
        acc.totalComments += post.comments_count;
        acc.totalShares += post.shares_count;
        acc.totalBookmarks += post.bookmarks_count;
        return acc;
      },
      {
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalBookmarks: 0,
      },
    );

    const top = posts.reduce<{ post: Post | null; engagement: number }>((best, post) => {
      const engagement = post.likes_count + post.comments_count + post.shares_count + post.bookmarks_count;
      if (!best.post || engagement > best.engagement) {
        return { post, engagement };
      }
      return best;
    }, { post: null, engagement: 0 });

    return {
      totalPosts: posts.length,
      totalLikes: totals.totalLikes,
      totalComments: totals.totalComments,
      totalShares: totals.totalShares,
      totalBookmarks: totals.totalBookmarks,
      followers: profileQuery.data?.followers_count ?? 0,
      following: profileQuery.data?.following_count ?? 0,
      publishedPosts: profileQuery.data?.posts_count ?? posts.length,
      topPost: top.post,
      topEngagement: top.engagement,
    };
  }, [posts, profileQuery.data]);

  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [posts]);

  const topPosts = useMemo(() => {
    return [...posts]
      .sort(
        (a, b) =>
          b.likes_count + b.comments_count + b.shares_count + b.bookmarks_count -
          (a.likes_count + a.comments_count + a.shares_count + a.bookmarks_count),
      )
      .slice(0, 3);
  }, [posts]);

  const displayName = profileQuery.data?.display_name || resolveDisplayName(user) || user?.username || "";
  const avatar = resolveUserAvatar(profileQuery.data ?? user ?? undefined, user?.username);
  const username = profileQuery.data?.username || user?.username || "";

  const formatNumber = (value: number) => value.toLocaleString();

  const getPostTitle = (post: Post) => {
    if (post.caption?.trim()) {
      return post.caption.length > 90 ? `${post.caption.slice(0, 87)}…` : post.caption;
    }
    if (post.video) {
      return "Video upload";
    }
    if (post.image) {
      return "Photo update";
    }
    return "Untitled post";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Topbar />

      <div className="pt-16 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[240px,1fr,320px] gap-6">
        <LeftSidebar />

        <main className="pt-4 space-y-6">
          <section className="bg-card border border-border rounded-2xl shadow-soft-md overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar src={avatar} alt={displayName} size="lg" className="border border-border shadow-md" />
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Sparkles size={14} /> Activity hub
                  </span>
                  <div>
                    <h1 className="text-3xl font-semibold text-foreground">{displayName}</h1>
                    <p className="text-sm text-muted-foreground">{username ? `@${username}` : ""}</p>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    Track how your work performs across Pentapy. Review total reach, engagement, and key posts before planning your next drop.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Users2 size={16} />
                      <span>{formatNumber(activitySummary.followers)} followers</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{formatNumber(activitySummary.following)} following</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/profile">
                    View profile
                    <ArrowUpRight size={16} className="ml-1" />
                  </Link>
                </Button>
                {postsQuery.isLoading || profileQuery.isLoading ? (
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading activity…
                  </div>
                ) : (
                  <div className="text-right text-sm text-muted-foreground">
                    Last updated just now
                  </div>
                )}
              </div>
            </div>
          </section>






        </main>

        <RightSidebar />
      </div>

      <Navbar />
    </div>
  );
};

export default Lists;
