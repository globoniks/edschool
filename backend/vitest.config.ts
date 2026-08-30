import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Source uses NodeNext-style `./foo.js` specifiers that actually point at
    // `./foo.ts`. Rewrite relative .js imports so Vite resolves the TS source.
    alias: [{ find: /^(\.{1,2}\/.*)\.js$/, replacement: '$1.ts' }],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Each file gets a clean module registry so mocked modules don't leak.
    restoreMocks: true,
  },
});
