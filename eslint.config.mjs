import typescriptEslint from '@typescript-eslint/eslint-plugin';
import communistSpelling from 'eslint-plugin-communist-spelling';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// import js from '@eslint/js';
// import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: js.configs.recommended,
//   allConfig: js.configs.all,
// });

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    // plugins: {
    //   '@typescript-eslint': typescriptEslint,
    //   'communist-spelling': communistSpelling,
    //   'simple-import-sort': simpleImportSort,
    // },
    ignores: [
      '**/examples',
      '**/dist',
      '**/node_modules',
      '**/html',
      '**/scribe.config.ts',
      '**/public',
    ],
    languageOptions: {
      // globals: { ...globals.node },
      // // parser: tsParser,
      // ecmaVersion: 'latest',
      // sourceType: 'module',

      parserOptions: {
        // project: true,
        project: './tsconfig.json',
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    // rules: {
    //   '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
    //   '@typescript-eslint/no-misused-promises': 'error',
    //   '@typescript-eslint/promise-function-async': 'error',
    //   '@typescript-eslint/no-floating-promises': 'error',
    //   '@typescript-eslint/consistent-type-definitions': 'off',
    //   '@typescript-eslint/no-unused-vars': 'error',
    //   'array-bracket-spacing': ['error', 'never'],
    //   'communist-spelling/communist-spelling': 'error',
    //   'no-unused-vars': 'off',
    //   'object-curly-spacing': ['error', 'always'],
    //   semi: ['error', 'always'],
    //   'simple-import-sort/exports': 'error',
    //   'simple-import-sort/imports': 'error',
    // },
  },
);
