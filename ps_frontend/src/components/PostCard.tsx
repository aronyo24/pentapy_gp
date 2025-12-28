import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Edit3,
  Trash2,
  Lock,
  Globe,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { Post, Comment } from "@/types/interface";
import { cn } from "@/lib/utils";
import { bookmarkPost, deletePost, likePost, sharePost, unlikePost, unbookmarkPost, updatePost } from "@/api/feed";
import { CommentsModal } from "./CommentsModal";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

interface PostCardProps {
  post: Post;
  onPostUpdated?: (post: Post) => void;
  onPostDeleted?: (postId: number) => void;
}

export const PostCard = ({ post, onPostUpdated, onPostDeleted }: PostCardProps) => {
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [postData, setPostData] = useState<Post>(post);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [sharesCount, setSharesCount] = useState(post.shares_count || 0);
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
  const [bookmarksCount, setBookmarksCount] = useState(post.bookmarks_count || 0);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);


  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  useEffect(() => {
    setPostData(post);
  }, [post]);

  useEffect(() => {
    setIsLiked(postData.is_liked);
    setLikesCount(postData.likes_count);
    setComments(postData.comments || []);
    setCommentsCount(postData.comments_count);
    setSharesCount(postData.shares_count || 0);
    setIsBookmarked(postData.is_bookmarked);
    setBookmarksCount(postData.bookmarks_count || 0);
    setEditCaption(postData.caption);

  }, [postData]);

  const media = useMemo(() => {
    if (postData.video) {
      return { type: "video" as const, src: postData.video };
    }
    if (postData.image) {
      return { type: "image" as const, src: postData.image };
    }
    return null;
  }, [postData.image, postData.video]);

  const isOwner = authUser?.id === postData.user.id;
  const taggedUsers = postData.tagged_users || [];
  const hashtags = postData.hashtags || [];
  const createdAt = new Date(postData.created_at);
  const updatedAt = new Date(postData.updated_at);
  const updatedSincePublish = Math.abs(updatedAt.getTime() - createdAt.getTime()) > 60_000;

  const normaliseUsernames = (input: string) => {
    return input
      .split(/[\s,]+/)
      .map((value) => value.trim().replace(/^@/, ""))
      .filter(Boolean);
  };

  const normaliseHashtags = (input: string) => {
    const seen = new Set<string>();
    const clean = input
      .split(/[\s,]+/)
      .map((value) => value.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    const unique: string[] = [];
    clean.forEach((tag) => {
      if (!seen.has(tag)) {
        seen.add(tag);
        unique.push(tag);
      }
    });
    return unique;
  };

  const handleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => prev + (nextLiked ? 1 : -1));
    setPostData((prev) => ({ ...prev, is_liked: nextLiked, likes_count: prev.likes_count + (nextLiked ? 1 : -1) }));

    try {
      if (nextLiked) {
        await likePost(postData.id);
      } else {
        await unlikePost(postData.id);
      }
    } catch (error) {
      console.error("Failed to toggle like", error);
      setIsLiked(!nextLiked);
      setLikesCount((prev) => prev + (nextLiked ? -1 : 1));
      setPostData((prev) => ({ ...prev, is_liked: !nextLiked, likes_count: prev.likes_count + (nextLiked ? -1 : 1) }));
      toast({
        title: "Unable to update like",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const handleCommentAdded = (newComment: Comment) => {
    setComments((prev) => [...prev, newComment]);
    setCommentsCount((prev) => prev + 1);
    setPostData((prev) => ({
      ...prev,
      comments_count: prev.comments_count + 1,
      comments: [...(prev.comments || []), newComment],
    }));
  };

  const handleShare = async () => {
    try {
      await sharePost(postData.id);
      setSharesCount((prev) => prev + 1);
      setPostData((prev) => ({ ...prev, shares_count: prev.shares_count + 1 }));
      toast({ title: "Shared", description: "Post added to your activity." });
    } catch (error) {
      console.error("Failed to share post", error);
      toast({
        title: "Unable to share",
        description: "Please try again shortly.",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    const nextBookmark = !isBookmarked;
    const delta = nextBookmark ? 1 : -1;
    const adjustCount = (count: number, change: number) => Math.max(0, count + change);
    setIsBookmarked(nextBookmark);
    setBookmarksCount((prev) => adjustCount(prev, delta));
    setPostData((prev) => ({
      ...prev,
      is_bookmarked: nextBookmark,
      bookmarks_count: adjustCount(prev.bookmarks_count, delta),
    }));

    try {
      if (nextBookmark) {
        await bookmarkPost(postData.id);
        toast({ title: "Saved", description: "Post added to your bookmarks." });
      } else {
        await unbookmarkPost(postData.id);
        toast({ title: "Removed", description: "Post removed from your bookmarks." });
      }
    } catch (error) {
      console.error("Failed to toggle bookmark", error);
      setIsBookmarked(!nextBookmark);
      setBookmarksCount((prev) => adjustCount(prev, -delta));
      setPostData((prev) => ({
        ...prev,
        is_bookmarked: !nextBookmark,
        bookmarks_count: adjustCount(prev.bookmarks_count, -delta),
      }));
      toast({
        title: "Unable to update bookmark",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleTogglePrivacy = async () => {
    if (!isOwner) return;
    const targetPrivacy = !postData.is_private;
    setPrivacyLoading(true);
    try {
      const updated = await updatePost(postData.id, {
        isPrivate: targetPrivacy,
      });
      setPostData(updated);
      onPostUpdated?.(updated);
      toast({
        title: targetPrivacy ? "Post is private" : "Post is public",
        description: targetPrivacy
          ? "Only you can see this post now."
          : "Everyone can see this post again.",
      });
    } catch (error) {
      console.error("Failed to toggle privacy", error);
      toast({
        title: "Unable to update privacy",
        description: "Please try again soon.",
        variant: "destructive",
      });
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    setDeleteLoading(true);
    try {
      await deletePost(postData.id);
      onPostDeleted?.(postData.id);
      toast({ title: "Post deleted", description: "We removed this post from your feed." });
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete post", error);
      toast({
        title: "Unable to delete",
        description: "Please try again a little later.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <article className="bg-card border border-border/60 rounded-xl mb-4 shadow-soft-md">
      <div className="flex items-center justify-between p-4">


        {isOwner ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <MoreHorizontal className="h-5 w-5" />
                <span className="sr-only">Post options</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit post
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={privacyLoading}
                onSelect={(event) => {
                  event.preventDefault();
                  if (!privacyLoading) {
                    void handleTogglePrivacy();
                  }
                }}
              >
                {postData.is_private ? (
                  <Globe className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {postData.is_private ? "Make public" : "Make private"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" />
          </span>
        )}
      </div>

      <div className="relative bg-muted flex items-center justify-center border-y border-border/60">
        {media ? (
          media.type === "video" ? (
            <video
              src={media.src}
              controls
              className="w-full max-h-[640px] bg-black object-contain"
            />
          ) : (
            <img
              src={media.src}
              alt={`Post by ${postData.user.username}`}
              className="w-full h-auto max-h-[640px] object-contain bg-background"
            />
          )
        ) : (
          <div className="py-24 text-sm text-muted-foreground">No media attached</div>
        )}
      </div>

      <div className="px-4 pt-4 pb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform hover:scale-110" aria-pressed={isLiked}>
              <Heart
                className={cn(
                  "h-6 w-6",
                  isLiked ? "fill-accent text-accent" : "text-foreground",
                )}
              />
              <span className="sr-only">{isLiked ? "Unlike" : "Like"}</span>
            </button>
            <button onClick={() => setIsCommentsOpen(true)} className="transition-transform hover:scale-110">
              <MessageCircle className="h-6 w-6" />
              <span className="sr-only">Open comments</span>
            </button>
            <button onClick={handleShare} className="transition-transform hover:scale-110">
              <Send className="h-6 w-6" />
              <span className="sr-only">Share post</span>
            </button>
          </div>
          <button
            onClick={handleBookmark}
            className="transition-transform hover:scale-110"
            aria-pressed={isBookmarked}
          >
            <Bookmark
              className={cn(
                "h-6 w-6",
                isBookmarked ? "fill-primary text-primary" : "text-foreground",
              )}
            />
            <span className="sr-only">{isBookmarked ? "Remove bookmark" : "Save post"}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
          <span>{likesCount} likes</span>
          {sharesCount > 0 && <span>{sharesCount} shares</span>}
          {bookmarksCount > 0 && <span>{bookmarksCount} saves</span>}
        </div>

        <div className="text-sm">
          <span className="font-semibold mr-2">{postData.user.username}</span>
          <span>{postData.caption}</span>
        </div>

        {taggedUsers.length > 0 && (
          <div className="text-sm text-muted-foreground">
            With{" "}
            {taggedUsers.map((person, index) => (
              <span key={person.id}>
                <Link to={`/profile/${person.username}`} className="font-medium text-primary hover:underline">
                  @{person.username}
                </Link>
                {index < taggedUsers.length - 1 && <span>, </span>}
              </span>
            ))}
          </div>
        )}

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-medium">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {commentsCount > 0 && (
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all {commentsCount} comments
          </button>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div>Published {createdAt.toLocaleString()}</div>
          {updatedSincePublish && <div>Updated {updatedAt.toLocaleString()}</div>}
        </div>
      </div>

      <CommentsModal
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        postId={postData.id}
        comments={comments}
        onCommentAdded={handleCommentAdded}
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">


        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post and its engagement stats will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
};
