"use client";

import { motion } from "framer-motion";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { authenticatedRequest } from "@/lib/api/client";
import { deleteUploadedReceipt } from "@/lib/api/upload";
import {
  AlertCircle,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  Upload,
} from "@/lib/icons";
import { resizeImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

interface FileUploadLabels {
  uploadLabel?: string;
  viewLabel?: string;
  dragHint?: string;
  fileTypesHint?: string;
  changeLabel?: string;
  removeLabel?: string;
  uploadingLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
  /** Supports the {{maxSize}} placeholder (in MB). */
  maxSizeError?: string;
}

interface FileUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  maxSize?: number;
  labels?: FileUploadLabels;
  disabled?: boolean;
  /** Uses a compact preview suitable for embedded sheets. */
  compact?: boolean;
  className?: string;
}

type UploadState =
  | { status: "idle" }
  | { status: "dragging" }
  | { status: "uploading" }
  | { status: "error"; message: string };

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg|avif|bmp)(\?.*)?$/i.test(url);
}

export function FileUpload({
  value,
  onChange,
  accept = "image/png,image/jpeg,image/jpg,image/webp,application/pdf",
  maxSize = 10 * 1024 * 1024,
  labels: userLabels,
  disabled = false,
  compact = false,
  className,
}: FileUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mountedRef = useRef(true);
  const uploadRequestRef = useRef(0);
  const pendingUploadedUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Invalidate in-flight uploads. If one resolves after the component has
      // unmounted, uploadFile will remove the object instead of losing its URL.
      uploadRequestRef.current += 1;
      const pendingUrls = Array.from(pendingUploadedUrlsRef.current);
      pendingUploadedUrlsRef.current.clear();
      for (const url of pendingUrls) {
        void deleteUploadedReceipt(url).catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const labels = useMemo(
    () => ({
      uploadLabel: t("transaction.uploadReceipt"),
      viewLabel: t("transaction.viewReceipt"),
      dragHint: t("transaction.dragDropHint"),
      fileTypesHint: t("transaction.fileTypesHint"),
      changeLabel: t("transaction.changeFile"),
      removeLabel: t("transaction.removeFile"),
      uploadingLabel: t("transaction.uploadProgress"),
      errorLabel: t("transaction.uploadError"),
      retryLabel: t("transaction.retry"),
      maxSizeError: t("transaction.uploadTooLarge"),
      ...userLabels,
    }),
    [t, userLabels],
  );
  const hasFile = !!value;

  const uploadFile = useCallback(
    async (file: File) => {
      const requestId = uploadRequestRef.current + 1;
      uploadRequestRef.current = requestId;
      const isCurrentRequest = () =>
        mountedRef.current && uploadRequestRef.current === requestId;

      if (file.size > maxSize) {
        setUploadProgress(null);
        setState({
          status: "error",
          message: (labels.maxSizeError ?? "").replace(
            "{{maxSize}}",
            String(Math.round(maxSize / 1024 / 1024)),
          ),
        });
        return;
      }

      setUploadProgress(0);
      setState({ status: "uploading" });

      try {
        // Images are downscaled client-side so receipts upload fast and stay
        // small in storage; PDFs pass through untouched.
        const payload = file.type.startsWith("image/")
          ? await resizeImage(file, 1600)
          : file;
        const formData = new FormData();
        formData.append("file", payload);
        // Goes through authenticatedRequest so uploads get the auth token,
        // rate-limit retries, and typed errors like the rest of the app.
        const data = await authenticatedRequest<{ url?: string }>(
          "/api/upload",
          {
            method: "POST",
            body: formData,
            onUploadProgress: setUploadProgress,
          },
        );
        if (!data?.url) throw new Error("upload_failed");

        // A sheet can close while the request is still in flight, or a user
        // can choose another file before this request finishes. Never hand an
        // orphaned result to a dead/stale form; remove it immediately instead.
        if (!isCurrentRequest()) {
          await deleteUploadedReceipt(data.url).catch(() => undefined);
          return;
        }

        pendingUploadedUrlsRef.current.add(data.url);
        try {
          onChange(data.url);
        } catch (error) {
          await deleteUploadedReceipt(data.url).catch(() => undefined);
          throw error;
        } finally {
          pendingUploadedUrlsRef.current.delete(data.url);
        }

        setPreviewUrl(null);
        setUploadProgress(null);
        setState({ status: "idle" });
      } catch {
        // Show the localized label, never raw server text. A stale request
        // must not overwrite the state of a newer upload or an unmounted form.
        if (!isCurrentRequest()) return;
        setUploadProgress(null);
        setState({
          status: "error",
          message: labels.errorLabel ?? "",
        });
      }
    },
    [maxSize, onChange, labels],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      uploadFile(file);
    },
    [uploadFile],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (disabled) return;
      setState({ status: "idle" });
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setState({ status: "dragging" });
  }, []);

  const handleDragLeave = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const handleRemove = useCallback(() => {
    // Any response from the previous upload is now stale. If it finishes
    // later, uploadFile will delete its object rather than attach it again.
    uploadRequestRef.current += 1;
    onChange(null);
    setPreviewUrl(null);
    setState({ status: "idle" });
  }, [onChange]);

  const handleRetry = useCallback(() => {
    setState({ status: "idle" });
    inputRef.current?.click();
  }, []);

  return (
    <div
      className={cn("w-full space-y-3", className)}
      aria-busy={state.status === "uploading"}
    >
      {hasFile && state.status !== "uploading" ? (
        <div
          className={cn(
            "overflow-hidden border border-border/30",
            compact
              ? "rounded-xl bg-muted/20 shadow-none"
              : "rounded-2xl bg-linear-to-br from-muted/20 to-muted/10 shadow-md",
          )}
        >
          {value && isImageUrl(value) ? (
            <div
              className={cn(
                "relative overflow-hidden bg-muted/30 ring-1 ring-border/20 shadow-sm",
                compact ? "m-2 h-28 rounded-lg sm:h-32" : "m-3 rounded-xl",
              )}
            >
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={labels.viewLabel}
                className="absolute inset-0 z-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                {/* biome-ignore lint/performance/noImgElement: dynamic remote receipt URLs with unknown dimensions — next/image would require remotePatterns config and fixed sizing */}
                <img
                  src={value}
                  alt={labels.viewLabel}
                  className={cn(
                    "h-full w-full object-cover",
                    !compact && "aspect-3/4",
                  )}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </button>
              <div className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-b from-black/25 via-transparent to-black/10" />
              <div
                className={cn(
                  "absolute right-2 top-2 z-10 flex items-center gap-1.5",
                  compact && "gap-1",
                )}
              >
                <motion.button
                  type="button"
                  disabled={disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => inputRef.current?.click()}
                  title={labels.changeLabel}
                  aria-label={labels.changeLabel}
                  className={cn(
                    "flex items-center justify-center rounded-full bg-linear-to-br from-black/45 to-black/35 text-white backdrop-blur-sm transition hover:from-black/65 hover:to-black/55 disabled:opacity-50 shadow-lg",
                    compact ? "size-7" : "size-9",
                  )}
                >
                  <Icon
                    icon={Upload}
                    className={compact ? "size-3.5" : "size-4"}
                  />
                </motion.button>
                <motion.button
                  type="button"
                  disabled={disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemove}
                  title={labels.removeLabel}
                  aria-label={labels.removeLabel}
                  className={cn(
                    "flex items-center justify-center rounded-full bg-linear-to-br from-destructive/60 to-destructive/50 text-white backdrop-blur-sm transition hover:from-destructive/80 hover:to-destructive/70 disabled:opacity-50 shadow-lg shadow-destructive/20",
                    compact ? "size-7" : "size-9",
                  )}
                >
                  <Icon
                    icon={Trash2}
                    className={compact ? "size-3.5" : "size-4"}
                  />
                </motion.button>
              </div>
            </div>
          ) : value ? (
            <div
              className={cn(
                "flex items-center gap-3 ring-1 ring-border/20",
                compact
                  ? "m-2 rounded-lg bg-background/70 p-2"
                  : "m-3 rounded-xl bg-linear-to-br from-background/60 to-background/40 p-3 shadow-sm",
              )}
            >
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-primary",
                  compact ? "size-9" : "size-11 shadow-md",
                )}
              >
                <Icon
                  icon={FileText}
                  className={compact ? "size-4" : "size-5"}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground/90">
                  {value.split("/").pop() || t("transaction.receipt")}
                </p>
                <p className="text-xs text-muted-foreground/50">PDF</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("common.download")}
                  className={cn(
                    "flex items-center justify-center rounded-lg text-muted-foreground/50 transition hover:bg-linear-to-br hover:from-muted/50 hover:to-muted/30 hover:text-foreground",
                    compact ? "size-7" : "size-8",
                  )}
                >
                  <Icon
                    icon={Download}
                    className={compact ? "size-3.5" : "size-4"}
                  />
                </motion.a>
                <motion.button
                  type="button"
                  disabled={disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => inputRef.current?.click()}
                  title={labels.changeLabel}
                  aria-label={labels.changeLabel}
                  className={cn(
                    "flex items-center justify-center rounded-lg text-muted-foreground/50 transition hover:bg-linear-to-br hover:from-muted/50 hover:to-muted/30 hover:text-primary",
                    compact ? "size-7" : "size-8",
                  )}
                >
                  <Icon
                    icon={Upload}
                    className={compact ? "size-3.5" : "size-4"}
                  />
                </motion.button>
                <motion.button
                  type="button"
                  disabled={disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemove}
                  title={labels.removeLabel}
                  aria-label={labels.removeLabel}
                  className={cn(
                    "flex items-center justify-center rounded-lg text-muted-foreground/50 transition hover:bg-linear-to-br hover:from-destructive/50 hover:to-destructive/30 hover:text-destructive",
                    compact ? "size-7" : "size-8",
                  )}
                >
                  <Icon
                    icon={Trash2}
                    className={compact ? "size-3.5" : "size-4"}
                  />
                </motion.button>
              </div>
            </div>
          ) : null}
        </div>
      ) : state.status === "uploading" ? (
        <output
          aria-live="polite"
          className={cn(
            "border border-primary/25 bg-primary/[0.03]",
            compact
              ? "rounded-xl p-2 shadow-none"
              : "rounded-2xl p-3 shadow-sm",
          )}
        >
          {previewUrl ? (
            <div
              className={cn(
                "relative overflow-hidden rounded-lg bg-muted/30",
                compact ? "h-20" : "h-28",
              )}
            >
              {/* biome-ignore lint/performance/noImgElement: local object URL preview with dynamic dimensions */}
              <img
                src={previewUrl}
                alt={labels.uploadLabel}
                className="h-full w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/35 backdrop-blur-[1px]">
                <div className="relative size-9">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="relative size-8">
                <div className="absolute inset-0 rounded-full border-2 border-primary/15" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
                />
              </div>
              <p className="text-sm font-medium text-foreground/70">
                {labels.uploadingLabel}
              </p>
            </div>
          )}
          {previewUrl ? (
            <p className="mt-2 text-center text-xs font-medium text-primary">
              {labels.uploadingLabel}
            </p>
          ) : null}
          {uploadProgress !== null ? (
            <div className="mt-2 flex items-center gap-2">
              <div
                role="progressbar"
                aria-label={labels.uploadingLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgress}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(uploadProgress, 4)}%` }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <span className="min-w-8 text-right text-[11px] font-medium tabular-nums text-primary">
                {uploadProgress}%
              </span>
            </div>
          ) : null}
        </output>
      ) : state.status === "error" ? (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            "border-2 border-dashed border-destructive/30 bg-linear-to-br from-destructive/2 to-destructive/1 text-center",
            compact
              ? "rounded-xl p-4 shadow-none"
              : "rounded-2xl p-6 shadow-md",
          )}
        >
          {previewUrl ? (
            <div
              className={cn(
                "mx-auto mb-3 overflow-hidden rounded-xl opacity-75",
                compact ? "h-20 w-28" : "h-28 w-40",
              )}
            >
              {/* biome-ignore lint/performance/noImgElement: local object URL preview with dynamic dimensions */}
              <img
                src={previewUrl}
                alt={labels.uploadLabel}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-destructive/20 to-destructive/10 ring-1 ring-destructive/20 shadow-md shadow-destructive/20">
              <Icon icon={AlertCircle} className="size-5 text-destructive" />
            </div>
          )}
          <p className="mx-auto max-w-56 text-sm font-medium text-destructive/90">
            {state.message}
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-destructive to-destructive/90 px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg shadow-destructive/20 transition hover:from-destructive/90 hover:to-destructive/80 active:translate-y-px"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Icon icon={RefreshCw} className="size-4" />
            </motion.div>
            {labels.retryLabel}
          </motion.button>
        </div>
      ) : (
        <motion.button
          type="button"
          disabled={disabled}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => inputRef.current?.click()}
          aria-label={labels.uploadLabel}
          aria-controls={inputId}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "group relative w-full cursor-pointer overflow-hidden border-2 border-dashed text-center transition duration-300 select-none",
            compact ? "rounded-xl p-4" : "rounded-2xl p-6",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
            state.status === "dragging"
              ? "scale-[0.99] border-primary bg-linear-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20"
              : "border-border/30 bg-muted/20 hover:border-primary/40 hover:bg-primary/5 shadow-sm",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <motion.div
            className={cn(
              "pointer-events-none absolute -top-10 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-linear-to-br from-primary/20 to-primary/10 blur-3xl transition-opacity duration-300",
              state.status === "dragging" ? "opacity-100" : "opacity-0",
            )}
            animate={{
              scale: state.status === "dragging" ? 1.2 : 1,
              opacity: state.status === "dragging" ? 1 : 0,
            }}
          />
          <div className="relative">
            <motion.div
              className={cn(
                "mx-auto mb-3 flex items-center justify-center rounded-2xl bg-linear-to-br from-muted-foreground/10 to-muted-foreground/5 ring-1 ring-border/20 transition-transform duration-300 shadow-sm",
                compact ? "size-10" : "size-12",
                state.status === "dragging"
                  ? "scale-110 bg-linear-to-br from-primary/20 to-primary/10 text-primary ring-primary/30"
                  : "group-hover:-translate-y-0.5 group-hover:scale-105",
              )}
            >
              <Icon
                icon={Upload}
                className={cn(
                  "size-5 transition-colors",
                  state.status === "dragging"
                    ? "text-primary"
                    : "text-muted-foreground/50 group-hover:text-primary/70",
                )}
              />
            </motion.div>
            <p className="text-sm font-medium text-foreground/80">
              {labels.uploadLabel}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/50">
              {labels.dragHint}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-linear-to-br from-background/70 to-background/50 px-3 py-1 text-[10px] font-medium text-muted-foreground/50 ring-1 ring-border/20 shadow-sm">
              {labels.fileTypesHint}
            </p>
          </div>
        </motion.button>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[min(96vw,1200px)] border-0 bg-black/90 p-2 shadow-2xl sm:rounded-2xl sm:p-3">
          <DialogTitle className="sr-only">{labels.viewLabel}</DialogTitle>
          <div className="flex max-h-[calc(100dvh-2rem)] min-h-[min(40vh,320px)] items-center justify-center overflow-hidden rounded-xl bg-black/40">
            {value ? (
              /* biome-ignore lint/performance/noImgElement: dynamic remote receipt URLs with unknown dimensions — next/image would require remotePatterns config and fixed sizing */
              <img
                src={value}
                alt={labels.viewLabel}
                className="max-h-[calc(100dvh-3rem)] max-w-full object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
