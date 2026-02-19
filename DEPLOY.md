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

**Dacă „Get publish profile” dă „Basic authentication is disabled”**, folosești Azure Login. Ai nevoie de 2 secrete în GitHub: `AZURE_WEBAPP_NAME` și `AZURE_CREDENTIALS`. Pașii detaliați sunt mai jos.

---

#### Pas cu pas: AZURE_CREDENTIALS (Service Principal)

**Pas 1 – Deschizi Microsoft Entra ID**

- În **Azure Portal** (portal.azure.com), în bara de search de sus scrii: **Microsoft Entra ID** (sau **Azure Active Directory**).
- Apeși pe rezultatul **Microsoft Entra ID** (serviciu, nu „tenant”).

**Pas 2 – Creezi o aplicație (App registration)**

- În meniul din stânga apeși **App registrations**.
- Apeși **+ New registration**.
- **Name**: ex. `MedAI-GitHub`.
- **Supported account types**: lasă „Accounts in this organizational directory only”.
- **Redirect URI**: lasi gol.
- Apeși **Register**.

**Pas 3 – Copiezi Application (client) ID și Directory (tenant) ID**

- Ești pe pagina aplicației. În **Overview** vezi:
  - **Application (client) ID** → asta e **clientId** (copiezi și îl păstrezi).
  - **Directory (tenant) ID** → asta e **tenantId** (copiezi și îl păstrezi).

**Pas 4 – Creezi un client secret**

- În meniul din stânga apeși **Certificates & secrets**.
- La **Client secrets** apeși **+ New client secret**.
- **Description**: ex. `GitHub Actions`.
- **Expires**: ex. 24 months.
- Apeși **Add**.
- La **Value** (coloana din tabel) apeși pe **Copy** – asta e **clientSecret**. Îl copiezi acum; nu se mai arată niciodată după ce închizi pagina.

**Pas 5 – Găsești Subscription ID**

- În bara de search de sus scrii: **Subscriptions**.
- Apeși pe **Subscriptions**.
- Apeși pe subscription-ul tău (cel folosit pentru App Service).
- Copiezi **Subscription ID** – asta e **subscriptionId**.

**Pas 6 – Dai aplicației drepturi pe Resource Group**

- În search scrii **Resource groups** și intri.
- Apeși pe resource group-ul în care e App Service-ul tău (ex. unde e „medai-backend”).
- În stânga apeși **Access control (IAM)**.
- Apeși **+ Add** → **Add role assignment**.
- Tab **Role**: cauți și alegi **Contributor** → **Next**.
- La **Members**: **+ Select members**.
- În search scrii numele aplicației (ex. `MedAI-GitHub`), o selectezi → **Select** → **Review + assign**.

**Pas 7 – Compui JSON-ul AZURE_CREDENTIALS**

- Deschizi Notepad și scrii pe **un singur rând** (înlocuiești cu valorile tale):

```
{"clientId":"COLEAZA_AICI_APPLICATION_CLIENT_ID","clientSecret":"COLEAZA_AICI_VALUE_DE_LA_CLIENT_SECRET","subscriptionId":"COLEAZA_AICI_SUBSCRIPTION_ID","tenantId":"COLEAZA_AICI_DIRECTORY_TENANT_ID"}
```

- Înlocuiești cele 4 zone cu valorile copiate (fără spații în plus, fără ghilimele în plus).
- Copiezi tot rândul.

**Pas 8 – Adaugi secretele în GitHub**

- Repo-ul tău → **Settings** → **Secrets and variables** → **Actions**.
- **New repository secret**:
  - **Name**: `AZURE_WEBAPP_NAME`  
    **Value**: numele exact al App Service-ului (ex. `medai-backend-gbazexfhdjdufxgk` – îl vezi în Overview la App Service sau în URL).
- **New repository secret**:
  - **Name**: `AZURE_CREDENTIALS`  
    **Value**: lipești JSON-ul din Notepad (tot rândul).

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
