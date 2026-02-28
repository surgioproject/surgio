import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import-x'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import globals from 'globals'

export default tseslint.config(
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'build/**',
      'test/asset/**',
      'docs/.vuepress/dist/**',
      'docs/.vuepress/.cache/**',
      'docs/.vuepress/.temp/**',
      'coverage/**',
      'node_modules/**',
      'examples/**',
      'hygen-template/**',
      // Root-level re-export files
      '*.js',
      '*.d.ts',
      // Config files at root
      '.prettierrc.js',
      'bump.config.ts',
    ],
  },

  // Base configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // TypeScript files configuration
  {
    files: ['src/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      'import-x': importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.eslint.json',
        },
        node: true,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      // Allow TypeScript re-export patterns
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      'import-x/order': [
        'error',
        {
          groups: [
            ['builtin', 'external', 'internal'],
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
        },
      ],
      'prettier/prettier': 'error',
    },
  },

  // Test files configuration (unit tests with ava)
  {
    files: ['test/**/*.ts', 'src/**/*.test.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      'import-x': importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.eslint.json',
        },
        node: true,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      'import-x/order': [
        'error',
        {
          groups: [
            ['builtin', 'external', 'internal'],
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
        },
      ],
      'prettier/prettier': 'error',
    },
  },

  // CLI test files (mocha)
  {
    files: ['test/**/*.cli-test.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.mocha,
      },
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      'import-x': importPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.eslint.json',
        },
        node: true,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'off',
      'import-x/order': [
        'error',
        {
          groups: [
            ['builtin', 'external', 'internal'],
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
        },
      ],
      'prettier/prettier': 'error',
    },
  },

  // JavaScript files configuration (without type-aware rules)
  {
    files: ['scripts/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      'import-x': importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import-x/order': [
        'error',
        {
          groups: [
            ['builtin', 'external', 'internal'],
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
        },
      ],
      'prettier/prettier': 'error',
    },
  },

  // Prettier must be last
  prettierConfig,
)
