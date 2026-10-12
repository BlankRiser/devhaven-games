'use client';

import { SpinnerGapIcon } from '@phosphor-icons/react';
import {
  Application as PixiApplication,
  Container,
  type Ticker,
} from 'pixi.js';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PixiStageContextValue {
  app: PixiApplication;
  viewport: Container;
}

const PixiStageContext = React.createContext<PixiStageContextValue | null>(null);

export const usePixiApp = (): PixiStageContextValue => {
  const ctx = React.useContext(PixiStageContext);
  if (!ctx) {
    throw new Error('usePixiApp must be used inside a <PixiStage> component.');
  }
  return ctx;
};

export const usePixiTick = (callback: (ticker: Ticker) => void): void => {
  const { app } = usePixiApp();
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    if (!app?.ticker) return;

    const handleTick = (ticker: Ticker) => {
      callbackRef.current(ticker);
    };

    app.ticker.add(handleTick);
    return () => {
      if (app?.ticker) {
        app.ticker.remove(handleTick);
      }
    };
  }, [ app ]);
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

export const PixiStage = React.memo(function PixiStage({
  width,
  height,
  fitContainer = false,
  scaleMode = 'fill',
  padding = 8,
  backgroundColor = 0x0d_11_1a,
  onFpsUpdate,
  className,
  children,
}: PixiStageProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasHostRef = React.useRef<HTMLDivElement | null>(null);
  const appRef = React.useRef<PixiApplication | null>(null);
  const viewportContainerRef = React.useRef<Container | null>(null);
  const onFpsUpdateRef = React.useRef(onFpsUpdate);
  onFpsUpdateRef.current = onFpsUpdate;

  const [ stageContext, setStageContext ] =
    React.useState<PixiStageContextValue | null>(null);

  const syncViewportTransform = React.useCallback(() => {
    const app = appRef.current;
    const viewport = viewportContainerRef.current;
    const element = containerRef.current;
    if (!app?.renderer || !element) return;

    const rect = element.getBoundingClientRect();
    const canvasWidth = fitContainer
      ? Math.max(200, Math.floor(rect.width))
      : width;
    const canvasHeight = fitContainer
      ? Math.max(200, Math.floor(rect.height))
      : height;

    app.renderer.resize(canvasWidth, canvasHeight);

    if (viewport && !viewport.destroyed) {
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

      const offsetX = fitContainer
        ? Math.round((canvasWidth - width * scaleX) / 2)
        : 0;
      const offsetY = fitContainer
        ? Math.round((canvasHeight - height * scaleY) / 2)
        : 0;

      viewport.position.set(offsetX, offsetY);
      viewport.scale.set(scaleX, scaleY);
    }
  }, [ fitContainer, height, padding, scaleMode, width ]);

  const syncViewportTransformRef = React.useRef(syncViewportTransform);
  syncViewportTransformRef.current = syncViewportTransform;

  React.useEffect(() => {
    let cancelled = false;
    let initializedApp: PixiApplication | null = null;
    let createdCanvas: HTMLCanvasElement | null = null;

    const initFrameId = window.requestAnimationFrame(async () => {
      if (cancelled) return;

      const host = canvasHostRef.current;
      const container = containerRef.current;
      if (!host || !container) return;

      const canvas = document.createElement('canvas');
      canvas.className = 'block';
      const app = new PixiApplication();

      const rect = container.getBoundingClientRect();
      const initialWidth = fitContainer
        ? Math.max(200, Math.floor(rect.width) || width)
        : width;
      const initialHeight = fitContainer
        ? Math.max(200, Math.floor(rect.height) || height)
        : height;
      const resolution = Math.min(window.devicePixelRatio || 1, 2);

      try {
        await app.init({
          canvas,
          width: initialWidth,
          height: initialHeight,
          backgroundColor,
          antialias: true,
          autoDensity: true,
          resolution,
          powerPreference: 'high-performance',
          preference: 'webgl',
        });
      } catch {
        return;
      }

      if (cancelled || !canvasHostRef.current) {
        try {
          app.destroy({ removeView: true }, { children: true });
        } catch {
          // Ignore teardown errors if cancelled during async init
        }
        return;
      }

      initializedApp = app;
      createdCanvas = canvas;

      if (app.ticker) {
        // Uncap maxFPS (0 = native display refresh rate, e.g. 120fps / 144fps / 60fps)
        app.ticker.maxFPS = 0;
        app.ticker.minFPS = 30;
      }

      const viewport = new Container();
      app.stage.addChild(viewport);

      appRef.current = app;
      viewportContainerRef.current = viewport;

      canvasHostRef.current.replaceChildren(canvas);
      syncViewportTransformRef.current();

      let frameCount = 0;
      let elapsedMs = 0;
      const handleFpsTick = (ticker: Ticker) => {
        const callback = onFpsUpdateRef.current;
        if (!callback) return;

        frameCount += 1;
        elapsedMs += ticker.deltaMS;

        if (elapsedMs >= 500) {
          const measuredFps = Math.round((frameCount * 1000) / elapsedMs);
          callback(Math.max(1, measuredFps));
          frameCount = 0;
          elapsedMs = 0;
        }
      };

      app.ticker.add(handleFpsTick);
      setStageContext({ app, viewport });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(initFrameId);
      appRef.current = null;
      viewportContainerRef.current = null;

      if (createdCanvas?.parentNode) {
        createdCanvas.parentNode.removeChild(createdCanvas);
      }

      if (initializedApp) {
        try {
          initializedApp.ticker?.stop();
          initializedApp.destroy({ removeView: true }, { children: true });
        } catch {
          // Ignore cleanup errors
        }
        initializedApp = null;
      }
    };
  }, [ backgroundColor, fitContainer, height, width ]);

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let rafId = 0;
    const scheduleSync = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        syncViewportTransform();
      });
    };

    scheduleSync();

    const observer = new ResizeObserver(scheduleSync);
    observer.observe(element);

    window.addEventListener('resize', scheduleSync);
    document.addEventListener('fullscreenchange', scheduleSync);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', scheduleSync);
      document.removeEventListener('fullscreenchange', scheduleSync);
    };
  }, [ syncViewportTransform ]);

  const isReady = stageContext !== null;

  return (
    <div
      ref={containerRef}
      style={fitContainer ? undefined : { width, height }}
      className={cn(
        'relative min-h-0 min-w-0 overflow-hidden select-none',
        fitContainer && 'h-full w-full flex-1',
        className,
      )}>
      <div
        ref={canvasHostRef}
        className={cn(
          'absolute inset-0 overflow-hidden transition-opacity duration-150',
          isReady ? 'opacity-100' : 'opacity-0',
        )}
      />

      {stageContext && (
        <PixiStageContext.Provider value={stageContext}>
          {children}
        </PixiStageContext.Provider>
      )}

      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d111a] text-xs tracking-widest text-muted-foreground uppercase">
          <SpinnerGapIcon className="size-6 animate-spin text-accent" />
          <span>Initializing PixiJS WebGL Engine...</span>
        </div>
      )}
    </div>
  );
});
