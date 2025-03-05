import { cn } from "@/lib/utils";

export const Cell = ({ children, isSelected = false, ...rest }: React.ComponentProps<'button'> & { isSelected: boolean }) => {
  return (
    <button
      className={cn([isSelected ? 'bg-zinc-100 dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-950', 'border rounded-md border-zinc-200 dark:border-zinc-800 size-15 md:size-40 grid place-items-center'])}
      {...rest}
    >
      {children}
    </button>
  );
};