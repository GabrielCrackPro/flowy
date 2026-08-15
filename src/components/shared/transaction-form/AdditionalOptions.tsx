import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import { Badge, Textarea } from "@/components/ui";
import { ChevronDown, StickyNote } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "../icon";

interface AdditionalOptionsProps {
  isOpen: boolean;
  onToggle: () => void;
  notes: string | undefined;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  hasContent: boolean;
  label: string;
  notesLabel: string;
  placeholder: string;
  modifiedLabel: string;
  embedded?: boolean;
}

export function AdditionalOptions({
  isOpen,
  onToggle,
  notes,
  onNotesChange,
  hasContent,
  label,
  notesLabel,
  placeholder,
  modifiedLabel,
  embedded = false,
}: AdditionalOptionsProps) {
  const panelId = useId();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className={cn(
        "overflow-hidden border border-border/50 bg-card",
        embedded ? "rounded-xl shadow-none" : "rounded-2xl shadow-sm",
      )}
    >
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center justify-between transition-colors hover:bg-muted/30",
          embedded ? "px-4 py-3.5" : "px-5 py-4",
        )}
        whileHover={{ backgroundColor: "rgba(var(--muted), 0.3)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500/20 to-violet-500/10 text-violet-600 dark:from-violet-500/30 dark:to-violet-500/20 dark:text-violet-400">
            <Icon icon={StickyNote} className="size-4" />
          </div>
          <span className="text-sm font-medium text-foreground/90">
            {label}
          </span>
          {hasContent ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2"
            >
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[10px] bg-linear-to-r from-violet-500 to-violet-600 text-white border-0"
              >
                {modifiedLabel}
              </Badge>
            </motion.div>
          ) : null}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icon icon={ChevronDown} className="size-4" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            id={panelId}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "flex flex-col gap-4 border-t border-border/30 py-4",
                embedded ? "px-4" : "px-5 sm:px-6",
              )}
            >
              <label
                htmlFor={`${panelId}-notes`}
                className="text-sm font-medium text-foreground/90"
              >
                {notesLabel}
              </label>
              <Textarea
                id={`${panelId}-notes`}
                value={notes ?? ""}
                onChange={onNotesChange}
                placeholder={placeholder}
                className="min-h-20 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
