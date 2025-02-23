'use client';

import { useAtom } from 'jotai';
import { AnimatePresence, motion, SVGMotionProps } from 'motion/react';
import * as React from 'react';
import { figuresVisibleAtom, hangmanStatsAtom } from './hangman-utils';
import { cn } from '@/lib/utils';

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => {
    const delay = i * 0.5;

    return {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay, dtype: 'spring', duration: 0.5, bounce: 0 },
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

export const HangmanFigure = ({ ...rest }: SVGMotionProps<SVGSVGElement>) => {
  const [visiblePart] = useAtom(figuresVisibleAtom);
  const [stats] = useAtom(hangmanStatsAtom);

  return (
    <AnimatePresence>
      <motion.svg
        variants={draw}
        initial="hidden"
        animate="visible"
        width="500"
        height="500"
        viewBox="0 0 500 500"
        fill="none"
        className={cn([stats.maxAttemptsReached ? 'text-rose-900 dark:text-rose-900' : 'text-neutral-950 dark:text-neutral-50'])}
        xmlns="http://www.w3.org/2000/svg"
        {...rest}
      >
        <motion.line variants={draw} data-slot="hangman-pole-bottom" custom={0} x1="90" y1="451" x2="246" y2="451" stroke="currentColor" strokeWidth="4" />
        <motion.line variants={draw} data-slot="hangman-pole-stand" custom={0.25} x1="169" y1="449" x2="169" y2="49" stroke="currentColor" strokeWidth="2" />
        <motion.line variants={draw} data-slot="hangman-pole-top" custom={0.5} x1="168" y1="48" x2="368" y2="48" stroke="currentColor" strokeWidth="2" />
        <motion.line variants={draw} data-slot="hangman-pole-rope" custom={1} x1="367" y1="47" x2="367" y2="97" stroke="currentColor" strokeWidth="2" />
        {visiblePart.head && <motion.circle variants={draw} data-slot="hangman-head" cx="368" cy="140" r="42" stroke="currentColor" strokeWidth="2" />}
        {visiblePart.body && <motion.line variants={draw} data-slot="hangman-body" x1="367" y1="183" x2="367" y2="314" stroke="currentColor" strokeWidth="2" />}
        {visiblePart.handLeft && <motion.line variants={draw} data-slot="hangman-hand-left" x1="366.801" y1="215.866" x2="323.5" y2="190.866" stroke="currentColor" strokeWidth="2" />}
        {visiblePart.handRight && <motion.line variants={draw} data-slot="hangman-hand-right" x1="366.5" y1="216.134" x2="409.801" y2="191.134" stroke="currentColor" strokeWidth="2" />}
        {visiblePart.legLeft && <motion.line variants={draw} data-slot="hangman-leg-left" x1="366.866" y1="313.5" x2="341.866" y2="356.801" stroke="currentColor" strokeWidth="2" />}
        {visiblePart.legRight && <motion.line variants={draw} data-slot="hangman-leg-right" x1="367.866" y1="313.5" x2="392.866" y2="356.801" stroke="currentColor" strokeWidth="2" />}
      </motion.svg>
    </AnimatePresence>
  );
};
