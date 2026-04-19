import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import stylistic from '@stylistic/eslint-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      /* Formatting rules */
      '@stylistic/max-len': [ 
        'warn', 
        { 
          code: 150, 
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
          ignoreTrailingComments: true,
        }, 
      ],
      '@stylistic/indent': [ 'warn', 2 ],
      '@stylistic/quotes': [ 'warn', 'single' ],
      '@stylistic/comma-dangle': [ 'warn', 'always-multiline' ],
      '@stylistic/array-bracket-spacing': [ 'warn', 'always' ],
      '@stylistic/object-curly-spacing': [ 'warn', 'always' ],
      '@stylistic/jsx-closing-bracket-location': [ 
        'warn', { selfClosing: false, nonEmpty: 'after-props' } ],
    },
  },
];

export default eslintConfig;
