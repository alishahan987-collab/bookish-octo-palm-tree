"use client";

import { LazyMotion, MotionConfig, domAnimation, m, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

/** LazyMotion keeps the animation bundle small; reducedMotion="user" honours OS settings. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

/** Fade-and-rise when scrolled into view. Use for below-the-fold content only. */
export function Reveal({
  children,
  delay = 0,
  className,
  ...rest
}: { children: ReactNode; delay?: number; className?: string } & HTMLMotionProps<"div">) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </m.div>
  );
}

export { m };
