import React from "react";

export const GameHeader = ({ title }: { readonly title: string }) => (
  <div className="border-border border-b p-6">
    <h2 className="font-heading text-foreground text-3xl font-medium tracking-[-0.025em] uppercase">
      {title}
    </h2>
  </div>
);
