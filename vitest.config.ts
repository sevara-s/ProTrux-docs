import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 15000,
    // Resolve workspace package deps (pnpm isolates apps/server/node_modules)
    server: {
      deps: {
        moduleDirectories: [
          'node_modules',
          path.resolve(__dirname, 'apps/server/node_modules'),
          path.resolve(__dirname, 'apps/web/node_modules'),
        ],
      },
    },
  },
  resolve: {
    preserveSymlinks: false,
  },
});
