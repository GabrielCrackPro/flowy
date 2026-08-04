import * as React from "react";
import { cn } from "@/lib/utils";

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  return <div ref={ref} className="relative" {...props} />;
});
FormControl.displayName = "FormControl";

export { FormControl };
