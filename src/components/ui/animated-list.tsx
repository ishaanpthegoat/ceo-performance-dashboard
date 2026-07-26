import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 17 · Animated List
 * Staggered reveal for a list, driven by a parent variant so the children only
 * declare their own start and end state. `key` on the container re-runs the
 * stagger when the underlying selection changes.
 */
export function AnimatedList({
  children,
  className,
  stagger = 0.045,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ul" | "ol" | "tbody";
}) {
  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: 0.04 } },
      }}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}

export function AnimatedListItem({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "tr";
}) {
  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}
