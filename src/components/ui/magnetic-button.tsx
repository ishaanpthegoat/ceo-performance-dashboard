import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 07 · Magnetic Button
 * The button leans toward the cursor while it is over it, and springs back on
 * leave. `strength` is how many px of travel at the far edge.
 */
export function MagneticButton({
  children,
  className,
  strength = 10,
  onClick,
  active = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  active?: boolean;
  onClick?: () => void;
  /* Deliberately narrow rather than spreading all of ComponentProps<"button">:
     React's DOM animation/drag handlers collide with Framer Motion's
     same-named props, which have different signatures. */
} & Pick<React.ComponentPropsWithoutRef<"button">, "title" | "disabled" | "aria-label" | "type">) {
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cfg = { damping: 18, stiffness: 260, mass: 0.5 };
  const x = useSpring(useTransform(mx, (v) => v * strength), cfg);
  const y = useSpring(useTransform(my, (v) => v * strength), cfg);

  function onMove(e: React.PointerEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
    my.set((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      onClick={onClick}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-ink text-page"
          : "bg-surface-2 text-ink-2 hairline hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
