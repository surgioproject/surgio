import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Base ESLint flat config for TypeScript packages (gateway, logger)
 * @param {string} tsconfigPath - Path to tsconfig.eslint.json
 * @param {string} tsconfigRootDir - Root directory for tsconfig resolution (use import.meta.dirname)
 * @param {object} options - Additional options
 * @param {string[]} [options.ignores] - Additional patterns to ignore
 */
export function createBaseConfig(tsconfigPath, tsconfigRootDir, options = {}) {
  const ignores = [
    'node_modules/**',
    'dist/**',
    'build/**',
    '**/*.js',
    '**/*.mjs',
    '**/*.mts',
    '**/*.cts',
    ...(options.ignores || []),
  ];

  return tseslint.config(
    { ignores },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.ts'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: tsconfigPath,
          tsconfigRootDir,
          sourceType: 'module',
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
    eslintConfigPrettier,
  );
}

export { eslint, tseslint, eslintConfigPrettier, globals };
