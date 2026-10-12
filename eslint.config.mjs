import core from "ultracite/eslint/core";
import typeAware from "ultracite/eslint/type-aware";
import react from "ultracite/eslint/react";
import tanstack from "ultracite/eslint/tanstack";
import tanstackTypeAware from "ultracite/eslint/tanstack/type-aware";
import next from "ultracite/eslint/next";

export default [
  ...core,
  ...typeAware,
  ...react,
  ...tanstack,
  ...tanstackTypeAware,
  ...next,
];
