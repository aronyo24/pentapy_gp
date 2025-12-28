import { apiClient } from "@/api/apiClient";
import type { ChatContact, ChatMessage, ConversationSummary } from "@/types/interface";

interface FetchMessagesOptions {
  limit?: number;
  before?: string;
}

export const fetchConversations = async (): Promise<ConversationSummary[]> => {
  const { data } = await apiClient.get<ConversationSummary[]>("/chat/conversations/");
  return data;
};

export const fetchConversation = async (conversationId: number): Promise<ConversationSummary> => {
  const { data } = await apiClient.get<ConversationSummary>(`/chat/conversations/${conversationId}/`);
  return data;
};

export const startConversationByUsername = async (username: string): Promise<ConversationSummary> => {
  const { data } = await apiClient.post<ConversationSummary>('/chat/conversations/start/', { username });
  return data;
};

export const fetchMessages = async (
  conversationId: number,
  options: FetchMessagesOptions = {},
): Promise<ChatMessage[]> => {
  const params = new URLSearchParams();
  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }
  if (options.before) {
    params.set("before", options.before);
  }
  const query = params.toString();
  const path = query
    ? `/chat/conversations/${conversationId}/messages/?${query}`
    : `/chat/conversations/${conversationId}/messages/`;
  const { data } = await apiClient.get<ChatMessage[]>(path);
  return data;
};

export const sendMessage = async (conversationId: number, content: string): Promise<ChatMessage> => {
  const { data } = await apiClient.post<ChatMessage>(`/chat/conversations/${conversationId}/messages/`, {
    content,
  });
  return data;
};

export const markConversationRead = async (conversationId: number): Promise<{ detail: string }> => {
  const { data } = await apiClient.post<{ detail: string }>(`/chat/conversations/${conversationId}/mark-read/`);
  return data;
};

export const fetchChatContacts = async (): Promise<ChatContact[]> => {
  const { data } = await apiClient.get<ChatContact[]>("/chat/contacts/");
  return data;
};

export const deleteConversation = async (conversationId: number): Promise<void> => {
  await apiClient.delete(`/chat/conversations/${conversationId}/`);
};
