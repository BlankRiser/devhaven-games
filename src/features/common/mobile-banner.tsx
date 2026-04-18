import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { Info } from 'lucide-react';

export const MobileBanner = () => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="p-2">
      <Alert>
        <Info />
        <AlertTitle>Full Experience on Desktop</AlertTitle>
        <AlertDescription>
          This website was designed for desktop browsers. For the best gameplay, features, and visuals, please switch to
          a desktop device.
        </AlertDescription>
      </Alert>
    </div>
  );
};
