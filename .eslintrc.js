module.exports = {
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 8,
  },
  env: {
    es6: true,
    node: true
  },
  rules: {
    "array-bracket-spacing": 0,
    "comma-dangle": 0,
    "dot-notation": 0,
    "valid-jsdoc": 0
  }
};
