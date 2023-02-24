module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    overrides: [],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'communist-spelling'],
    rules: {
        'communist-spelling/communist-spelling': 'error',
        semi: ['error', 'always'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
    },
    ignorePatterns: ['.*'],
};
