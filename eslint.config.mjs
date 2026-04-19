import stylistic from '@stylistic/eslint-plugin';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig =  [
  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'external',
            'builtin',
            'internal',
            'sibling',
            'parent',
            'index',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: false,
          },
        },
      ],
      '@stylistic/max-len': [ 'warn', {
        code: 150,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreRegExpLiterals: true,
        ignoreComments: true,
        ignoreTrailingComments: true,
      } ],
      '@stylistic/indent': [ 'warn', 2 ],
      '@stylistic/quotes': [ 'warn', 'single' ],
      '@stylistic/comma-dangle': [ 'warn', 'always-multiline' ],
      '@stylistic/array-bracket-spacing': [ 'warn', 'always' ],
      '@stylistic/object-curly-spacing': [ 'warn', 'always' ],
      '@stylistic/jsx-closing-bracket-location': [
        'warn',
        { selfClosing: false, nonEmpty: 'after-props' },
      ],
    },
  },

  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig