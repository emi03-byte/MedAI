# API MedAI (Azure Functions)

Acest folder este deployat ca API pe Azure Static Web Apps. Rute disponibile:

- `GET /api/medications` – listă medicamente (query: `search`, `limit`, `offset`; `limit=all` pentru toate)
- `POST /api/openai/v1/chat/completions` – proxy OpenAI (pentru chat)

## Conectare la baza de date (Azure SQL)

Ca să meargă **GET /api/medications** în producție, trebuie setată conexiunea la Azure SQL:

1. Azure Portal → resursa ta **Static Web App** (ex. ashy-mud-055a0ce03)
2. **Configuration** → **Application settings**
3. Adaugă o setare:
   - **Name:** `AZURE_SQL_CONNECTION_STRING`
   - **Value:** connection string-ul tău, de forma:
     ```
     Server=medai01.database.windows.net;Database=MedAI;User Id=USER;Password=PASS;Encrypt=true;
     ```
     Sau cu Azure AD:
     ```
     Server=medai01.database.windows.net;Database=MedAI;Authentication=Active Directory Default;Encrypt=true;
     ```
4. Salvează (Save).

În baza Azure SQL trebuie să existe tabela **medications** cu coloanele folosite de backend-ul local (id, denumire_medicament, substanta_activa, cod_medicament, etc.). Poți crea tabela și popula datele din scriptul/CSV-ul folosit la backend.

## Build local (opțional)

```bash
cd api
npm install
```

Dependențele sunt instalate automat la deploy pe Azure.
