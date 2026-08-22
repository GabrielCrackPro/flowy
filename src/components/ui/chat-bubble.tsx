import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps extends HTMLAttributes<HTMLDivElement> {
  variant: "user" | "assistant";
}

export function ChatBubble({ variant, className, ...props }: ChatBubbleProps) {
  return (
    <div
      data-role={variant}
      className={cn(
        "flex w-full items-end gap-2.5 text-sm",
        variant === "user" ? "justify-end" : "justify-start",
        className,
      )}
      {...props}
    />
  );
}

export function ChatBubbleAvatar({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10",
        className,
      )}
      {...props}
    />
  );
}

export function ChatBubbleContent({
  variant,
  className,
  ...props
}: ChatBubbleProps) {
  return (
    <div
      data-role={variant}
      className={cn(
        "max-w-[calc(100%-2.25rem)] overflow-hidden rounded-2xl px-3.5 py-2.5 text-[0.9375rem] leading-6 whitespace-pre-wrap break-words shadow-sm sm:max-w-[85%]",
        variant === "user"
          ? "rounded-br-md bg-primary text-primary-foreground shadow-primary/10"
          : "rounded-bl-md border border-border/50 bg-muted/55 text-foreground shadow-black/5",
        className,
      )}
      {...props}
    />
  );
}
