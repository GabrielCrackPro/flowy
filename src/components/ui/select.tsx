"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import type * as React from "react";
import { Icon } from "@/components/shared/icon";
import {
  CONTROL_DISABLED,
  CONTROL_FOCUS,
  CONTROL_ICON_GAP,
  CONTROL_PLACEHOLDER,
  CONTROL_SURFACE,
  OPTION_ROW_BASE,
  OPTION_ROW_INTERACTION,
} from "@/components/ui/control-styles";
import { useOverlayOpen } from "@/hooks/useOverlayOpen";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

function Select<Value, Multiple extends boolean | undefined = false>({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  const overlay = useOverlayOpen<SelectPrimitive.Root.ChangeEventDetails>({
    open,
    defaultOpen,
    onOpenChange,
    // Selects dismiss on outside press; no system-back history interception
    // (see useOverlayOpen's option docs for why menus/popovers opt out).
    systemBackDismiss: false,
  });

  return <SelectPrimitive.Root {...overlay} {...props} />;
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

interface SelectValueProps
  extends Omit<SelectPrimitive.Value.Props, "children"> {
  options?: ReadonlyArray<{ value: string; label: React.ReactNode }>;
}

function SelectValue({
  className,
  options,
  placeholder,
  ...props
}: SelectValueProps) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      placeholder={placeholder}
      {...props}
    >
      {(value: string | null) => {
        if (value == null || value === "") {
          return (placeholder ?? null) as React.ReactNode;
        }
        return (
          options?.find((option) => option.value === value)?.label ?? value
        );
      }}
    </SelectPrimitive.Value>
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        `group flex w-fit items-center justify-between ${CONTROL_ICON_GAP} px-3 py-1.5 text-sm select-none`,
        CONTROL_SURFACE,
        CONTROL_FOCUS,
        CONTROL_DISABLED,
        "hover:border-border hover:bg-muted/30",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        `data-placeholder:${CONTROL_PLACEHOLDER} data-[size=default]:h-11 data-[size=sm]:h-10 data-[size=sm]:rounded-xl`,
        "*:data-[slot=select-value]:flex *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 *:data-[slot=select-value]:whitespace-nowrap",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <Icon
            icon={ChevronDownIcon}
            className="pointer-events-none size-4 transition-transform duration-200 group-aria-expanded:rotate-180"
          />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-border/30 bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/8",
            "duration-100 data-[align-trigger=true]:animate-none",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2",
            "data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-muted-foreground/70",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        OPTION_ROW_BASE,
        "cursor-default pr-8 select-none outline-hidden",
        OPTION_ROW_INTERACTION,
        "focus:bg-muted/60 focus:text-foreground",
        "data-selected:bg-primary/10 data-selected:font-medium data-selected:text-primary",
        "not-data-[variant=destructive]:focus:**:text-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        `*:[span]:last:flex *:[span]:last:items-center *:[span]:last:${CONTROL_ICON_GAP}`,
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText
        className={`flex flex-1 shrink-0 ${CONTROL_ICON_GAP} whitespace-nowrap`}
      >
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-1.5 flex size-4 items-center justify-center rounded-full bg-primary/10" />
        }
      >
        <Icon
          icon={CheckIcon}
          className="pointer-events-none size-3.5 text-primary"
        />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <Icon icon={ChevronUpIcon} />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <Icon icon={ChevronDownIcon} />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
