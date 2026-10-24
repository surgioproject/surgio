export function createBaseConfig(tsconfigPath: string, tsconfigRootDir: string, options?: {
    ignores?: string[] | undefined;
}): tseslint.FlatConfig.ConfigArray;
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
export { eslint, tseslint, eslintConfigPrettier, globals };
