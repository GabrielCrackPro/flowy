"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  type ChangeEvent,
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export const OTP_CODE_LENGTH = 6;

const OTP_SLOT_KEYS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
] as const;

export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  label,
  autoFocus = false,
  invalid = false,
  errorMessage,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  label: string;
  autoFocus?: boolean;
  invalid?: boolean;
  errorMessage?: string | null;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const wasInvalid = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const digits = Array.from(
    { length: OTP_CODE_LENGTH },
    (_, index) => value[index] ?? "",
  );
  const activeIndex = Math.min(value.length, OTP_CODE_LENGTH - 1);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (invalid && !wasInvalid.current) {
      setShakeKey((key) => key + 1);
    }
    wasInvalid.current = invalid;
  }, [invalid]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value
      .replace(/\D/g, "")
      .slice(0, OTP_CODE_LENGTH);

    onChange(nextValue);
    if (nextValue.length === OTP_CODE_LENGTH) {
      onComplete?.(nextValue);
    }
  };

  return (
    <fieldset
      className={cn("flex flex-col items-center gap-2", className)}
      aria-describedby={errorMessage ? errorId : undefined}
    >
      <legend className="sr-only">{label}</legend>
      <motion.div
        key={shakeKey}
        className="relative flex cursor-text items-center gap-2 sm:gap-2.5"
        animate={
          shakeKey > 0 && invalid && !prefersReducedMotion
            ? { x: [0, -7, 7, -5, 5, -2, 2, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          pattern="[0-9]*"
          maxLength={OTP_CODE_LENGTH}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-label={label}
          className="absolute inset-0 z-10 size-full cursor-text rounded-xl opacity-0 outline-none disabled:cursor-not-allowed"
        />

        {digits.map((digit, index) => {
          const active = focused && index === activeIndex;

          return (
            <Fragment key={OTP_SLOT_KEYS[index]}>
              <span
                aria-hidden="true"
                className={cn(
                  "relative flex size-11 items-center justify-center overflow-hidden rounded-xl border text-lg font-semibold tabular-nums sm:size-12",
                  invalid
                    ? "border-destructive/50 bg-destructive/5 text-destructive"
                    : digit
                      ? "border-primary/35 bg-primary/[0.06] text-foreground shadow-sm"
                      : "border-border/70 bg-background text-foreground shadow-sm",
                  active &&
                    (invalid
                      ? "border-destructive ring-3 ring-destructive/20"
                      : "z-0 scale-105 border-primary ring-3 ring-primary/20"),
                  disabled && "opacity-50",
                )}
              >
                {digit ? (
                  <motion.span
                    key={digit}
                    initial={{
                      opacity: 0,
                      y: prefersReducedMotion ? 0 : 10,
                      scale: prefersReducedMotion ? 1 : 0.8,
                    }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    className="block"
                  >
                    {digit}
                  </motion.span>
                ) : null}
                {active && !digit ? (
                  <span
                    aria-hidden="true"
                    className="absolute h-5 w-px animate-pulse bg-primary"
                  />
                ) : null}
              </span>
              {index === 2 ? (
                <span
                  aria-hidden="true"
                  className="px-0.5 text-sm font-semibold text-muted-foreground/50"
                >
                  ·
                </span>
              ) : null}
            </Fragment>
          );
        })}
      </motion.div>
      {errorMessage ? (
        <motion.p
          id={errorId}
          role="alert"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="max-w-sm text-center text-xs font-medium text-destructive"
        >
          {errorMessage}
        </motion.p>
      ) : null}
    </fieldset>
  );
}
