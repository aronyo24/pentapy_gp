import { Settings } from "lucide-react";
import { Avatar } from "./Avatar";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import type { ProfileSummary } from "@/types/interface";

interface ProfileHeaderProps {
  user: ProfileSummary;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  avatarOverride?: string;
  onToggleFollow?: () => void;
  followLoading?: boolean;
}

export const ProfileHeader = ({
  user,
  isOwnProfile = false,
  onEditProfile,
  avatarOverride,
  onToggleFollow,
  followLoading = false,
}: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const avatarSrc = avatarOverride ?? user.avatar;
  const followLabel = user.isFollowing ? "Following" : "Follow";

  return (
    <div className="border-b border-border">
      <div className="h-36 bg-gradient-primary rounded-b-lg shadow-soft-md" aria-hidden="true" />

      <div className="px-4 -mt-10">
        <div className="bg-card p-4 rounded-lg shadow-soft-md">
          <div className="flex items-center gap-4">
            <Avatar src={avatarSrc} alt={user.username} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-semibold">{user.username}</h2>
                {user.isVerified && <span className="text-primary">✓</span>}
              </div>

              <p className="text-sm text-muted-foreground mb-2">{user.name}</p>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-semibold">{user.posts}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{user.followers}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{user.following}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
            </div>

            <div className="ml-3">
              {isOwnProfile ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    className="px-4 py-2"
                    onClick={onEditProfile}
                    disabled={!onEditProfile}
                  >
                    Edit Profile
                  </Button>
                  <Button variant="secondary" size="icon" onClick={() => navigate('/settings')}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    className="px-4 py-2"
                    onClick={onToggleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? 'Please wait…' : followLabel}
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-4 py-2"
                    onClick={() => navigate(`/messages?user=${encodeURIComponent(user.username)}`)}
                  >
                    Message
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3">
            {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
