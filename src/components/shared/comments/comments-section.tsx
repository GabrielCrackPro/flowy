"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { ConfirmDialog, EmptyState, UserAvatar } from "@/components/shared";
import { DetailCard } from "@/components/shared/detail-card";
import { Icon } from "@/components/shared/icon";
import { useCloseWhenSettled } from "@/hooks/useCloseWhenSettled";
import { useComments } from "@/hooks/useComments";
import { useProfile } from "@/hooks/useProfile";
import {
  Bold,
  Code2,
  Eye,
  EyeOff,
  Italic,
  List,
  MessageSquare,
  Send,
} from "@/lib/icons";
import type { Comment } from "@/types/Comment";
import { CommentRow } from "./comment-row";

export function CommentsSection({
  entityType,
  entityId,
}: {
  entityType: string;
  entityId: string;
}) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const locale = profile?.locale ?? "es-ES";
  const {
    comments,
    busy: commentsBusy,
    addComment,
    editComment,
    removeComment,
  } = useComments(entityType, entityId);

  const [commentText, setCommentText] = useState("");
  const [previewComment, setPreviewComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const { roots, childrenOf } = useMemo(() => {
    const byParent = new Map<string | null, Comment[]>();
    for (const comment of comments) {
      const key = comment.parentId;
      const list = byParent.get(key) ?? [];
      list.push(comment);
      byParent.set(key, list);
    }
    const sortLevel = (list: Comment[]) =>
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const childrenOf = new Map<string, Comment[]>();
    for (const [key, list] of byParent) {
      if (key !== null) childrenOf.set(key, sortLevel(list));
    }
    return { roots: sortLevel(byParent.get(null) ?? []), childrenOf };
  }, [comments]);

  const handleAddComment = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const text = commentText.trim();
      if (!text) return;
      await addComment(text);
      setCommentText("");
      setPreviewComment(false);
    },
    [commentText, addComment],
  );

  const applyMarkdown = useCallback(
    (prefix: string, suffix = "") => {
      const input = commentInputRef.current;
      if (!input) return;
      const start = input.selectionStart ?? commentText.length;
      const end = input.selectionEnd ?? start;
      const selected = commentText.slice(start, end);
      const inserted = `${prefix}${selected}${suffix}`;
      const next = `${commentText.slice(0, start)}${inserted}${commentText.slice(end)}`;
      setCommentText(next);
      requestAnimationFrame(() => {
        input.focus();
        if (selected) {
          const cursor = start + inserted.length;
          input.setSelectionRange(cursor, cursor);
        } else {
          const cursor = start + prefix.length;
          input.setSelectionRange(cursor, cursor);
        }
      });
    },
    [commentText],
  );

  const handleAddReply = useCallback(
    async (parentId: string) => {
      const text = replyText.trim();
      if (!text) return;
      await addComment(text, parentId);
      setReplyText("");
      setReplyingToId(null);
    },
    [replyText, addComment],
  );

  const handleSaveEdit = useCallback(
    async (commentId: string) => {
      const text = editText.trim();
      if (!text) return;
      await editComment(commentId, text);
      setEditingId(null);
      setEditText("");
    },
    [editText, editComment],
  );

  // Keep the confirm open (spinner + disabled buttons) while the removal is
  // in flight, then close once it settles — the toast reports the outcome.
  const markDeleteStarted = useCloseWhenSettled(commentsBusy, () =>
    setDeleteCommentId(null),
  );

  const commentAvatar = profile ? (
    <UserAvatar profile={profile} size="sm" className="size-8 text-[10px]" />
  ) : (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted" />
  );
  const markdownLink = (props: React.ComponentProps<"a">) => (
    <a {...props} target="_blank" rel="noreferrer" />
  );

  return (
    <DetailCard delay={0.2} className="mt-8">
      <div className="p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            <Icon icon={MessageSquare} className="size-3.5" />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
            {t("transaction.comments")}
          </span>
          {comments.length > 0 && (
            <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground/60">
              {comments.length}
            </span>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {roots.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon={<Icon icon={MessageSquare} className="size-5" />}
                description={t("transaction.commentsEmpty")}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1"
            >
              <AnimatePresence initial={false}>
                {roots.map((comment) => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    childrenOf={childrenOf}
                    profile={profile}
                    t={t}
                    locale={locale}
                    commentsBusy={commentsBusy}
                    editingId={editingId}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onStartEdit={(target) => {
                      setEditingId(target.id);
                      setEditText(target.content);
                    }}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                    onSaveEdit={handleSaveEdit}
                    onRequestDelete={setDeleteCommentId}
                    replyTargetId={replyingToId}
                    replyText={replyText}
                    onReplyTextChange={setReplyText}
                    onToggleReply={(target) => {
                      setReplyingToId((current) =>
                        current === target.id ? null : target.id,
                      );
                      setReplyText("");
                    }}
                    onCancelReply={() => {
                      setReplyingToId(null);
                      setReplyText("");
                    }}
                    onSendReply={handleAddReply}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          onSubmit={handleAddComment}
          className="mt-5 flex items-start gap-3"
        >
          {commentAvatar}
          <div className="min-w-0 flex-1 space-y-1 rounded-xl border border-border/60 bg-muted/20 p-1.5 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-0.5">
                {[
                  {
                    icon: Bold,
                    key: "markdownBold",
                    prefix: "**",
                    suffix: "**",
                  },
                  {
                    icon: Italic,
                    key: "markdownItalic",
                    prefix: "*",
                    suffix: "*",
                  },
                  {
                    icon: Code2,
                    key: "markdownCode",
                    prefix: "`",
                    suffix: "`",
                  },
                  { icon: List, key: "markdownList", prefix: "- ", suffix: "" },
                ].map(({ icon: IconComponent, key, prefix, suffix }) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={t(`transaction.${key}`)}
                    title={t(`transaction.${key}`)}
                    onClick={() => applyMarkdown(prefix, suffix)}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
                  >
                    <Icon icon={IconComponent} className="size-3.5" />
                  </button>
                ))}
              </div>
              {commentText.trim() && (
                <button
                  type="button"
                  onClick={() => setPreviewComment((value) => !value)}
                  aria-label={
                    previewComment
                      ? t("transaction.markdownEdit")
                      : t("transaction.markdownPreview")
                  }
                  aria-pressed={previewComment}
                  title={
                    previewComment
                      ? t("transaction.markdownEdit")
                      : t("transaction.markdownPreview")
                  }
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
                >
                  <Icon
                    icon={previewComment ? EyeOff : Eye}
                    className="size-3.5"
                  />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 py-0.5 pl-2">
              {previewComment && commentText.trim() ? (
                <div className="min-h-10 flex-1 px-2 py-2 text-sm text-foreground/85 [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-2 [&_ul]:space-y-1">
                  {commentText.trim() ? (
                    <ReactMarkdown components={{ a: markdownLink }}>
                      {commentText}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-muted-foreground/40">
                      {t("transaction.commentPlaceholder")}
                    </span>
                  )}
                </div>
              ) : (
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("transaction.commentPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
                />
              )}
              <button
                type="submit"
                disabled={!commentText.trim() || commentsBusy}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-20"
              >
                {commentsBusy ? (
                  <span className="size-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                ) : (
                  <Icon icon={Send} className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={!!deleteCommentId}
        onOpenChange={(open) => {
          if (!open) setDeleteCommentId(null);
        }}
        title={t("transaction.comments")}
        description={t("transaction.commentDeleteConfirm")}
        confirmLabel={t("transactions.delete")}
        cancelLabel={t("transaction.cancel")}
        loading={commentsBusy}
        closeOnConfirm={false}
        onConfirm={() => {
          if (deleteCommentId) {
            markDeleteStarted();
            removeComment(deleteCommentId);
          }
        }}
      />
    </DetailCard>
  );
}
