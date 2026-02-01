import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja Playwright dla testów e2e aplikacji Next.js
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Uruchom testy równolegle */
  fullyParallel: true,
  
  /* Nie kontynuuj testów po błędzie w CI */
  forbidOnly: !!process.env.CI,
  
  /* Powtórz tylko nieudane testy w CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Liczba workerów */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter */
  reporter: 'html',
  
  /* Współdzielone ustawienia dla wszystkich projektów */
  use: {
    /* Bazowy URL aplikacji */
    baseURL: 'http://localhost:5000',
    
    /* Zbieraj ślady po nieudanych testach */
    trace: 'on-first-retry',
    
    /* Screenshot po błędzie */
    screenshot: 'only-on-failure',
  },

  /* Konfiguracja projektów przeglądarek */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Uruchom dev server przed rozpoczęciem testów */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
