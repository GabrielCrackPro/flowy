import * as React from "react";
import { cn } from "@/lib/utils";

// Standalone section-heading label used OUTSIDE react-hook-form context
// (e.g. theme preview, color picker). Form inputs inside RHF forms use the
// FormLabel exported by ReactForm.tsx, which wires htmlFor via useFormField.
const FormSectionLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: consumers associate the label via the htmlFor prop, or use it as a standalone section heading
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
  );
});
FormSectionLabel.displayName = "FormSectionLabel";

export { FormSectionLabel };
