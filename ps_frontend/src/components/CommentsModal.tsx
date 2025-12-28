import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Comment } from "@/types/interface";
import { commentPost } from "@/api/feed";

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: number;
    comments: Comment[];
    onCommentAdded: (comment: Comment) => void;
}

export const CommentsModal = ({ isOpen, onClose, postId, comments: initialComments, onCommentAdded }: CommentsModalProps) => {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Sync with props if they change
    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsLoading(true);
        try {
            const comment = await commentPost(postId, newComment);
            setComments([...comments, comment]);
            onCommentAdded(comment);
            setNewComment("");
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Comments</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full pr-4">
                    <div className="flex flex-col gap-4">
                        {comments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No comments yet.</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar src={comment.user.avatar || undefined} alt={comment.user.username} className="w-8 h-8" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{comment.user.username}</span>
                                        <span className="text-sm text-muted-foreground">{comment.text}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
                    <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>Post</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
