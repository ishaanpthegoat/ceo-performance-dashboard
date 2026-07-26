import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 08 · Animated Tabs
 * The selection pill slides between tabs via a shared `layoutId` rather than
 * animating width/left, so it interpolates correctly at any label length.
 * Implements the real tablist keyboard contract, which most copy-paste tab
 * components skip.
 */
export type TabItem<T extends string> = { id: T; label: string; hint?: string };

export function AnimatedTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  layoutId = "tab-pill",
}: {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  layoutId?: string;
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === value);
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (delta) {
      e.preventDefault();
      onChange(tabs[(i + delta + tabs.length) % tabs.length].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(tabs[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(tabs[tabs.length - 1].id);
    }
  }

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-full bg-surface-2 p-1 hairline",
        className,
      )}
    >
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            title={t.hint}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              selected ? "text-page" : "text-ink-2 hover:text-ink",
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
