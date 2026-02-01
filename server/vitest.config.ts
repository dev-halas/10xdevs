import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Uruchom testy e2e sekwencyjnie, aby uniknąć konfliktów w bazie danych
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.d.ts',
        'prisma/',
      ],
    },
  },
});
