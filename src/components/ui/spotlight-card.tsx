import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 02 · Spotlight Card
 * Tracks the pointer and paints a radial highlight on the border and surface.
 * Pure CSS custom properties driven from a pointermove handler — no re-render
 * per frame, so this is cheap enough to put on a 12-card grid.
 */
export function SpotlightCard({
  children,
  className,
  radius = 340,
  color = "var(--color-s1)",
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-surface hairline transition-transform duration-300",
        className,
      )}
      style={
        {
          "--spot": color,
          "--r": `${radius}px`,
        } as React.CSSProperties
      }
    >
      {/* Border glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: active ? 0.7 : 0,
          background:
            "radial-gradient(var(--r) circle at var(--mx) var(--my), var(--spot), transparent 60%)",
          mask: "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: 1,
        }}
      />
      {/* Surface wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active ? 0.08 : 0,
          background:
            "radial-gradient(var(--r) circle at var(--mx) var(--my), var(--spot), transparent 55%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
