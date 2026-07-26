import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 13 · Command Palette
 * ⌘K / Ctrl-K search over a flat item list, grouped by section. Written against
 * the combobox pattern: the input keeps focus and owns the keyboard, the list is
 * `aria-activedescendant`-driven, and Escape always closes.
 */
export type CommandItem = {
  id: string;
  label: string;
  group: string;
  hint?: string;
  keywords?: string;
  onSelect: () => void;
};

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      // Wait for the panel to mount before grabbing focus.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) =>
      `${i.label} ${i.group} ${i.hint ?? ""} ${i.keywords ?? ""}`.toLowerCase().includes(needle),
    );
  }, [items, q]);

  // Clamp the cursor whenever the result set shrinks under it.
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function commit(i: number) {
    const item = results[i];
    if (!item) return;
    item.onSelect();
    setOpen(false);
  }

  const grouped = results.reduce<Record<string, { item: CommandItem; idx: number }[]>>(
    (acc, item, idx) => {
      (acc[item.group] ??= []).push({ item, idx });
      return acc;
    },
    {},
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-surface-2 py-1.5 pr-2 pl-3 text-sm text-muted transition-colors hairline hover:text-ink-2"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="rounded border border-hairline bg-surface px-1.5 py-0.5 font-sans text-[10px] tracking-wide">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-100 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -6 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl overflow-hidden rounded-2xl bg-surface shadow-2xl hairline"
            >
              <div className="flex items-center gap-3 border-b border-hairline px-4">
                <Search className="size-4 shrink-0 text-muted" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setCursor((c) => Math.min(c + 1, results.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setCursor((c) => Math.max(c - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      commit(cursor);
                    }
                  }}
                  role="combobox"
                  aria-expanded
                  aria-controls="cmdk-list"
                  aria-activedescendant={results[cursor] ? `cmdk-${results[cursor].id}` : undefined}
                  placeholder="Jump to a CEO, a metric, a view…"
                  className="w-full bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-muted"
                />
              </div>

              <div ref={listRef} id="cmdk-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
                {results.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-muted">
                    Nothing matches “{q}”.
                  </p>
                )}
                {Object.entries(grouped).map(([group, rows]) => (
                  <div key={group} className="mb-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
                      {group}
                    </p>
                    {rows.map(({ item, idx }) => (
                      <button
                        key={item.id}
                        id={`cmdk-${item.id}`}
                        data-idx={idx}
                        role="option"
                        aria-selected={idx === cursor}
                        onMouseMove={() => setCursor(idx)}
                        onClick={() => commit(idx)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          idx === cursor ? "bg-surface-2 text-ink" : "text-ink-2",
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.hint && (
                          <span className="shrink-0 text-xs tnum text-muted">{item.hint}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
