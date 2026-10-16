"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { SVGMotionProps } from "motion/react";
import type { ComponentProps } from "react";

export const Cell = ({
  children,
  isSelected = false,
  className,
  ...rest
}: ComponentProps<"button"> & { readonly isSelected?: boolean }) => {
  const selectedClass = isSelected
    ? "bg-secondary"
    : "bg-card hover:bg-secondary/60";
  return (
    <button
      type="button"
      className={cn(
        selectedClass,
        "border-border focus-visible:ring-ring grid h-full w-full place-items-center border transition-colors focus-visible:z-10 focus-visible:ring-1 focus-visible:outline-none",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

const draw = {
  hidden: { opacity: 0, pathLength: 0 },
  visible: (index: number) => {
    const delay = index * 0.5;
    return {
      opacity: 1,
      pathLength: 1,
      transition: {
        opacity: { delay, duration: 0.01 },
        pathLength: {
          bounce: 0,
          delay,
          duration: 0.5,
          type: "spring" as const,
        },
      },
    };
  },
  exit: {
    opacity: 0,
    pathLength: 0,
    transition: {
      opacity: { duration: 0.01 },
      pathLength: { bounce: 0, duration: 0.5, type: "spring" as const },
    },
  },
};

export const AnimatedCircle = ({
  ...properties
}: Readonly<SVGMotionProps<SVGSVGElement>>) => {
  const size = 24;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial="hidden"
      animate="visible"
      exit="exit"
      {...properties}
    >
      <motion.circle cx={12} cy={12} r={10} variants={draw} custom={0} />
    </motion.svg>
  );
};

export const AnimatedCross = ({
  ...properties
}: Readonly<SVGMotionProps<SVGSVGElement>>) => {
  const size = 24;
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial="hidden"
      animate="visible"
      {...properties}
    >
      <motion.line x1="6" y1="6" x2="18" y2="18" variants={draw} custom={0} />
      <motion.line x1="6" y1="18" x2="18" y2="6" variants={draw} custom={0} />
    </motion.svg>
  );
};
