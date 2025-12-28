import { Avatar } from "./Avatar";
import { Story as StoryType } from "@/types/interface";
import { resolveUserAvatar } from "@/lib/avatar";

interface StoryProps {
  story: StoryType;
  onClick?: () => void;
}

export const Story = ({ story, onClick }: StoryProps) => {
  const ownerAvatar = resolveUserAvatar(
    {
      username: story.user.username,
      profile: { avatar: story.user.avatar ?? null, display_name: null },
    },
    story.user.username,
  );

  const storyCover = story.image || ownerAvatar;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-shrink-0 transition-base hover:scale-105"
    >
      <div className="relative">
        <span className="block rounded-full bg-gradient-primary p-[3px]">
          <span className="block rounded-full bg-background p-[3px]">
            <img
              src={storyCover}
              alt={`${story.user.username}'s story`}
              className="h-16 w-16 rounded-full object-cover"
            />
          </span>
        </span>
        <span className="absolute -bottom-1 -right-1">
          <Avatar
            src={ownerAvatar}
            alt={`${story.user.username} avatar`}
            size="sm"
            className="h-7 w-7 border-2 border-background shadow-sm"
          />
        </span>
      </div>
      <span className="text-xs text-foreground max-w-[72px] truncate text-center">
        {story.user.username}
      </span>
    </button>
  );
};
