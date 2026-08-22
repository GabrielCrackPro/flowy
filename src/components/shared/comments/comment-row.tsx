"use client";

import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { UserAvatar } from "@/components/shared";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui";
import { CornerDownRight, Pencil, Trash2, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types/Comment";
import type { Profile } from "@/types/Profile";

export function formatRelativeTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const seconds = Math.round(diffMs / 1000);
  if (Math.abs(seconds) < 45) return rtf.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return rtf.format(days, "day");

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export interface CommentRowProps {
  comment: Comment;
  childrenOf: Map<string, Comment[]>;
  depth?: number;
  profile: Profile | null;
  t: (key: string) => string;
  locale: string;
  commentsBusy: boolean;
  editingId: string | null;
  editText: string;
  onEditTextChange: (value: string) => void;
  onStartEdit: (comment: Comment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (commentId: string) => void;
  onRequestDelete: (commentId: string) => void;
  replyTargetId: string | null;
  replyText: string;
  onReplyTextChange: (value: string) => void;
  onToggleReply: (comment: Comment) => void;
  onCancelReply: () => void;
  onSendReply: (commentId: string) => void;
}

export function CommentRow({
  comment,
  childrenOf,
  depth = 0,
  profile,
  t,
  locale,
  commentsBusy,
  editingId,
  editText,
  onEditTextChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
  replyTargetId,
  replyText,
  onReplyTextChange,
  onToggleReply,
  onCancelReply,
  onSendReply,
}: CommentRowProps) {
  const compact = depth > 0;
  const replies = childrenOf.get(comment.id) ?? [];
  const editing = editingId === comment.id;
  const replying = replyTargetId === comment.id;
  const avatar = profile ? (
    <UserAvatar
      profile={profile}
      size="sm"
      className={cn(
        "shrink-0",
        compact ? "size-6 text-[9px]" : "size-8 text-[10px]",
      )}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted",
        compact ? "size-6" : "size-8",
      )}
    />
  );

  const rowClass = cn(
    "group flex items-start gap-3 transition-colors hover:bg-muted/30",
    compact ? "-mx-2 rounded-xl px-2 py-2" : "-mx-3 rounded-2xl px-3 py-3",
  );

  if (editing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className={cn(rowClass, "hover:bg-transparent")}
      >
        {avatar}
        <div className="min-w-0 flex-1 space-y-2.5">
          <textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm shadow-sm outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            rows={2}
          />
          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
            >
              {t("transaction.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!editText.trim() || commentsBusy}
              onClick={() => onSaveEdit(comment.id)}
            >
              {t("transaction.save")}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
    >
      <div className={rowClass}>
        {avatar}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "font-semibold text-foreground",
                compact ? "text-[11px]" : "text-xs",
              )}
            >
              {profile?.name ?? t("profile.user")}
            </span>
            <span className="text-[11px] text-muted-foreground/40">
              {formatRelativeTime(comment.createdAt, locale)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-[11px] text-muted-foreground/30">
                {t("transaction.modified")}
              </span>
            )}
          </div>
          <div
            className={cn(
              "mt-1 leading-relaxed text-foreground/85 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_li]:ml-4 [&_li]:list-disc [&_ol]:space-y-1 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-2.5 [&_pre]:text-xs [&_strong]:font-semibold [&_ul]:space-y-1",
              compact ? "text-[13px]" : "text-sm",
            )}
          >
            <ReactMarkdown
              components={{
                a: ({ node: _node, ...props }) => (
                  <a {...props} target="_blank" rel="noreferrer" />
                ),
              }}
            >
              {comment.content}
            </ReactMarkdown>
          </div>
        </div>

        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            aria-label={t("transaction.reply")}
            onClick={() => onToggleReply(comment)}
            className={cn(
              "flex items-center justify-center rounded-lg text-muted-foreground/30 transition-colors hover:bg-muted hover:text-foreground",
              compact ? "size-6" : "size-7",
            )}
          >
            <Icon
              icon={CornerDownRight}
              className={compact ? "size-3" : "size-3.5"}
            />
          </button>
          <button
            type="button"
            onClick={() => onStartEdit(comment)}
            className={cn(
              "flex items-center justify-center rounded-lg text-muted-foreground/30 transition-colors hover:bg-muted hover:text-foreground",
              compact ? "size-6" : "size-7",
            )}
          >
            <Icon icon={Pencil} className={compact ? "size-3" : "size-3"} />
          </button>
          <button
            type="button"
            onClick={() => onRequestDelete(comment.id)}
            className={cn(
              "flex items-center justify-center rounded-lg text-muted-foreground/30 transition-colors hover:bg-destructive/5 hover:text-destructive",
              compact ? "size-6" : "size-7",
            )}
          >
            <Icon icon={Trash2} className={compact ? "size-3" : "size-3"} />
          </button>
        </div>
      </div>

      {replying && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendReply(comment.id);
          }}
          className="mt-2 ml-11 flex items-center gap-2"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/60 bg-muted/20 py-1.5 pl-3.5 pr-1.5 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
            <input
              type="text"
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder={t("transaction.replyPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || commentsBusy}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-20"
            >
              {commentsBusy ? (
                <span className="size-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
              ) : (
                <Icon icon={CornerDownRight} className="size-3.5" />
              )}
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("transaction.cancelReply")}
            onClick={onCancelReply}
          >
            <Icon icon={X} className="size-3.5" />
          </Button>
        </form>
      )}

      {replies.length > 0 && (
        <div className="ml-11 mt-1 space-y-0.5 border-l border-border/60 pl-4">
          <AnimatePresence initial={false}>
            {replies.map((reply) => (
              <CommentRow
                key={reply.id}
                comment={reply}
                childrenOf={childrenOf}
                depth={depth + 1}
                profile={profile}
                t={t}
                locale={locale}
                commentsBusy={commentsBusy}
                editingId={editingId}
                editText={editText}
                onEditTextChange={onEditTextChange}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onRequestDelete={onRequestDelete}
                replyTargetId={replyTargetId}
                replyText={replyText}
                onReplyTextChange={onReplyTextChange}
                onToggleReply={onToggleReply}
                onCancelReply={onCancelReply}
                onSendReply={onSendReply}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
