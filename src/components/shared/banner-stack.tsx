"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { X } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Delay between simultaneous banner entrances/exits (ms). Multiplied by the
 * banner's stable mount index, so offline → push → incident cascade in with
 * a slide/fade instead of snapping in together.
 */
export const BANNER_STAGGER_MS = 60;

/** Shared mount/unmount slide (px) — a clear drop-down from behind the header. */
export const BANNER_SLIDE_PX = -16;

interface RegisteredBanner {
  /** Provided by dismissible banners; the dismiss-all control skips the rest. */
  onDismiss?: () => void;
  /** Whether the banner is currently shown (drives the dismiss-all count). */
  visible: boolean;
  /** Stable mount order across the stack (never reassigned on re-register). */
  index: number;
}

interface BannerStackContextValue {
  /** True when ≥2 dismissible banners are visible — show the shared control. */
  showDismissAll: boolean;
  /**
   * Register a banner (mount time). Assigns its stable stagger index once;
   * returns an unregister function. Never called again for the same id.
   */
  registerItem: (id: string, onDismiss?: () => void) => () => void;
  /**
   * Sync a banner's visibility without touching its index or dismiss handler
   * (called only when the boolean actually flips).
   */
  updateItem: (id: string, visible: boolean) => void;
  /** All registered banners, for stagger-delay computation. */
  items: ReadonlyMap<string, RegisteredBanner>;
}

/** No-op default so banners render fine outside a BannerStack. */
const BannerStackContext = createContext<BannerStackContextValue>({
  showDismissAll: false,
  registerItem: () => () => {},
  updateItem: () => {},
  items: new Map(),
});

export function useBannerStack() {
  return useContext(BannerStackContext);
}

/**
 * Groups the under-header banners (offline, push, incident) into a single
 * cohesive strip stack with internal dividers instead of three independent
 * full-width bars. When two or more dismissible banners are visible, their
 * individual dismiss buttons are hidden and one floating "Dismiss all"
 * control dismisses them together.
 */
export function BannerStack({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Map<string, RegisteredBanner>>(new Map());
  const nextIndexRef = useRef(0);

  const registerItem = useCallback((id: string, onDismiss?: () => void) => {
    setItems((prev) => {
      const next = new Map(prev);
      // Registration is mount-only per id (the hook guards), so a fresh entry
      // always gets a fresh index. No-op if somehow called twice.
      if (next.has(id)) return prev;
      next.set(id, {
        onDismiss,
        visible: false,
        index: nextIndexRef.current++,
      });
      return next;
    });
    return () => {
      setItems((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    };
  }, []);

  // Only the boolean flips (identity-stable) — the dismiss handler is frozen
  // at registration behind a ref, so this never changes on every render and
  // cannot trigger the setState-in-effect update loop.
  const updateItem = useCallback((id: string, visible: boolean) => {
    setItems((prev) => {
      const existing = prev.get(id);
      if (!existing || existing.visible === visible) return prev;
      const next = new Map(prev);
      next.set(id, { ...existing, visible });
      return next;
    });
  }, []);

  const showDismissAll =
    [...items.values()].filter((item) => item.visible && item.onDismiss)
      .length >= 2;

  const dismissAll = useCallback(() => {
    // Snapshot the handlers (each dismiss hides its banner, unregistering it
    // from the map while we iterate).
    const handlers = [...items.values()]
      .filter((item) => item.visible && item.onDismiss)
      .map((item) => item.onDismiss);
    for (const handler of handlers) handler?.();
  }, [items]);

  const value = useMemo(
    () => ({ showDismissAll, registerItem, updateItem, items }),
    [showDismissAll, registerItem, updateItem, items],
  );

  return (
    <BannerStackContext.Provider value={value}>
      <div className="relative w-full">
        {/* Each strip keeps its own tinted background; its own border-b acts
            as the divider between banners and closes the stack. The padding
            clears the floating dismiss-all pill when it is shown. */}
        <div className={cn(showDismissAll && "pr-14 sm:pr-16")}>{children}</div>

        <AnimatePresence>
          {showDismissAll ? (
            <motion.button
              key="dismiss-all"
              type="button"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.15 }}
              onClick={dismissAll}
              title={t("alerts.dismissAll")}
              className={cn(
                "absolute top-1/2 right-2 z-10 -translate-y-1/2",
                "inline-flex shrink-0 items-center gap-1 rounded-full",
                "border border-border/60 bg-background/95 px-2.5 py-1 text-xs font-semibold",
                "text-muted-foreground shadow-sm backdrop-blur-sm",
                "transition-colors hover:bg-muted hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              <X aria-hidden className="size-3" />
              <span className="hidden sm:inline">{t("alerts.dismissAll")}</span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </BannerStackContext.Provider>
  );
}

/**
 * Registers a banner with the enclosing BannerStack while it is mounted,
 * hides its own dismiss button when the stack shows the shared dismiss-all
 * control, and returns the slide/fade stagger delay for its mount/unmount
 * animation.
 *
 * The delay only applies when another banner is visible alongside it — a
 * lone banner (e.g. an incident appearing long after the page settled)
 * animates immediately instead of waiting out a stale cascade.
 */
export function useBannerStackItem({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: (() => void) | undefined;
}) {
  const { showDismissAll, registerItem, updateItem, items } = useBannerStack();
  const idRef = useRef<string | null>(null);

  // Keep the latest dismiss handler behind a ref so the stack's stored
  // handler never goes stale, without the hook depending on its identity.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Register once at mount (stable index + a stable dismiss wrapper); the
  // wrapper always calls through to the latest handler. Only banners with a
  // real dismiss count as dismissible — the offline banner passes undefined
  // and must stay excluded from dismiss-all.
  const dismissible = Boolean(onDismiss);
  useEffect(() => {
    if (!idRef.current) {
      idRef.current = `banner-${Math.random().toString(36).slice(2)}`;
    }
    const id = idRef.current;
    return registerItem(
      id,
      dismissible ? () => onDismissRef.current?.() : undefined,
    );
  }, [registerItem, dismissible]);

  // Sync only the boolean visibility (identity-stable) so the effect never
  // re-runs on every render.
  useEffect(() => {
    if (!idRef.current) return;
    updateItem(idRef.current, visible);
  }, [visible, updateItem]);

  const staggerDelay = useMemo(() => {
    const id = idRef.current;
    const item = id ? items.get(id) : undefined;
    if (!item) return 0;

    // Count the OTHER banners that are visible right now. This banner is
    // entering, so if at least one other is on screen the entrances are
    // simultaneous — cascade them. A lone banner gets no delay.
    let visibleOthers = 0;
    for (const [otherId, other] of items) {
      if (otherId !== id && other.visible) visibleOthers += 1;
    }
    if (visibleOthers < 1) return 0;
    return item.index * BANNER_STAGGER_MS;
  }, [items]);

  // An exit render recomputes the delay with this banner no longer visible
  // (visibleOthers drops to 0 → delay 0), which would make dismiss-all snap
  // simultaneously instead of cascading out. Freeze the delay at the last
  // visible render so exit mirrors entrance.
  const delayRef = useRef(0);
  useEffect(() => {
    if (visible) delayRef.current = staggerDelay;
  }, [visible, staggerDelay]);
  const delay = visible ? staggerDelay : delayRef.current;

  return {
    showDismissAll,
    ownDismissHidden: showDismissAll,
    staggerDelay: delay,
  };
}

/**
 * Shared motion wrapper for stacked banner strips: a drop-down slide + fade on
 * mount/unmount, delayed by the caller's staggerDelay so simultaneous banners
 * cascade in/out instead of snapping together. Keeps the height collapse so
 * the strips below flow smoothly. Reduced-motion users get the height/opacity
 * fade (transform slide is disabled by MotionConfig).
 */
export function BannerStripMotion({
  delay,
  className,
  children,
}: {
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0, y: BANNER_SLIDE_PX }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: BANNER_SLIDE_PX }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay }}
      className={cn("overflow-hidden", className)}
    >
      {children}
    </motion.div>
  );
}
