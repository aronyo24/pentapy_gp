import { Post } from "@/types/interface";
import { Avatar } from "./Avatar";
import { Badge } from "@/components/ui/badge";
import { X, Lock, Globe } from "lucide-react";
import { Link } from "react-router-dom";

interface PostModalProps {
  post: Post | null;
  onClose: () => void;
}

export const PostModal = ({ post, onClose }: PostModalProps) => {
  if (!post) return null;

  const taggedUsers = post.tagged_users || [];
  const hashtags = post.hashtags || [];
  const createdAt = new Date(post.created_at);
  const updatedAt = new Date(post.updated_at);
  const updatedSincePublish = Math.abs(updatedAt.getTime() - createdAt.getTime()) > 60_000;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="bg-card rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto flex" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 bg-black/5 p-2 flex items-center justify-center">
          {post.video ? (
            <video
              src={post.video}
              controls
              className="max-h-[80vh] w-full rounded-md bg-black object-contain"
            />
          ) : post.image ? (
            <img
              src={post.image}
              alt={`Post by ${post.user.username}`}
              className="object-contain max-h-[80vh]"
            />
          ) : (
            <div className="text-sm text-muted-foreground">No media available for this post.</div>
          )}
        </div>
        <div className="w-80 border-l border-border p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            
            <button onClick={onClose} aria-label="Close post" className="p-2 rounded hover:bg-secondary">
              <X />
            </button>
          </div>

          <div className="text-sm whitespace-pre-line">{post.caption}</div>

          {taggedUsers.length > 0 && (
            <div className="text-xs text-muted-foreground">
              With {taggedUsers.map((person, index) => (
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
                <Badge key={tag} variant="secondary" className="text-[11px] font-medium">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-auto">
            <div className="text-sm text-muted-foreground">{post.likes_count} likes • {post.comments_count} comments</div>
            <div className="mt-2">
              <input aria-label="Add a comment" placeholder="Add a comment..." className="w-full px-3 py-2 bg-secondary rounded-md" />
            </div>
            <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              <div>Published {createdAt.toLocaleString()}</div>
              {updatedSincePublish && <div>Updated {updatedAt.toLocaleString()}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
