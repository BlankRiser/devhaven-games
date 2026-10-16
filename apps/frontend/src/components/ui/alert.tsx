import { cva } from "class-variance-authority";
import { cn } from "cn";
import * as React from "react";
import type { VariantProps } from "class-variance-authority";

const alertVariants = cva(
  "group/alert border-border bg-card relative grid w-full gap-1 border px-4 py-3 text-left text-xs tracking-wide has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "border-destructive/50 bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = ({
  className,
  variant,
  ...properties
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) => {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...properties}
    />
  );
};

const AlertTitle = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "[&_a]:hover:text-foreground text-sm font-semibold group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3",
        className
      )}
      {...properties}
    />
  );
};

const AlertDescription = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...properties}
    />
  );
};

const AlertAction = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2.5 right-3", className)}
      {...properties}
    />
  );
};

export { Alert, AlertTitle, AlertDescription, AlertAction };
