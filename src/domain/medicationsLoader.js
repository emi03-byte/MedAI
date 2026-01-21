import Papa from 'papaparse'
import { API_BASE_URL } from '../config/env'
import { mapMedicationRowsToUi } from './medications'

let cachedUiRows = null
let cachedUiRowsPromise = null

const trimObjectKeysAndValues = (obj) => {
  if (!obj || typeof obj !== 'object') return {}
  const out = {}
  for (const [rawKey, rawValue] of Object.entries(obj)) {
    const key = typeof rawKey === 'string' ? rawKey.trim() : String(rawKey)
    if (!key) continue
    const value = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim()
    out[key] = value
  }
  return out
}

const normalizeCsvRow = (row) => {
  const cleaned = trimObjectKeysAndValues(row)

  // Handle potential BOM on the first header
  const denumireKey = Object.keys(cleaned).find((k) =>
    k.replace(/^\uFEFF/, '') === 'Denumire medicament'
  )

  if (denumireKey && denumireKey !== 'Denumire medicament') {
    cleaned['Denumire medicament'] = cleaned[denumireKey]
    delete cleaned[denumireKey]
  }

  return cleaned
}

const loadUiRowsFromCsv = async () => {
  const res = await fetch('/medicamente_cu_boli_COMPLET.csv', { cache: 'force-cache' })
  if (!res.ok) {
    throw new Error(`Nu am putut încărca CSV-ul (HTTP ${res.status})`)
  }

  const csvText = await res.text()

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  const data = Array.isArray(parsed.data) ? parsed.data : []
  const rows = data
    .map(normalizeCsvRow)
    .filter((r) => (r['Denumire medicament'] || '').length > 0)

  return rows
}

/**
 * Load all medications as UI-shaped rows.
 *
 * - Prefer backend API (SQLite) when available (local dev / deployed backend)
 * - Fallback to parsing `public/medicamente_cu_boli_COMPLET.csv` when backend is missing
 */
export async function loadAllMedicationsForUi() {
  if (cachedUiRows) return cachedUiRows
  if (cachedUiRowsPromise) return cachedUiRowsPromise

  cachedUiRowsPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/medications?limit=all`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      const items = Array.isArray(data.items) ? data.items : []
      const uiRows = mapMedicationRowsToUi(items)
      cachedUiRows = uiRows
      return uiRows
    } catch {
      const uiRows = await loadUiRowsFromCsv()
      cachedUiRows = uiRows
      return uiRows
    } finally {
      cachedUiRowsPromise = null
    }
  })()

  return cachedUiRowsPromise
}

