import { formatDistanceToNowStrict } from "date-fns";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import { Story } from "@/types/interface";
import { resolveUserAvatar } from "@/lib/avatar";
import { Avatar } from "@/components/Avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StoryViewerProps {
  stories: Story[];
  activeIndex: number;
  open: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete?: (story: Story) => void;
  currentUserId?: number | null;
  isDeleting?: boolean;
}

export const StoryViewer = ({
  stories,
  activeIndex,
  open,
  onClose,
  onPrev,
  onNext,
  onDelete,
  currentUserId,
  isDeleting = false,
}: StoryViewerProps) => {
  const story = stories[activeIndex];

  if (!story) {
    return null;
  }

  const ownerAvatar = resolveUserAvatar(
    {
      username: story.user.username,
      profile: { avatar: story.user.avatar ?? null, display_name: null },
    },
    story.user.username,
  );
  const postedAgo = formatDistanceToNowStrict(new Date(story.created_at), { addSuffix: true });
  const expiresIn = formatDistanceToNowStrict(new Date(story.expires_at), { addSuffix: true });
  const canDelete = typeof currentUserId === "number" && story.user.id === currentUserId;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < stories.length - 1;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0">
        <div className="relative w-full overflow-hidden rounded-3xl bg-background/95 text-foreground shadow-2xl">
          <div className="grid gap-0 sm:grid-cols-[minmax(0,60%),minmax(0,40%)]">
            <div className="relative bg-black">
              <img
                src={story.image ?? ownerAvatar}
                alt={`${story.user.username}'s story`}
                className="h-full w-full object-contain"
              />

              {hasPrev && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label="Previous story"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {hasNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label="Next story"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            <aside className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <Avatar src={ownerAvatar} alt={story.user.username} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{story.user.username}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{postedAgo}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Story expires {expiresIn}</p>
                </div>
              </div>

              <div className="flex-1 rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                <p>Stories disappear automatically after 24 hours. Keep your highlights fresh by rotating new moments in.</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close viewer
                </Button>
                {canDelete && onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(story)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> {isDeleting ? "Removing…" : "Delete story"}
                  </Button>
                )}
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
