# System Zarządzania Firmami

---

## 📋 Spis treści

1. [Wizja produktu](#Wizja)
2. [Problem i rozwiązanie](#problem-i-rozwiązanie)
3. [Grupa docelowa](#grupa-docelowa)
4. [Funkcjonalności](#funkcjonalności)
5. [User Stories](#user-stories)
6. [Wymagania techniczne](#wymagania-techniczne)
7. [Architektura systemu](#architektura-systemu)
8. [Bezpieczeństwo](#bezpieczeństwo)
9. [Roadmap](#roadmap)
10. [Metryki sukcesu](#metryki-sukcesu)

---

## 🎯 Wizja

System Zarządzania Firmami to aplikacja webowa zaprojektowana dla polskich przedsiębiorców i księgowych, umożliwiająca efektywne zarządzanie danymi firm. Produkt oferuje prosty, bezpieczny i intuicyjny sposób na przechowywanie i zarządzanie podstawowymi danymi firmowymi z automatyczną walidacją polskich identyfikatorów biznesowych.

### Kluczowa wartość

> "Jeden system do zarządzania wszystkimi danymi firm Twoich klientów - prosty, bezpieczny i zgodny z polskimi standardami."

---

## 🔍 Problem i rozwiązanie

### Problem

Polscy przedsiębiorcy i księgowi potrzebują centralnego miejsca do:
- Przechowywania danych firm (NIP, REGON, nazwa)
- Szybkiego dostępu do informacji o firmach
- Walidacji poprawności danych identyfikacyjnych
- Zarządzania wieloma firmami w jednym miejscu

Tradycyjne rozwiązania (arkusze kalkulacyjne, notatki) są:
- ❌ Podatne na błędy
- ❌ Trudne w zarządzaniu przy większej liczbie firm
- ❌ Nie walidują danych automatycznie
- ❌ Nie są dostępne z różnych urządzeń

### Rozwiązanie

Nasza aplikacja oferuje:
- ✅ Automatyczną walidację NIP i REGON
- ✅ Centralne, bezpieczne przechowywanie danych
- ✅ Dostęp z dowolnego urządzenia przez przeglądarkę
- ✅ Prosty interfejs użytkownika
- ✅ Wieloużytkownikowy system z izolacją danych

---

## 👥 Grupa docelowa

### Primary personas

**1. Mały przedsiębiorca (Jan, 35 lat)**
- Prowadzi kilka działalności gospodarczych
- Potrzebuje mieć dane firm zawsze pod ręką
- Ceni prostotę i szybkość działania
- Korzysta głównie z laptopa i telefonu

**2. Księgowa (Anna, 42 lata)**
- Obsługuje 20-50 firm klientów
- Potrzebuje szybkiego dostępu do NIP/REGON klientów
- Wymaga pewności, że dane są poprawne
- Pracuje głównie na komputerze stacjonarnym

**3. Freelancer/Konsultant (Michał, 28 lat)**
- Współpracuje z wieloma firmami
- Potrzebuje katalog kontrahentów
- Ceni nowoczesne interfejsy
- Korzysta z różnych urządzeń

---

## ⚙️ Funkcjonalności

### 🔐 Moduł Autoryzacji

**Status:** ✅ Zaimplementowane

#### F1: Rejestracja użytkownika
- Formularz rejestracji z polami: email, telefon, hasło
- Walidacja unikalności email i telefonu
- Hashowanie hasła (bcrypt)
- Automatyczne utworzenie konta w bazie danych

#### F2: Logowanie użytkownika
- Logowanie przez email lub numer telefonu
- Weryfikacja hasła
- Generowanie JWT access token (15 min wygaśnięcia)
- Generowanie refresh token (7 dni wygaśnięcia)
- Przechowywanie refresh tokenów w Redis

#### F3: Odświeżanie tokenu
- Automatyczne odświeżanie access token przy wygaśnięciu
- Walidacja refresh token z Redis
- Generowanie nowego access token bez ponownego logowania
- Queue system dla równoczesnych requestów

#### F4: Wylogowanie
- Usunięcie refresh token z Redis
- Unieważnienie sesji użytkownika
- Czyszczenie tokenów po stronie klienta

---

### 🏢 Moduł Zarządzania Firmami

**Status:** ✅ Zaimplementowane (CRUD częściowo)

#### F5: Dodawanie firmy
- Formularz z polami: nazwa, NIP, REGON
- Automatyczna normalizacja danych (usuwanie spacji, myślników)
- Walidacja formatu NIP (10 cyfr)
- Walidacja formatu REGON (9 lub 14 cyfr)
- Weryfikacja unikalności NIP i REGON w systemie
- Przypisanie firmy do zalogowanego użytkownika

#### F6: Lista firm użytkownika
- Wyświetlenie wszystkich firm przypisanych do użytkownika
- Paginacja wyników (domyślnie 10 na stronę)
- Sortowanie według daty utworzenia (najnowsze pierwsze)
- Wyświetlanie: nazwa, NIP, REGON, data dodania
- Przycisk "Dodaj firmę"

#### F7: Szczegóły firmy
- Wyświetlenie pełnych informacji o firmie
- Dostęp tylko dla właściciela firmy
- Możliwość edycji danych (w roadmapie)
- Możliwość usunięcia firmy (w roadmapie)

#### F8: Kontrola dostępu
- Użytkownik widzi tylko swoje firmy
- Brak możliwości dostępu do firm innych użytkowników
- Walidacja właściciela przy każdym requestzie

---

### 📊 Moduł Dashboard

**Status:** ✅ Zaimplementowane

#### F9: Panel użytkownika
- Wyświetlenie informacji o zalogowanym użytkowniku (email, telefon, ID)
- Lista firm użytkownika
- Przycisk wylogowania
- Navigation między widokami

#### F10: Ochrona tras
- AuthGuard dla chronionych tras
- Automatyczne przekierowanie na /login dla niezalogowanych
- Sprawdzanie ważności tokenu
- Obsługa wygaśnięcia sesji

---

## 📝 User Stories

### Autoryzacja

**US-01: Rejestracja konta**
```
Jako nowy użytkownik
Chcę zarejestrować konto podając email, telefon i hasło
Aby móc korzystać z systemu
```
**Kryteria akceptacji:**
- Email musi być unikalny w systemie
- Telefon musi być unikalny w systemie
- Hasło musi zostać zahashowane
- Po rejestracji użytkownik otrzymuje potwierdzenie

**US-02: Logowanie do systemu**
```
Jako zarejestrowany użytkownik
Chcę zalogować się używając email/telefonu i hasła
Aby uzyskać dostęp do moich danych
```
**Kryteria akceptacji:**
- Mogę zalogować się używając email LUB telefonu
- System zwraca access token i refresh token
- Tokeny są automatycznie zapisane w localStorage
- Po logowaniu jestem przekierowany na dashboard

**US-03: Automatyczne odświeżanie sesji**
```
Jako zalogowany użytkownik
Chcę aby moja sesja była automatycznie odświeżana
Aby nie musieć logować się co 15 minut
```
**Kryteria akceptacji:**
- Po wygaśnięciu access token (15 min) system automatycznie go odświeża
- Odświeżanie jest transparentne dla użytkownika
- Sesja trwa 7 dni (ważność refresh token)

---

### Zarządzanie firmami

**US-04: Dodawanie firmy**
```
Jako przedsiębiorca/księgowa
Chcę dodać firmę podając nazwę, NIP i REGON
Aby móc zarządzać danymi firmy w systemie
```
**Kryteria akceptacji:**
- Formularz waliduje format NIP (10 cyfr)
- Formularz waliduje format REGON (9 lub 14 cyfr)
- System automatycznie usuwa spacje i myślniki z NIP/REGON
- NIP i REGON muszą być unikalne w całym systemie
- Po dodaniu firma pojawia się na mojej liście

**US-05: Przeglądanie listy firm**
```
Jako użytkownik z wieloma firmami
Chcę widzieć listę wszystkich moich firm
Aby szybko znaleźć potrzebne informacje
```
**Kryteria akceptacji:**
- Widzę tylko swoje firmy (nie widzę firm innych użytkowników)
- Lista jest paginowana (10 firm na stronę)
- Firmy są sortowane od najnowszych
- Dla każdej firmy widzę: nazwę, NIP, REGON, datę dodania

**US-06: Wyświetlanie szczegółów firmy**
```
Jako użytkownik
Chcę kliknąć na firmę i zobaczyć jej pełne informacje
Aby sprawdzić lub zweryfikować dane
```
**Kryteria akceptacji:**
- Kliknięcie na firmę pokazuje widok szczegółów
- Widzę wszystkie informacje: nazwa, NIP, REGON, daty
- Mogę wrócić do listy firm
- Nie mam dostępu do szczegółów firm innych użytkowników

**US-07: Izolacja danych między użytkownikami**
```
Jako użytkownik systemu
Chcę mieć pewność, że nikt inny nie widzi moich firm
Aby moje dane były prywatne i bezpieczne
```
**Kryteria akceptacji:**
- Każdy użytkownik widzi tylko swoje firmy
- API zwraca błąd 404 przy próbie dostępu do cudzej firmy
- Walidacja właściciela przy każdym requestzie

---

### Dashboard

**US-08: Panel główny**
```
Jako zalogowany użytkownik
Chcę mieć dashboard z przeglądem moich danych
Aby szybko zobaczyć status konta i firm
```
**Kryteria akceptacji:**
- Widzę informacje o moim koncie (email, telefon)
- Widzę listę moich firm
- Mam przycisk do wylogowania
- Mam przycisk do dodania nowej firmy

---

## 🛠️ Wymagania techniczne

### Backend

**Framework:** Fastify 5.6.1
- Szybki, nowoczesny framework Node.js
- Natywne wsparcie dla TypeScript
- Świetna wydajność

**Baza danych:** PostgreSQL
- Relacyjna baza danych
- ACID compliance
- Wsparcie dla złożonych zapytań

**ORM:** Prisma 6.16.3
- Type-safe database client
- Automatyczne migracje
- Intuicyjne API

**Cache/Session:** Redis (ioredis 5.4.1)
- Przechowywanie refresh tokenów
- Szybki dostęp do sesji
- TTL dla automatycznego czyszczenia

**Walidacja:** Zod 4.1.11
- Runtime validation
- Type inference
- Czytelne error messages

**Autoryzacja:**
- JWT (jsonwebtoken 9.0.2)
- bcrypt (bcryptjs 2.4.3) do hashowania haseł

**Bezpieczeństwo:**
- Helmet.js - security headers
- CORS - kontrola dostępu
- Cookie security

---

### Frontend

**Framework:** Next.js 15.5.4 (React 19.1.0)
- Server-side rendering
- File-based routing
- React Server Components

**HTTP Client:** Axios 1.12.2
- Automatyczne retry
- Interceptory dla tokenów
- Queue system dla refresh token

**Styling:** CSS Modules
- Scoped styles
- No external dependencies
- Lightweight

**State Management:**
- React Context API (AuthContext)
- Local component state

---

### DevOps

**Development:**
- TypeScript 5.9.2
- ts-node-dev dla hot reload
- dotenv dla zmiennych środowiskowych

**Database Management:**
- Prisma Migrate dla wersjonowania schematu
- Prisma Studio do przeglądania danych

**Konteneryzacja:**
- Docker Compose dla PostgreSQL i Redis
- Łatwe uruchomienie środowiska deweloperskiego

---

## Architektura systemu

### Architektura wysokiego poziomu

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│  Next.js 15 + React 19 (Port 5000)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Pages: /login, /register, /dashboard           │   │
│  │  Components: AuthGuard, CompaniesList           │   │
│  │  Context: AuthContext                           │   │
│  │  Services: auth, companies, users               │   │
│  │  Utils: api-client (axios wrapper)              │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST API
                       │ JSON
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                             │
│  Fastify 5.6 + TypeScript (Port 3000)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Routes: /api/auth, /api/companies              │   │
│  │  Controllers: Auth, Companies                   │   │
│  │  Services: AuthService                          │   │
│  │  Middlewares: auth (JWT verification)           │   │
│  │  Utils: Validators, Helpers, Error Handler      │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐   ┌──────────────────────┐
│    PostgreSQL        │   │       Redis          │
│  (Port 5432)         │   │    (Port 6379)       │
│                      │   │                      │
│  • Users             │   │  • Refresh Tokens    │
│  • Companies         │   │  • Sessions (TTL)    │
│  • Migrations        │   │                      │
└──────────────────────┘   └──────────────────────┘
```

---

### Backend - Architektura warstwowa

```
┌────────────────────────────────────────────────┐
│              ROUTES LAYER                       │
│  Define endpoints + attach middleware          │
│  /api/auth/*, /api/companies/*                 │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│           MIDDLEWARE LAYER                      │
│  • Authentication (JWT verify)                 │
│  • CORS, Helmet, Cookie                        │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│          CONTROLLERS LAYER                      │
│  Handle HTTP requests/responses                │
│  • AuthController                              │
│  • CompaniesController                         │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│           SERVICES LAYER                        │
│  Business logic                                │
│  • AuthService (register, login, refresh)      │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│        HELPERS/VALIDATORS LAYER                 │
│  • CompanyValidators (NIP, REGON)              │
│  • CompanyDataNormalizers                      │
│  • PaginationHelpers                           │
│  • ErrorFactory                                │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│            DATA ACCESS LAYER                    │
│  • Prisma Client (PostgreSQL)                  │
│  • Redis Client (ioredis)                      │
└────────────────────────────────────────────────┘
```

---

### Frontend - Architektura komponentowa

```
┌────────────────────────────────────────────────┐
│                  PAGES                          │
│  /login, /register, /dashboard                 │
│  • Server Components (when possible)           │
│  • Client Components (use client)              │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│            COMPONENTS LAYER                     │
│  Reusable UI components                        │
│  • AuthGuard (route protection)                │
│  • CompaniesList (list + pagination)           │
│  • CompanyDetails (detail view)                │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│            CONTEXT LAYER                        │
│  Global state management                       │
│  • AuthContext (user, login, logout)           │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│            SERVICES LAYER                       │
│  Domain-specific business logic                │
│  • authService (login, register, logout)       │
│  • companiesService (CRUD operations)          │
│  • usersService (profile management)           │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│            HTTP CLIENT LAYER                    │
│  • api-client.ts (axios wrapper)               │
│  • Automatic token refresh                     │
│  • Request/Response interceptors               │
│  • Error handling                              │
└────────────────────────────────────────────────┘
```

---

### Przepływ autoryzacji

```
┌──────────┐                  ┌──────────┐                ┌──────────┐
│          │   1. POST        │          │   2. Validate  │          │
│  Client  │──/auth/login────>│  Backend │───email/pass──>│  Prisma  │
│          │   {email, pass}  │          │                │          │
└────┬─────┘                  └────┬─────┘                └────┬─────┘
     │                             │                            │
     │                             │<──3. User found────────────┘
     │                             │
     │                             │   4. Generate JWT tokens
     │                             │      - Access token (15min)
     │                             │      - Refresh token (7d)
     │                             │
     │                             │   5. Store refresh in Redis
     │                             ├──────────────────────────────┐
     │                             │                              │
     │<──6. Return tokens──────────┤                              ▼
     │    {accessToken,            │                        ┌──────────┐
     │     refreshToken,           │                        │  Redis   │
     │     refreshTokenId}         │                        │  SET     │
     │                             │                        └──────────┘
     │   7. Save to localStorage   │
     └─────────────────────────────┘

     ┌─────────────────────────────┐
     │   8. Authenticated requests │
     │      Authorization: Bearer  │
     │      <access-token>         │
     └─────────────────────────────┘
```

---

### Przepływ odświeżania tokenu

```
┌──────────┐                  ┌──────────┐                ┌──────────┐
│          │   1. Request     │          │   2. Check     │          │
│  Client  │──with expired───>│  Backend │───token────────>│  Redis   │
│          │   access token   │          │   validity     │          │
└────┬─────┘                  └────┬─────┘                └────┬─────┘
     │                             │                            │
     │<──3. 401 Unauthorized────────┤                            │
     │                             │                            │
     │   4. Auto refresh           │                            │
     │   POST /auth/refresh        │                            │
     ├──{refreshToken,─────────────>│                            │
     │   refreshTokenId}           │                            │
     │                             │───5. Verify in Redis──────>│
     │                             │                            │
     │                             │<──6. Token valid───────────┘
     │                             │
     │                             │   7. Generate new access token
     │                             │
     │<──8. New access token────────┤
     │                             │
     │   9. Retry original request │
     ├─────────────────────────────>│
     │   with new token            │
     │                             │
     │<──10. Success response───────┤
     │                             │
```

---

## Bezpieczeństwo

### Implementowane mechanizmy

**1. Hashowanie haseł**
- Użycie bcrypt z saltem
- Brak przechowywania plaintext passwords
- Porównanie hashów przy logowaniu

**2. JWT Tokens**
- Access token: krótki czas życia (15 minut)
- Refresh token: dłuższy czas życia (7 dni)
- Podpisane tokenem secret
- Payload zawiera tylko user.id (minimalizacja danych)

**3. Refresh Token Security**
- Przechowywane w Redis (nie w JWT payload)
- TTL automatycznie usuwa wygasłe tokeny
- Invalidacja przy wylogowaniu
- Unikalny ID dla każdego tokenu

**4. Kontrola dostępu**
- Middleware weryfikuje JWT przy każdym protected request
- Walidacja właściciela zasobu (user może dostęp tylko do swoich firm)
- Error 401 dla unauthorized
- Error 404 zamiast 403 (ukrycie istnienia zasobu)

**5. Input Validation**
- Zod schema validation dla wszystkich inputów
- Sanitizacja danych (trim, remove special chars)
- Walidacja formatów (NIP, REGON, email, phone)
- Protection przeciw SQL injection (Prisma)

**6. HTTP Security Headers**
- Helmet.js dla podstawowych security headers
- CORS configuration
- Cookie security flags

**7. Rate Limiting**
- Planowane: ograniczenie liczby requestów per IP
- Planowane: throttling dla login attempts

---

## Roadmap

**Cel:** Podstawowa funkcjonalność systemu

- ✅ System autoryzacji (register, login, logout, refresh)
- ✅ CRUD dla firm (Create, Read)
- ✅ Walidacja NIP/REGON
- ✅ Dashboard użytkownika
- ✅ Izolacja danych między użytkownikami
- ✅ Responsive UI

---



## 🔧 Setup i Deployment

### Wymagania środowiskowe

**Backend:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=3000
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

### Uruchomienie lokalne

**1. Infrastruktura (PostgreSQL + Redis):**
```bash
cd apps/server
docker-compose up -d
```

**2. Backend:**
```bash
cd apps/server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run server  # Port 3000
```

**3. Frontend:**
```bash
cd apps/web
npm install
npm run dev  # Port 5000
```

**4. Dostęp:**
- Frontend: http://localhost:5000
- Backend API: http://localhost:3000/api
- Prisma Studio: `npm run prisma:studio`

---

## 📞 Kontakt i Wsparcie

**Product Owner:** 10xDevs Team  
**Tech Lead:** 10xDevs Team  
**Dokumentacja techniczna:** 
- `apps/web/API_CLIENT_README.md`
- `apps/web/SERVICE_ARCHITECTURE_README.md`

---

## 📄 Historia zmian

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | 2026-01-24 | Pierwsza wersja PRD - dokumentacja MVP |

---

## ✅ Podsumowanie

System Zarządzania Firmami to solidny MVP z pełną autoryzacją, zarządzaniem danymi firm i walidacją polskich identyfikatorów. Projekt jest gotowy do rozbudowy o testy, CI/CD i dodatkowe funkcjonalności zgodnie z roadmapą.

**Status MVP:** ✅ Gotowe do prezentacji  
**Gotowość do certyfikacji:** 50% (wymaga testów + CI/CD + finalizacja dokumentacji)

---

*Dokument będzie aktualizowany wraz z rozwojem produktu.*
