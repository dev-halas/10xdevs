import { test, expect } from '@playwright/test';

test.describe('Strona główna', () => {
  test('powinna załadować stronę główną', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź czy strona się załadowała
    await expect(page).toHaveTitle('Create Next App');
    
    // Sprawdź czy jest nagłówek
    const heading = page.getByRole('heading', { name: /Witaj w aplikacji/i });
    await expect(heading).toBeVisible();
  });

  test('powinna wyświetlać główne elementy strony', async ({ page }) => {
    await page.goto('/');
    
    // Poczekaj na załadowanie zawartości
    await page.waitForLoadState('domcontentloaded');
    
    // Sprawdź tekst powitalny
    const welcomeText = page.getByText(/Zaloguj się lub zarejestruj, aby kontynuować/i);
    await expect(welcomeText).toBeVisible();
    
    // Sprawdź sekcję status API
    const apiStatus = page.getByRole('heading', { name: /Status API/i });
    await expect(apiStatus).toBeVisible();
  });

  test('powinna mieć działające linki nawigacyjne', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź czy istnieją linki do logowania i rejestracji
    const loginLink = page.getByRole('link', { name: /Zaloguj się/i });
    const registerLink = page.getByRole('link', { name: /Zarejestruj się/i });
    
    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
  });

  test('linki powinny przekierowywać do odpowiednich stron', async ({ page }) => {
    await page.goto('/');
    
    // Kliknij link do logowania
    const loginLink = page.getByRole('link', { name: /Zaloguj się/i });
    await loginLink.click();
    
    // Sprawdź przekierowanie
    await expect(page).toHaveURL(/.*login/);
  });
});
