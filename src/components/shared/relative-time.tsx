"use client";

import { useEffect, useRef, useState } from "react";

interface RelativeTimeProps {
  date?: Date | string | number | null;
  locale?: string;
  prefix?: string;
  className?: string;
}

function formatRelativeTime(
  date: Date,
  locale: string,
): { text: string; nextUpdateIn: number } {
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diff < 60) {
    return { text: subMinuteMessage(locale), nextUpdateIn: 1000 };
  }

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) {
    return { text: rtf.format(-minutes, "minute"), nextUpdateIn: 60_000 };
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return { text: rtf.format(-hours, "hour"), nextUpdateIn: 60 * 60 * 1000 };
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return {
      text: rtf.format(-days, "day"),
      nextUpdateIn: 24 * 60 * 60 * 1000,
    };
  }

  return {
    text: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date),
    nextUpdateIn: 24 * 60 * 60 * 1000,
  };
}

const SUB_MINUTE_MESSAGES: Record<string, string> = {
  es: "menos de un minuto",
  en: "less than a minute",
};

function subMinuteMessage(locale: string): string {
  const lang = locale.split("-")[0];
  return SUB_MINUTE_MESSAGES[lang] ?? SUB_MINUTE_MESSAGES.en;
}

export function RelativeTime({
  date,
  locale = "es-ES",
  prefix,
  className,
}: RelativeTimeProps) {
  const [text, setText] = useState("");

  const parsedDateRef = useRef<Date | null>(null);
  const localeRef = useRef(locale);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Update refs when props change
  useEffect(() => {
    parsedDateRef.current = date ? new Date(date) : null;
    localeRef.current = locale;

    // Clear existing timeout when date/locale changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [date, locale]);

  useEffect(() => {
    const currentParsedDate = parsedDateRef.current;
    const currentLocale = localeRef.current;

    if (!currentParsedDate) {
      setText("");
      return;
    }

    const update = () => {
      const { text, nextUpdateIn } = formatRelativeTime(
        currentParsedDate,
        currentLocale,
      );
      setText(text);
      timeoutRef.current = setTimeout(update, nextUpdateIn);
    };

    update();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  if (!date) return null;

  return (
    <span className={className}>{prefix ? `${prefix} ${text}` : text}</span>
  );
}
