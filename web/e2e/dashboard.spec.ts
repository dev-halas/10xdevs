import { test, expect } from '@playwright/test';

test.describe('Dashboard - ochrona trasy', () => {
  test('powinien przekierować niezalogowanego użytkownika do logowania', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Poczekaj na przekierowanie (może być opóźnione przez AuthContext)
    await page.waitForTimeout(2000);
    
    // Sprawdź czy zostaliśmy przekierowani do strony logowania
    await expect(page).toHaveURL(/.*login/);
  });

  test('strona dashboard nie powinna być dostępna bez uwierzytelnienia', async ({ page }) => {
    // Próba bezpośredniego dostępu do dashboard
    await page.goto('/dashboard');
    
    // Poczekaj na potencjalne przekierowanie
    await page.waitForTimeout(2000);
    
    // Sprawdź czy nie widzimy treści dashboard (nie ma tekstu "Dashboard" w nagłówku)
    const dashboardHeading = page.getByRole('heading', { name: /^Dashboard$/i });
    
    // Używamy count() żeby sprawdzić czy element istnieje, bez rzucania błędu
    const count = await dashboardHeading.count();
    expect(count).toBe(0);
  });
});
