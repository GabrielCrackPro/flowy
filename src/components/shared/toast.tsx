"use client";

import { cn } from "@lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type ExternalToast, toast as sonnerToast } from "sonner";
import { ErrorTranslationKeys } from "@/lib/errors/error-types";
import {
  CheckCircle2,
  Clock,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
  XCircle,
} from "@/lib/icons";
import { Animated } from "./animated-component";
import { Icon, type IconProps } from "./icon";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function useToastProgress(durationMs: number | null) {
  const [progress, setProgress] = useState(1);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (durationMs == null) {
      setProgress(1);
      return;
    }

    pausedRef.current = false;
    elapsedRef.current = 0;
    lastRef.current = null;

    let raf: number;
    const tick = (now: number) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = now - lastRef.current;
      lastRef.current = now;
      if (!pausedRef.current) {
        elapsedRef.current += dt;
        setProgress(Math.max(0, 1 - elapsedRef.current / durationMs));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  return { progress, setPaused };
}

type ToastVariant =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "loading"
  | "rate_limit";

interface AppToastProps {
  id: number | string;
  variant: ToastVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
}

const variants: Record<
  ToastVariant,
  {
    Icon: IconProps["icon"];
    tone: "positive" | "negative" | "info" | "warning" | "default";
  }
> = {
  success: {
    Icon: CheckCircle2,
    tone: "positive",
  },
  error: {
    Icon: XCircle,
    tone: "negative",
  },
  warning: {
    Icon: TriangleAlert,
    tone: "warning",
  },
  info: {
    Icon: Info,
    tone: "info",
  },
  loading: {
    Icon: LoaderCircle,
    tone: "default",
  },
  rate_limit: {
    Icon: Clock,
    tone: "warning",
  },
};

const toneAccentClasses: Record<
  "positive" | "negative" | "info" | "warning" | "default",
  string
> = {
  default:
    "bg-gradient-to-br from-primary/20 to-primary/10 text-primary dark:from-primary/30 dark:to-primary/20 shadow-md shadow-primary/20",
  positive:
    "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:from-emerald-500/30 dark:to-emerald-500/20 dark:text-emerald-400 shadow-md shadow-emerald-500/20",
  negative:
    "bg-gradient-to-br from-rose-500/20 to-rose-500/10 text-rose-600 dark:from-rose-500/30 dark:to-rose-500/20 dark:text-rose-400 shadow-md shadow-rose-500/20",
  info: "bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-600 dark:from-blue-500/30 dark:to-blue-500/20 dark:text-blue-400 shadow-md shadow-blue-500/20",
  warning:
    "bg-gradient-to-br from-amber-500/20 to-amber-500/10 text-amber-600 dark:from-amber-500/30 dark:to-amber-500/20 dark:text-amber-400 shadow-md shadow-amber-500/20",
};

const toneBorderClasses: Record<
  "positive" | "negative" | "info" | "warning" | "default",
  string
> = {
  default: "from-primary via-primary to-primary",
  positive: "from-emerald-500 via-emerald-400 to-emerald-500",
  negative: "from-rose-500 via-rose-400 to-rose-500",
  info: "from-blue-500 via-blue-400 to-blue-500",
  warning: "from-amber-500 via-amber-400 to-amber-500",
};

const toneBgClasses: Record<
  "positive" | "negative" | "info" | "warning" | "default",
  string
> = {
  default: "from-primary/8 via-primary/[0.03] to-transparent",
  positive: "from-emerald-500/8 via-emerald-500/[0.03] to-transparent",
  negative: "from-rose-500/8 via-rose-500/[0.03] to-transparent",
  info: "from-blue-500/8 via-blue-500/[0.03] to-transparent",
  warning: "from-amber-500/8 via-amber-500/[0.03] to-transparent",
};

const toneBarClasses: Record<
  "positive" | "negative" | "info" | "warning" | "default",
  string
> = {
  default: "from-primary via-primary/70 to-primary/20",
  positive: "from-emerald-400 via-emerald-500 to-emerald-500/20",
  negative: "from-rose-400 via-rose-500 to-rose-500/20",
  info: "from-blue-400 via-blue-500 to-blue-500/20",
  warning: "from-amber-400 via-amber-500 to-amber-500/20",
};

const toneGlowClasses: Record<
  "positive" | "negative" | "info" | "warning" | "default",
  string
> = {
  default: "shadow-[0_-2px_12px_rgba(37,99,235,0.5)]",
  positive: "shadow-[0_-2px_12px_rgba(16,185,129,0.5)]",
  negative: "shadow-[0_-2px_12px_rgba(244,63,94,0.5)]",
  info: "shadow-[0_-2px_12px_rgba(59,130,246,0.5)]",
  warning: "shadow-[0_-2px_12px_rgba(245,158,11,0.5)]",
};

export function AppToast({
  id,
  variant,
  title,
  description,
  action,
  duration,
}: AppToastProps) {
  const { Icon: IconComponent, tone } = variants[variant];
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 600px)");

  const enterAnimation = isMobile
    ? { opacity: 0, y: 48, scale: 0.95 }
    : { opacity: 0, x: 60, scale: 0.92, y: -10 };

  const hasProgress =
    typeof duration === "number" && Number.isFinite(duration) && duration > 0;
  const { progress, setPaused } = useToastProgress(
    hasProgress ? duration : null,
  );

  // Countdown timer for rate limit errors
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (variant === "rate_limit" && typeof description === "number") {
      setCountdown(description);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [variant, description]);

  // Translate rate limit title
  const displayTitle =
    variant === "rate_limit" && typeof title === "string"
      ? t(ErrorTranslationKeys.RATE_LIMIT_TITLE)
      : title;

  return (
    <Animated.div
      initial={enterAnimation}
      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
      exit={enterAnimation}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
        layout: { duration: 0.3 },
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="group relative flex w-full items-start gap-4 max-[600px]:gap-2.5 overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card to-card/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 max-[600px]:p-3.5 transition duration-500 ease-out hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1"
    >
      {/* Background gradient */}
      <Animated.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          toneBgClasses[tone],
        )}
      />

      {/* Top gradient border */}
      <Animated.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className={cn(
          "absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r origin-left",
          toneBorderClasses[tone],
        )}
      />

      {/* Icon */}
      <Animated.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.15,
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
        whileHover={{ scale: 1.15, rotate: 8 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative flex size-10 max-[600px]:size-8 shrink-0 items-center justify-center rounded-xl transition-transform",
          toneAccentClasses[tone],
        )}
      >
        <Icon
          icon={IconComponent}
          className={cn(
            "size-5 max-[600px]:size-4",
            variant === "loading" && "animate-spin",
          )}
        />
      </Animated.div>

      {/* Content */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-2.5 max-[600px]:gap-1.5 py-0.5">
        <Animated.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="break-words text-sm font-semibold leading-tight text-foreground"
        >
          {displayTitle}
        </Animated.p>
        {variant === "rate_limit" && countdown !== null ? (
          <Animated.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.25,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="break-words text-[13px] leading-relaxed text-muted-foreground/70"
          >
            {t(ErrorTranslationKeys.RATE_LIMIT_RETRYING_IN)}: {countdown}s
          </Animated.p>
        ) : description && typeof description !== "number" ? (
          <Animated.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.25,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="break-words text-[13px] leading-relaxed text-muted-foreground/70"
          >
            {description}
          </Animated.p>
        ) : null}
        {action ? (
          <Animated.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="mt-2 max-[600px]:mt-1.5"
          >
            {action}
          </Animated.div>
        ) : null}
      </div>

      {/* Close button */}
      <Animated.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        whileHover={{ scale: 1.15, rotate: 90 }}
        whileTap={{ scale: 0.85 }}
        type="button"
        onClick={() => sonnerToast.dismiss(id)}
        aria-label="Cerrar notificación"
        className="relative -m-1 flex size-8 max-[600px]:size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted/80 hover:text-foreground"
      >
        <Icon icon={X} className="size-4" />
      </Animated.button>

      {/* Progress bar */}
      {hasProgress ? (
        <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-2xl bg-foreground/[0.05]">
          <div className="h-full w-full overflow-hidden rounded-b-2xl">
            <Animated.motion.div
              style={{ scaleX: progress }}
              className={cn(
                "h-full w-full origin-left bg-gradient-to-r",
                toneBarClasses[tone],
                toneGlowClasses[tone],
              )}
            />
          </div>
        </div>
      ) : null}
    </Animated.div>
  );
}

type ToastOptions = ExternalToast & {
  action?: React.ReactNode;
};

function show(
  variant: ToastVariant,
  title: React.ReactNode,
  description?: React.ReactNode,
  options?: ToastOptions,
) {
  const { action, ...rest } = options ?? {};
  const duration =
    rest.duration ??
    (variant === "error" || variant === "rate_limit"
      ? 5000
      : variant === "loading"
        ? Infinity
        : 4000);

  return sonnerToast.custom(
    (id) => (
      <AppToast
        id={id}
        variant={variant}
        title={title}
        description={description}
        action={action}
        duration={duration}
      />
    ),
    { duration, ...rest },
  );
}

export const toast = {
  success: (
    title: React.ReactNode,
    description?: React.ReactNode,
    options?: ToastOptions,
  ) => show("success", title, description, options),
  error: (
    title: React.ReactNode,
    description?: React.ReactNode,
    options?: ToastOptions,
  ) => show("error", title, description, options),
  info: (
    title: React.ReactNode,
    description?: React.ReactNode,
    options?: ToastOptions,
  ) => show("info", title, description, options),
  warning: (
    title: React.ReactNode,
    description?: React.ReactNode,
    options?: ToastOptions,
  ) => show("warning", title, description, options),
  loading: (
    title: React.ReactNode,
    description?: React.ReactNode,
    options?: ToastOptions,
  ) => show("loading", title, description, options),
  rateLimit: (
    _title: React.ReactNode,
    retryAfter?: number,
    options?: ToastOptions,
  ) => show("rate_limit", "", retryAfter, options),
  message: (
    title: React.ReactNode,
    description?: React.ReactNode,
    options?: ToastOptions,
  ) => show("info", title, description, options),
  dismiss: sonnerToast.dismiss,
};
