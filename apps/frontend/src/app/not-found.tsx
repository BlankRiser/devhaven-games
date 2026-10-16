import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// eslint-disable-next-line react/function-component-definition
export default function NotFound() {
  return (
    <div className="grid h-full w-full flex-1 place-items-center p-6">
      <div className="border-border bg-card flex flex-col items-center gap-2 border p-8 text-center">
        <span className="text-muted-foreground text-xs leading-4 font-light tracking-widest uppercase">
          ERR // 404 MANIFEST MISSING
        </span>
        <h2 className="font-heading mt-1.5 text-[48px] leading-[48px] font-medium tracking-[-0.025em] uppercase">
          Not Found
        </h2>
        <p className="text-muted-foreground mt-2 text-xs leading-4 font-light">
          Could not locate the requested module in the shipping manifest.
        </p>
        <div className="mt-2 pt-2">
          <Link href="/" className={buttonVariants({variant: 'default'})} >
            <ArrowLeftIcon data-icon="inline-start" />
            <span>Return to Manifest</span>
          </Link>
        </div>
      </div>
    </div>
  );
}