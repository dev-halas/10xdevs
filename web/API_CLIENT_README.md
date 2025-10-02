# 📡 Axios API Client Wrapper

Zaawansowany wrapper dla axios z automatyczną autoryzacją, odświeżaniem tokenów i obsługą błędów.

## 🚀 Instalacja

Axios został już zainstalowany w projekcie:
```bash
npm install axios  # ✅ Już zainstalowane
```

## 📚 Użycie podstawowe

### Importowanie
```typescript
import { apiClient } from '../utils/api-client';
// lub
import { apiClient, type Company, type User } from '../utils/api-client';
```

### Autoryzacja

#### Logowanie
```typescript
async function loginUser() {
  try {
    const result = await apiClient.login({
      email: 'user@example.com',
      pin: '1234'
    });
    
    // Tokeny są automatycznie zapisane w localStorage
    console.log('Zalogowano:', result.user);
  } catch (error) {
    console.error('Błąd logowania:', error);
  }
}
```

#### Rejestracja
```typescript
async function registerUser() {
  try {
    const user = await apiClient.register({
      email: 'newuser@example.com',
      phone: '+48123456789',
      pin: '1234'
    });
    
    console.log('Zarejestrowano:', user);
  } catch (error) {
    console.error('Błąd rejestracji:', error);
  }
}
```

#### Wylogowanie
```typescript
async function logoutUser() {
  await apiClient.logout();
  // Dane zostają automatycznie wyczyszczone
}
```

### Zarządzanie firmami

#### Pobieranie listy firm z paginacją
```typescript
async function getCompaniesList() {
  try {
    const result = await apiClient.getCompanies(1, 20); // strona 1, 20 elementów
    
    console.log('Firmy:', result.companies);
    console.log('Paginacja:', result.pagination);
  } catch (error) {
    console.error('Błąd pobierania firm:', error);
  }
}
```

#### Tworzenie firmy
```typescript
async function createNewCompany() {
  try {
    const company = await apiClient.createCompany({
      name: 'Moje Przedsiębiorstwo Sp. z o.o.',
      nip: '1234567890',
      regon: '123456789'
    });
    
    console.log('Utworzono firmę:', company);
  } catch (error) {
    console.error('Błąd tworzenia firmy:', error);
  }
}
```

#### Aktualizacja firmy
```typescript
async function updateCompany(companyId: string) {
  try {
    const updatedCompany = await apiClient.updateCompany(companyId, {
      name: 'Nowa nazwa firmy',
      // Można aktualizować tylko niektóre pola
    });
    
    console.log('Zaktualizowano:', updatedCompany);
  } catch (error) {
    console.error('Błąd aktualizacji:', error);
  }
}
```

#### Usuwanie firmy
```typescript
async function deleteCompany(companyId: string) {
  try {
    await apiClient.deleteCompany(companyId);
    console.log('Firma została usunięta');
  } catch (error) {
    console.error('Błąd usuwania:', error);
  }
}
```

### Zarządzanie użytkownikami

#### Profil użytkownika
```typescript
async function getUserProfile() {
  try {
    const profile = await apiClient.getUserProfile();
    console.log('Profil:', profile);
  } catch (error) {
    console.error('Błąd pobierania profilu:', error);
  }
}
```

#### Zmiana hasła
```typescript
async function changeUserPassword() {
  try {
    await apiClient.changePassword({
      currentPin: '1234',
      newPin: '5678'
    });
    
    console.log('Hasło zostało zmienione');
  } catch (error) {
    console.error('Błąd zmiany hasła:', error);
  }
}
```

## 🎯 Użycie w komponentach React

### Z AuthContext
```typescript
import { useAuth } from '../contexts/AuthContext';

function LoginForm() {
  const { login, user, isAuthenticated } = useAuth();
  
  const handleLogin = async (email: string, pin: string) => {
    try {
      await login({ email, pin });
      console.log('Zalogowano!');
    } catch (error) {
      console.error('Błąd:', error);
    }
  };
  
  if (isAuthenticated) {
    return <div>Witaj {user?.email}!</div>;
  }
  
  return <button onClick={() => handleLogin('user@test.com', '1234')}>
    Zaloguj się
  </button>;
}
```

### Bezpośrednie użycie w komponencie
```typescript
import { apiClient, type Company } from '../utils/api-client';

function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const result = await apiClient.getCompanies();
        setCompanies(result.companies);
      } catch (error) {
        console.error('Błąd pobierania firm:', error);
      }
    };
    
    fetchCompanies();
  }, []);
  
  return (
    <div>
      {companies.map(company => (
        <div key={company.id}>
          <h3>{company.name}</h3>
          <p>NIP: {company.nip}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Konfiguracja

### Zmiana bazowego URL
Zmodyfikuj wartość `API_BASE_URL` w `src/utils/api-client.ts`:
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
// Zmień na:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
```

### Timeout
Domyślnie timeout to 30 sekund, można zmienić w konstruktorze:
```typescript
this.axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Zmień tutaj czas timeout
});
```

## 🛠️ Funkcje zaawansowane

### Automatyczne odświeżanie tokenów
- Wrapper automatycznie wykrywa błędy 401
- Próbuje odświeżyć token używając refresh token
- Jeśli odświeżanie się uda, ponawia oryginalny request
- Jeśli się nie uda, przekierowuje do `/login`

### Queue system
- Podczas odświeżania tokenu inne requesty czekają w kolejce
- Oszczędza niepotrzebne wywołania refresh
- Ułatwia synchronizację wielu równoczesnych żądań

### Centralna obsługa błędów
- Wszystkie błędy są konwertowane na Error objects
- Jednolite formatowanie komunikatów błędów
- Automatyczne parsowanie odpowiedzi API

## 📊 Typy TypeScript

Wszystkie typy są już zdefiniowane w `api-client.ts`:

```typescript
interface Company {
  id: string;
  name: string;
  nip: string;
  regon: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  phone: string;
}

interface AuthTokens {
  token: string;
  refreshToken: string;
  refreshTokenId: string;
}
```

## 🔍 Debugging

### Sprawdzanie stanu autoryzacji
```typescript
// W przeglądarce:
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
console.log('User:', localStorage.getItem('user'));
```

### Monitoring requestów
Axios wrapper automatycznie loguje błędy do konsoli. Możesz też dodać własne logowanie:

```typescript
// Przed wywołaniem requestu
console.log('Making request to:', endpoint);

try {
  const result = await apiClient.getCompanies();
  console.log('Success:', result);
} catch (error) {
  console.error('Request failed:', error);
}
```

## 🚨 Najczęstsze problemy

### 1. Błąd "Brak uprawnień"
- Sprawdź czy token jest obecny w localStorage
- Upewnij się że serwer działa na odpowiednim porcie
- Sprawdź czy endpoint wymaga autoryzacji

### 2. Requesty nie działają po logowaniu
- Sprawdź czy tokeny zostały zapisane w localStorage
- Sprawdź czy w network tab jest właściwy Authorization header

### 3. Automatyczne przekierowanie na login
- Wrapper automatycznie przekierowuje gdy token jest nieważny
- Jest to normalne zachowanie gdy refresh token wygasł

---

## 📞 Wsparcie

W przypadku problemów sprawdź:
1. Czy serwer działa na portach 3000 (API) i 5000 (frontend)
2. Czy wszystkie endpointy API są dostępne
3. Czy tokeny są prawidłowo zapisywane w localStorage

Możesz też sprawdzić przykłady użycia w `src/utils/api-examples.ts`.
