import * as React from "react";

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  return <div ref={ref} className="relative" {...props} />;
});
FormControl.displayName = "FormControl";

export { FormControl };
