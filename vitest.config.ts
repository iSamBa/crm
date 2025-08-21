import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'tests/e2e/**/*',
      'playwright-tests/**/*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/not-found.tsx',
        'src/components/ui/**', // shadcn/ui components
        'next.config.ts',
        'tailwind.config.js',
        'postcss.config.mjs'
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})