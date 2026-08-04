"use client";

interface CommandPaletteFooterProps {
  t: (key: string) => string;
}

const kbdClass =
  "rounded-md border border-border/30 bg-gradient-to-br from-muted/40 to-muted/30 px-1.5 py-0.5 font-mono text-[10px] font-medium shadow-sm";

export function CommandPaletteFooter({ t }: CommandPaletteFooterProps) {
  return (
    <div className="border-t border-border/30 px-4 py-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground/50">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className={kbdClass}>↑↓</kbd>
            {t("search.navigate")}
          </span>
          <span className="flex items-center gap-1">
            <kbd className={kbdClass}>↵</kbd>
            {t("search.open")}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className={kbdClass}>Esc</kbd>
          {t("search.close")}
        </span>
      </div>
    </div>
  );
}
