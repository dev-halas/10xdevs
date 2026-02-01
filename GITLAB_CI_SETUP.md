# 🚀 GitLab CI/CD - Przewodnik Krok po Kroku

## 📋 Spis treści
1. [Przygotowanie projektu](#1-przygotowanie-projektu)
2. [Konfiguracja zmiennych w GitLabie](#2-konfiguracja-zmiennych-w-gitlabie)
3. [Push zmian do GitLaba](#3-push-zmian-do-gitlaba)
4. [Weryfikacja pipeline'u](#4-weryfikacja-pipelineu)
5. [Rozwiązywanie problemów](#5-rozwiązywanie-problemów)

---

## 1. Przygotowanie projektu

### ✅ Co już mamy:
- [x] Plik `.gitlab-ci.yml` utworzony w głównym katalogu
- [x] Testy jednostkowe i E2E
- [x] Skrypty npm w package.json

### 📝 Co zawiera pipeline:

```
┌─────────────┐
│  INSTALL    │  → Instalacja dependencies (server + web)
└──────┬──────┘
       │
┌──────▼──────┐
│   TEST      │  → Unit tests + E2E tests (backend + frontend)
└──────┬──────┘     ├─ test:backend:unit
       │            ├─ test:backend:e2e
       │            ├─ test:frontend:unit
       │            └─ test:frontend:e2e
┌──────▼──────┐
│   BUILD     │  → Build backend (TypeScript) + frontend (Next.js)
└──────┬──────┘
       │
┌──────▼──────┐
│   DEPLOY    │  → Deployment (manual, opcjonalny)
└─────────────┘
```

---

## 2. Konfiguracja zmiennych w GitLabie

### Krok 2.1: Przejdź do ustawień CI/CD

1. Otwórz swój projekt na **GitLab.com**
2. Z menu bocznego wybierz: **Settings** → **CI/CD**
3. Znajdź sekcję **Variables** i kliknij **Expand**

### Krok 2.2: Dodaj zmienne środowiskowe

Kliknij przycisk **Add variable** i dodaj następujące zmienne:

#### 🔐 Zmienne wymagane (dla testów):

| Key | Value | Protected | Masked | Notes |
|-----|-------|-----------|--------|-------|
| `DATABASE_URL` | `postgresql://test_user:test_password@postgres:5432/test_db` | ❌ | ❌ | URL bazy testowej |
| `REDIS_URL` | `redis://redis:6379` | ❌ | ❌ | URL Redis dla testów |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-me` | ✅ | ✅ | Klucz JWT (wygeneruj losowy) |
| `JWT_EXPIRES_IN` | `15m` | ❌ | ❌ | Czas życia access token |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | ❌ | ❌ | Czas życia refresh token |

#### 🌐 Zmienne dla produkcji (opcjonalne):

| Key | Value | Protected | Masked | Notes |
|-----|-------|-----------|--------|-------|
| `PRODUCTION_API_URL` | `https://api.yourapp.com` | ✅ | ❌ | URL produkcyjnego API |
| `PRODUCTION_DATABASE_URL` | `postgresql://user:pass@host:5432/prod_db` | ✅ | ✅ | Produkcyjna baza danych |
| `PRODUCTION_REDIS_URL` | `redis://prod-redis:6379` | ✅ | ✅ | Produkcyjny Redis |

### Krok 2.3: Generowanie bezpiecznego JWT_SECRET

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

**Git Bash / WSL:**
```bash
openssl rand -base64 64
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Skopiuj wygenerowany string i użyj go jako wartość dla `JWT_SECRET`.

---

## 3. Push zmian do GitLaba

### Krok 3.1: Sprawdź status git

```bash
cd D:\10xdevs\apps
git status
```

### Krok 3.2: Dodaj nowe pliki

```bash
git add .gitlab-ci.yml
git add GITLAB_CI_SETUP.md
```

### Krok 3.3: Zatwierdź zmiany (commit)

```bash
git commit -m "feat: Add GitLab CI/CD pipeline with tests and build stages"
```

### Krok 3.4: Wypchnij zmiany (push)

```bash
git push origin main
```

Lub jeśli pracujesz na innym branchu:
```bash
git push origin <nazwa-brancha>
```

---

## 4. Weryfikacja pipeline'u

### Krok 4.1: Sprawdź pipeline w GitLabie

1. Przejdź do swojego projektu na **GitLab.com**
2. Z menu bocznego wybierz: **CI/CD** → **Pipelines**
3. Powinieneś zobaczyć nowy pipeline z 4 etapami

### Krok 4.2: Monitoruj wykonanie

Pipeline będzie miał następujące etapy:

```
🔵 INSTALL
   ├─ install:server (Node.js dependencies)
   └─ install:web (Node.js dependencies)

🔵 TEST
   ├─ test:backend:unit (Vitest + PostgreSQL + Redis)
   ├─ test:backend:e2e (E2E tests)
   ├─ test:frontend:unit (Vitest + React Testing Library)
   └─ test:frontend:e2e (Playwright)

🔵 BUILD
   ├─ build:backend (TypeScript compilation)
   └─ build:frontend (Next.js build)

🔵 DEPLOY (manual)
   ├─ deploy:staging (optional)
   └─ deploy:production (optional)
```

### Krok 4.3: Sprawdź logi

Kliknij na dowolny job, aby zobaczyć szczegółowe logi:
- ✅ **Success** (zielony) - wszystko OK
- ❌ **Failed** (czerwony) - błąd, sprawdź logi
- ⏸️ **Manual** (niebieski) - wymaga ręcznego uruchomienia

---

## 5. Rozwiązywanie problemów

### ❌ Problem: "Permission denied" podczas instalacji

**Rozwiązanie:**
- Sprawdź, czy masz uprawnienia do projektu (Developer lub wyżej)
- Sprawdź ustawienia Runners w **Settings** → **CI/CD** → **Runners**

### ❌ Problem: Testy się nie uruchamiają

**Rozwiązanie:**
1. Sprawdź logi jobu
2. Upewnij się, że zmienne środowiskowe są poprawnie ustawione
3. Sprawdź czy serwisy (PostgreSQL, Redis) są dostępne

### ❌ Problem: Build timeout

**Rozwiązanie:**
- Zwiększ timeout w **Settings** → **CI/CD** → **General pipelines**
- Domyślnie: 60 minut (powinno wystarczyć)

### ❌ Problem: Cache nie działa

**Rozwiązanie:**
- Wyczyść cache: **CI/CD** → **Pipelines** → **Clear runner caches**
- Poczekaj na następny pipeline run

---

## 🎯 Następne kroki (opcjonalne)

### 1. **Dodaj badges do README**

```markdown
[![Pipeline Status](https://gitlab.com/your-username/your-project/badges/main/pipeline.svg)](https://gitlab.com/your-username/your-project/-/commits/main)
[![Coverage](https://gitlab.com/your-username/your-project/badges/main/coverage.svg)](https://gitlab.com/your-username/your-project/-/commits/main)
```

### 2. **Konfiguruj Merge Request pipelines**

**Settings** → **General** → **Merge requests**
- ✅ Enable "Pipelines must succeed" (blokada merge jeśli testy failują)

### 3. **Dodaj automatyczny deployment**

W pliku `.gitlab-ci.yml` usuń `when: manual` z sekcji deploy, aby automatycznie deployować po każdym pushu do `main`.

### 4. **Dodaj Slack/Discord notifications**

**Settings** → **Integrations** → Wybierz swój komunikator

---

## 📊 Sprawdź coverage

Po uruchomieniu pipeline'u możesz zobaczyć pokrycie testami:

1. **CI/CD** → **Pipelines** → Kliknij na pipeline
2. Znajdź job `test:backend:unit` lub `test:frontend:unit`
3. Kliknij **Coverage** w artifacts
4. Pobierz raport lub zobacz w GitLabie

---

## 🎉 Gratulacje!

Twój projekt ma teraz działające CI/CD! Każdy push będzie automatycznie:
- ✅ Instalował dependencies
- ✅ Uruchamiał testy (unit + E2E)
- ✅ Budował aplikację
- ✅ Sprawdzał jakość kodu

**Projekt jest teraz w 100% gotowy do certyfikacji 10xDevs!** 🚀

---

## 📞 Potrzebujesz pomocy?

- 📚 [GitLab CI/CD Docs](https://docs.gitlab.com/ee/ci/)
- 📚 [GitLab CI/CD Examples](https://docs.gitlab.com/ee/ci/examples/)
- 💬 [GitLab Community Forum](https://forum.gitlab.com/)

---

*Dokument utworzony: 2026-02-01*
