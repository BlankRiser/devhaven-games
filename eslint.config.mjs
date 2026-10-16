import core from "ultracite/eslint/core";
import typeAware from "ultracite/eslint/type-aware";
import react from "ultracite/eslint/react";
import tanstack from "ultracite/eslint/tanstack";
import tanstackTypeAware from "ultracite/eslint/tanstack/type-aware";
import next from "ultracite/eslint/next";

export default [
  ...core,
  ...typeAware,
  ...react.map((config) => ({
    ...config,
    files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
  })),
  ...tanstack.map((config) => ({
    ...config,
    files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
  })),
  ...tanstackTypeAware.map((config) => ({
    ...config,
    files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
  })),
  ...next.map((config) => ({
    ...config,
    files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
  })),
  {
    files: ["apps/frontend/**/*.{ts,tsx,js,jsx}"],
    settings: {
      next: {
        rootDir: ["apps/frontend/"],
      },
    },
  },
  {
    files: ["apps/backend/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/class-methods-use-this": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "arrow-body-style": "off",
      "unicorn/consistent-class-member-order": "off",
      "unicorn/no-invalid-response-options": "off",
      "unicorn/no-top-level-side-effects": "off",
    },
  },
];
