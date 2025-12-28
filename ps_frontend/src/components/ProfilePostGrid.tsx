import { memo } from "react";
import { Heart, MessageCircle, Video } from "lucide-react";

import type { Post } from "@/types/interface";

interface ProfilePostGridProps {
  posts: Post[];
  isLoading?: boolean;
  emptyLabel?: string;
  onSelect?: (post: Post) => void;
}

const SkeletonTile = () => (
  <div className="aspect-square animate-pulse bg-muted/60" aria-hidden />
);

const ProfilePostGridComponent = ({ posts, isLoading = false, emptyLabel, onSelect }: ProfilePostGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1" aria-live="polite" aria-busy>
        {Array.from({ length: 9 }).map((_, index) => (
          <SkeletonTile key={index} />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
        {emptyLabel ?? "No posts yet."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => onSelect?.(post)}
          className="group relative aspect-square overflow-hidden bg-muted"
          aria-label={`Open post from ${post.user.username}`}
        >
          {post.video ? (
            <video
              src={post.video}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-contain bg-black/80 transition-transform duration-200 ease-out group-hover:scale-95"
            />
          ) : post.image ? (
            <img
              src={post.image}
              alt={post.caption ? `${post.user.username}: ${post.caption}` : `Post from ${post.user.username}`}
              className="h-full w-full object-contain bg-muted transition-transform duration-200 ease-out group-hover:scale-95"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted-foreground/10 text-muted-foreground text-xs">
              No media
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <Heart className="h-4 w-4" />
              {post.likes_count}
            </span>
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </span>
          </div>

          {post.video && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Video className="h-3 w-3" /> Video
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export const ProfilePostGrid = memo(ProfilePostGridComponent);
