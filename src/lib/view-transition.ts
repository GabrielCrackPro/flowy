export interface ViewTransitionOptions {
  x: number;
  y: number;
}

function supportsViewTransition() {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

export function startThemeTransition(
  callback: () => void,
  options?: ViewTransitionOptions,
) {
  if (!supportsViewTransition()) {
    callback();
    return;
  }

  if (options) {
    document.documentElement.style.setProperty("--theme-x", `${options.x}px`);
    document.documentElement.style.setProperty("--theme-y", `${options.y}px`);

    const radius = Math.hypot(
      Math.max(options.x, window.innerWidth - options.x),
      Math.max(options.y, window.innerHeight - options.y),
    );

    document.documentElement.style.setProperty("--theme-radius", `${radius}px`);
  }

  (
    document as Document & {
      startViewTransition(cb: () => void): void;
    }
  ).startViewTransition(callback);
}

export function startPageTransition(callback: () => void) {
  if (!supportsViewTransition()) {
    callback();
    return;
  }

  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;

  document.documentElement.style.setProperty("--theme-x", `${x}px`);
  document.documentElement.style.setProperty("--theme-y", `${y}px`);

  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  document.documentElement.style.setProperty("--theme-radius", `${radius}px`);

  document.startViewTransition(callback);
}
