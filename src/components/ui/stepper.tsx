"use client";

import { Fragment } from "react";
import { Check } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the active step. Steps before it render as completed. */
  activeIndex: number;
  className?: string;
  /** When provided, completed steps become clickable to navigate back. */
  onStepClick?: (index: number) => void;
}

/**
 * Horizontal step indicator: numbered circles, a check mark for completed
 * steps, and a connector line between each step. Shared by any multi-step
 * flow so step chrome stays consistent.
 */
export function Stepper({
  steps,
  activeIndex,
  className,
  onStepClick,
}: StepperProps) {
  return (
    <div className={cn("flex w-full items-center", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;
        const clickable = isCompleted && onStepClick != null;

        const content = (
          <>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200",
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {isCompleted ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </>
        );

        return (
          <Fragment key={step.id}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick?.(index)}
                aria-label={step.label}
                className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {content}
              </button>
            ) : (
              <div
                aria-current={isActive ? "step" : undefined}
                className="flex shrink-0 items-center gap-2"
              >
                {content}
              </div>
            )}
            {index < steps.length - 1 ? (
              <div
                aria-hidden="true"
                className={cn(
                  "mx-3 h-px min-w-5 flex-1 rounded-full transition-colors duration-200",
                  index < activeIndex ? "bg-primary/40" : "bg-border/60",
                )}
              />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
