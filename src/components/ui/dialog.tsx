"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { XIcon } from "@/lib/icons";

import { cn } from "@/lib/utils";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/60 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  const { t } = useTranslation();

  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border border-border/30 bg-gradient-to-br from-background to-background/50 p-6 shadow-2xl ring-1 ring-foreground/10 duration-200 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0 sm:rounded-2xl",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg opacity-70 ring-offset-background transition hover:opacity-100 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2 disabled:pointer-events-none">
          <Icon icon={XIcon} className="size-4" />
          <span className="sr-only">{t("common.close")}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1.5 text-center sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg font-semibold leading-none tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground/80", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
