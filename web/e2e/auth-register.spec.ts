import { test, expect } from '@playwright/test';

test.describe('Strona rejestracji', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('powinna załadować stronę rejestracji', async ({ page }) => {
    // Sprawdź URL
    await expect(page).toHaveURL(/.*register/);
    
    // Sprawdź nagłówek
    const heading = page.getByRole('heading', { name: /Załóż konto/i });
    await expect(heading).toBeVisible();
    
    // Sprawdź czy jest formularz rejestracji
    const emailInput = page.locator('#email');
    const phoneInput = page.locator('#phone');
    const passwordInput = page.locator('#password');
    const confirmInput = page.locator('#confirm');
    
    await expect(emailInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmInput).toBeVisible();
  });

  test('powinna wyświetlać wszystkie wymagane pola', async ({ page }) => {
    // Sprawdź wszystkie pola formularza
    const emailInput = page.locator('#email');
    const phoneInput = page.locator('#phone');
    const passwordInput = page.locator('#password');
    const confirmInput = page.locator('#confirm');
    const registerButton = page.getByRole('button', { name: /Załóż konto/i });
    
    await expect(emailInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmInput).toBeVisible();
    await expect(registerButton).toBeVisible();
    
    // Sprawdź labele
    await expect(page.getByText('E‑mail')).toBeVisible();
    await expect(page.getByText('Telefon')).toBeVisible();
    await expect(page.getByText('Hasło', { exact: true })).toBeVisible();
    await expect(page.getByText('Powtórz hasło')).toBeVisible();
  });

  test('powinna walidować zgodność haseł', async ({ page }) => {
    const emailInput = page.locator('#email');
    const phoneInput = page.locator('#phone');
    const passwordInput = page.locator('#password');
    const confirmInput = page.locator('#confirm');
    const registerButton = page.getByRole('button', { name: /Załóż konto/i });
    
    // Wypełnij formularz z różnymi hasłami
    await emailInput.fill('test@example.com');
    await phoneInput.fill('+48123456789');
    await passwordInput.fill('Password123!');
    await confirmInput.fill('DifferentPassword123!');
    await registerButton.click();
    
    // Sprawdź czy pojawił się komunikat o błędzie
    const errorMessage = page.getByText(/Hasła nie są takie same/i);
    await expect(errorMessage).toBeVisible();
  });

  test('powinna walidować siłę hasła', async ({ page }) => {
    const emailInput = page.locator('#email');
    const phoneInput = page.locator('#phone');
    const passwordInput = page.locator('#password');
    const confirmInput = page.locator('#confirm');
    const registerButton = page.getByRole('button', { name: /Załóż konto/i });
    
    // Wypełnij formularz ze słabym hasłem
    await emailInput.fill('test@example.com');
    await phoneInput.fill('+48123456789');
    await passwordInput.fill('weak');
    await confirmInput.fill('weak');
    await registerButton.click();
    
    // Sprawdź czy pojawił się komunikat o błędzie (używamy getByText zamiast getByRole)
    const errorMessage = page.getByText(/Hasło musi zawierać/i);
    await expect(errorMessage).toBeVisible();
  });

  test('powinna mieć link do logowania', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /Zaloguj się/i });
    await expect(loginLink).toBeVisible();
    
    // Sprawdź przekierowanie
    await loginLink.click();
    await expect(page).toHaveURL(/.*login/);
  });
});
