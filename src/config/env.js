// Pentru Azure Static Web Apps, API-urile sunt disponibile la /api/... (relative)
// Pentru development local, folosim localhost:3001 (Express backend)
// Dacă VITE_API_BASE este setat explicit, îl folosim
export const API_BASE_URL = import.meta.env.VITE_API_BASE || 
  (import.meta.env.DEV ? 'http://localhost:3001' : '')

export const IS_DEV = !!import.meta.env.DEV

