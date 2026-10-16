"use client";

import { CornersInIcon, CornersOutIcon } from "@phosphor-icons/react";
import * as React from "react";
import { Button } from "@/components/ui/button";

export function useGameFullscreen<T extends HTMLElement = HTMLElement>() {
  const containerReference = React.useRef<T | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = React.useCallback(async () => {
    const element = containerReference.current;
    if (!element) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen permission errors
    }
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return {
    containerRef: containerReference,
    isFullscreen,
    toggleFullscreen,
  };
}

export const FullscreenToggleButton = ({
  isFullscreen,
  onToggle,
}: {
  readonly isFullscreen: boolean;
  readonly onToggle: () => void;
}) => (
  <Button
    variant="outline"
    size="icon-sm"
    onClick={onToggle}
    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    className="size-7"
  >
    {isFullscreen ? (
      <CornersInIcon className="size-3.5" />
    ) : (
      <CornersOutIcon className="size-3.5" />
    )}
  </Button>
);
