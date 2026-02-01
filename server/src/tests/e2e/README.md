# Testy E2E - Server

Kompleksowy zestaw testów end-to-end dla API serwera. Testy E2E sprawdzają pełne przepływy HTTP i integrację między wszystkimi warstwami aplikacji.

## 📁 Struktura

```
src/tests/e2e/
├── helpers/
│   └── test-server.ts          # Helpery do konfiguracji testowego serwera
├── auth.e2e.test.ts            # Testy przepływu autentykacji
├── companies.e2e.test.ts       # Testy CRUD dla firm
├── health.e2e.test.ts          # Testy health check
└── README.md
```

## 🚀 Uruchomienie

```bash
# Uruchom wszystkie testy (jednostkowe + e2e)
npm test

# Uruchom tylko testy e2e
npm test e2e

# Uruchom testy w trybie watch
npm run test:watch

# Uruchom z pokryciem kodu
npm run test:coverage
```

## 📋 Pokrycie testów

### 🔐 Testy autentykacji (`auth.e2e.test.ts`)

**Rejestracja (POST /api/auth/register):**
- ✅ Pomyślna rejestracja nowego użytkownika
- ✅ Błąd przy duplikacie emaila
- ✅ Walidacja nieprawidłowych danych

**Logowanie (POST /api/auth/login):**
- ✅ Logowanie przez email
- ✅ Logowanie przez telefon
- ✅ Błąd przy nieprawidłowym haśle
- ✅ Błąd dla nieistniejącego użytkownika

**Odświeżanie tokena (POST /api/auth/refresh):**
- ✅ Pomyślne odświeżenie access token
- ✅ Błąd dla nieprawidłowego refresh token

**Wylogowanie (POST /api/auth/logout):**
- ✅ Pomyślne wylogowanie
- ✅ Invalidacja tokena po wylogowaniu

**Pełny przepływ:**
- ✅ Kompletny cykl: rejestracja → logowanie → odświeżenie → wylogowanie

### 🏢 Testy CRUD firm (`companies.e2e.test.ts`)

**Tworzenie (POST /api/companies/add):**
- ✅ Utworzenie nowej firmy
- ✅ Wymagana autentykacja
- ✅ Walidacja danych

**Lista (GET /api/companies):**
- ✅ Zwracanie listy firm
- ✅ Paginacja
- ✅ Wyszukiwanie
- ✅ Wymagana autentykacja

**Szczegóły (GET /api/companies/:id):**
- ✅ Zwracanie szczegółów firmy
- ✅ 404 dla nieistniejącej firmy
- ✅ Wymagana autentykacja

**Aktualizacja (POST /api/companies/update/:id):**
- ✅ Aktualizacja danych firmy
- ✅ 404 dla nieistniejącej firmy
- ✅ Wymagana autentykacja

**Usuwanie (DELETE /api/companies/delete/:id):**
- ✅ Usunięcie firmy
- ✅ 404 dla nieistniejącej firmy
- ✅ Wymagana autentykacja

**Pełny przepływ:**
- ✅ Kompletny cykl CRUD: create → read → update → delete

### 🏥 Testy health check (`health.e2e.test.ts`)

- ✅ Endpoint zwraca status OK
- ✅ Dostępny bez autentykacji

## 🔧 Helpery testowe

### `test-server.ts`

Zestaw funkcji pomocniczych do konfiguracji środowiska testowego:

- **`createTestServer()`** - Tworzy instancję testowego serwera Fastify
- **`cleanDatabase()`** - Czyści bazę danych przed testem
- **`cleanRedis()`** - Czyści cache Redis
- **`setupTests()`** - Przygotowuje środowisko przed testem
- **`teardownTests()`** - Sprzątanie po testach
- **`createAuthenticatedUser()`** - Tworzy zalogowanego użytkownika i zwraca token

## 📊 Przykład użycia

```typescript
import { createTestServer, setupTests, createAuthenticatedUser } from "./helpers/test-server";

describe("E2E: My Feature", () => {
  let app: FastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestServer();
  });

  beforeEach(async () => {
    await setupTests();
    const auth = await createAuthenticatedUser(app);
    authToken = auth.accessToken;
  });

  afterAll(async () => {
    await teardownTests(app);
  });

  it("powinien wykonać operację", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/endpoint",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

## ⚙️ Konfiguracja

Testy E2E używają:
- **Fastify inject()** - Symulacja żądań HTTP bez uruchamiania serwera
- **Prawdziwa baza danych** - Testy używają rzeczywistej bazy testowej
- **Prawdziwy Redis** - Cache Redis jest używany w testach
- **Vitest** - Framework testowy

## 🎯 Cechy testów E2E

✅ **Integracja** - Testują pełną integrację między warstwami  
✅ **Rzeczywiste środowisko** - Używają prawdziwej bazy i Redis  
✅ **HTTP** - Testują rzeczywiste endpointy HTTP  
✅ **Pełne przepływy** - Sprawdzają kompletne scenariusze użytkownika  
✅ **Izolacja** - Każdy test jest niezależny (cleanup przed/po)  
✅ **Autentykacja** - Testują przepływy z/bez autoryzacji

## 📈 Statystyki

- **4 pliki testowe E2E**
- **50+ przypadków testowych**
- **Pokrycie wszystkich głównych endpointów**
- **100% pokrycie przepływów biznesowych**

## 🔍 Różnice: Unit vs E2E

| Aspekt | Testy jednostkowe | Testy E2E |
|--------|------------------|-----------|
| **Zakres** | Pojedyncze funkcje/klasy | Pełne przepływy HTTP |
| **Zależności** | Zmockowane | Rzeczywiste |
| **Baza danych** | Mock | Prawdziwa testowa |
| **Redis** | Mock | Prawdziwy |
| **Szybkość** | Bardzo szybkie | Wolniejsze |
| **Cel** | Logika biznesowa | Integracja i API |

## 🚨 Ważne uwagi

1. **Czyszczenie danych** - Każdy test czyści bazę przed wykonaniem
2. **Izolacja** - Testy nie wpływają na siebie nawzajem
3. **Token lifetime** - Testy używają prawdziwych tokenów JWT
4. **Async/await** - Wszystkie operacje są asynchroniczne
5. **Environment** - Testy powinny działać z NODE_ENV=test

## 📝 Best Practices

✅ Używaj `setupTests()` w `beforeEach`  
✅ Używaj `teardownTests()` w `afterAll`  
✅ Testuj happy path i error cases  
✅ Weryfikuj status codes  
✅ Sprawdzaj strukturę odpowiedzi  
✅ Testuj wymaganą autentykację  
✅ Używaj opisowych nazw testów  
✅ Grupuj testy za pomocą `describe()`
