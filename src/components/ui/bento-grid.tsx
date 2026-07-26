import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/use-reveal";

/**
 * 03 · Bento Grid
 * Asymmetric dashboard grid. Children declare their own span; the grid stays a
 * single column under `md` so nothing needs a mobile override.
 */
export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12", className)}>
      {children}
    </div>
  );
}

export function BentoCard({
  children,
  className,
  span = 4,
  delay = 0,
  title,
  eyebrow,
  action,
  id,
}: {
  children?: ReactNode;
  className?: string;
  /** Column span at the lg breakpoint, out of 12. */
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;
  delay?: number;
  title?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  /** Anchor target, so nav can scroll to this card. */
  id?: string;
}) {
  // Reveal is observer-driven with a timer fallback, so a card can never be
  // stranded at opacity 0 when the observer does not fire. See useReveal.
  const { ref, revealed } = useReveal<HTMLElement>();

  const spans: Record<number, string> = {
    3: "lg:col-span-3 md:col-span-3",
    4: "lg:col-span-4 md:col-span-3",
    5: "lg:col-span-5 md:col-span-3",
    6: "lg:col-span-6 md:col-span-6",
    7: "lg:col-span-7 md:col-span-6",
    8: "lg:col-span-8 md:col-span-6",
    9: "lg:col-span-9 md:col-span-6",
    12: "lg:col-span-12 md:col-span-6",
  };

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 14 }}
      animate={revealed ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex min-w-0 scroll-mt-6 flex-col rounded-2xl bg-surface p-5 hairline",
        spans[span],
        className,
      )}
    >
      {(title || eyebrow || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
                {eyebrow}
              </p>
            )}
            {title && <h3 className="mt-1 text-base font-semibold text-ink">{title}</h3>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </motion.section>
  );
}
