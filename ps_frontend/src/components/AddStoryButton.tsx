import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { createStory } from "@/api/feed";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface AddStoryButtonProps {
    onStoryAdded: () => void;
}

export const AddStoryButton = ({ onStoryAdded }: AddStoryButtonProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleClick = () => {
        if (isLoading) return;
        inputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const formData = new FormData();
        formData.append("image", file);

        setIsLoading(true);
        try {
            await createStory(formData);
            toast({
                title: "Story added",
                description: "Your story has been posted successfully.",
            });
            onStoryAdded();
        } catch (error) {
            console.error("Failed to add story", error);
            toast({
                title: "Error",
                description: "Failed to add story.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group" onClick={handleClick}>
            <input
                type="file"
                ref={inputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isLoading}
            />
            <div className={cn(
                "w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center transition-base group-hover:bg-muted",
                isLoading && "opacity-50 cursor-not-allowed"
            )}>
                <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-xs text-foreground">Add Story</span>
        </div>
    );
};
