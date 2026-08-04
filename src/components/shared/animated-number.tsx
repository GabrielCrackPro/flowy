"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  formatter: (value: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 800,
  className,
  formatter,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const valueRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = value;
    valueRef.current = value;
    const start = performance.now();
    let raf: number;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{formatter(display)}</span>;
}
