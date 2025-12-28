import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/Topbar";
import { Navbar } from "@/components/Navbar";
// import { Story } from "@/components/Story";
import { PostCard } from "@/components/PostCard";
import { mockStories, mockPosts, currentUser as mockCurrentUser, type User as MockUserType } from "@/data/mockData";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import Composer from "@/components/Composer";
import PostModal from "@/components/PostModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { resolveDisplayName, resolveUserAvatar } from "@/lib/avatar";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchUsers } from "@/api/users";
import UserResultCard from "@/components/UserResultCard";
import { deleteStory, getPosts, getStories } from "@/api/feed";
import { Post as PostType, Story as StoryType } from "@/types/interface";
import { AddStoryButton } from "@/components/AddStoryButton";
import { StoryViewer } from "@/components/StoryViewer";
import { toast } from "sonner";

const Home = () => {
  const { user: authUser } = useAuth();
  const currentUserProfile: MockUserType = useMemo(() => {
    if (!authUser) {
      return mockCurrentUser;
    }

    return {
      id: String(authUser.id),
      username: authUser.username,
      name: resolveDisplayName(authUser),
      avatar: resolveUserAvatar(authUser),
      bio: authUser.profile.display_name ?? undefined,
      followers: mockCurrentUser.followers,
      following: mockCurrentUser.following,
      posts: mockCurrentUser.posts,
      isVerified: authUser.profile.email_verified,
    };
  }, [authUser]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const trimmedQuery = debouncedQuery.trim();

  const {
    data: searchResults = [],
    isLoading: searchLoading,
  } = useQuery({
    queryKey: ["userSearch", trimmedQuery],
    queryFn: () => searchUsers(trimmedQuery, 6),
    enabled: trimmedQuery.length > 0,
  });

  const [posts, setPosts] = useState<PostType[]>([]);
  const [stories, setStories] = useState<StoryType[]>([]);
  const [modalPost, setModalPost] = useState<PostType | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(() => {
    try {
      return localStorage.getItem('pentapy_seen_banner') !== '1';
    } catch (e) {
      return true;
    }
  });

  const fetchFeed = async () => {
    try {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);

      const fetchedStories = await getStories();
      setStories(fetchedStories);
    } catch (error) {
      console.error("Error fetching feed:", error);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    // Keyboard shortcut: press 'c' to focus/create composer
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "c") {
        const el = document.querySelector("textarea[aria-label='Create a post']") as HTMLTextAreaElement | null;
        el?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleCreate = (payload: { text: string; image?: string }) => {
    // Optimistic update or just refetch
    fetchFeed();
  };

  const handlePostUpdated = (updatedPost: PostType) => {
    setPosts((prev) => prev.map((existing) => (existing.id === updatedPost.id ? updatedPost : existing)));
    setModalPost((prev) => (prev?.id === updatedPost.id ? updatedPost : prev));
  };

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((existing) => existing.id !== postId));
    if (modalPost?.id === postId) {
      setModalPost(null);
    }
  };

  const openStoryViewer = (index: number) => {
    setActiveStoryIndex(index);
    setIsStoryViewerOpen(true);
  };

  const closeStoryViewer = () => {
    setIsStoryViewerOpen(false);
    setActiveStoryIndex(null);
  };

  const showPreviousStory = () => {
    setActiveStoryIndex((prev) => (prev && prev > 0 ? prev - 1 : prev));
  };

  const showNextStory = () => {
    setActiveStoryIndex((prev) => {
      if (prev === null) return prev;
      if (prev < stories.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  };

  const deleteStoryMutation = useMutation({
    mutationFn: (storyId: number) => deleteStory(storyId),
    onSuccess: (_data, storyId) => {
      let removedIndex = -1;
      let nextLength = 0;
      setStories((prevStories) => {
        removedIndex = prevStories.findIndex((story) => story.id === storyId);
        const nextStories = prevStories.filter((story) => story.id !== storyId);
        nextLength = nextStories.length;
        return nextStories;
      });

      setActiveStoryIndex((prev) => {
        if (prev === null) {
          return prev;
        }
        if (removedIndex === -1) {
          return prev >= nextLength ? Math.max(nextLength - 1, 0) : prev;
        }
        if (nextLength === 0) {
          return null;
        }
        if (prev > removedIndex) {
          return prev - 1;
        }
        if (prev >= nextLength) {
          return nextLength - 1;
        }
        return prev;
      });

      if (nextLength === 0) {
        setIsStoryViewerOpen(false);
      }

      toast.success("Story deleted");
      void fetchFeed();
    },
    onError: () => {
      toast.error("Unable to delete this story right now.");
    },
  });

  const handleDeleteStory = (story: StoryType) => {
    if (deleteStoryMutation.isPending) {
      return;
    }
    deleteStoryMutation.mutate(story.id);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Topbar />

      <div className="pt-16 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[240px,1fr,320px] gap-6">
        {/* Left */}
        <LeftSidebar />

        {/* Center */}
        <main className="pt-4 space-y-4">
          {showBanner && (
            <div className="p-3 rounded-lg bg-gradient-soft border border-border flex items-center justify-between">
              <div>
                <div className="font-semibold">Welcome to PentaPy — desktop-first preview</div>
                <div className="text-sm text-muted-foreground">No login required. Press <span className="font-mono">c</span> to open composer.</div>
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowBanner(false);
                    try { localStorage.setItem('pentapy_seen_banner', '1'); } catch (e) { }
                  }}
                  className="px-3 py-1 bg-primary text-white rounded-md"
                >Got it</button>
              </div>
            </div>
          )}
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search people to follow"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-2"
              />
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">People</h3>
              {trimmedQuery.length > 0 ? (
                searchLoading ? (
                  <p className="text-sm text-muted-foreground">Searching users…</p>
                ) : searchResults.length ? (
                  <div className="space-y-3">
                    {searchResults.map((person) => (
                      <UserResultCard key={person.id} user={person} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No users found for "{trimmedQuery}".</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Start typing a username to discover people.</p>
              )}
            </div>
          </div>

          <div>
            <Composer onCreate={handleCreate} />
          </div>

          <div className="space-y-4">
            {posts.map((post: PostType) => (
              <div key={post.id} onDoubleClick={() => setModalPost(post)}>
                <PostCard post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
              </div>
            ))}
          </div>
        </main>

        {/* Right */}
        <RightSidebar />
      </div>

      <Navbar />

      <PostModal post={modalPost} onClose={() => setModalPost(null)} />

      {activeStoryIndex !== null && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          activeIndex={Math.min(activeStoryIndex, stories.length - 1)}
          open={isStoryViewerOpen}
          onClose={closeStoryViewer}
          onPrev={showPreviousStory}
          onNext={showNextStory}
          onDelete={handleDeleteStory}
          currentUserId={authUser?.id}
          isDeleting={deleteStoryMutation.isPending}
        />
      )}
    </div>
  );
};

export default Home;

