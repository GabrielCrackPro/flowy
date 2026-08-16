import type * as React from "react";

import {
  CONTROL_DISABLED,
  CONTROL_FOCUS,
  CONTROL_SURFACE,
  INPUT_PLACEHOLDER,
} from "@/components/ui/control-styles";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full px-3 py-2.5 text-base md:text-sm",
        CONTROL_SURFACE,
        INPUT_PLACEHOLDER,
        CONTROL_FOCUS,
        CONTROL_DISABLED,
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
