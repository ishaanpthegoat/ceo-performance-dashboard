import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal that cannot strand content invisible.
 *
 * The obvious way to write this is Framer's `whileInView` with `once: true`, and
 * it has a failure mode that bites in real use: if the element is never observed
 * intersecting — a deep link that lands below it, a restored scroll position, a
 * background tab whose observer is throttled, a print — the element keeps its
 * `initial` state forever, and `initial` is `opacity: 0`. The content is in the
 * DOM and simply cannot be seen.
 *
 * So: observe as usual, but also start a timer. Whichever fires first reveals
 * the element permanently. The animation is decoration; visibility is not.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  { rootMargin = "-60px", fallbackMs = 1200 }: { rootMargin?: string; fallbackMs?: number } = {},
) {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;

    const el = ref.current;
    const reveal = () => setRevealed(true);

    // No observer support, or nothing to observe: show it now.
    if (!el || typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) reveal();
      },
      { rootMargin },
    );
    io.observe(el);

    const timer = setTimeout(reveal, fallbackMs);

    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [revealed, rootMargin, fallbackMs]);

  return { ref, revealed };
}
