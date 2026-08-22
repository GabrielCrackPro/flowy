"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useRef, useState } from "react";
import { authenticatedRequest, getAccessToken } from "@/lib/api/client";

export interface AssistantConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ConversationResponse {
  id: string;
  title: string;
  messages: Array<{ id: string; role: "user" | "assistant"; content: string }>;
}

interface UseAssistantOptions {
  onError?: (error: Error) => void;
}

export function useAssistant({ onError }: UseAssistantOptions = {}) {
  const conversationIdRef = useRef<string | null>(null);
  if (!conversationIdRef.current && typeof crypto !== "undefined") {
    conversationIdRef.current = crypto.randomUUID();
  }
  const [conversations, setConversations] = useState<
    AssistantConversationSummary[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant",
        body: () => ({ conversationId: conversationIdRef.current }),
        headers: async () => {
          const token = await getAccessToken();
          return token
            ? { Authorization: `Bearer ${token}` }
            : { Authorization: "" };
        },
        credentials: "same-origin",
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    transport,
    onError: useCallback((err: Error) => onError?.(err), [onError]),
  });

  const refreshConversations = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setConversations(
        await authenticatedRequest<AssistantConversationSummary[]>(
          "/api/assistant/conversations",
        ),
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const selectConversation = useCallback(
    async (id: string) => {
      const conversation = await authenticatedRequest<ConversationResponse>(
        `/api/assistant/conversations?id=${id}`,
      );
      conversationIdRef.current = conversation.id;
      setMessages(
        conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          parts: [{ type: "text", text: message.content }],
        })) as UIMessage[],
      );
    },
    [setMessages],
  );

  const startNewConversation = useCallback(() => {
    conversationIdRef.current = crypto.randomUUID();
    setMessages([]);
  }, [setMessages]);
  const renameConversation = useCallback(
    async (id: string, title: string) => {
      await authenticatedRequest(`/api/assistant/conversations?id=${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      await refreshConversations();
    },
    [refreshConversations],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      await authenticatedRequest(`/api/assistant/conversations?id=${id}`, {
        method: "DELETE",
      });
      if (conversationIdRef.current === id) startNewConversation();
      await refreshConversations();
    },
    [refreshConversations, startNewConversation],
  );

  return {
    messages: messages as UIMessage[],
    sendMessage,
    status,
    stop,
    error,
    setMessages,
    isLoading: status === "streaming" || status === "submitted",
    conversations,
    historyLoading,
    refreshConversations,
    selectConversation,
    startNewConversation,
    deleteConversation,
    renameConversation,
  };
}
