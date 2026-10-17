import core from "ultracite/eslint/core";
import next from "ultracite/eslint/next";
import react from "ultracite/eslint/react";
import tanstack from "ultracite/eslint/tanstack";
import tanstackTypeAware from "ultracite/eslint/tanstack/type-aware";
import typeAware from "ultracite/eslint/type-aware";

const frontendFiles = ["apps/frontend/**/*.{ts,tsx,js,jsx}"];
const withFrontendFiles = (configs) =>
  configs.map((config) => ({ ...config, files: frontendFiles }));

// eslint-disable-next-line unicorn/no-top-level-side-effects
export default [
  ...core,
  ...typeAware,
  ...withFrontendFiles(react),
  ...withFrontendFiles(tanstack),
  ...withFrontendFiles(tanstackTypeAware),
  ...withFrontendFiles(next),
  {
    files: frontendFiles,
    rules: {
      "arrow-body-style": "off",
      "react-doctor/use-lazy-motion": "off",
    },
    settings: {
      next: {
        rootDir: ["apps/frontend/"],
      },
    },
  },
  {
    files: ["apps/frontend/src/features/sudoku/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/naming-convention": "off",
      "complexity": "off",
      "no-bitwise": "off",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/too-many-break-or-continue-in-loop": "off",
    },
  },
  {
    files: ["apps/frontend/src/features/common/multiplayer/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "unicorn/consistent-class-member-order": "off",
      "unicorn/try-complexity": "off",
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
  {
    files: ["apps/backend/scripts/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/array-type": "off",
      "promise/avoid-new": "off",
      "sonarjs/max-union-size": "off",
      "sonarjs/pseudo-random": "off",
      "unicorn/consistent-boolean-name": "off",
      "unicorn/no-process-exit": "off",
      "unicorn/prefer-early-return": "off",
      "unicorn/prefer-error-is-error": "off",
      "unicorn/try-complexity": "off",
    },
  },
];
