"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";

const Switch = ({
  className,
  size = "default",
  ...properties
}: SwitchPrimitive.Root.Props & {
  readonly size?: "sm" | "default";
}) => (
  <SwitchPrimitive.Root
    data-slot="switch"
    data-size={size}
    className={cn(
      "peer group/switch focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary group-has-[:focus-visible]/field-label:data-checked:border-primary data-unchecked:border-input/50 data-unchecked:bg-input group-has-[:focus-visible]/field-label:data-unchecked:border-input/50 relative inline-flex shrink-0 items-center rounded-none border transition-all outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 aria-invalid:ring-2 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[size=default]:h-4.5 data-[size=default]:w-8.25 data-[size=sm]:h-3.5 data-[size=sm]:w-6.25",
      className
    )}
    {...properties}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className="bg-background dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground pointer-events-none block ring-0 transition-transform group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 data-checked:translate-x-[calc(100%+2px)] data-unchecked:translate-x-0.25"
    />
  </SwitchPrimitive.Root>
);

export { Switch };
