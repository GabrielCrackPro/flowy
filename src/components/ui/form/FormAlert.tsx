import { Icon } from "@/components/shared";
import { cn } from "@lib/utils";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "@/lib/icons";

type FormAlertVariant = "error" | "success" | "info" | "warning";

interface FormAlertProps {
  message?: string | null;
  variant?: FormAlertVariant;
  className?: string;
}

const variants: Record<
  FormAlertVariant,
  {
    container: string;
    icon: React.ReactNode;
  }
> = {
  error: {
    container: "border-destructive/20 bg-destructive/10 text-destructive",
    icon: <Icon icon={AlertCircle} className="h-4 w-4 shrink-0" />,
  },
  success: {
    container:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: <Icon icon={CheckCircle2} className="h-4 w-4 shrink-0" />,
  },
  warning: {
    container:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: <Icon icon={TriangleAlert} className="h-4 w-4 shrink-0" />,
  },
  info: {
    container: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    icon: <Icon icon={Info} className="h-4 w-4 shrink-0" />,
  },
};

export function FormAlert({
  message,
  variant = "info",
  className,
}: FormAlertProps) {
  if (!message) {
    return null;
  }

  const styles = variants[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-sm",
        styles.container,
        className,
      )}
    >
      {styles.icon}

      <div className="flex-1">{message}</div>
    </div>
  );
}
