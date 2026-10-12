import React from 'react';

export const GameHeader = ({ title }: { title: string }) => {
  return (
    <div className="border-b border-border p-6">
      <h2 className="font-heading text-3xl font-medium tracking-[-0.025em] text-foreground uppercase">
        {title}
      </h2>
    </div>
  );
};
