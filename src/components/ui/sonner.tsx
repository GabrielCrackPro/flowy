"use client";

import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = ComponentProps<typeof SonnerToaster>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      offset={{ top: 76, right: 16 }}
      mobileOffset={{ top: 76, right: 12 }}
      gap={12}
      visibleToasts={5}
      duration={4000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "relative",
        },
      }}
      expand
      richColors
      closeButton={false}
      {...props}
    />
  );
};

export { Toaster };
