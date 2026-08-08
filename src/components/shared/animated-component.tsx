"use client";

import {
  type HTMLMotionProps,
  motion,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedComponentProps
  extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  // Preset animations for common use cases
  preset?: "fade-in" | "slide-in-right" | "slide-in-up" | "scale-in" | "none";
  // Disable animation
  disabled?: boolean;
}

const presetTransitions: Record<
  Exclude<AnimatedComponentProps["preset"], undefined>,
  {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    exit?: TargetAndTransition;
    transition: Transition;
  }
> = {
  "fade-in": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  "slide-in-right": {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  "slide-in-up": {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  "scale-in": {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  none: {
    initial: {},
    animate: {},
    transition: { duration: 0 },
  },
};

export function AnimatedComponent({
  children,
  preset = "fade-in",
  disabled = false,
  initial,
  animate,
  exit,
  transition,
  ...props
}: AnimatedComponentProps) {
  if (disabled) {
    // Filter out motion-specific props when rendering as regular div
    const { style, className } = props;
    return (
      <div className={className} style={style as React.CSSProperties}>
        {children}
      </div>
    );
  }

  // Use preset if provided and no custom animation props
  const usePreset = preset !== "none" && !initial && !animate && !exit;
  const presetConfig = usePreset ? presetTransitions[preset] : undefined;

  return (
    <motion.div
      initial={initial ?? presetConfig?.initial}
      animate={animate ?? presetConfig?.animate}
      exit={exit ?? presetConfig?.exit}
      transition={transition ?? presetConfig?.transition}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Export common motion components as shortcuts
export const Animated = {
  Component: AnimatedComponent,
  // Direct access to motion for complex cases
  motion,
  // Common element shortcuts
  div: motion.div,
  p: motion.p,
  button: motion.button,
  span: motion.span,
};
