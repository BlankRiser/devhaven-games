"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

const Collapsible = ({ ...properties }: CollapsiblePrimitive.Root.Props) => (
  <CollapsiblePrimitive.Root data-slot="collapsible" {...properties} />
);

const CollapsibleTrigger = ({
  ...properties
}: CollapsiblePrimitive.Trigger.Props) => {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      {...properties}
    />
  );
};

const CollapsibleContent = ({
  ...properties
}: CollapsiblePrimitive.Panel.Props) => {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      {...properties}
    />
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
