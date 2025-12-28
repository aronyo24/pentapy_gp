import React from 'react';

interface PostProps {
    post: {
        id: number;
        user: {
            username: string;
            // Add avatar if available
        };
        image: string | null;
        video?: string | null;
        caption: string;
        created_at: string;
    };
}

const PostCard: React.FC<PostProps> = ({ post }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
            <div className="p-4 flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-300 mr-3"></div> {/* Placeholder avatar */}
                <span className="font-bold text-gray-900 dark:text-white">{post.user.username}</span>
            </div>
            {post.video ? (
                <video src={post.video} controls className="w-full h-auto max-h-[500px] bg-black object-contain" />
            ) : post.image ? (
                <img src={post.image} alt={post.caption} className="w-full h-auto object-cover max-h-[500px]" />
            ) : (
                <div className="p-6 text-center text-sm text-gray-500">No media attached.</div>
            )}
            <div className="p-4">
                <p className="text-gray-800 dark:text-gray-200">
                    <span className="font-bold mr-2">{post.user.username}</span>
                    {post.caption}
                </p>
            </div>
        </div>
    );
};

export default PostCard;
