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
  canvasWidth: number;
  canvasHeight: number;
  onFpsUpdate?: (fps: number) => void;
}

const NativeFrameRateBooster = ({
  canvasWidth,
  canvasHeight,
  onFpsUpdate,
}: NativeFrameRateBoosterProps) => {
  const { app } = useApplication();
  const frameCountRef = React.useRef(0);
  const elapsedMsRef = React.useRef(0);

  React.useEffect(() => {
    if (!app?.ticker) return;
    // Uncap maxFPS (0 = native display refresh rate, e.g. 120fps / 144fps / 60fps)
    app.ticker.maxFPS = 0;
    app.ticker.minFPS = 30;
  }, [ app ]);

  // Explicitly resize the PixiJS WebGL renderer whenever container dimensions change
  React.useEffect(() => {
    if (!app?.renderer || canvasWidth <= 0 || canvasHeight <= 0) return;
    app.renderer.resize(canvasWidth, canvasHeight);
  }, [ app, canvasWidth, canvasHeight ]);

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
  fitContainer?: boolean;
  scaleMode?: 'contain' | 'fill';
  padding?: number;
  backgroundColor?: number;
  onFpsUpdate?: (fps: number) => void;
  className?: string;
  children: React.ReactNode;
}

export const PixiStage = ({
  width,
  height,
  fitContainer = false,
  scaleMode = 'fill',
  padding = 8,
  backgroundColor = 0x12_12_12,
  onFpsUpdate,
  className,
  children,
}: PixiStageProps) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [ bounds, setBounds ] = React.useState<{ width: number; height: number } | null>(
    fitContainer ? null : { width, height },
  );

  React.useEffect(() => {
    if (!fitContainer) return;
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const nextWidth = Math.max(300, Math.floor(element.clientWidth));
      const nextHeight = Math.max(240, Math.floor(element.clientHeight));
      setBounds((prev) =>
        prev && prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight },
      );
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ fitContainer ]);

  const resolution =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const canvasWidth = bounds?.width ?? width;
  const canvasHeight = bounds?.height ?? height;

  const availableWidth = Math.max(64, canvasWidth - padding * 2);
  const availableHeight = Math.max(64, canvasHeight - padding * 2);

  const scaleX = fitContainer
    ? scaleMode === 'fill'
      ? availableWidth / width
      : Math.min(availableWidth / width, availableHeight / height)
    : 1;

  const scaleY = fitContainer
    ? scaleMode === 'fill'
      ? availableHeight / height
      : Math.min(availableWidth / width, availableHeight / height)
    : 1;

  const offsetX = fitContainer ? Math.round((canvasWidth - width * scaleX) / 2) : 0;
  const offsetY = fitContainer ? Math.round((canvasHeight - height * scaleY) / 2) : 0;

  return (
    <div
      ref={containerRef}
      style={fitContainer ? undefined : { width, height }}
      className={cn(
        'relative overflow-hidden select-none',
        fitContainer && 'h-full w-full flex-1',
        className,
      )}>
      {bounds && (
        <Application
          width={canvasWidth}
          height={canvasHeight}
          resizeTo={fitContainer ? containerRef : undefined}
          backgroundColor={backgroundColor}
          antialias
          autoDensity
          resolution={resolution}
          powerPreference="high-performance"
          preference="webgl"
          className="block h-full w-full">
          <NativeFrameRateBooster
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onFpsUpdate={onFpsUpdate}
          />
          <pixiContainer x={offsetX} y={offsetY} scale={{ x: scaleX, y: scaleY }}>
            {children}
          </pixiContainer>
        </Application>
      )}
    </div>
  );
};
