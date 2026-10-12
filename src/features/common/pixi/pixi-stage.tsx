'use client';

import { Application, extend, useApplication, useTick } from '@pixi/react';
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import * as React from 'react';
import { cn } from '@/lib/utils';

extend({
  Container,
  Graphics,
  Sprite,
  Text,
});

interface NativeFrameRateBoosterProps {
  onFpsUpdate?: (fps: number) => void;
}

const NativeFrameRateBooster = ({ onFpsUpdate }: NativeFrameRateBoosterProps) => {
  const { app } = useApplication();
  const frameCountRef = React.useRef(0);
  const elapsedMsRef = React.useRef(0);

  React.useEffect(() => {
    if (!app?.ticker) return;
    // Uncap maxFPS (0 = native display refresh rate, e.g. 120fps / 144fps / 60fps)
    app.ticker.maxFPS = 0;
    app.ticker.minFPS = 30;
  }, [ app ]);

  const handleTick = React.useCallback(
    (ticker: { deltaMS: number; FPS: number }) => {
      if (!onFpsUpdate) return;
      frameCountRef.current += 1;
      elapsedMsRef.current += ticker.deltaMS;

      if (elapsedMsRef.current >= 400) {
        const measuredFps = Math.round((frameCountRef.current * 1000) / elapsedMsRef.current);
        onFpsUpdate(Math.max(1, measuredFps));
        frameCountRef.current = 0;
        elapsedMsRef.current = 0;
      }
    },
    [ onFpsUpdate ],
  );

  useTick(handleTick);

  return null;
};

export interface PixiStageProps {
  width: number;
  height: number;
  backgroundColor?: number;
  onFpsUpdate?: (fps: number) => void;
  className?: string;
  children: React.ReactNode;
}

export const PixiStage = ({
  width,
  height,
  backgroundColor = 0x12_12_12,
  onFpsUpdate,
  className,
  children,
}: PixiStageProps) => {
  const resolution =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  return (
    <div
      style={{ width, height }}
      className={cn('relative overflow-hidden select-none', className)}>
      <Application
        width={width}
        height={height}
        backgroundColor={backgroundColor}
        antialias
        autoDensity
        resolution={resolution}
        powerPreference="high-performance"
        preference="webgl">
        <NativeFrameRateBooster onFpsUpdate={onFpsUpdate} />
        {children}
      </Application>
    </div>
  );
};
