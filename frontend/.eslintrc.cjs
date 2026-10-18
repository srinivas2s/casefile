module.exports = {
  root: true,
  ignorePatterns: ['dist'],
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      env: {
        browser: true,
        es2022: true,
        node: true,
      },
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
  ],
};
