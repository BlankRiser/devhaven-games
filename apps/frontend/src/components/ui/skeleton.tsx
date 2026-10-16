import { cn } from "cn";

const Skeleton = ({
  className,
  ...properties
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse", className)}
      {...properties}
    />
  );
};

export { Skeleton };
