# Testy E2E - Playwright

## Opis

Testy end-to-end dla aplikacji Next.js wykorzystujące Playwright.

## Struktura testów

- `homepage.spec.ts` - Testy strony głównej
- `auth-login.spec.ts` - Testy strony logowania
- `auth-register.spec.ts` - Testy strony rejestracji
- `dashboard.spec.ts` - Testy dashboardu i autoryzacji

## Uruchamianie testów

### Wszystkie testy
```bash
npm run test:e2e
```

### W trybie interaktywnym (UI)
```bash
npm run test:e2e:ui
```

### Tylko wybrana przeglądarka
```bash
npx playwright test --project=chromium
```

### Konkretny plik testowy
```bash
npx playwright test e2e/homepage.spec.ts
```

### W trybie debug
```bash
npx playwright test --debug
```

## Raporty

Po uruchomieniu testów, raport HTML jest dostępny w:
```bash
npx playwright show-report
```

## Konfiguracja

Konfiguracja znajduje się w pliku `playwright.config.ts`:
- Port: 5000 (dopasowany do Next.js dev server)
- Przeglądarka: Chromium (Desktop Chrome)
- Automatyczne uruchamianie dev servera przed testami
- Screenshots przy błędach
- Trace przy powtórzeniach testów

## Rozszerzanie testów

### Dodawanie nowego testu
1. Utwórz nowy plik `*.spec.ts` w katalogu `e2e/`
2. Import Playwright test i expect:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Napisz testy używając `test.describe()` i `test()`

### Przykład testu
```typescript
import { test, expect } from '@playwright/test';

test.describe('Moja funkcjonalność', () => {
  test('powinien zrobić coś', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Expected Title/);
  });
});
```

## Najlepsze praktyki

1. **Używaj semantic selectors** - `getByRole`, `getByLabel`, `getByText`
2. **Czekaj na elementy** - Playwright automatycznie czeka, ale możesz użyć `waitForLoadState`
3. **Izoluj testy** - Każdy test powinien być niezależny
4. **Używaj beforeEach** - Do wspólnego setup'u dla grupy testów
5. **Nazywaj testy opisowo** - Jasne nazwy ułatwiają debug

## Dodatkowe przeglądarki

Aby dodać więcej przeglądarek (Firefox, Safari):

1. Zainstaluj przeglądarki:
   ```bash
   npx playwright install firefox webkit
   ```

2. Dodaj do `playwright.config.ts`:
   ```typescript
   projects: [
     { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
     { name: 'webkit', use: { ...devices['Desktop Safari'] } },
   ]
   ```

## Troubleshooting

### Dev server się nie uruchamia
- Sprawdź czy port 5000 jest wolny
- Zweryfikuj czy `npm run dev` działa poprawnie

### Testy timeout'ują
- Zwiększ timeout w `playwright.config.ts`
- Sprawdź czy aplikacja poprawnie się buduje

### Selektory nie działają
- Użyj Playwright Inspector: `npx playwright test --debug`
- Sprawdź strukturę DOM w przeglądarce
