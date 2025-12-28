import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Video as VideoIcon, X, Lock } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAuth } from "@/context/AuthContext";
import { resolveDisplayName, resolveUserAvatar } from "@/lib/avatar";
import { createPost } from "@/api/feed";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ComposerProps {
  onCreate?: (payload: { text: string; image?: string }) => void;
}

export const Composer = ({ onCreate }: ComposerProps) => {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [taggedInput, setTaggedInput] = useState("");
  const [hashtagsInput, setHashtagsInput] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const avatarUrl = resolveUserAvatar(user);
  const username = resolveDisplayName(user) || user?.username || "You";

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const resetPreview = () => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFile(null);
    setMediaType(null);
  };

  const resetComposer = () => {
    setText("");
    setTaggedInput("");
    setHashtagsInput("");
    setIsPrivate(false);
    resetPreview();
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    resetPreview();

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please choose an image or a video file.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    setFile(file);
    setMediaType(isImage ? "image" : "video");
  };

  const submit = async () => {
    if (!text && !file) {
      toast.error("Share a thought or attach media before posting.");
      return;
    }

    const taggedUsernames = taggedInput
      .split(/[\s,]+/)
      .map((value) => value.trim().replace(/^@/, ""))
      .filter(Boolean);

    const hashtags = hashtagsInput
      .split(/[\s,]+/)
      .map((value) => value.trim().replace(/^#/, ""))
      .filter(Boolean);

    setLoading(true);
    try {
      await createPost({
        caption: text,
        image: mediaType === "image" ? file ?? undefined : undefined,
        video: mediaType === "video" ? file ?? undefined : undefined,
        isPrivate,
        hashtags,
        taggedUsernames,
      });

      // Notify parent component (Home) to update the feed
      onCreate?.({ text, image: preview ?? undefined }); // This is for optimistic update or just callback

      resetComposer();
      toast.success("Post created successfully!");
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-soft-md">
      <div className="flex gap-3">
        <Avatar src={avatarUrl} alt={username} />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something with PentaPy..."
            className="w-full resize-none bg-transparent outline-none text-sm min-h-[48px]"
            aria-label="Create a post"
          />

          {preview && mediaType === "image" && (
            <div className="mt-3 relative">
              <img src={preview} alt="preview" className="w-full rounded-xl object-contain bg-muted max-h-96 border border-border" />
              <button
                type="button"
                onClick={resetPreview}
                className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75 transition-colors"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {preview && mediaType === "video" && (
            <div className="mt-3 relative">
              <video
                src={preview}
                controls
                className="w-full rounded-xl border border-border bg-black max-h-80"
              />
              <button
                type="button"
                onClick={resetPreview}
                className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/75 transition-colors"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                <ImageIcon className="h-4 w-4" /> Photo
              </button>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                <VideoIcon className="h-4 w-4" /> Video
              </button>
            </div>
            <div>
              <button
                onClick={submit}
                disabled={loading}
                className="px-3 py-1 rounded-md bg-primary text-white disabled:opacity-50"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="composer-tags" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tag collaborators
                </Label>
                <Input
                  id="composer-tags"
                  placeholder="@designer, @photographer"
                  value={taggedInput}
                  onChange={(event) => setTaggedInput(event.target.value)}
                  className="text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate usernames with commas. Tagged people will be mentioned on the post.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="composer-hashtags" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Hashtags
                </Label>
                <Input
                  id="composer-hashtags"
                  placeholder="#campaign, #launch"
                  value={hashtagsInput}
                  onChange={(event) => setHashtagsInput(event.target.value)}
                  className="text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Add keywords to help others discover this post. No need to include the # symbol.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Private post</p>
                  <p className="text-xs text-muted-foreground">Only you will see this post while it is private.</p>
                </div>
              </div>
              <Switch id="composer-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;

