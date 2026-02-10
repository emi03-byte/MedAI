# Deploy MedAI: Frontend (Static Web Apps) + Backend Express (App Service)

Aplicația are două părți în producție:

1. **Frontend** (React) → Azure Static Web Apps (deja configurat)
2. **Backend** (Express) → Azure App Service (trebuie creat și configurat)

---

## 1. Backend pe Azure App Service

### 1.1 Creează Web App în Azure Portal

- **Resource**: App Service (Web App)
- **Runtime**: Node 20 LTS
- **Region**: aceeași ca pentru SQL (ex. West Europe)
- **Plan**: Basic B1 sau Free F1 (limitat)
- Notează **URL-ul** (ex. `https://medai-backend.azurewebsites.net`)

### 1.2 Configurare App Service

- **Configuration** → **Application settings** → **New application setting**
  - **Name**: `AZURE_SQL_CONNECTION_STRING`
  - **Value**: același connection string ca la Static Web App (Server=...;Database=MedAI;User Id=emi;Password=...;Encrypt=true;...)
- **Save**

### 1.3 Tabele în Azure SQL

În **Query editor** pe baza **MedAI** (cu firewall permis), rulează în ordine:

1. `api/scripts/create-medications-table.sql` (dacă nu există deja `medications`)
2. `api/scripts/create-all-tables-azure.sql` (users, retete, user_medicines)

### 1.4 Deploy din GitHub

- În App Service: **Deployment Center** → **GitHub** → autorizează și alege repo + branch `main`
- Sau folosește **GitHub Actions**:
  - În repo: **Settings** → **Secrets and variables** → **Actions**
  - Adaugă:
    - `AZURE_WEBAPP_NAME`: numele exact al App Service-ului (ex. `medai-backend`)
    - `AZURE_WEBAPP_PUBLISH_PROFILE`: conținutul fișierului descărcat din Azure Portal → App Service → **Get publish profile**
  - La push pe `main` (sau la modificări în `backend/`), workflow-ul `.github/workflows/azure-app-service-backend.yml` face deploy

După deploy, backend-ul rulează la: `https://<AZURE_WEBAPP_NAME>.azurewebsites.net` (ex. `/health`, `/api/auth/login`).

---

## 2. Frontend să folosească backend-ul

### 2.1 Secret în GitHub pentru URL backend

- **Settings** → **Secrets and variables** → **Actions**
- Adaugă:
  - **Name**: `VITE_API_BASE`
  - **Value**: URL-ul backend-ului **fără slash la final** (ex. `https://medai-backend.azurewebsites.net`)

La **build** pe Static Web Apps, frontend-ul va avea `API_BASE_URL` setat la acest URL, deci toate requesturile `/api/...` vor merge la Express pe App Service.

### 2.2 (Opțional) Dezactivează API-ul din Static Web Apps

Dacă vrei să folosești **doar** Express (nu și Azure Functions pentru medications/chat), poți lăsa `api_location` în workflow sau îl poți șterge – frontend-ul va apela doar `VITE_API_BASE`, deci doar Express. Dacă lași `api_location: "api"`, rutele `/api/medications` și `/api/openai/...` de pe domeniul Static Web App vor răspunde din Functions; dacă vrei totul pe Express, setezi `VITE_API_BASE` și poți elimina sau nu folosi Functions.

---

## 3. Rezumat

| Ce | Unde | Variabile / Secret |
|----|------|--------------------|
| Frontend | Static Web Apps | Build cu `VITE_API_BASE` (secret) |
| Backend  | App Service     | `AZURE_SQL_CONNECTION_STRING` (Application settings) |
| DB       | Azure SQL       | Tabele: medications, users, retete, user_medicines |

După ce ai creat App Service, ai setat `AZURE_SQL_CONNECTION_STRING`, ai rulat scripturile SQL și ai adăugat secretul `VITE_API_BASE`, la următorul push pe `main`:

- Frontend se deploy-ează pe Static Web Apps și folosește backend-ul de la `VITE_API_BASE`
- Backend se deploy-ează pe App Service (dacă ai configurat workflow-ul și secretele) și se conectează la Azure SQL

Testare: deschizi URL-ul Static Web App, te loghezi – requesturile de login merg la Express pe App Service.
