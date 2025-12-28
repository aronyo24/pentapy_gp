// Mock data for PentaPy

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  user: User;
  images: string[];
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
}

export interface Story {
  id: string;
  user: User;
  image: string;
  isViewed: boolean;
}

export interface Notification {
  id: string;
  user: User;
  type: 'like' | 'comment' | 'follow';
  post?: { id: string; image: string };
  timestamp: string;
  message: string;
}

export const currentUser: User = {
  id: '1',
  username: 'pentapy_user',
  name: 'PentaPy User',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pentapy',
  bio: '✨ Living my best life | 📸 Photography | 🎨 Creative',
  followers: 1234,
  following: 567,
  posts: 89,
  isVerified: true,
};

export const mockUsers: User[] = [
  {
    id: '2',
    username: 'alex_creative',
    name: 'Alex Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    followers: 5432,
    following: 234,
    posts: 156,
    isVerified: true,
  },
  {
    id: '3',
    username: 'sarah.designs',
    name: 'Sarah Miller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    followers: 3210,
    following: 456,
    posts: 89,
  },
  {
    id: '4',
    username: 'mike_photos',
    name: 'Mike Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    followers: 8765,
    following: 123,
    posts: 234,
    isVerified: true,
  },
  {
    id: '5',
    username: 'emma.art',
    name: 'Emma Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    followers: 2109,
    following: 345,
    posts: 67,
  },
];

export const mockStories: Story[] = [
  {
    id: '1',
    user: currentUser,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    isViewed: false,
  },
  ...mockUsers.map((user, index) => ({
    id: String(index + 2),
    user,
    image: `https://images.unsplash.com/photo-${1500000000000 + index * 10000000}?w=400`,
    isViewed: index % 3 === 0,
  })),
];

export const mockPosts: Post[] = [
  {
    id: '1',
    user: mockUsers[0],
    images: ['https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800'],
    caption: '✨ Chasing sunsets and dreams #photography #sunset #vibes',
    likes: 1234,
    comments: 89,
    timestamp: '2h ago',
    isLiked: false,
  },
  {
    id: '2',
    user: mockUsers[1],
    images: [
      'https://images.unsplash.com/photo-1682687221038-404cb8830901?w=800',
      'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800',
    ],
    caption: 'New collection dropping soon! 🎨 #design #art #creative',
    likes: 2345,
    comments: 156,
    timestamp: '5h ago',
    isLiked: true,
  },
  {
    id: '3',
    user: mockUsers[2],
    images: ['https://images.unsplash.com/photo-1682687221080-5cb261c645cb?w=800'],
    caption: 'Urban exploration 🏙️ #citylife #photography',
    likes: 987,
    comments: 45,
    timestamp: '1d ago',
    isLiked: false,
  },
  {
    id: '4',
    user: mockUsers[3],
    images: ['https://images.unsplash.com/photo-1682687220923-c58b9a4592ae?w=800'],
    caption: 'Creating magic one brushstroke at a time 🖌️ #art #painting',
    likes: 3456,
    comments: 234,
    timestamp: '2d ago',
    isLiked: true,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    user: mockUsers[0],
    type: 'like',
    post: { id: '1', image: mockPosts[0].images[0] },
    timestamp: '2m ago',
    message: 'liked your post',
  },
  {
    id: '2',
    user: mockUsers[1],
    type: 'follow',
    timestamp: '1h ago',
    message: 'started following you',
  },
  {
    id: '3',
    user: mockUsers[2],
    type: 'comment',
    post: { id: '2', image: mockPosts[1].images[0] },
    timestamp: '3h ago',
    message: 'commented: "Amazing work! 🔥"',
  },
  {
    id: '4',
    user: mockUsers[3],
    type: 'like',
    post: { id: '3', image: mockPosts[2].images[0] },
    timestamp: '1d ago',
    message: 'liked your post',
  },
];

export const mockExplorePosts = [
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400',
  'https://images.unsplash.com/photo-1682687221038-404cb8830901?w=400',
  'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400',
  'https://images.unsplash.com/photo-1682687221080-5cb261c645cb?w=400',
  'https://images.unsplash.com/photo-1682687220923-c58b9a4592ae?w=400',
  'https://images.unsplash.com/photo-1682687220866-c856f566f1bd?w=400',
  'https://images.unsplash.com/photo-1682687220795-796d3f6f7000?w=400',
  'https://images.unsplash.com/photo-1682687219800-bba120d709c5?w=400',
  'https://images.unsplash.com/photo-1682687221175-fd40bbafe6cd?w=400',
];
