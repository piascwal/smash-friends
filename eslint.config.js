import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: { globals: globals.browser },
    rules: {
      // des fichiers courts, lisibles d'une traite
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 25],
      eqeqeq: 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-restricted-syntax': [
        'error',
        { selector: 'ExportDefaultDeclaration', message: 'Utilise un export nommé.' },
      ],
    },
  },
  {
    // la simulation ne dépend pas du navigateur : elle tourne aussi dans les tests et chez l'hôte réseau
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage'],
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: { 'max-lines-per-function': 'off' },
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
    rules: { 'no-restricted-syntax': 'off' },
  },
  prettier,
);
