import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="grid h-full w-full flex-1 place-items-center p-6">
      <div className="flex flex-col items-center gap-2 border border-border bg-card p-8 text-center">
        <span className="text-xs leading-4 font-light tracking-widest text-muted-foreground uppercase">
          ERR // 404 MANIFEST MISSING
        </span>
        <h2 className="mt-1.5 font-heading text-[48px] leading-[48px] font-medium tracking-[-0.025em] uppercase">
          Not Found
        </h2>
        <p className="mt-2 text-xs leading-4 font-light text-muted-foreground">
          Could not locate the requested module in the shipping manifest.
        </p>
        <div className="mt-2 pt-2">
          <Button render={<Link href="/" />}>
            <ArrowLeftIcon data-icon="inline-start" />
            <span>Return to Manifest</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
