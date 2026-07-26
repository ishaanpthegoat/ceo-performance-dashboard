import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 01 · Aurora Background
 * Slow drifting colour field behind the hero. Three blurred conic blooms on
 * independent animation delays, so the loop never visibly repeats.
 */
export function AuroraBackground({
  children,
  className,
  intensity = 0.5,
}: {
  children?: ReactNode;
  className?: string;
  /** 0–1. Multiplies bloom opacity. */
  intensity?: number;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="animate-aurora absolute -top-1/2 left-[-10%] h-[130%] w-[70%] rounded-full blur-[110px] will-change-transform"
          style={{
            opacity: intensity,
            background:
              "conic-gradient(from 120deg at 50% 50%, var(--color-s1), transparent 45%, var(--color-s7) 70%, transparent)",
          }}
        />
        <div
          className="animate-aurora absolute -bottom-1/2 right-[-15%] h-[130%] w-[65%] rounded-full blur-[120px] will-change-transform"
          style={{
            opacity: intensity * 0.85,
            animationDelay: "-7s",
            animationDuration: "28s",
            background:
              "conic-gradient(from 300deg at 50% 50%, var(--color-s3), transparent 40%, var(--color-s1) 75%, transparent)",
          }}
        />
        <div
          className="animate-aurora absolute top-[10%] left-[30%] h-[80%] w-[45%] rounded-full blur-[130px] will-change-transform"
          style={{
            opacity: intensity * 0.55,
            animationDelay: "-14s",
            animationDuration: "34s",
            background:
              "radial-gradient(circle at 50% 50%, var(--color-s2), transparent 65%)",
          }}
        />
        {/* Keeps text legible over the brightest part of the bloom. */}
        <div className="absolute inset-0 bg-page/55" />
      </div>
      {children}
    </div>
  );
}
