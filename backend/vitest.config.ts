import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/tests/**',
        '**/__tests__/**'
      ]
    },
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist']
  }
});
