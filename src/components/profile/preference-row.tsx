import { Icon, type IconProps } from "@/components/shared";
import { cn } from "@/lib/utils";

export function PreferenceRow({
  icon,
  title,
  hint,
  control,
  saving,
}: {
  icon: IconProps["icon"];
  title: string;
  hint: string;
  control: React.ReactNode;
  saving?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 transition-opacity duration-200",
        saving && "opacity-70",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon icon={icon} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
