/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  ignorePatterns: [
    'dist',
    'dev-dist',
    'node_modules',
    '.eslintrc.cjs',
    'generate-icons.js',
    'postcss.config.js',
    'tailwind.config.js',
  ],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // This codebase carries a lot of untyped API responses (tracked as N5).
    // Warn so new code gets nudged, rather than failing the build on debt that
    // predates the config.
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],

    // Real bug classes — these stay errors.
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'smart'],
    'no-var': 'error',
    'prefer-const': 'error',
  },
};
