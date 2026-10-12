'use client';

import { useAtomValue } from 'jotai';
import { AnimatePresence, motion, type SVGMotionProps, type Variants } from 'motion/react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { figuresVisibleAtom, hangmanStatsAtom } from './hangman-utils';

const gallowsVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delayIndex = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: delayIndex * 0.12, type: 'spring', duration: 0.45, bounce: 0 },
      opacity: { delay: delayIndex * 0.12, duration: 0.05 },
    },
  }),
};

const bodyPartVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: 'spring', duration: 0.4, bounce: 0 },
      opacity: { duration: 0.08 },
    },
  },
  exit: {
    pathLength: 0,
    opacity: 0,
    transition: {
      pathLength: { duration: 0.2, ease: 'easeInOut' },
      opacity: { delay: 0.12, duration: 0.1 },
    },
  },
};

export const HangmanFigure = ({ className, ...rest }: SVGMotionProps<SVGSVGElement>) => {
  const visiblePart = useAtomValue(figuresVisibleAtom);
  const stats = useAtomValue(hangmanStatsAtom);

  return (
    <motion.svg
      initial="hidden"
      animate="visible"
      viewBox="60 25 380 450"
      fill="none"
      className={cn(
        'h-40 w-40 shrink-0 transition-colors duration-300 sm:h-48 sm:w-48',
        stats.maxAttemptsReached
          ? 'text-destructive'
          : stats.hasWon
            ? 'text-chart-2'
            : 'text-foreground',
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}>
      {/* Gallows base, pole, beam, and rope */}
      <motion.line
        variants={gallowsVariants}
        data-slot="hangman-pole-bottom"
        custom={0}
        x1="90"
        y1="451"
        x2="246"
        y2="451"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="square"
      />
      <motion.line
        variants={gallowsVariants}
        data-slot="hangman-pole-stand"
        custom={1}
        x1="169"
        y1="449"
        x2="169"
        y2="49"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="square"
      />
      <motion.line
        variants={gallowsVariants}
        data-slot="hangman-pole-top"
        custom={2}
        x1="167"
        y1="48"
        x2="368"
        y2="48"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="square"
      />
      <motion.line
        variants={gallowsVariants}
        data-slot="hangman-pole-brace"
        custom={2.5}
        x1="169"
        y1="105"
        x2="225"
        y2="48"
        stroke="currentColor"
        strokeWidth="3"
      />
      <motion.line
        variants={gallowsVariants}
        data-slot="hangman-pole-rope"
        custom={3}
        x1="367"
        y1="48"
        x2="367"
        y2="98"
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* Stick figure parts with smooth mount & unmount animations */}
      <AnimatePresence>
        {visiblePart.head && (
          <motion.circle
            key="head"
            variants={bodyPartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-slot="hangman-head"
            cx="367"
            cy="140"
            r="42"
            stroke="currentColor"
            strokeWidth="4"
          />
        )}
        {visiblePart.body && (
          <motion.line
            key="body"
            variants={bodyPartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-slot="hangman-body"
            x1="367"
            y1="182"
            x2="367"
            y2="314"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
        {visiblePart.handLeft && (
          <motion.line
            key="hand-left"
            variants={bodyPartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-slot="hangman-hand-left"
            x1="367"
            y1="220"
            x2="316"
            y2="190"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
        {visiblePart.handRight && (
          <motion.line
            key="hand-right"
            variants={bodyPartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-slot="hangman-hand-right"
            x1="367"
            y1="220"
            x2="418"
            y2="190"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
        {visiblePart.legLeft && (
          <motion.line
            key="leg-left"
            variants={bodyPartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-slot="hangman-leg-left"
            x1="367"
            y1="313"
            x2="332"
            y2="372"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
        {visiblePart.legRight && (
          <motion.line
            key="leg-right"
            variants={bodyPartVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            data-slot="hangman-leg-right"
            x1="367"
            y1="313"
            x2="402"
            y2="372"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
      </AnimatePresence>
    </motion.svg>
  );
};
