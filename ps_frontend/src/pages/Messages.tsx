import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { formatDistanceToNowStrict } from "date-fns";
import { BellOff, MoreHorizontal, Send, Trash2, UserX } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import {
  deleteConversation,
  fetchChatContacts,
  fetchConversations,
  fetchMessages,
  sendMessage,
  startConversationByUsername,
} from "@/api/chat";
import { searchUsers } from "@/api/users";
import { Avatar } from "@/components/Avatar";
import LeftSidebar from "@/components/LeftSidebar";
import { Navbar } from "@/components/Navbar";
import { Topbar } from "@/components/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/hooks/use-toast";
import { resolveUserAvatar } from "@/lib/avatar";
import type { ChatContact, ChatMessage, ConversationSummary, PublicUserSummary } from "@/types/interface";

const formatRelativeTime = (iso: string | undefined) => {
  if (!iso) return "";
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("Failed to format timestamp", error);
    }
    return "";
  }
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    return detail ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
};

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const redirectTargetRef = useRef<string | null>(searchParams.get("user"));
  const clearRedirectParam = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("user");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [optionsOpenFor, setOptionsOpenFor] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"conversations" | "people">("conversations");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const conversationsQuery = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: fetchConversations,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const conversations = useMemo(
    () => conversationsQuery.data ?? ([] as ConversationSummary[]),
    [conversationsQuery.data],
  );

  const directConversationMap = useMemo(() => {
    const map = new Map<number, ConversationSummary>();
    conversations.forEach((conversation) => {
      if (conversation.is_group) {
        return;
      }
      conversation.participants.forEach((participant) => {
        if (participant.id !== user?.id) {
          map.set(participant.id, conversation);
        }
      });
    });
    return map;
  }, [conversations, user?.id]);

  const contactsQuery = useQuery({
    queryKey: ["chat", "contacts"],
    queryFn: fetchChatContacts,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const contacts = useMemo(
    () => contactsQuery.data ?? ([] as ChatContact[]),
    [contactsQuery.data],
  );

  const filteredContacts = useMemo(
    () => contacts.filter((contact) => !directConversationMap.has(contact.id)),
    [contacts, directConversationMap],
  );

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }

    if (!selectedConversationId || !conversations.some((c) => c.id === selectedConversationId)) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", selectedConversationId],
    queryFn: () => fetchMessages(selectedConversationId as number, { limit: 100 }),
    enabled: typeof selectedConversationId === "number",
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!selectedConversationId) return;
    if (!messagesQuery.data) return;

    const latest = messagesQuery.data[messagesQuery.data.length - 1] ?? null;

    queryClient.setQueryData<ConversationSummary[]>(["chat", "conversations"], (prev) => {
      if (!prev) return prev;
      return prev.map((conversation) =>
        conversation.id === selectedConversationId
          ? {
              ...conversation,
              last_message: latest ?? conversation.last_message,
              unread_count: 0,
            }
          : conversation,
      );
    });
  }, [messagesQuery.data, queryClient, selectedConversationId]);

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(selectedConversationId as number, content),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessage[]>(["chat", "messages", message.conversation_id], (prev = []) => [
        ...prev,
        message,
      ]);

      queryClient.setQueryData<ConversationSummary[]>(["chat", "conversations"], (prev) => {
        if (!prev) return prev;
        const index = prev.findIndex((conversation) => conversation.id === message.conversation_id);
        if (index < 0) {
          return prev;
        }
        const updated = {
          ...prev[index],
          last_message: message,
          unread_count: 0,
        };
        const next = [...prev];
        next.splice(index, 1);
        next.unshift(updated);
        return next;
      });

      setMessageDraft("");
    },
    onError: (error) => {
      toast({
        title: "Unable to send message",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: startConversationByUsername,
    onSuccess: (conversation) => {
      queryClient.setQueryData<ConversationSummary[]>(["chat", "conversations"], (prev = []) => {
        const index = prev.findIndex((existing) => existing.id === conversation.id);
        if (index >= 0) {
          const copy = [...prev];
          copy.splice(index, 1);
          return [conversation, ...copy];
        }
        return [conversation, ...prev];
      });

      setSelectedConversationId(conversation.id);
      setSearchTerm("");
      const otherParticipant = conversation.participants.find((participant) => participant.id !== user?.id);
      if (otherParticipant) {
        queryClient.setQueryData<ChatContact[]>(["chat", "contacts"], (prev = []) =>
          prev.filter((contact) => contact.id !== otherParticipant.id),
        );
      }
      setSidebarTab("conversations");
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", conversation.id] });
      queryClient.invalidateQueries({ queryKey: ["chat", "contacts"] });
    },
    onError: (error) => {
      toast({
        title: "Unable to start conversation",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: number) => deleteConversation(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.setQueryData<ConversationSummary[]>(["chat", "conversations"], (prev) =>
        prev?.filter((conversation) => conversation.id !== conversationId) ?? [],
      );
      queryClient.removeQueries({ queryKey: ["chat", "messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "contacts"] });
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      setOptionsOpenFor(null);
      toast({ title: "Conversation removed", description: "This chat thread has been deleted." });
    },
    onError: (error) => {
      toast({
        title: "Unable to delete conversation",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const searchQuery = useQuery({
    queryKey: ["chat", "search", debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch, 8),
    enabled: debouncedSearch.trim().length > 1,
    staleTime: 5_000,
  });

  const conversationHeaderTitle = useMemo(() => {
    if (!activeConversation) return "";
    if (activeConversation.is_group && activeConversation.title) {
      return activeConversation.title;
    }

    const other = activeConversation.participants.find((participant) => participant.id !== user?.id);
    if (other) {
      return other.full_name || other.username;
    }

    return activeConversation.title || `Conversation ${activeConversation.id}`;
  }, [activeConversation, user?.id]);

  const conversationHeaderSubtitle = useMemo(() => {
    if (!activeConversation) return "";
    if (activeConversation.is_group) {
      return `${activeConversation.participants.length} participants`;
    }
    return "Active now";
  }, [activeConversation]);

  const getConversationAvatar = (conversation: ConversationSummary) => {
    if (conversation.is_group) {
      const seed = conversation.title || `group-${conversation.id}`;
      return resolveUserAvatar({ username: seed, profile: { avatar: null } }, seed);
    }
    const other = conversation.participants.find((participant) => participant.id !== user?.id);
    const seed = other?.username || conversation.title || `conversation-${conversation.id}`;
    return resolveUserAvatar(
      { username: seed, profile: { avatar: other?.avatar ?? null } },
      seed,
    );
  };

  const conversationAvatar = activeConversation ? getConversationAvatar(activeConversation) : undefined;

  const getContactAvatar = (contact: ChatContact) =>
    contact.avatar ?? resolveUserAvatar({ username: contact.username, profile: { avatar: null } }, contact.username);

  const handleSendMessage = () => {
    if (!selectedConversationId) return;
    const trimmed = messageDraft.trim();
    if (!trimmed) return;
    if (sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(trimmed);
  };

  const handleStartConversation = (username: string, participantId?: number) => {
    if (!username) {
      return;
    }

    if (typeof participantId === "number") {
      const existing = directConversationMap.get(participantId);
      if (existing) {
        setSelectedConversationId(existing.id);
        return;
      }
    }

    if (startConversationMutation.isPending) {
      return;
    }

    startConversationMutation.mutate(username);
  };

  const handleDeleteConversation = (conversationId: number) => {
    if (deleteConversationMutation.isPending) {
      return;
    }
    deleteConversationMutation.mutate(conversationId);
  };

  const isSending = sendMessageMutation.isPending;

  useEffect(() => {
    const targetUsername = redirectTargetRef.current;
    if (!targetUsername) {
      return;
    }

    const trimmed = targetUsername.trim();
    if (!trimmed) {
      redirectTargetRef.current = null;
      clearRedirectParam();
      return;
    }

    const matchingConversation = conversations.find((conversation) =>
      conversation.participants.some(
        (participant) =>
          participant.username.toLowerCase() === trimmed.toLowerCase() && participant.id !== user?.id,
      ),
    );

    if (matchingConversation) {
      setSelectedConversationId(matchingConversation.id);
      setSidebarTab("conversations");
      redirectTargetRef.current = null;
      clearRedirectParam();
      return;
    }

    if (!contactsQuery.isFetching && !startConversationMutation.isPending) {
      handleStartConversation(trimmed);
      setSidebarTab("conversations");
      redirectTargetRef.current = null;
      clearRedirectParam();
    }
  }, [clearRedirectParam, conversations, contactsQuery.isFetching, handleStartConversation, startConversationMutation.isPending, user?.id]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Topbar />

      <div className="pt-16 max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-6">
        <LeftSidebar />

        <main className="pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Messages</h1>
              <p className="text-sm text-muted-foreground">Chat with other members in real time.</p>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-soft-md overflow-hidden grid grid-cols-1 md:grid-cols-[340px,minmax(0,1fr)]">
            <div className="border-r border-border p-3 space-y-3">
              <div>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search users..."
                  className="w-full px-3 py-2 bg-secondary rounded-md outline-none text-sm"
                  aria-label="Search users to message"
                />
                {debouncedSearch.trim().length > 1 && (
                  <div className="mt-2 space-y-1">
                    {searchQuery.isPending && (
                      <div className="text-xs text-muted-foreground px-2 py-1">Searching…</div>
                    )}
                    {!searchQuery.isPending && searchQuery.data?.length === 0 && (
                      <div className="text-xs text-muted-foreground px-2 py-1">No users found.</div>
                    )}
                    {searchQuery.data?.map((result: PublicUserSummary) => {
                      const existingConversation = directConversationMap.get(result.id);
                      const isExisting = Boolean(existingConversation);

                      return (
                        <div
                          key={result.id}
                          className="flex items-center justify-between gap-2 rounded-md px-2 py-2 bg-muted/40"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{result.username}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.profile.display_name || result.first_name || result.last_name || result.username}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartConversation(result.username, result.id)}
                            className="text-xs font-medium px-3 py-1 rounded-md bg-primary text-primary-foreground"
                            disabled={startConversationMutation.isPending && !isExisting}
                          >
                            {isExisting ? "Open" : "Message"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="inline-flex rounded-lg bg-muted/60 p-1">
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      sidebarTab === "conversations"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSidebarTab("conversations")}
                    aria-pressed={sidebarTab === "conversations"}
                  >
                    Conversations
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      sidebarTab === "people"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSidebarTab("people")}
                    aria-pressed={sidebarTab === "people"}
                  >
                    People you follow
                  </button>
                </div>
                {sidebarTab === "conversations" && conversationsQuery.isFetching && (
                  <span className="text-xs text-muted-foreground">Refreshing…</span>
                )}
                {sidebarTab === "people" && contactsQuery.isFetching && (
                  <span className="text-xs text-muted-foreground">Updating…</span>
                )}
              </div>

              {sidebarTab === "people" ? (
                <div className="flex flex-col gap-2">
                  {contactsQuery.isError ? (
                    <div className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                      {getErrorMessage(contactsQuery.error)}
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                      {contacts.length === 0
                        ? "Follow people to see them here."
                        : "Everyone you follow already has an active conversation. Use search to reach others."}
                    </div>
                  ) : (
                    filteredContacts.map((contact) => {
                      const existingConversation = directConversationMap.get(contact.id);
                      const contactLabel = contact.full_name || contact.username;
                      const helperText = contact.you_follow && contact.follows_you
                        ? "You follow each other"
                        : contact.you_follow
                          ? "You follow them"
                          : contact.follows_you
                            ? "Follows you"
                            : "Start chatting";
                      const avatarUrl = getContactAvatar(contact);

                      return (
                        <div
                          key={contact.id}
                          className="flex items-center gap-3 rounded-md px-2 py-2 bg-muted/30"
                        >
                          <Avatar src={avatarUrl} alt={contactLabel} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium truncate">{contactLabel}</div>
                              {contact.follows_you && (
                                <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                                  Follows you
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{helperText}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartConversation(contact.username, contact.id)}
                            className="text-xs font-medium px-3 py-1 rounded-md bg-primary text-primary-foreground shrink-0"
                            disabled={startConversationMutation.isPending && !existingConversation}
                          >
                            Message
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {conversationsQuery.isError && (
                    <div className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                      {getErrorMessage(conversationsQuery.error)}
                    </div>
                  )}

                  {conversations.length === 0 && !conversationsQuery.isFetching ? (
                    <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                      {filteredContacts.length > 0
                        ? "Pick someone from People to start chatting."
                        : "Start a conversation by searching for a user."}
                    </div>
                  ) : (
                    conversations.map((conversation) => {
                      const lastMessage = conversation.last_message;
                      const preview = lastMessage?.content ?? "No messages yet";
                      const timestamp = lastMessage ? formatRelativeTime(lastMessage.created_at) : "—";
                      const other = conversation.participants.find((participant) => participant.id !== user?.id);
                      const label = conversation.is_group
                        ? conversation.title || `Group ${conversation.id}`
                        : other?.full_name || other?.username || conversation.title || `Conversation ${conversation.id}`;

                      const isSelected = conversation.id === selectedConversationId;
                      const avatarUrl = getConversationAvatar(conversation);

                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => setSelectedConversationId(conversation.id)}
                          className={`flex items-center gap-3 w-full text-left p-3 rounded-md transition-base ${
                            isSelected ? "bg-primary/10" : "hover:bg-secondary"
                          }`}
                          aria-current={isSelected}
                        >
                          <Avatar
                            src={avatarUrl}
                            alt={label}
                            hasStory={!isSelected}
                            isViewed={conversation.unread_count === 0}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium truncate">{label}</div>
                              <div className="text-xs text-muted-foreground shrink-0">{timestamp}</div>
                            </div>
                            <div className="text-sm text-muted-foreground truncate">{preview}</div>
                          </div>
                          {conversation.unread_count > 0 && (
                            <span className="ml-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full px-2 py-0.5">
                              {conversation.unread_count}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col h-[65vh] lg:h-[70vh]">
              {!activeConversation ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center px-6">
                  Select a conversation or start a new one to begin chatting.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3 border-b border-border pb-3">
                    <Avatar src={conversationAvatar} alt={conversationHeaderTitle} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{conversationHeaderTitle}</div>
                      <div className="text-xs text-muted-foreground truncate">{conversationHeaderSubtitle}</div>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOptionsOpenFor(optionsOpenFor === activeConversation.id ? null : activeConversation.id)
                        }
                        aria-haspopup="true"
                        aria-expanded={optionsOpenFor === activeConversation.id}
                        className="p-2 rounded-md hover:bg-secondary transition-base"
                        aria-label="Conversation options"
                      >
                        <MoreHorizontal />
                      </button>

                      {optionsOpenFor === activeConversation.id && (
                        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-md shadow-soft-md z-20">
                          <button
                            type="button"
                            onClick={() => setOptionsOpenFor(null)}
                            className="w-full text-left px-3 py-2 hover:bg-secondary"
                          >
                            <BellOff className="inline-block mr-2" size={14} /> Mute
                          </button>
                          <button
                            type="button"
                            onClick={() => setOptionsOpenFor(null)}
                            className="w-full text-left px-3 py-2 hover:bg-secondary"
                          >
                            <UserX className="inline-block mr-2" size={14} /> Block
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOptionsOpenFor(null);
                              handleDeleteConversation(activeConversation.id);
                            }}
                            className="w-full text-left px-3 py-2 text-destructive hover:bg-secondary disabled:opacity-60"
                            disabled={deleteConversationMutation.isPending}
                          >
                            <Trash2 className="inline-block mr-2" size={14} /> Delete Conversation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto px-2 py-2 space-y-3" aria-live="polite">
                    {messagesQuery.isPending && (
                      <div className="text-sm text-muted-foreground text-center mt-6">Loading messages…</div>
                    )}

                    {messagesQuery.isError && (
                      <div className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                        {getErrorMessage(messagesQuery.error)}
                      </div>
                    )}

                    {messagesQuery.data?.map((message) => {
                      const isOwnMessage = message.sender.id === user?.id;
                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`${
                              isOwnMessage ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                            } px-3 py-2 rounded-lg max-w-[70%]`}
                          >
                            <div className="text-sm break-words whitespace-pre-wrap">{message.content}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={messageDraft}
                        onChange={(event) => setMessageDraft(event.target.value)}
                        placeholder="Write a message..."
                        className="flex-1 px-3 py-2 bg-secondary rounded-md outline-none"
                        aria-label="Write a message"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-md"
                        aria-label="Send message"
                        disabled={isSending || !messageDraft.trim()}
                      >
                        <Send className={isSending ? "animate-pulse" : ""} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <Navbar />
    </div>
  );
};

export default Messages;
