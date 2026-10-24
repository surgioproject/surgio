import eslint from '@eslint/js'
import eslintReact from '@eslint-react/eslint-plugin'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'coverage/**',
      'public/**',
      '**/*.js',
      '**/*.mjs',
      '**/*.mts',
      'src/libs/shadcn.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintReact.configs['recommended-typescript'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'react-hooks': reactHooksPlugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser, ...globals.es2020 },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_|^err',
          varsIgnorePattern: '^React$',
        },
      ],
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
  eslintConfigPrettier
)
