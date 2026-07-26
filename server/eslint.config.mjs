import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import typescriptEslint from 'typescript-eslint';

export default typescriptEslint.config(
  {
    ignores: ['coverage/**', 'dist/**', 'node_modules/**', '*.config.mjs'],
  },
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
);
