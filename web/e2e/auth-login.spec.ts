import { test, expect } from '@playwright/test';

test.describe('Strona logowania', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('powinna załadować stronę logowania', async ({ page }) => {
    // Sprawdź URL
    await expect(page).toHaveURL(/.*login/);
    
    // Sprawdź nagłówek
    const heading = page.getByRole('heading', { name: /Zaloguj się/i });
    await expect(heading).toBeVisible();
    
    // Sprawdź czy jest formularz logowania
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('powinna wyświetlać wszystkie elementy formularza', async ({ page }) => {
    // Sprawdź pola formularza
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const loginButton = page.getByRole('button', { name: /Zaloguj się/i });
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Sprawdź labele (używając selektora dla label)
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test('powinna walidować puste pola przez przeglądarkę', async ({ page }) => {
    // Kliknij przycisk logowania bez wypełnienia pól
    const loginButton = page.getByRole('button', { name: /Zaloguj się/i });
    await loginButton.click();
    
    // Sprawdź czy formularz nie został wysłany (nadal na stronie logowania)
    // HTML5 validation zatrzyma wysłanie formularza
    await expect(page).toHaveURL(/.*login/);
  });

  test('powinna mieć linki do rejestracji i resetowania hasła', async ({ page }) => {
    // Link do rejestracji
    const registerLink = page.getByRole('link', { name: /Załóż konto/i });
    await expect(registerLink).toBeVisible();
    
    // Link do resetowania hasła
    const resetLink = page.getByRole('link', { name: /Zresetuj hasło/i });
    await expect(resetLink).toBeVisible();
  });

  test('link do rejestracji powinien przekierowywać', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /Załóż konto/i });
    await registerLink.click();
    
    await expect(page).toHaveURL(/.*register/);
  });
});
