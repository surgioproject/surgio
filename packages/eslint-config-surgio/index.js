import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: ['**/*.d.{ts,mts,cts}', '**/*.tsx'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.es2025,
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      'array-bracket-spacing': 'off',
      'comma-dangle': 'off',
      'dot-notation': 'off',
      'valid-jsdoc': 'off',
      'no-unused-vars': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      eqeqeq: ['error', 'allow-null'],
    },
  },
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parser: tseslint.parser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration:not([declare=true])',
          message:
            'TypeScript enums require transformation and cannot be run by Node.js type stripping.',
        },
        {
          selector: 'TSModuleDeclaration:not([declare=true])',
          message:
            'TypeScript namespaces require transformation and cannot be run by Node.js type stripping.',
        },
        {
          selector: 'TSParameterProperty',
          message:
            'TypeScript parameter properties require transformation and cannot be run by Node.js type stripping.',
        },
        {
          selector: 'TSImportEqualsDeclaration',
          message:
            'TypeScript import aliases require transformation and cannot be run by Node.js type stripping.',
        },
        {
          selector: 'Decorator',
          message: 'Decorators are not supported by Node.js 22.',
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,mts}'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.cts'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.commonjs,
      },
    },
  },
]

export default config
export { config as 'module.exports' }
