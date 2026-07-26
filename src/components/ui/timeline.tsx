import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/use-reveal";

/**
 * 09 · Scroll Timeline
 * Vertical timeline whose spine fills as the section scrolls past. The spine is
 * scaled on the GPU (`scaleY` + `transform-origin: top`) rather than animating
 * height, so it stays smooth on a long list.
 */
export type TimelineEntry = {
  id: string;
  /** Left-rail label — a year, a date, a tenure length. */
  marker: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  /** Overrides the dot colour. Defaults to series slot 1. */
  accent?: string;
};

export function Timeline({
  entries,
  className,
}: {
  entries: TimelineEntry[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.45"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Track */}
      <div
        aria-hidden
        className="absolute top-2 bottom-2 left-[calc(4.5rem+0.5px)] w-px bg-grid sm:left-[calc(6rem+0.5px)]"
      />
      {/* Progress spine */}
      <motion.div
        aria-hidden
        style={{ scaleY, originY: 0 }}
        className="absolute top-2 bottom-2 left-[calc(4.5rem+0.5px)] w-px sm:left-[calc(6rem+0.5px)]"
      >
        <div
          className="h-full w-full"
          style={{
            background: "linear-gradient(180deg, var(--color-s1), var(--color-s7))",
          }}
        />
      </motion.div>

      <ol className="space-y-7">
        {entries.map((e, i) => (
          <TimelineRow key={e.id} entry={e} index={i} />
        ))}
      </ol>
    </div>
  );
}

function TimelineRow({ entry: e, index: i }: { entry: TimelineEntry; index: number }) {
  const { ref, revealed } = useReveal<HTMLLIElement>({ rootMargin: "-80px" });

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: 12 }}
      animate={revealed ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.4, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-4 sm:gap-6"
    >
      <div className="w-18 shrink-0 pt-0.5 text-right text-xs tnum text-muted sm:w-24">
        {e.marker}
      </div>
      <span
        aria-hidden
        className="relative z-10 mt-[7px] size-2.5 shrink-0 rounded-full ring-2"
        style={{
          background: e.accent ?? "var(--color-s1)",
          // 2px surface ring keeps the dot legible where it crosses the spine.
          ["--tw-ring-color" as string]: "var(--color-page)",
          marginLeft: "-1.3125rem",
        }}
      />
      <div className="min-w-0 flex-1 pb-1">
        <div className="text-sm font-semibold text-ink">{e.title}</div>
        {e.body && <div className="mt-1 text-sm leading-relaxed text-ink-2">{e.body}</div>}
      </div>
    </motion.li>
  );
}
