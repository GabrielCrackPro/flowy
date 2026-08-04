import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg",
        outline:
          "border-border/30 bg-background hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground hover:border-border/50 aria-expanded:bg-gradient-to-r aria-expanded:from-muted/50 aria-expanded:to-muted/30 aria-expanded:text-foreground dark:border-input/50 dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/80 aria-expanded:bg-gradient-to-r aria-expanded:from-secondary aria-expanded:to-secondary/90 aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground aria-expanded:bg-gradient-to-r aria-expanded:from-muted/50 aria-expanded:to-muted/30 aria-expanded:text-foreground dark:hover:bg-muted/40",
        destructive:
          "bg-gradient-to-r from-destructive/10 to-destructive/5 text-destructive hover:from-destructive/20 hover:to-destructive/10 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:from-destructive/20 dark:to-destructive/10 dark:hover:from-destructive/30 dark:hover:to-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild) {
    const { children, ...rest } = props;
    const onlyChild = React.Children.only(children) as React.ReactElement<{
      className?: string;
      ref?: React.Ref<HTMLButtonElement>;
    }>;
    const mergedProps: Record<string, unknown> = {
      ...rest,
      ref,
      className: cn(classes, onlyChild.props.className),
    };
    return React.cloneElement(onlyChild, mergedProps);
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      ref={ref}
      className={classes}
      {...props}
    />
  );
});

export { Button, buttonVariants };
