import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/components/UploadButton";
import { toast } from "sonner";

const CreatePost = () => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleFileSelect = (files: FileList) => {
    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setSelectedImages([...selectedImages, ...newImages]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (selectedImages.length === 0) {
      toast.error("Please select at least one image");
      return;
    }
    toast.success("Post created successfully!");
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">Create Post</h2>
          <Button
            onClick={handlePost}
            size="sm"
            disabled={selectedImages.length === 0}
            className="bg-gradient-primary"
          >
            Post
          </Button>
        </div>
      </header>

      <main className="pt-14 p-4 max-w-2xl mx-auto">
        <div className="space-y-6 animate-fade-in">
          {/* Image Upload */}
          <div>
            <UploadButton onFileSelect={handleFileSelect} multiple />
            
            {selectedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`Selected ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-base"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Caption
            </label>
            <Textarea
              placeholder="Write a caption... #hashtags"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-32 resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
