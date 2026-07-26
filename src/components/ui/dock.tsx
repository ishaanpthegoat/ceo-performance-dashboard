import { createContext, useContext, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

type DockCtx = {
  mouseX: MotionValue<number>;
  magnification: number;
  baseSize: number;
  distance: number;
};

const DockContext = createContext<DockCtx | null>(null);

/**
 * 11 · Dock
 * macOS-style magnifying dock. Each item's scale is a function of its distance
 * from the pointer along the dock's axis, so neighbours swell as you approach.
 */
export function Dock({
  children,
  className,
  magnification = 56,
  baseSize = 40,
  distance = 130,
}: {
  children: ReactNode;
  className?: string;
  magnification?: number;
  baseSize?: number;
  /** Falloff radius in px — how far the bulge reaches. */
  distance?: number;
}) {
  const mouseX = useMotionValue(Infinity);

  return (
    <DockContext.Provider value={{ mouseX, magnification, baseSize, distance }}>
      <div
        onPointerMove={(e) => mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(Infinity)}
        className={cn(
          "mx-auto flex h-14 items-end gap-2 rounded-2xl bg-surface/80 px-2.5 pb-2 backdrop-blur-xl hairline",
          className,
        )}
      >
        {children}
      </div>
    </DockContext.Provider>
  );
}

export function DockItem({
  children,
  label,
  onClick,
  active = false,
  className,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  const ctx = useContext(DockContext);
  const ref = useRef<HTMLButtonElement>(null);

  // Hooks must run unconditionally, so always create the fallback motion value
  // and pick between it and the context one afterwards.
  const standalone = useMotionValue(Infinity);
  const mouseX = ctx?.mouseX ?? standalone;

  // Distance from the pointer to this item's horizontal centre.
  const dist = useTransform(mouseX, (x) => {
    const b = ref.current?.getBoundingClientRect();
    if (!b) return Infinity;
    return x - (b.left + b.width / 2);
  });

  const base = ctx?.baseSize ?? 40;
  const mag = ctx?.magnification ?? 56;
  const falloff = ctx?.distance ?? 130;

  const size = useSpring(
    useTransform(dist, [-falloff, 0, falloff], [base, mag, base]),
    { damping: 16, stiffness: 220, mass: 0.2 },
  );

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{ width: size, height: size }}
      className={cn(
        "group/dock relative grid shrink-0 place-items-center rounded-xl transition-colors",
        active ? "bg-ink text-page" : "bg-surface-2 text-ink-2 hover:text-ink",
        className,
      )}
    >
      {children}
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 scale-90 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-page opacity-0 transition-all duration-150 group-hover/dock:scale-100 group-hover/dock:opacity-100">
        {label}
      </span>
    </motion.button>
  );
}
