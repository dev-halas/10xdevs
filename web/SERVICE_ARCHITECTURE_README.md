# 🏗️ Architektura Serwisów - Dokumentacja

Nowa architektura oparta na wydzielonych serwisach korzystających z czystego axios wrappera.

## 📁 Struktura plików

```
src/
├── utils/
│   └── api-client.ts          # Czysty axios wrapper
├── services/
│   ├── auth.service.ts        # Serwis autoryzacji
│   ├── companies.service.ts   # Serwis firm
│   └── users.service.ts       # Serwis użytkowników
├── contexts/
│   └── AuthContext.tsx        # Context używający serwisów
└── utils/
    └── companies-api.ts       # Kompatybilność wsteczna
```

## 🎯 Założenia nowej architektury

### 1. **Czysty axios wrapper** (`api-client.ts`)
- Tylko podstawowe metody HTTP (get, post, put, delete, patch)
- Automatyczna autoryzacja i odświeżanie tokenów
- Centralna obsługa błędów
- **BRAK endpointów biznesowych**

### 2. **Wydzielone serwisy** (`services/`)
- Każdy serwis odpowiada za konkretną domenę biznesową
- Łatwe testowanie i modyfikacja
- Czytelne API z typowaniem TypeScript
- Możliwość cachowania na poziomie serwisu

### 3. **Kompatybilność wsteczna**
- Istniejący kod (`companies-api.ts`) nadal działa
- Stopniowe wprowadzanie nowych serwisów

## 🚀 Nowe serwisy

### Auth Service (`auth.service.ts`)

```typescript
import { authService } from '../services/auth.service';

// Logowanie
const result = await authService.login({
  email: 'user@example.com',
  pin: '1234'
});

// Rejestracja
const user = await authService.register({
  email: 'new@example.com',
  phone: '+48123456789',
  pin: '1234'
});

// Wylogowanie
await authService.logout(refreshTokenId);

// Odświeżanie tokenu
const tokens = await authService.refreshToken({
  refreshTokenId: 'id',
  refreshToken: 'token'
});
```

### Companies Service (`companies.service.ts`)

```typescript
import { companiesService } from '../services/companies.service';

// Lista firm z paginacją
const result = await companiesService.getCompanies(1, 20);
console.log(result.companies); // Company[]
console.log(result.pagination); // Informacje o paginacji

// Konkretna firma
const company = await companiesService.getCompany('id');

// Tworzenie firmy
const newCompany = await companiesService.createCompany({
  name: 'Firma Sp. z o.o.',
  nip: '1234567890',
  regon: '123456789'
});

// Aktualizacja firmy
const updated = await companiesService.updateCompany('id', {
  name: 'Nowa nazwa'
});

// Usuwanie firmy
await companiesService.deleteCompany('id');
```

### Users Service (`users.service.ts`)

```typescript
import { usersService } from '../services/users.service';

// Profil użytkownika
const profile = await usersService.getUserProfile();

// Aktualizacja profilu
await usersService.updateUserProfile({
  phone: '+48987654321'
});

// Zmiana hasła
await usersService.changePassword({
  currentPin: '1234',
  newPin: '5678'
});
```

## 🔧 Czysty axios wrapper

### Podstawowe metody

```typescript
import { apiClient, ApiClient } from '../utils/api-client';

// Get
const data = await apiClient.get<User>('/users/profile');

// Post
const result = await apiClient.post<AuthTokens>('/auth/login', loginData);

// Put
const updated = await apiClient.put<Company>('/companies/123', updateData);

// Delete
await apiClient.delete<void>('/companies/123');

// Patch
const patched = await apiClient.patch<User>('/users/profile', partialData);
```

### Pełna odpowiedź z metadanymi

```typescript
// Metoda request() zwraca pełną odpowiedź API
const response = await apiClient.request<Company[]>({
  method: 'GET',
  url: '/companies?page=1&limit=10'
});

console.log(response.success); // boolean
console.log(response.data); // Company[]
console.log(response.meta?.pagination); // Informacje o paginacji
```

### Własna instancja

```typescript
// Stwórz własną instancję ApiClient
const customApiClient = new ApiClient('https://api.example.com');

const data = await customApiClient.get('/endpoint');
```

## 🔄 Migracja z starego kodu

### Przed migracją:
```typescript
// Stary kod korzystający z apiClient
const companies = await apiClient.getCompanies();
const logs = await apiClient.login(data);
```

### Po migracji:
```typescript
// Nowy kod korzystający z serwisów
const companies = await companiesService.getCompanies();
const logs = await authService.login(data);
```

### Kompatybilność wsteczna
```typescript
// Stary kod nadal działa poprzez companies-api.ts
import { companiesApi } from '../utils/companies-api';

const companies = await companiesApi.getCompanies(); // ✅ działa nadal
```

## 💡 Zalety nowej architektury

### ✅ **Separacja odpowiedzialności**
- Axios wrapper = komunikacji HTTP
- Serwisy = logika biznesowa
- Context = stan aplikacji

### ✅ **Łatwiejsze testowanie**
```typescript
// Testowanie serwiców w izolacji
import { companiesService } from '../services/companies.service';

// Mock apiClient dla testów
jest.mock('../utils/api-client');
```

### ✅ **Lepsze typowanie**
```typescript
// Każdy serwis ma dedykowane typy
interface CreateCompanyData {
  name: string;
  nip: string;
  regon: string;
}

const company = await companiesService.createCompany(data); // data jest typowane!
```

### ✅ **Skalowalność**
- Łatwe dodawanie nowych serwisów
- Możliwość cachowania na poziomie serwisu
- Możliwość dodania middleware'ów dla konkretnych serwisów

### ✅ **Debugging**
- Łatwe logowanie wszystkich requestów konkretnego serwisu
- Centralna obsługa błędów dla każdej domeny biznesowej

## 🔮 Future Enhancements

### Potencjalne rozszerzenia:

1. **Cache na poziomie serwisów**
```typescript
// companies.service.ts mógłby mieć swój własny cache
const cachedCompanies = await companiesService.getCompaniesCached();
```

2. **Batching requestów**
```typescript
// Możliwość łączenia wielu requestów
const [companies, users] = await Promise.all([
  companiesService.getCompanies(),
  usersService.getUsers()
]);
```

3. **Offline support**
```typescript
// Synchronizacja danych offline
const syncQueue = companiesService.getSyncQueue();
```

4. **Real-time updates**
```typescript
// WebSocket support dla konkretnych serwisów
companiesService.onCompanyUpdate(callback);
```

---

## 📞 Wsparcie

Nowa architektura zapewnia:
- **Łatwiejsze zarządzanie kodem**
- **Lepsze testowanie**
- **Czytelniejszą strukturę projektu**
- **Skalowalność na przyszłość**

Wszystkie istniejące komponenty działają bez zmian dzięki kompatybilności wstecznej w `companies-api.ts`.
