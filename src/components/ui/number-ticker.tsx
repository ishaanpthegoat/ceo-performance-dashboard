import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * 04 · Number Ticker
 * Springs a figure up from zero the first time it scrolls into view. Writes to
 * textContent directly rather than through state, so a wall of these does not
 * cause a re-render storm.
 */
export function NumberTicker({
  value,
  format,
  className,
  delay = 0,
  once = true,
}: {
  value: number;
  /** Turns the in-flight number into display text. Defaults to a rounded integer. */
  format?: (n: number) => string;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 42, stiffness: 90, mass: 1 });

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => mv.set(value), delay * 1000);
    return () => clearTimeout(t);
  }, [inView, value, delay, mv]);

  useEffect(
    () =>
      spring.on("change", (n) => {
        const el = ref.current;
        if (el) el.textContent = format ? format(n) : Math.round(n).toLocaleString("en-US");
      }),
    [spring, format],
  );

  // Initial content is the FINAL value, not zero. The spring only writes to the
  // node once it actually moves, so the correct figure is what sits in the DOM
  // until the element scrolls into view — which is what a screen reader, a
  // search crawler, or a JS-disabled reader gets. Rendering format(0) here
  // instead would leave a real "$0" in the document for anything that never
  // triggers the viewport observer.
  return (
    <span ref={ref} className={className}>
      {format ? format(value) : Math.round(value).toLocaleString("en-US")}
    </span>
  );
}
