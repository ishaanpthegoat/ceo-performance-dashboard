import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 16 · Tilt Card
 * 3D perspective tilt toward the cursor, plus a specular sheen that tracks the
 * same position. `transformStyle: preserve-3d` lets children opt into depth with
 * their own `translateZ`.
 */
export function TiltCard({
  children,
  className,
  max = 9,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees on each axis. */
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const cfg = { damping: 20, stiffness: 200, mass: 0.4 };

  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), cfg);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), cfg);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    el.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 900 }}
      className={cn("relative rounded-2xl bg-surface hairline", className)}
    >
      {children}
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{
            background:
              "radial-gradient(400px circle at var(--gx, 50%) var(--gy, 50%), rgb(255 255 255 / 0.07), transparent 60%)",
          }}
        />
      )}
    </motion.div>
  );
}
