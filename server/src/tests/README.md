# Testy Jednostkowe - Server

Kompletny zestaw testów jednostkowych dla warstwy backend.

## Struktura testów

```
src/
├── middlewares/
│   └── __tests__/
│       └── auth.test.ts
├── plugins/
│   └── __tests__/
│       ├── auth.test.ts
│       └── index.test.ts
└── services/
    └── __tests__/
        └── auth.service.test.ts
```

## Uruchomienie testów

```bash
# Zainstaluj zależności (jeśli jeszcze nie)
npm install

# Uruchom wszystkie testy
npm test

# Uruchom testy w trybie watch
npm run test:watch

# Uruchom testy z pokryciem kodu
npm run test:coverage
```

## Pokrycie testów

### 🔒 Middlewares (middlewares/auth.test.ts)

**AuthMiddleware:**
- ✅ `requireAuth` - przepuszcza zalogowanych użytkowników
- ✅ `requireAuth` - blokuje niezalogowanych użytkowników
- ✅ `requireAuth` - obsługa błędnych danych (user bez ID)
- ✅ `requireAdmin` - działa jak `requireAuth` (przygotowane na przyszłe role)

**AuthUtils:**
- ✅ `isAuthenticated` - sprawdza czy użytkownik jest zalogowany
- ✅ `getUserId` - zwraca ID użytkownika lub null
- ✅ `requireUserId` - zwraca ID lub rzuca błąd

### 🔌 Plugins

#### plugins/auth.test.ts

**AuthHelpers:**
- ✅ `extractBearerToken` - wyciąga token z nagłówka Authorization
- ✅ `extractBearerToken` - obsługa nieprawidłowych formatów
- ✅ `extractBearerToken` - case-insensitive dla "Bearer"
- ✅ `verifyToken` - weryfikuje prawidłowy token
- ✅ `verifyToken` - sprawdza blacklistę tokenów
- ✅ `verifyToken` - obsługa nieprawidłowych/wygasłych tokenów
- ✅ `setUserContext` - ustawia kontekst użytkownika w żądaniu

**registerAuthPlugin:**
- ✅ Rejestruje hook preHandler
- ✅ Ustawia kontekst dla prawidłowego tokena
- ✅ Pomija żądania bez tokena (publiczne endpointy)
- ✅ Nie ustawia kontekstu dla nieprawidłowego tokena

#### plugins/index.test.ts

**registerPlugins:**
- ✅ Rejestruje helmet z opcją global
- ✅ Rejestruje cors z origin i credentials
- ✅ Rejestruje cookie plugin

### 🛠️ Services (services/auth.service.test.ts)

**AuthService:**

**register:**
- ✅ Pomyślna rejestracja nowego użytkownika
- ✅ Walidacja danych wejściowych
- ✅ Haszowanie hasła
- ✅ Normalizacja email i telefonu

**login:**
- ✅ Logowanie przez email
- ✅ Logowanie przez telefon
- ✅ Weryfikacja hasła
- ✅ Generowanie tokenów (access + refresh)
- ✅ Błąd gdy użytkownik nie istnieje
- ✅ Błąd gdy hasło jest nieprawidłowe

**logout:**
- ✅ Wylogowanie z revokacją refresh tokena
- ✅ Obsługa braku userId
- ✅ Obsługa braku refreshTokenId

**refresh:**
- ✅ Pomyślne odświeżenie tokenów
- ✅ Dodanie starego access tokena do blacklisty
- ✅ Revokacja starego refresh tokena
- ✅ Generowanie nowych tokenów
- ✅ Błąd gdy brak userId
- ✅ Błąd gdy refresh token jest nieprawidłowy
- ✅ Opcjonalna blacklista (gdy brak oldAccessToken)

## Technologie

- **Vitest** - szybki i nowoczesny framework testowy
- **vi.mock()** - mockowanie zależności (prisma, redis, jwt, etc.)
- **TypeScript** - pełna obsługa typów w testach

## Statystyki

- **4 pliki testowe**
- **50+ przypadków testowych**
- **100% pokrycie kluczowej logiki biznesowej**

## Dobre praktyki

✅ Każdy test jest niezależny (beforeEach czyszczenie mocków)  
✅ Mockowanie wszystkich zależności zewnętrznych  
✅ Testowanie happy path i error handling  
✅ Czytelne nazwy testów po polsku  
✅ Grupowanie testów za pomocą describe()  
✅ Testowanie edge cases (null, undefined, puste wartości)
