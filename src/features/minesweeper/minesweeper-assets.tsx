import * as React from 'react';
import { cn } from '@/lib/utils';

type CellProps = React.ComponentProps<'button'> & { isSelected: boolean };

export const Cell = ({ children, isSelected = false, className, ...rest }: CellProps) => {
  return (
    <button
      className={cn(
        isSelected ? 'bg-zinc-100 dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-950',
        'border rounded-md border-zinc-200 dark:border-zinc-800 size-8 md:size-10 grid place-items-center text-sm font-medium',
        className,
      )}
      {...rest}>
      {children}
    </button>
  );
};
