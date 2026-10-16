"use client";

import { useEffect, useRef, useState } from "react";
import { useGameFullscreen } from "@/features/common/use-game-fullscreen";
import { TicTacToeLocal } from "./tic-tac-toe-local";
import { TicTacToeOnline } from "./tic-tac-toe-online";

const TicTacToe = () => {
  const { containerRef, isFullscreen, toggleFullscreen } = useGameFullscreen();
  const arenaReference = useRef<HTMLElement | null>(null);
  const [boardSize, setBoardSize] = useState(280);

  const [mode, setMode] = useState<"local" | "online">(() => {
    if (typeof window !== "undefined") {
      const parameters = new URLSearchParams(window.location.search);
      if (parameters.has("room")) {
        return "online";
      }
    }
    return "local";
  });

  useEffect(() => {
    const element = arenaReference.current;
    if (!element) {
      const noop = () => {
        window.cancelAnimationFrame(0);
      };
      return noop;
    }

    let rafId = 0;
    const updateSize = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const maxBoardSize = 280;
        const availableSpace = Math.min(rect.width - 48, rect.height - 140);
        const nextSize = Math.min(
          maxBoardSize,
          Math.max(200, Math.floor(availableSpace))
        );
        setBoardSize(nextSize);
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    document.addEventListener("fullscreenchange", updateSize);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener("fullscreenchange", updateSize);
    };
  }, []);

  const handleSwitchMode = (nextMode: "local" | "online") => {
    setMode(nextMode);
  };

  const handleToggleFullscreen = () => {
    void toggleFullscreen();
  };

  return (
    <section
      ref={(element) => {
        containerRef.current = element;
        arenaReference.current = element;
      }}
      className="bg-background relative flex h-full w-full flex-1 flex-col overflow-hidden"
    >
      {mode === "local" ? (
        <TicTacToeLocal
          boardSize={boardSize}
          isFullscreen={isFullscreen}
          onSwitchMode={handleSwitchMode}
          onToggleFullscreen={handleToggleFullscreen}
        />
      ) : (
        <TicTacToeOnline
          boardSize={boardSize}
          isFullscreen={isFullscreen}
          onSwitchMode={handleSwitchMode}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}
    </section>
  );
};

export default TicTacToe;
