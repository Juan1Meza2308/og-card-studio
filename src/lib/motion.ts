import { type Variants } from "motion/react";

export const spring = {
  gentle: { type: "spring", stiffness: 120, damping: 18, mass: 0.8 },
  snappy: { type: "spring", stiffness: 280, damping: 22, mass: 0.6 },
  bouncy: { type: "spring", stiffness: 400, damping: 25, mass: 0.5 },
  slow: { type: "spring", stiffness: 80, damping: 20, mass: 1.2 },
} as const;

export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.42, 0, 0.58, 1] as const,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: spring.gentle },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: spring.gentle },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: ease.out } },
};

export const fadeOut: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0, transition: { duration: 0.15, ease: ease.inOut } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: spring.gentle },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: spring.gentle },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: spring.snappy },
};

export const scaleOut: Variants = {
  visible: { opacity: 1, scale: 1 },
  hidden: { opacity: 0, scale: 0.95, transition: { duration: 0.1, ease: ease.inOut } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: spring.gentle },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: spring.gentle },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: ease.inOut } },
};

export const hoverLift = {
  whileHover: { y: -2, transition: spring.snappy },
  whileTap: { scale: 0.98, transition: { duration: 0.05 } },
};

export const hoverScale = {
  whileHover: { scale: 1.02, transition: spring.snappy },
  whileTap: { scale: 0.98, transition: { duration: 0.05 } },
};

export const cardTilt = {
  whileHover: { rotateX: 2, rotateY: -2, transition: spring.gentle },
};

export const focusRing = {
  whileFocus: { boxShadow: "0 0 0 3px var(--color-ring)" },
};

export const prefersReducedMotion = { type: "media", media: "(prefers-reduced-motion: reduce)" };

export function getReducedMotionVariants(base: Variants): Variants {
  const reduced: Variants = {};
  for (const [key, value] of Object.entries(base)) {
    if (typeof value === "object" && value !== null && "transition" in value) {
      reduced[key] = { ...value, transition: { duration: 0.01 } };
    } else {
      reduced[key] = value;
    }
  }
  return reduced;
}
