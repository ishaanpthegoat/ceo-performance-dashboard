import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * 18 · Dot Pattern
 * Tiling SVG dot grid for section backgrounds, with an optional radial mask so
 * it fades out at the edges instead of ending on a hard line.
 * `useId` keeps the pattern id unique when several instances are on one page.
 */
export function DotPattern({
  className,
  size = 22,
  radius = 1,
  mask = true,
}: {
  className?: string;
  /** Grid pitch in px. */
  size?: number;
  radius?: number;
  mask?: boolean;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full text-grid", className)}
      style={
        mask
          ? {
              maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 60% at 50% 0%, #000 40%, transparent 100%)",
            }
          : undefined
      }
    >
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={radius} cy={radius} r={radius} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
