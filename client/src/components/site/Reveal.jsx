import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";

// Fades content up the first time it scrolls into view.
export default function Reveal({ as = "div", delay = 0, y = 28, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, transform: reduce ? "none" : `translateY(${y}px)` }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduce ? 0.3 : 0.9, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
