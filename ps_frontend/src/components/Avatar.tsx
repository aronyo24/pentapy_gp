import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hasStory?: boolean;
  isViewed?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-24 w-24",
};

export const Avatar = ({ 
  src, 
  alt, 
  size = "md", 
  className,
  hasStory = false,
  isViewed = false,
}: AvatarProps) => {
  const avatarContent = (
    <img
      src={src}
      alt={alt}
      className={cn(
        "rounded-full object-cover",
        sizeClasses[size],
        className
      )}
    />
  );

  if (hasStory) {
    return (
      <div className={cn(
        "rounded-full p-0.5",
        isViewed 
          ? "bg-gradient-to-tr from-muted to-muted" 
          : "bg-gradient-primary"
      )}>
        <div className="rounded-full p-0.5 bg-background">
          {avatarContent}
        </div>
      </div>
    );
  }

  return avatarContent;
};
