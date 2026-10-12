'use client';

import { motion, SVGMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export const Cell = ({ children, isSelected = false, ...rest }: React.ComponentProps<'button'> & { isSelected: boolean }) => {
  return (
    <button
      className={cn([
        isSelected ? 'bg-secondary' : 'bg-card hover:bg-secondary/60',
        'grid size-20 place-items-center border border-border transition-colors md:size-36',
      ])}
      {...rest}>
      {children}
    </button>
  );
};

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => {
    const delay = i * 0.5;
    return {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay, type: 'spring', duration: 0.5, bounce: 0 },
        opacity: { delay, duration: 0.01 },
      },
    };
  },
  exit: {
    pathLength: 0,
    opacity: 0,
    transition: {
      pathLength: { type: 'spring', duration: 0.5, bounce: 0 },
      opacity: { duration: 0.01 },
    },
  },
};

export const AnimatedCircle = (props: SVGMotionProps<SVGSVGElement>) => {
  return (
    <motion.svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial="hidden"
      animate="visible"
      exit="exit"
      {...props}>
      <motion.circle cx={12} cy={12} r={10} variants={draw} custom={0} />
    </motion.svg>
  );
};

export const AnimatedCross = (props: SVGMotionProps<SVGSVGElement>) => (
  <motion.svg 
    width="24" height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    initial="hidden"
    animate="visible"
    {...props}>
    <motion.line x1="6" y1="6" x2="18" y2="18" variants={draw} custom={0} />
    <motion.line x1="6" y1="18" x2="18" y2="6" variants={draw} custom={0} />
  </motion.svg>
);
