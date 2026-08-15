"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/** Opens a list page's create form when navigated to with `?create=1`. */
export function useCreateEntityFromQuery(openCreate: () => void) {
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || searchParams.get("create") !== "1") return;

    handled.current = true;
    const url = new URL(window.location.href);
    url.searchParams.delete("create");
    window.history.replaceState(window.history.state, "", url);
    openCreate();
  }, [openCreate, searchParams]);
}
