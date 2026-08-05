"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!date) {
      setText("");
      return;
    }

    const parsed = new Date(date);
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      const { text: nextText, nextUpdateIn } = formatRelativeTime(
        parsed,
        locale,
      );
      setText(nextText);
      timeout = setTimeout(update, nextUpdateIn);
    };

    update();
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [date, locale]);

  if (!date) return null;

  return (
    <span className={className}>{prefix ? `${prefix} ${text}` : text}</span>
  );
}
