import React from 'react';

export const GameHeader = ({ title }: { title: string }) => {
  return (
    <div className="p-6 border-b border-b-neutral-200 dark:border-b-neutral-800">
      <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{title}</h2>
    </div>
  );
};
