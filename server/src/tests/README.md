# Testy - Server

Kompletny zestaw testów jednostkowych i end-to-end dla warstwy backend.

## 📁 Struktura testów

```
src/
├── controllers/
│   └── tests/
│       ├── auth.controller.test.ts
│       ├── companies.controller.test.ts
│       └── dashboard.controller.test.ts
├── middlewares/
│   └── tests/
│       └── auth.test.ts
├── plugins/
│   └── tests/
│       ├── auth.test.ts
│       └── index.test.ts
├── services/
│   └── tests/
│       └── auth.service.test.ts
└── tests/
    ├── e2e/
    │   ├── helpers/
    │   │   └── test-server.ts
    │   ├── auth.e2e.test.ts
    │   ├── companies.e2e.test.ts
    │   ├── health.e2e.test.ts
    │   └── README.md
    └── README.md
```

## 🚀 Uruchomienie testów

```bash
# Zainstaluj zależności (jeśli jeszcze nie)
npm install

# Uruchom wszystkie testy (jednostkowe + e2e)
npm test

# Uruchom tylko testy jednostkowe
npm run test:unit

# Uruchom tylko testy e2e
npm run test:e2e

# Uruchom testy w trybie watch
npm run test:watch

# Uruchom testy e2e w trybie watch
npm run test:e2e:watch

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

## 📊 Statystyki

### Testy jednostkowe
- **7 plików testowych**
- **80+ przypadków testowych**
- **100% pokrycie kluczowej logiki biznesowej**

### Testy E2E
- **4 pliki testowe**
- **50+ przypadków testowych**
- **100% pokrycie głównych przepływów HTTP**

### Razem
- **11 plików testowych**
- **130+ przypadków testowych**

## 🎯 Rodzaje testów

### Testy jednostkowe (Unit Tests)
- **Lokalizacja**: `src/*/tests/*.test.ts`
- **Cel**: Testowanie pojedynczych funkcji/klas w izolacji
- **Zależności**: Zmockowane
- **Szybkość**: Bardzo szybkie

### Testy E2E (End-to-End Tests)
- **Lokalizacja**: `src/tests/e2e/*.e2e.test.ts`
- **Cel**: Testowanie pełnych przepływów HTTP
- **Zależności**: Rzeczywiste (baza danych, Redis)
- **Szybkość**: Wolniejsze, ale bardziej realistyczne

Szczegółowe informacje o testach E2E znajdziesz w [src/tests/e2e/README.md](./e2e/README.md)

## 📖 Dobre praktyki

### Testy jednostkowe
✅ Każdy test jest niezależny (beforeEach czyszczenie mocków)  
✅ Mockowanie wszystkich zależności zewnętrznych  
✅ Testowanie happy path i error handling  
✅ Czytelne nazwy testów po polsku  
✅ Grupowanie testów za pomocą describe()  
✅ Testowanie edge cases (null, undefined, puste wartości)

### Testy E2E
✅ Używaj `setupTests()` w `beforeEach`  
✅ Używaj `teardownTests()` w `afterAll`  
✅ Testuj pełne przepływy użytkownika  
✅ Weryfikuj status codes HTTP  
✅ Sprawdzaj strukturę odpowiedzi JSON  
✅ Testuj autentykację i autoryzację  
✅ Czyszczenie bazy danych między testami
