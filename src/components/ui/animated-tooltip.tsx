import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 12 · Animated Tooltip
 * Springs in with a slight rotation that tracks the pointer's horizontal
 * position across the trigger, which reads as physical rather than as a
 * generic fade.
 */
export function AnimatedTooltip({
  children,
  content,
  className,
  side = "top",
}: {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  side?: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);
  const x = useMotionValue(0);
  const rotate = useSpring(useTransform(x, [-60, 60], [-9, 9]), {
    damping: 14,
    stiffness: 220,
  });
  const shift = useSpring(useTransform(x, [-60, 60], [-14, 14]), {
    damping: 14,
    stiffness: 220,
  });

  return (
    <span
      className={cn("relative inline-flex", className)}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - (r.left + r.width / 2));
      }}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 8 : -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 6 : -6, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            style={{ rotate, x: shift }}
            className={cn(
              "pointer-events-none absolute left-1/2 z-50 w-max max-w-[16rem] -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs leading-snug font-medium text-page shadow-xl",
              side === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]",
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
