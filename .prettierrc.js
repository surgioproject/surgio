export default {
  semi: false,
  useTabs: false,
  tabWidth: 2,
  trailingComma: 'all',
  singleQuote: true,
  bracketSpacing: true,
  overrides: [
    {
      files: [
        'packages/eslint-config-surgio/**',
        'packages/gateway/**',
        'packages/gateway-frontend/**',
        'packages/logger/**',
      ],
      options: { trailingComma: 'es5' },
    },
  ],
}
