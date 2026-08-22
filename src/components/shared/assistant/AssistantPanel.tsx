"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  CircleStop,
  Clock,
  Copy,
  MessageSquare,
  Pencil,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
} from "lucide";
import { MorphIcon } from "morphicons/react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Button,
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleContent,
} from "@/components/ui";
import { useAssistant } from "@/hooks/useAssistant";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface AssistantPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// History panel — slide-down section in the chat area
// ---------------------------------------------------------------------------
function HistoryPanel({
  open,
  conversations,
  loading,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: {
  open: boolean;
  conversations: Array<{
    id: string;
    title: string;
    updatedAt: string;
  }>;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="mb-3 rounded-xl border border-border/50 bg-muted/15 p-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">
                {t("assistant.history")}
              </span>
              <button
                type="button"
                className="text-[10px] font-medium text-primary hover:underline"
                onClick={onNew}
              >
                {t("assistant.newConversation")}
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 px-2 py-4">
                <MorphIcon icon={Clock} size={12} reducedMotion="user" />
                <span className="text-[11px] text-muted-foreground">
                  {t("common.loading")}
                </span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-2 py-4 text-center">
                <p className="text-[11px] text-muted-foreground/60">
                  {t("assistant.noHistory")}
                </p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto overscroll-contain">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="group flex items-center gap-1 rounded-lg px-1 transition-colors hover:bg-muted/40"
                  >
                    {editingId === conversation.id ? (
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => {
                            if (editTitle.trim())
                              onRename(conversation.id, editTitle);
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="min-w-0 flex-1 rounded-md border border-border/50 bg-background px-2 py-1 text-[11px] outline-none focus:border-primary/40"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-[11px] text-foreground/80"
                        onClick={() => onSelect(conversation.id)}
                      >
                        <span className="block truncate">
                          {conversation.title}
                        </span>
                        <span className="block text-[9px] text-muted-foreground/40">
                          {formatRelativeTime(conversation.updatedAt)}
                        </span>
                      </button>
                    )}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground/40 hover:text-foreground"
                        onClick={() => {
                          setEditingId(conversation.id);
                          setEditTitle(conversation.title);
                        }}
                        aria-label={t("assistant.renameConversation")}
                      >
                        <MorphIcon
                          icon={Pencil}
                          size={12}
                          reducedMotion="user"
                        />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground/40 hover:text-destructive"
                        onClick={() => onDelete(conversation.id)}
                        aria-label={t("assistant.deleteConversation")}
                      >
                        <MorphIcon
                          icon={Trash2}
                          size={12}
                          reducedMotion="user"
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Empty state — welcome screen with branded icon and suggested prompts
// ---------------------------------------------------------------------------
function EmptyState({
  prompts,
  onPrompt,
}: {
  prompts: string[];
  onPrompt: (text: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[22rem] flex-col items-center justify-center px-2 py-8 text-center sm:min-h-[26rem] sm:py-12">
      <div className="relative mb-4">
        <div className="absolute -inset-3 rounded-3xl bg-primary/5 blur-xl" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
          <MorphIcon icon={MessageSquare} size={24} reducedMotion="user" />
        </div>
      </div>
      <p className="text-sm font-semibold tracking-tight text-foreground">
        {t("assistant.emptyTitle")}
      </p>
      <p className="mt-1.5 max-w-[16rem] text-[11px] leading-4 text-muted-foreground">
        {t("assistant.emptyDescription")}
      </p>
      <div className="mt-5 w-full max-w-sm space-y-1.5 text-left">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="group flex min-h-10 w-full items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-left text-[11px] text-muted-foreground shadow-sm transition active:scale-[0.99] hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
            onClick={() => onPrompt(prompt)}
          >
            <span className="min-w-0 flex-1 truncate">{prompt}</span>
            <MorphIcon
              icon={Send}
              size={12}
              reducedMotion="user"
              className="shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-60"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message action bar — appears on hover/focus for assistant messages
// ---------------------------------------------------------------------------
function MessageActions({
  messageId,
  text,
  copied,
  onCopy,
}: {
  messageId: string;
  text: string;
  copied: boolean;
  onCopy: (id: string, text: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        onClick={() => onCopy(messageId, text)}
        aria-label={
          copied ? t("assistant.copiedResponse") : t("assistant.copyResponse")
        }
        title={
          copied ? t("assistant.copiedResponse") : t("assistant.copyResponse")
        }
        className={cn(
          "rounded-md p-1 text-muted-foreground/40 transition hover:bg-muted hover:text-foreground",
          copied && "text-primary",
        )}
      >
        <MorphIcon
          icon={copied ? Check : Copy}
          size={12}
          reducedMotion="user"
          className={cn(
            "transition-transform duration-200",
            copied && "scale-110",
          )}
        />
      </button>
      <button
        type="button"
        aria-label={t("assistant.regenerate")}
        title={t("assistant.regenerate")}
        className="rounded-md p-1 text-muted-foreground/40 transition hover:bg-muted hover:text-foreground"
      >
        <MorphIcon icon={RefreshCw} size={12} reducedMotion="user" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
export function AssistantPanel({ open, onOpenChange }: AssistantPanelProps) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const {
    messages,
    sendMessage,
    isLoading,
    stop,
    error: chatError,
    conversations,
    historyLoading,
    refreshConversations,
    selectConversation,
    startNewConversation,
    deleteConversation,
    renameConversation,
  } = useAssistant({ onError: () => setHasError(true) });

  const messageCount = messages.length;
  const streamedTextLength = messages.reduce(
    (total, message) =>
      total +
      message.parts.reduce(
        (length, part) =>
          length + (part.type === "text" ? part.text.length : 0),
        0,
      ),
    0,
  );

  const suggestedPrompts = [
    t("assistant.suggestions.monthlyOverview"),
    t("assistant.suggestions.subscriptions"),
    t("assistant.suggestions.budgets"),
    t("assistant.suggestions.savingsRate"),
  ];

  const latestMessage = messages[messages.length - 1];
  const hasLatestAssistantText =
    latestMessage?.role === "assistant" &&
    latestMessage.parts.some(
      (part) => part.type === "text" && part.text.trim().length > 0,
    );

  const errorMessage = (() => {
    const raw = chatError?.message || "";
    if (
      raw.includes("insufficient_quota") ||
      raw.includes("exceeded your current quota")
    )
      return t("assistant.quotaExceeded");
    if (raw.includes("rate_limit") || raw.includes("Too many requests"))
      return t("assistant.rateLimited");
    if (raw.includes("not configured")) return t("assistant.notConfigured");
    try {
      const parsed = JSON.parse(raw) as { message?: string; category?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // Not JSON — use as-is
    }
    return raw || t("assistant.errorGeneric");
  })();

  // biome-ignore lint/correctness/useExhaustiveDependencies: message count drives scrolling when the stream changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount, streamedTextLength]);

  useEffect(() => {
    if (open) void refreshConversations();
  }, [open, refreshConversations]);

  useEffect(() => {
    if (!open) {
      setInput("");
      setHasError(false);
      setShowHistory(false);
      if (inputRef.current) inputRef.current.style.height = "auto";
    }
  }, [open]);

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    setHasError(false);
    sendMessage({ text: input.trim() });
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  function handleSuggestedPrompt(prompt: string) {
    setHasError(false);
    sendMessage({ text: prompt });
  }

  async function handleCopy(messageId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      window.setTimeout(() => setCopiedMessageId(null), 1800);
    } catch {
      setCopiedMessageId(null);
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("assistant.title")}
      icon={<MorphIcon icon={MessageSquare} size={20} reducedMotion="user" />}
      headerAction={
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setShowHistory((v) => !v);
              void refreshConversations();
            }}
            aria-label={t("assistant.history")}
            title={t("assistant.history")}
            className={cn(
              "rounded-lg",
              showHistory
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MorphIcon
              icon={showHistory ? ChevronDown : Clock}
              size={14}
              reducedMotion="user"
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              startNewConversation();
              setShowHistory(false);
            }}
            aria-label={t("assistant.newConversation")}
            title={t("assistant.newConversation")}
            className="rounded-lg text-muted-foreground hover:text-foreground"
          >
            <MorphIcon icon={RotateCcw} size={14} reducedMotion="user" />
          </Button>
        </div>
      }
      className="sm:max-w-md"
      contentClassName="p-0"
      snapPoints={[0.45, 0.92]}
      defaultSnapPoint={1}
    >
      <div className="flex min-h-[calc(92dvh-7rem)] flex-col sm:min-h-0 sm:h-full">
        {/* Scrollable area */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          <HistoryPanel
            open={showHistory}
            conversations={conversations}
            loading={historyLoading}
            onSelect={(id) => {
              void selectConversation(id);
              setShowHistory(false);
            }}
            onNew={() => {
              startNewConversation();
              setShowHistory(false);
            }}
            onRename={(id, title) => void renameConversation(id, title)}
            onDelete={(id) => void deleteConversation(id)}
          />

          {messages.length === 0 && (
            <EmptyState
              prompts={suggestedPrompts}
              onPrompt={handleSuggestedPrompt}
            />
          )}

          <div className="space-y-3 sm:space-y-4">
            {messages.map((msg, index) => {
              const text = msg.parts
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("");

              if (!text.trim()) return null;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.24,
                    delay: Math.min(index * 0.035, 0.18),
                    ease: "easeOut",
                  }}
                  className="group"
                >
                  <ChatBubble
                    variant={msg.role === "user" ? "user" : "assistant"}
                  >
                    {msg.role === "assistant" && (
                      <ChatBubbleAvatar>
                        <MorphIcon
                          icon={MessageSquare}
                          size={14}
                          reducedMotion="user"
                        />
                      </ChatBubbleAvatar>
                    )}
                    <ChatBubbleContent
                      variant={msg.role === "user" ? "user" : "assistant"}
                    >
                      {msg.role === "assistant" ? (
                        <div className="[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-background/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_h1]:text-sm [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol]:space-y-1 [&_p]:leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background/70 [&_pre]:p-2.5 [&_pre]:text-xs [&_strong]:font-semibold [&_ul]:space-y-1">
                          <ReactMarkdown
                            components={{
                              a: ({ node: _node, ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noreferrer"
                                />
                              ),
                            }}
                          >
                            {text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p>{text}</p>
                      )}
                    </ChatBubbleContent>
                    {msg.role === "user" && (
                      <ChatBubbleAvatar className="size-7 bg-transparent p-0 ring-0">
                        {profile ? (
                          <UserAvatar
                            profile={profile}
                            size="sm"
                            className="size-7 ring-0"
                          />
                        ) : (
                          "Y"
                        )}
                      </ChatBubbleAvatar>
                    )}
                  </ChatBubble>
                  {msg.role === "assistant" && (
                    <div className="ml-8 mt-1">
                      <MessageActions
                        messageId={msg.id}
                        text={text}
                        copied={copiedMessageId === msg.id}
                        onCopy={handleCopy}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Thinking indicator */}
          {isLoading && !hasLatestAssistantText && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              aria-live="polite"
              className="mt-3 sm:mt-4"
            >
              <ChatBubble variant="assistant">
                <ChatBubbleAvatar>
                  <MorphIcon
                    icon={MessageSquare}
                    size={14}
                    reducedMotion="user"
                  />
                </ChatBubbleAvatar>
                <ChatBubbleContent
                  variant="assistant"
                  className="flex items-center gap-1.5 px-4 py-3"
                >
                  <span className="sr-only">{t("assistant.thinking")}</span>
                  <span className="size-1.5 animate-[assistant-thinking_1.2s_ease-in-out_infinite] rounded-full bg-primary [animation-delay:-0.4s] motion-reduce:animate-none" />
                  <span className="size-1.5 animate-[assistant-thinking_1.2s_ease-in-out_infinite] rounded-full bg-primary/70 [animation-delay:-0.2s] motion-reduce:animate-none" />
                  <span className="size-1.5 animate-[assistant-thinking_1.2s_ease-in-out_infinite] rounded-full bg-primary/40 motion-reduce:animate-none" />
                </ChatBubbleContent>
              </ChatBubble>
            </motion.div>
          )}

          {/* Error */}
          {hasError && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3"
            >
              <div className="flex items-start gap-2.5">
                <MorphIcon
                  icon={CircleStop}
                  size={14}
                  reducedMotion="user"
                  className="mt-0.5 shrink-0 text-destructive"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-medium text-destructive">
                    {errorMessage}
                  </p>
                  <p className="text-[10px] text-destructive/60">
                    {t("assistant.errorHint")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer — pinned to bottom */}
        <div className="shrink-0 border-t border-border/40 bg-background/98 px-3 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px)+0.5rem)] shadow-[0_-8px_24px_hsl(var(--background)/0.7)] backdrop-blur-sm sm:px-4 sm:py-3">
          <form onSubmit={handleSubmit} className="space-y-1.5">
            <div className="flex items-end gap-1.5 rounded-2xl border border-border/60 bg-muted/20 p-1 shadow-sm transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={2000}
                onInput={(e) => {
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 128)}px`;
                }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={t("assistant.placeholder")}
                disabled={isLoading}
                aria-label={t("assistant.placeholder")}
                className={cn(
                  "min-h-10 max-h-32 flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
              <div className="flex items-center gap-0.5">
                {isLoading ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => stop()}
                    aria-label={t("assistant.stop")}
                    className="mb-0.5 size-8 rounded-xl text-destructive transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <MorphIcon
                      icon={CircleStop}
                      size={16}
                      reducedMotion="user"
                    />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon-sm"
                    variant="default"
                    disabled={!input.trim()}
                    aria-label={t("assistant.send")}
                    className={cn(
                      "mb-0.5 size-8 rounded-xl transition-all duration-200",
                      input.trim()
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <MorphIcon
                      icon={Send}
                      size={16}
                      reducedMotion="user"
                      className={cn(
                        "transition-transform duration-200",
                        input.trim() && "-rotate-12",
                      )}
                    />
                  </Button>
                )}
              </div>
            </div>
          </form>
          <p className="mt-1 text-center text-[9px] text-muted-foreground/40 max-sm:hidden">
            {t("assistant.disclaimer")}
          </p>
        </div>
      </div>
    </BottomSheet>
  );
}
