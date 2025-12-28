export interface UserProfileSummary {
	display_name: string;
	phone_number: string | null;
	avatar: string | null;
	email_verified: boolean;
	last_otp_sent_at: string | null;
	otp_used: boolean;
}

export interface AuthUser {
	id: number;
	username: string;
	email: string;
	first_name: string;
	last_name: string;
	profile: UserProfileSummary;
}

export interface RegisterResponse {
	detail: string;
	uidb64: string;
	token: string;
}

export interface LoginResponse {
	detail: string;
	requires_verification?: boolean;
	user?: AuthUser;
}

export interface ResendOtpResponse {
	detail: string;
	uidb64?: string;
	token?: string;
}

export interface VerifyOtpPayload {
	email?: string;
	otp_code: string;
}

export interface PublicUserSummary {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
	full_name: string;
	display_name: string;
	profile: UserProfileSummary;
	followers_count: number;
	following_count: number;
	posts_count: number;
	is_following: boolean;
	is_self: boolean;
}

export interface ProfileSummary {
	id: string;
	username: string;
	name: string;
	avatar: string;
	bio?: string;
	followers: number;
	following: number;
	posts: number;
	isVerified?: boolean;
	isSelf?: boolean;
	isFollowing?: boolean;
}

export interface NotificationActor {
	id: number;
	username: string;
	full_name: string;
	display_name: string;
	avatar: string | null;
}

export interface NotificationItem {
	id: number;
	notification_type: 'follow';
	message: string;
	created_at: string;
	is_read: boolean;
	actor: NotificationActor;
	can_follow_back: boolean;
	follow_back_url: string | null;
}

export interface ConversationParticipant {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
	full_name: string;
	avatar?: string | null;
}

export interface ChatMessage {
	id: number;
	conversation_id: number;
	sender: ConversationParticipant;
	content: string;
	created_at: string;
	edited: boolean;
	deleted: boolean;
}

export interface ConversationSummary {
	id: number;
	title: string;
	is_group: boolean;
	created_at: string;
	participants: ConversationParticipant[];
	last_message: ChatMessage | null;
	unread_count: number;
}

export interface ChatContact extends ConversationParticipant {
	you_follow: boolean;
	follows_you: boolean;
}

export interface Comment {
	id: number;
	post: number;
	user: {
		id: number;
		username: string;
		email: string;
		avatar?: string;
	};
	text: string;
	created_at: string;
}

export interface Post {
	id: number;
	user: {
		id: number;
		username: string;
		email: string;
		avatar?: string | null;
	};
	image: string | null;
	video?: string | null;
	caption: string;
	created_at: string;
	updated_at: string;
	is_private: boolean;
	hashtags: string[];
	tagged_users: {
		id: number;
		username: string;
		email: string;
		avatar?: string | null;
	}[];
	likes_count: number;
	comments_count: number;
	shares_count: number;
	is_liked: boolean;
	bookmarks_count: number;
	is_bookmarked: boolean;
	comments: Comment[];
}

export interface Story {
	id: number;
	user: {
		id: number;
		username: string;
		email: string;
		avatar?: string;
	};
	image: string;
	created_at: string;
	expires_at: string;
}
