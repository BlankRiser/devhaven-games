"use client";

import { SpinnerGapIcon } from "@phosphor-icons/react";
import { Application as PixiApp, Container } from "pixi.js";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { Ticker } from "pixi.js";

export interface PixiStageContextValue {
  app: PixiApp;
  viewport: Container;
}

const PixiStageContext = React.createContext<PixiStageContextValue | null>(
  null
);

export const usePixiApp = (): PixiStageContextValue => {
  const context = React.useContext(PixiStageContext);
  if (!context) {
    throw new Error("usePixiApp must be used inside a <PixiStage> component.");
  }
  return context;
};

export const usePixiTick = (callback: (ticker: Ticker) => void): void => {
  const { app } = usePixiApp();
  const callbackReference = React.useRef(callback);
  callbackReference.current = callback;

  React.useEffect(() => {
    if (!app?.ticker) {
      return;
    }

    const handleTick = (ticker: Ticker) => {
      callbackReference.current(ticker);
    };

    app.ticker.add(handleTick);
    return () => {
      if (app?.ticker) {
        app.ticker.remove(handleTick);
      }
    };
  }, [app]);
};

export interface PixiStageProps {
  readonly width: number;
  readonly height: number;
  readonly fitContainer?: boolean;
  readonly scaleMode?: "contain" | "fill";
  readonly padding?: number;
  readonly backgroundColor?: number;
  readonly onFpsUpdate?: (fps: number) => void;
  readonly className?: string;
  readonly children: React.ReactNode;
}

export const PixiStage = React.memo(
  ({
    width,
    height,
    fitContainer = false,
    scaleMode = "fill",
    padding = 8,
    backgroundColor = 0x0d_11_1a,
    onFpsUpdate,
    className,
    children,
  }: PixiStageProps) => {
    const containerReference = React.useRef<HTMLDivElement | null>(null);
    const canvasHostReference = React.useRef<HTMLDivElement | null>(null);
    const appReference = React.useRef<PixiApp | null>(null);
    const viewportContainerReference = React.useRef<Container | null>(null);
    const onFpsUpdateReference = React.useRef(onFpsUpdate);
    onFpsUpdateReference.current = onFpsUpdate;

    const [stageContext, setStageContext] =
      React.useState<PixiStageContextValue | null>(null);

    const syncViewportTransform = React.useCallback(() => {
      const app = appReference.current;
      const viewport = viewportContainerReference.current;
      const element = containerReference.current;
      if (!app?.renderer || !element) {
        return;
      }

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
          ? scaleMode === "fill"
            ? availableWidth / width
            : Math.min(availableWidth / width, availableHeight / height)
          : 1;

        const scaleY = fitContainer
          ? scaleMode === "fill"
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
    }, [fitContainer, height, padding, scaleMode, width]);

    const syncViewportTransformReference = React.useRef(syncViewportTransform);
    syncViewportTransformReference.current = syncViewportTransform;

    React.useEffect(() => {
      let isCancelled = false;
      let initializedApp: PixiApp | null = null;
      let createdCanvas: HTMLCanvasElement | null = null;

      const initFrameId = window.requestAnimationFrame(async () => {
        if (isCancelled) {
          return;
        }

        const host = canvasHostReference.current;
        const container = containerReference.current;
        if (!host || !container) {
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.className = "block";
        const app = new PixiApp();

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
            powerPreference: "high-performance",
            preference: "webgl",
          });
        } catch {
          return;
        }

        if (isCancelled || !canvasHostReference.current) {
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

        appReference.current = app;
        viewportContainerReference.current = viewport;

        canvasHostReference.current.replaceChildren(canvas);
        syncViewportTransformReference.current();

        let frameCount = 0;
        let elapsedMs = 0;
        const handleFpsTick = (ticker: Ticker) => {
          const callback = onFpsUpdateReference.current;
          if (!callback) {
            return;
          }

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
        isCancelled = true;
        window.cancelAnimationFrame(initFrameId);
        appReference.current = null;
        viewportContainerReference.current = null;

        if (createdCanvas?.parentNode) {
          createdCanvas.remove();
        }

        if (!initializedApp) {
          return;
        }

        try {
          initializedApp.ticker?.stop();
          initializedApp.destroy({ removeView: true }, { children: true });
        } catch {
          // Ignore cleanup errors
        }
        initializedApp = null;
      };
    }, [backgroundColor, fitContainer, height, width]);

    React.useEffect(() => {
      const element = containerReference.current;
      if (!element) {
        return;
      }

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

      window.addEventListener("resize", scheduleSync);
      document.addEventListener("fullscreenchange", scheduleSync);

      return () => {
        window.cancelAnimationFrame(rafId);
        observer.disconnect();
        window.removeEventListener("resize", scheduleSync);
        document.removeEventListener("fullscreenchange", scheduleSync);
      };
    }, [syncViewportTransform]);

    const isReady = stageContext !== null;

    return (
      <div
        ref={containerReference}
        style={fitContainer ? undefined : { width, height }}
        className={cn(
          "relative min-h-0 min-w-0 overflow-hidden select-none",
          fitContainer && "h-full w-full flex-1",
          className
        )}
      >
        <div
          ref={canvasHostReference}
          className={cn(
            "absolute inset-0 overflow-hidden transition-opacity duration-150",
            isReady ? "opacity-100" : "opacity-0"
          )}
        />

        {stageContext ? (
          <PixiStageContext.Provider value={stageContext}>
            {children}
          </PixiStageContext.Provider>
        ) : null}

        {!isReady && (
          <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d111a] text-xs tracking-widest uppercase">
            <SpinnerGapIcon className="text-accent size-6 animate-spin" />
            <span>Initializing PixiJS WebGL Engine...</span>
          </div>
        )}
      </div>
    );
  }
);
