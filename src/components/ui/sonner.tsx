"use client";

import { useTheme } from "next-themes";
import { type ComponentProps, useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = ComponentProps<typeof SonnerToaster>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      position={isMobile ? "bottom-right" : "top-right"}
      offset={{
        top: 76,
        right: 16,
        bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
      mobileOffset={{
        top: 76,
        right: 12,
        bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
      gap={isMobile ? 8 : 12}
      visibleToasts={isMobile ? 3 : 5}
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
