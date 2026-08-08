"use client";

import { motion } from "framer-motion";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  Upload,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

interface FileUploadLabels {
  uploadLabel?: string;
  dragHint?: string;
  fileTypesHint?: string;
  changeLabel?: string;
  removeLabel?: string;
  uploadingLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
}

interface FileUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  maxSize?: number;
  labels?: FileUploadLabels;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_LABELS: FileUploadLabels = {
  uploadLabel: "Subir comprobante",
  dragHint: "Arrastra un archivo o haz clic para subir",
  fileTypesHint: "PNG, JPG, WebP, PDF \u2022 Max 10 MB",
  changeLabel: "Cambiar",
  removeLabel: "Eliminar",
  uploadingLabel: "Subiendo...",
  errorLabel: "Error al subir el archivo",
  retryLabel: "Reintentar",
};

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
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const labels = { ...DEFAULT_LABELS, ...userLabels };
  const hasFile = !!value;

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > maxSize) {
        setState({
          status: "error",
          message: `El archivo excede el tamaño máximo de ${Math.round(maxSize / 1024 / 1024)} MB`,
        });
        return;
      }

      setState({ status: "uploading" });

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al subir");
        onChange(data.url);
        setState({ status: "idle" });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : labels.errorLabel!,
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
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setState({ status: "idle" });
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setState({ status: "dragging" });
  }, []);

  const handleDragLeave = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const handleRemove = useCallback(() => {
    onChange(null);
    setPreviewUrl(null);
    setState({ status: "idle" });
  }, [onChange]);

  const handleRetry = useCallback(() => {
    setState({ status: "idle" });
    inputRef.current?.click();
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {hasFile && state.status !== "uploading" ? (
        <div className="overflow-hidden rounded-2xl border border-border/30 bg-linear-to-br from-muted/20 to-muted/10 shadow-md">
          {value && isImageUrl(value) ? (
            <div className="relative m-3 overflow-hidden rounded-xl bg-muted/30 ring-1 ring-border/20 shadow-sm">
              <img
                src={value}
                alt="Receipt"
                className="aspect-3/4 h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/25 via-transparent to-black/10" />
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <motion.button
                  type="button"
                  disabled={disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => inputRef.current?.click()}
                  title={labels.changeLabel}
                  aria-label={labels.changeLabel}
                  className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-black/45 to-black/35 text-white backdrop-blur-sm transition-all hover:from-black/65 hover:to-black/55 disabled:opacity-50 shadow-lg"
                >
                  <Icon icon={Upload} className="size-4" />
                </motion.button>
                <motion.button
                  type="button"
                  disabled={disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemove}
                  title={labels.removeLabel}
                  aria-label={labels.removeLabel}
                  className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-destructive/60 to-destructive/50 text-white backdrop-blur-sm transition-all hover:from-destructive/80 hover:to-destructive/70 disabled:opacity-50 shadow-lg shadow-destructive/20"
                >
                  <Icon icon={Trash2} className="size-4" />
                </motion.button>
              </div>
            </div>
          ) : value ? (
            <div className="m-3 flex items-center gap-3 rounded-xl bg-linear-to-br from-background/60 to-background/40 p-3 ring-1 ring-border/20 shadow-sm">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-primary shadow-md">
                <Icon icon={FileText} className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground/90">
                  {value.split("/").pop() || "receipt"}
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
                  aria-label="Download"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-all hover:bg-linear-to-br hover:from-muted/50 hover:to-muted/30 hover:text-foreground"
                >
                  <Icon icon={Download} className="size-4" />
                </motion.a>
                <motion.button
                  type="button"
                  disabled={disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => inputRef.current?.click()}
                  title={labels.changeLabel}
                  aria-label={labels.changeLabel}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-all hover:bg-linear-to-br hover:from-muted/50 hover:to-muted/30 hover:text-primary"
                >
                  <Icon icon={Upload} className="size-4" />
                </motion.button>
                <motion.button
                  type="button"
                  disabled={disabled}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemove}
                  title={labels.removeLabel}
                  aria-label={labels.removeLabel}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-all hover:bg-linear-to-br hover:from-destructive/50 hover:to-destructive/30 hover:text-destructive"
                >
                  <Icon icon={Trash2} className="size-4" />
                </motion.button>
              </div>
            </div>
          ) : null}
        </div>
      ) : state.status === "uploading" ? (
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-linear-to-br from-primary/2 to-primary/1 p-6 text-center shadow-md">
          <div className="relative mx-auto mb-3 size-11">
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
      ) : state.status === "error" ? (
        <div className="rounded-2xl border-2 border-dashed border-destructive/30 bg-linear-to-br from-destructive/2 to-destructive/1 p-6 text-center shadow-md">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-destructive/20 to-destructive/10 ring-1 ring-destructive/20 shadow-md shadow-destructive/20">
            <Icon icon={AlertCircle} className="size-5 text-destructive" />
          </div>
          <p className="mx-auto max-w-56 text-sm font-medium text-destructive/90">
            {state.message}
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-destructive to-destructive/90 px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:from-destructive/90 hover:to-destructive/80 active:translate-y-px"
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
        <motion.div
          role="button"
          tabIndex={0}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 select-none",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
            state.status === "dragging"
              ? "scale-[0.99] border-primary bg-linear-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20"
              : "border-border/30 bg-linear-to-brr from-muted/20 to-muted/10 hover:border-primary/40 hover:from-primary/5 hover:to-primary/2 shadow-md",
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
                "mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-muted-foreground/10 to-muted-foreground/5 ring-1 ring-border/20 transition-transform duration-300 shadow-sm",
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
        </motion.div>
      )}

      <input
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
