'use client';

import { CornersInIcon, CornersOutIcon } from '@phosphor-icons/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';

export function useGameFullscreen<T extends HTMLElement = HTMLElement>() {
  const containerRef = React.useRef<T | null>(null);
  const [ isFullscreen, setIsFullscreen ] = React.useState(false);

  const toggleFullscreen = React.useCallback(async () => {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen permission errors
    }
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    containerRef,
    isFullscreen,
    toggleFullscreen,
  };
}

export const FullscreenToggleButton = ({
  isFullscreen,
  onToggle,
}: {
  isFullscreen: boolean;
  onToggle: () => void;
}) => {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={onToggle}
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      className="size-7">
      {isFullscreen ? (
        <CornersInIcon className="size-3.5" />
      ) : (
        <CornersOutIcon className="size-3.5" />
      )}
    </Button>
  );
};
