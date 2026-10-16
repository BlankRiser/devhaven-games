import { cn } from "cn";
import * as React from "react";

const Card = ({
  className,
  size = "default",
  ...properties
}: React.ComponentProps<"div"> & { readonly size?: "default" | "sm" }) => {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card border-border bg-card text-card-foreground flex flex-col gap-(--card-spacing) overflow-hidden border py-(--card-spacing) text-xs [--card-spacing:--spacing(5)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none",
        className
      )}
      {...properties}
    />
  );
};

const CardHeader = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-none px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...properties}
    />
  );
};

const CardTitle = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-2xl leading-none font-medium tracking-[-0.025em] uppercase",
        className
      )}
      {...properties}
    />
  );
};

const CardDescription = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-muted-foreground text-xs leading-4 font-light",
        className
      )}
      {...properties}
    />
  );
};

const CardAction = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...properties}
    />
  );
};

const CardContent = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...properties}
    />
  );
};

const CardFooter = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-(--card-spacing) [.border-t]:pt-(--card-spacing)",
        className
      )}
      {...properties}
    />
  );
};

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
