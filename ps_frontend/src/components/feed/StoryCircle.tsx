import React from 'react';

interface StoryProps {
    story: {
        id: number;
        user: {
            username: string;
        };
        image: string;
    };
}

const StoryCircle: React.FC<StoryProps> = ({ story }) => {
    return (
        <div className="flex flex-col items-center mr-4 cursor-pointer">
            <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                <div className="h-full w-full rounded-full border-2 border-white dark:border-gray-900 overflow-hidden">
                    <img src={story.image} alt={story.user.username} className="h-full w-full object-cover" />
                </div>
            </div>
            <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">{story.user.username}</span>
        </div>
    );
};

export default StoryCircle;
