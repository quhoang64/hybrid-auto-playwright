import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Playwright rules — áp dụng cho test files
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
  },

  // Setup files không cần assertions
  {
    files: ['tests/**/*.setup.ts'],
    rules: {
      'playwright/expect-expect': 'off',
    },
  },

  // Rules chung cho toàn project
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // Prettier phải để cuối — tắt các rules conflict với formatting
  prettier,

  // Bỏ qua các thư mục không cần lint
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'dist/'],
  },
);
