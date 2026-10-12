import { InfoIcon } from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';

export const MobileBanner = () => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="border-b border-border p-3">
      <Alert>
        <InfoIcon />
        <AlertTitle className="font-heading text-base font-medium tracking-wider uppercase">
          Full Experience on Desktop
        </AlertTitle>
        <AlertDescription>
          This platform is calibrated for desktop viewports. Switch to a desktop terminal for
          optimal local multiplayer controls.
        </AlertDescription>
      </Alert>
    </div>
  );
};
