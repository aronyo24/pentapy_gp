import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Clapperboard,
  Flame,
  Heart,
  Hash,
  Maximize2,
  MessageCircle,
  Pause,
  Play,
  PlayCircle,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { Topbar } from "@/components/Topbar";
import LeftSidebar from "@/components/LeftSidebar";
import { Navbar } from "@/components/Navbar";
import { getPosts } from "@/api/feed";
import type { Post } from "@/types/interface";
import { Avatar } from "@/components/Avatar";
import { resolveUserAvatar } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

type SortOption = "recent" | "engagement";

type TaggedUser = NonNullable<Post["tagged_users"]>[number];

interface VideoFeedItemProps {
  post: Post;
  avatarSrc: string;
  uploadedAgo: string;
  isTrending: boolean;
  engagement: number;
  hashtags: string[];
  taggedUsers: TaggedUser[];
  onRequestNext: () => void;
  onRequestPrevious: () => void;
}

const VideoFeedItem = ({
  post,
  avatarSrc,
  uploadedAgo,
  isTrending,
  engagement,
  hashtags,
  taggedUsers,
  onRequestNext,
  onRequestPrevious,
}: VideoFeedItemProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fitMode, setFitMode] = useState<"contain" | "fill">("contain");

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo) {
      return undefined;
    }

    const playPromise = currentVideo.play();
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(!currentVideo.paused);
    }

    return () => {
      currentVideo.pause();
      currentVideo.currentTime = 0;
      setIsPlaying(false);
    };
  }, [post.id]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const togglePlayback = useCallback(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo) {
      return;
    }

    if (currentVideo.paused) {
      const playPromise = currentVideo.play();
      if (playPromise) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
      }
    } else {
      currentVideo.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleNextVideo = useCallback(() => {
    onRequestNext();
  }, [onRequestNext]);

  const handlePreviousVideo = useCallback(() => {
    onRequestPrevious();
  }, [onRequestPrevious]);

  useEffect(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo) {
      return undefined;
    }

    const onEnded = () => {
      setIsPlaying(false);
      onRequestNext();
    };

    currentVideo.addEventListener("ended", onEnded);
    return () => currentVideo.removeEventListener("ended", onEnded);
  }, [onRequestNext]);

  return (
    <article
      ref={containerRef}
      className="relative flex flex-col overflow-hidden rounded-[32px] border border-border/60 bg-black/90 shadow-2xl ring-1 ring-border/40 backdrop-blur-xl"
      style={{ minHeight: "320px" }}
    >
      <div
        className="relative flex w-full items-center justify-center bg-black"
        style={{ aspectRatio: "16 / 9", minHeight: "320px", maxHeight: "calc(100vh - 320px)" }}
      >
        <video
          ref={videoRef}
          src={post.video ?? undefined}
          poster={post.image ?? undefined}
          playsInline
          muted={isMuted}
          preload="metadata"
          className={fitMode === "contain" ? "h-full w-full object-contain" : "h-full w-full object-cover"}
          onLoadedData={(event) => {
            const element = event.currentTarget;
            if (element.readyState >= 2) {
              element.style.backgroundColor = "transparent";
            }
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

        <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
          <div className="flex items-center gap-2">
            <Badge variant={post.is_private ? "secondary" : "default"} className="bg-black/70 text-white shadow-sm">
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                {post.is_private ? <ShieldCheck className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                {post.is_private ? "Private" : "Public"}
              </span>
            </Badge>
            {isTrending ? (
              <Badge variant="secondary" className="bg-amber-500/90 text-white shadow-sm">
                Trending
              </Badge>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <div className="flex items-center gap-3">
                <Avatar src={avatarSrc} alt={post.user.username} size="lg" className="ring-4 ring-white/20" />
                <div>
                  <p className="text-base font-semibold leading-tight">{post.user.username}</p>
                  <p className="text-[11px] text-white/70">Uploaded {uploadedAgo}</p>
                </div>
              </div>
              {post.caption ? (
                <p className="text-sm text-white/90 line-clamp-3">{post.caption}</p>
              ) : null}
              {hashtags.length > 0 ? (
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {hashtags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/15 uppercase tracking-wide">
                      <Hash className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {taggedUsers.length > 0 ? (
                <p className="text-[11px] text-white/70">
                  With {taggedUsers.map((user, index) => `@${user.username}${index < taggedUsers.length - 1 ? ", " : ""}`)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/60 text-white shadow transition hover:bg-black/80"
                onClick={handlePreviousVideo}
              >
                <SkipBack className="h-4 w-4" />
                <span className="sr-only">Previous video</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/60 text-white shadow transition hover:bg-black/80"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="sr-only">{isPlaying ? "Pause" : "Play"} video</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/60 text-white shadow transition hover:bg-black/80"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <span className="sr-only">{isMuted ? "Unmute" : "Mute"} video</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/60 text-white shadow transition hover:bg-black/80"
                onClick={handleNextVideo}
              >
                <SkipForward className="h-4 w-4" />
                <span className="sr-only">Next video</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/60 text-white shadow transition hover:bg-black/80"
                onClick={() => setFitMode((prev) => (prev === "contain" ? "fill" : "contain"))}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {fitMode === "contain" ? "Fill" : "Fit"}
                </span>
                <span className="sr-only">Toggle fit mode</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/60 text-white shadow transition hover:bg-black/80"
                onClick={() => {
                  if (videoRef.current?.requestFullscreen) {
                    videoRef.current.requestFullscreen().catch(() => undefined);
                  } else if (containerRef.current?.requestFullscreen) {
                    containerRef.current.requestFullscreen().catch(() => undefined);
                  }
                }}
              >
                <Maximize2 className="h-4 w-4" />
                <span className="sr-only">Full screen</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const Videos = () => {
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVideoId, setActiveVideoId] = useState<number | string | null>(null);

  const videosQuery = useQuery<Post[]>({
    queryKey: ["feed", "videos"],
    queryFn: () => getPosts(),
    staleTime: 15_000,
  });

  const videoPosts = useMemo(() => {
    if (!videosQuery.data) {
      return [] as Post[];
    }
    return videosQuery.data.filter((post) => Boolean(post.video));
  }, [videosQuery.data]);

  const metrics = useMemo(() => {
    const totals = videoPosts.reduce(
      (acc, post) => {
        const engagement = post.likes_count + post.comments_count + post.shares_count + post.bookmarks_count;
        acc.totalLikes += post.likes_count;
        acc.totalComments += post.comments_count;
        acc.totalSaves += post.bookmarks_count;
        acc.totalShares += post.shares_count;
        if (engagement > acc.topEngagement) {
          acc.topEngagement = engagement;
          acc.topPost = post;
        }
        const createdAt = new Date(post.created_at).getTime();
        if (!acc.latestUpload || createdAt > acc.latestUpload) {
          acc.latestUpload = createdAt;
        }
        if (post.is_private) {
          acc.privateCount += 1;
        }
        return acc;
      },
      {
        totalLikes: 0,
        totalComments: 0,
        totalSaves: 0,
        totalShares: 0,
        topEngagement: 0,
        topPost: null as Post | null,
        latestUpload: 0,
        privateCount: 0,
      },
    );

    return {
      totalVideos: videoPosts.length,
      totalLikes: totals.totalLikes,
      totalComments: totals.totalComments,
      totalSaves: totals.totalSaves,
      totalShares: totals.totalShares,
      topPost: totals.topPost,
      topEngagement: totals.topEngagement,
      latestUpload: totals.latestUpload,
      privateCount: totals.privateCount,
    };
  }, [videoPosts]);

  const sortedVideos = useMemo(() => {
    const list = [...videoPosts];
    if (sortOption === "engagement") {
      return list.sort((a, b) => {
        const engagementA = a.likes_count + a.comments_count + a.shares_count + a.bookmarks_count;
        const engagementB = b.likes_count + b.comments_count + b.shares_count + b.bookmarks_count;
        return engagementB - engagementA;
      });
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [videoPosts, sortOption]);

  const filteredVideos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return sortedVideos;
    }

    return sortedVideos.filter((post) => {
      const username = post.user.username.toLowerCase();
      const caption = (post.caption ?? "").toLowerCase();
      const hashtags = (post.hashtags ?? []).map((tag) => tag.toLowerCase()).join(" ");
      return username.includes(term) || caption.includes(term) || hashtags.includes(term);
    });
  }, [sortedVideos, searchTerm]);

  useEffect(() => {
    if (!filteredVideos.length) {
      setActiveVideoId(null);
      return;
    }

    setActiveVideoId((current) => {
      if (current != null && filteredVideos.some((post) => post.id === current)) {
        return current;
      }
      return filteredVideos[0]?.id ?? null;
    });
  }, [filteredVideos]);

  const handleSelectVideo = useCallback((postId: number | string) => {
    setActiveVideoId(postId);
  }, []);

  const handleNextVideo = useCallback(() => {
    setActiveVideoId((current) => {
      if (!filteredVideos.length) {
        return null;
      }
      const currentIndex = filteredVideos.findIndex((post) => post.id === current);
      const nextIndex = currentIndex === -1 || currentIndex === filteredVideos.length - 1 ? 0 : currentIndex + 1;
      return filteredVideos[nextIndex]?.id ?? null;
    });
  }, [filteredVideos]);

  const handlePreviousVideo = useCallback(() => {
    setActiveVideoId((current) => {
      if (!filteredVideos.length) {
        return null;
      }
      const currentIndex = filteredVideos.findIndex((post) => post.id === current);
      if (currentIndex === -1) {
        return filteredVideos[0]?.id ?? null;
      }
      const prevIndex = currentIndex === 0 ? filteredVideos.length - 1 : currentIndex - 1;
      return filteredVideos[prevIndex]?.id ?? null;
    });
  }, [filteredVideos]);

  const activeVideo = useMemo(() => {
    if (!filteredVideos.length) {
      return null;
    }
    const match = filteredVideos.find((post) => post.id === activeVideoId);
    return match ?? filteredVideos[0];
  }, [activeVideoId, filteredVideos]);

  const recommendedVideos = useMemo(() => {
    if (!activeVideo) {
      return filteredVideos;
    }
    return filteredVideos.filter((post) => post.id !== activeVideo.id);
  }, [activeVideo, filteredVideos]);

  const latestUploadLabel = metrics.latestUpload
    ? formatDistanceToNowStrict(new Date(metrics.latestUpload), { addSuffix: true })
    : "No uploads yet";

  const isLoading = videosQuery.isLoading;
  const isError = videosQuery.isError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 pb-20">
      <Topbar />

      <div className="pt-16 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[240px,minmax(0,1fr)] gap-6">
        <LeftSidebar />

        <main className="pt-4 space-y-6">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Clapperboard className="h-4 w-4" /> Video Library
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Videos</h1>
              <p className="text-sm text-muted-foreground">Discover every clip shared by the community, with a layout inspired by pro video platforms.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => videosQuery.refetch()}
              disabled={videosQuery.isFetching}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{videosQuery.isFetching ? "Refreshing" : "Refresh"}</span>
            </Button>
          </header>

          <section className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-2xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search videos, creators, or hashtags"
                  className="w-full rounded-full border-border/70 bg-background pl-10 pr-4 shadow-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={sortOption === "recent" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSortOption("recent")}
                >
                  Latest uploads
                </Button>
                <Button
                  variant={sortOption === "engagement" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSortOption("engagement")}
                >
                  Top engagement
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-full">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{filteredVideos.length.toLocaleString()} videos</span>
              <Separator orientation="vertical" className="hidden h-4 md:inline-flex" />
              <span>Last upload {latestUploadLabel}</span>
            </div>
          </section>

          {metrics.topPost ? (
            <Card className="border border-amber-200/40 bg-amber-50/40 shadow-md backdrop-blur">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <Badge className="w-fit gap-1 bg-amber-500 text-white shadow">
                    <Flame className="h-3.5 w-3.5" /> Trending highlight
                  </Badge>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {metrics.topPost.user.username}'s video is leading with {metrics.topEngagement.toLocaleString()} total interactions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Posted {formatDistanceToNowStrict(new Date(metrics.topPost.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex flex-1 items-center gap-4">
                  {metrics.topPost.image ? (
                    <img
                      src={metrics.topPost.image ?? undefined}
                      alt="Top video thumbnail"
                      className="h-28 w-28 flex-shrink-0 rounded-2xl object-cover ring-2 ring-amber-500/60"
                    />
                  ) : (
                    <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 ring-2 ring-amber-500/40">
                      <Clapperboard className="h-10 w-10" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <span>
                      Likes: <strong className="text-foreground">{metrics.topPost.likes_count.toLocaleString()}</strong>
                    </span>
                    <span>
                      Comments: <strong className="text-foreground">{metrics.topPost.comments_count.toLocaleString()}</strong>
                    </span>
                    <span>
                      Shares: <strong className="text-foreground">{metrics.topPost.shares_count.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => metrics.topPost && handleSelectVideo(metrics.topPost.id)}>
                  View now
                </Button>
              </CardHeader>
            </Card>
          ) : null}

          {isError ? (
            <Card className="border-destructive/40 bg-destructive/10 text-destructive shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">Something went wrong</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-destructive/90">We couldn’t fetch the latest videos. Check your connection and try again.</p>
                <Button variant="secondary" onClick={() => videosQuery.refetch()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {isLoading ? (
            <div className="relative h-[calc(100vh-260px)] overflow-hidden rounded-[32px] border border-border/60 bg-black/70 shadow-inner">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-muted/40 via-muted/10 to-muted/40" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-center text-sm text-muted-foreground">Preparing your video feed…</div>
            </div>
          ) : videoPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 py-16 text-center">
              <Clapperboard className="mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No videos yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                When creators share videos, they will appear here for easy playback. Try uploading a video post from the home composer.
              </p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No matching videos</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                We couldn’t find any videos for “{searchTerm}”. Try a different keyword or clear your filters.
              </p>
            </div>
          ) : activeVideo ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
              <div className="space-y-4">
                <VideoFeedItem
                  post={activeVideo}
                  avatarSrc={resolveUserAvatar(
                    {
                      username: activeVideo.user.username,
                      profile: { avatar: activeVideo.user.avatar ?? null, display_name: null },
                    },
                    activeVideo.user.username,
                  )}
                  uploadedAgo={formatDistanceToNowStrict(new Date(activeVideo.created_at), { addSuffix: true })}
                  engagement={activeVideo.likes_count + activeVideo.comments_count + activeVideo.bookmarks_count + activeVideo.shares_count}
                  isTrending={metrics.topPost?.id === activeVideo.id && metrics.topEngagement > 0}
                  hashtags={activeVideo.hashtags ?? []}
                  taggedUsers={activeVideo.tagged_users ?? []}
                  onRequestNext={handleNextVideo}
                  onRequestPrevious={handlePreviousVideo}
                />

                <Card className="border border-border/60 bg-card/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-foreground">About this video</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Creator:</strong> {activeVideo.user.username}
                    </p>
                    <p>
                      <strong className="text-foreground">Published:</strong> {formatDistanceToNowStrict(new Date(activeVideo.created_at), { addSuffix: true })}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                        <Heart className="h-3 w-3" /> {activeVideo.likes_count.toLocaleString()} likes
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                        <MessageCircle className="h-3 w-3" /> {activeVideo.comments_count.toLocaleString()} comments
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                        <Share2 className="h-3 w-3" /> {activeVideo.shares_count.toLocaleString()} shares
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                        <Bookmark className="h-3 w-3" /> {activeVideo.bookmarks_count.toLocaleString()} saves
                      </span>
                    </div>
                    {activeVideo.hashtags?.length ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {activeVideo.hashtags.map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-full border-border/40 text-muted-foreground">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              <aside className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recommended</h2>
                  <span className="text-xs text-muted-foreground">{filteredVideos.length.toLocaleString()} results</span>
                </div>
                <div className="max-h-[calc(100vh-260px)] space-y-4 overflow-y-auto pr-1">
                  {recommendedVideos.map((post) => {
                    const thumb = post.image ?? post.video ?? undefined;
                    const uploadedAgo = formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true });
                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => handleSelectVideo(post.id)}
                        className="group flex w-full gap-3 rounded-2xl border border-border/40 bg-card/70 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-card"
                      >
                        <div className="relative aspect-video w-48 overflow-hidden rounded-xl bg-black">
                          {thumb ? (
                            post.image ? (
                              <img src={thumb ?? undefined} alt={post.caption ?? "Video thumbnail"} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                            ) : (
                              <video
                                src={thumb ?? undefined}
                                muted
                                playsInline
                                preload="metadata"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            )
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                              <Clapperboard className="h-8 w-8" />
                            </div>
                          )}
                          {metrics.topPost?.id === post.id ? (
                            <Badge className="absolute left-2 top-2 bg-amber-500 text-white shadow">Trending</Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground transition group-hover:text-primary">
                              {post.caption || "Untitled video"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Avatar src={resolveUserAvatar({ username: post.user.username, profile: { avatar: post.user.avatar ?? null, display_name: null } }, post.user.username)} alt={post.user.username} size="sm" />
                              <span>@{post.user.username}</span>
                              <span>•</span>
                              <span>{uploadedAgo}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>{post.likes_count.toLocaleString()} likes</span>
                            <span>{post.comments_count.toLocaleString()} comments</span>
                            <span>{post.shares_count.toLocaleString()} shares</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            </div>
          ) : null}
        </main>
      </div>

      <Navbar />
    </div>
  );
};

export default Videos;
