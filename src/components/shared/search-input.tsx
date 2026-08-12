"use client";

import { Button, Input } from "@components/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Icon
        icon={Search}
        className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/50"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 rounded-xl border-border/30 bg-muted/20 pl-9 pr-9 text-sm placeholder:text-muted-foreground/40 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-shadow",
          inputClassName,
        )}
      />
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onChange("")}
              className="size-7 text-muted-foreground/40 hover:bg-muted/60 hover:text-foreground"
            >
              <Icon icon={X} className="size-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
