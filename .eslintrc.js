const { join } = require('path');

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: join(__dirname, 'tsconfig.eslint.json'),
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-var-requires': 0,
  },
};
