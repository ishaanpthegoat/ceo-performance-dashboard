import { cn } from "@/lib/utils";

/**
 * 06 · Border Beam
 * A light travelling around a container's border. Drop it inside any
 * `relative` element with a matching border radius.
 *
 * Implemented with `offset-path` on the border rectangle rather than a rotating
 * conic gradient, so the beam actually follows rounded corners instead of
 * sweeping through them.
 */
export function BorderBeam({
  className,
  size = 130,
  duration = 6,
  delay = 0,
  radius = 16,
  colorFrom = "var(--color-s1)",
  colorTo = "var(--color-s7)",
}: {
  className?: string;
  /** Length of the visible streak, in px. */
  size?: number;
  /** Seconds for one lap. */
  duration?: number;
  delay?: number;
  /** Must match the parent's border radius for the beam to track the corners. */
  radius?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className,
      )}
    >
      <div
        className="animate-beam absolute aspect-square will-change-[offset-distance]"
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${radius}px)`,
          offsetAnchor: "50% 50%",
          animationDuration: `${duration}s`,
          animationDelay: `${-delay}s`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          filter: "blur(6px)",
          opacity: 0.85,
        }}
      />
    </div>
  );
}
