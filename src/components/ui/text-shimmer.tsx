import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 10 · Text Shimmer
 * A highlight sweeps across the glyphs. Uses `background-clip: text` on a
 * moving gradient — the text itself stays selectable and searchable.
 */
export function TextShimmer({
  children,
  as: Tag = "span",
  className,
  duration = 3,
  spread = 30,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Seconds per sweep. */
  duration?: number;
  /** Width of the highlight band, in percent of the element. */
  spread?: number;
}) {
  return (
    <Tag
      className={cn("animate-shimmer bg-clip-text text-transparent", className)}
      style={{
        backgroundImage: `linear-gradient(90deg, var(--color-ink-2) 0%, var(--color-ink-2) ${
          50 - spread / 2
        }%, var(--color-ink) 50%, var(--color-ink-2) ${50 + spread / 2}%, var(--color-ink-2) 100%)`,
        backgroundSize: "200% 100%",
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </Tag>
  );
}
