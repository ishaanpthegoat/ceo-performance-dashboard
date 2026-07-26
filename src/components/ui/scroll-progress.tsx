import { motion, useScroll, useSpring } from "framer-motion";

/**
 * 14 · Scroll Progress
 * Hairline reading-progress bar pinned to the top of the viewport. Spring-damped
 * so a trackpad fling does not make it jitter.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{
        scaleX: width,
        originX: 0,
        background: "linear-gradient(90deg, var(--color-s1), var(--color-s7), var(--color-s3))",
      }}
      className="fixed inset-x-0 top-0 z-100 h-[2px]"
    />
  );
}
