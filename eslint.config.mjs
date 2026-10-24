import {
  eslint,
  tseslint,
  eslintConfigPrettier,
  globals,
} from './eslint.config.base.mjs'

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,mts,cts,js,mjs,cjs}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: 'module',
        project: null,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node, ...globals.es2020 },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  eslintConfigPrettier
)
