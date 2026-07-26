import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * 15 · Meteors
 * Decorative streaks falling across a container. Positions and timings are
 * randomised once per mount via useMemo — regenerating them every render would
 * make the field visibly twitch.
 */
export function Meteors({ count = 16, className }: { count?: number; className?: string }) {
  const meteors = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.round((i / count) * 120 - 10)}%`,
        top: `${-Math.round(Math.random() * 30)}%`,
        delay: `${(Math.random() * 5).toFixed(2)}s`,
        duration: `${(3 + Math.random() * 5).toFixed(2)}s`,
      })),
    [count],
  );

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {meteors.map((m) => (
        <span
          key={m.id}
          className="animate-meteor absolute size-0.5 rotate-[215deg] rounded-full bg-ink-2/70"
          style={{
            left: m.left,
            top: m.top,
            animationDelay: m.delay,
            animationDuration: m.duration,
            boxShadow: "0 0 0 1px rgb(255 255 255 / 0.06)",
          }}
        >
          {/* The tail. Sits behind the head and fades out along its length. */}
          <span
            className="absolute top-1/2 -z-10 h-px w-[52px] -translate-y-1/2"
            style={{
              background: "linear-gradient(90deg, var(--color-ink-2), transparent)",
            }}
          />
        </span>
      ))}
    </div>
  );
}
