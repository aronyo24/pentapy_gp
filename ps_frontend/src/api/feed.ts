import { apiClient } from "./apiClient";
import { Comment, Post, Story } from "../types/interface";

export interface FetchPostsOptions {
    username?: string;
    userId?: number;
}

export const getPosts = async (options: FetchPostsOptions = {}): Promise<Post[]> => {
    const params = new URLSearchParams();
    if (options.username) {
        params.set("username", options.username);
    }
    if (typeof options.userId === "number") {
        params.set("user_id", String(options.userId));
    }

    const query = params.toString();
    const endpoint = query ? `/api/posts/?${query}` : "/api/posts/";
    const response = await apiClient.get<Post[]>(endpoint);
    return response.data;
};

export interface CreatePostParams {
    caption: string;
    image?: File;
    video?: File;
    isPrivate?: boolean;
    hashtags?: string[];
    taggedUsernames?: string[];
}

export interface UpdatePostParams {
    caption?: string;
    image?: File | null;
    video?: File | null;
    isPrivate?: boolean;
    hashtags?: string[];
    taggedUsernames?: string[];
}

const buildPostFormData = (params: CreatePostParams | UpdatePostParams) => {
    const formData = new FormData();

    if ("caption" in params && params.caption !== undefined) {
        formData.append("caption", params.caption);
    }

    if ("image" in params && params.image instanceof File) {
        formData.append("image", params.image);
    }

    if ("video" in params && params.video instanceof File) {
        formData.append("video", params.video);
    }

    if (params.isPrivate !== undefined) {
        formData.append("is_private", params.isPrivate ? "true" : "false");
    }

    if (params.hashtags) {
        params.hashtags.forEach((tag) => formData.append("hashtags", tag));
    }

    if (params.taggedUsernames) {
        params.taggedUsernames.forEach((username) => formData.append("tagged_usernames", username));
    }

    return formData;
};

export const createPost = async (params: CreatePostParams): Promise<Post> => {
    const response = await apiClient.post("/api/posts/", buildPostFormData(params), {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const updatePost = async (postId: number, params: UpdatePostParams): Promise<Post> => {
    const response = await apiClient.patch(`/api/posts/${postId}/`, buildPostFormData(params), {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const deletePost = async (postId: number): Promise<void> => {
    await apiClient.delete(`/api/posts/${postId}/`);
};

export const getStories = async (): Promise<Story[]> => {
    const response = await apiClient.get("/api/stories/");
    return response.data;
};

export const createStory = async (formData: FormData): Promise<Story> => {
    const response = await apiClient.post("/api/stories/", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const deleteStory = async (storyId: number): Promise<void> => {
    await apiClient.delete(`/api/stories/${storyId}/`);
};

export const likePost = async (postId: number): Promise<void> => {
    await apiClient.post(`/api/posts/${postId}/like/`);
};

export const unlikePost = async (postId: number): Promise<void> => {
    await apiClient.post(`/api/posts/${postId}/unlike/`);
};

export const commentPost = async (postId: number, text: string): Promise<Comment> => {
    const response = await apiClient.post(`/api/posts/${postId}/comment/`, { text });
    return response.data;
};

export const sharePost = async (postId: number): Promise<void> => {
    await apiClient.post(`/api/posts/${postId}/share/`);
};

export const bookmarkPost = async (postId: number): Promise<void> => {
    await apiClient.post(`/api/posts/${postId}/bookmark/`);
};

export const unbookmarkPost = async (postId: number): Promise<void> => {
    await apiClient.post(`/api/posts/${postId}/unbookmark/`);
};

export const getBookmarks = async (): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>("/api/bookmarks/");
    return response.data;
};
