const FALLBACK_SEED = "pentapy";

type AvatarSource = {
  username?: string;
  first_name?: string | null;
  last_name?: string | null;
  profile?: {
    avatar?: string | null;
    display_name?: string | null;
  } | null;
};

const buildDicebearUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || FALLBACK_SEED)}`;

export const resolveUserAvatar = (user?: AvatarSource | null, fallbackSeed?: string): string => {
  const avatar = user?.profile?.avatar;
  if (avatar) {
    return avatar;
  }

  const seed = user?.username || fallbackSeed || FALLBACK_SEED;
  return buildDicebearUrl(seed);
};

export const resolveDisplayName = (user?: AvatarSource | null): string => {
  if (!user) {
    return "";
  }

  const profileName = user.profile?.display_name?.trim();
  if (profileName) {
    return profileName;
  }

  const first = user.first_name ?? "";
  const last = user.last_name ?? "";
  const fullName = `${first} ${last}`.trim();
  if (fullName) {
    return fullName;
  }

  return user.username ?? "";
};
