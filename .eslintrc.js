// eslint-disable-next-line no-undef
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  ignorePatterns: ['examples', 'dist', 'node_modules', 'html'],
  root: true,
  overrides: [],
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'communist-spelling', 'simple-import-sort'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'array-bracket-spacing': ['error', 'never'],
    'communist-spelling/communist-spelling': 'error',
    'no-unused-vars': 'off',
    'object-curly-spacing': ['error', 'always'],
    semi: ['error', 'always'],
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
  },
};
