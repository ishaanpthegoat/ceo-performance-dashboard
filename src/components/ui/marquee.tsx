import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 05 · Marquee
 * Seamless infinite scroller. Duplicates the child set once and translates by
 * exactly half the track, which is what makes the wrap invisible. Pauses on
 * hover so a reader can actually read a row that is moving.
 */
export function Marquee({
  children,
  className,
  reverse = false,
  vertical = false,
  pauseOnHover = true,
  speed = 42,
  gap = "1.5rem",
  fade = true,
}: {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
  vertical?: boolean;
  pauseOnHover?: boolean;
  /** Seconds for one full pass. Higher is slower. */
  speed?: number;
  gap?: string;
  fade?: boolean;
}) {
  const track = (
    <div
      className={cn(
        "flex shrink-0 items-center",
        vertical ? "animate-marquee-v flex-col" : "animate-marquee flex-row",
        pauseOnHover && "group-hover:[animation-play-state:paused]",
      )}
      style={{
        gap,
        animationDuration: `${speed}s`,
        animationDirection: reverse ? "reverse" : "normal",
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      className={cn("group relative flex overflow-hidden", vertical && "flex-col", className)}
      style={{ ["--marquee-gap" as string]: gap, gap }}
    >
      {track}
      {/* The duplicate is decorative — the first track already announced it. */}
      <div aria-hidden>{track}</div>
      {fade && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: vertical
              ? "linear-gradient(180deg, var(--color-page), transparent 12%, transparent 88%, var(--color-page))"
              : "linear-gradient(90deg, var(--color-page), transparent 8%, transparent 92%, var(--color-page))",
          }}
        />
      )}
    </div>
  );
}
