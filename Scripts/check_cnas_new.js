#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'
import { load as cheerioLoad } from 'cheerio'

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'medicamente.db')
const PAGE_URL = 'https://cnas.ro/lista-medicamente/'

if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found:', DB_PATH)
  process.exit(1)
}

const sqlite = sqlite3.verbose()
const db = new sqlite.Database(DB_PATH)

const fetchPage = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const normalizeHeaders = (r) => {
  const out = {}
  Object.keys(r).forEach(k => {
    out[k.trim()] = r[k]
    out[k.trim().toLowerCase()] = r[k]
  })
  return out
}

const pick = (r, candidates) => {
  for (const c of candidates) {
    if (r[c] && r[c].toString().trim() !== '') return r[c].toString().trim()
  }
  return ''
}

const mapRow = (raw) => {
  const r = normalizeHeaders(raw)
  return {
    denumire_medicament: pick(r, ['Denumire', 'Denumire medicament', 'denumire', 'denumire produs', 'denumire comercială']),
    substanta_activa: pick(r, ['Substanță activă', 'Substanta activa', 'substantă activă', 'substanța activă', 'substanta', 'substanta activa']),
    lista_compensare: pick(r, ['Lista de compensare', 'Lista compensare', 'lista compensare', 'lista de compensare']),
    cod_medicament: pick(r, ['Cod', 'Cod medicament', 'cod medicament', 'cod', 'cod produs']),
    forma_farmaceutica: pick(r, ['Formă', 'Formă farmaceutica', 'Formă farmaceutică', 'Forma farmaceutica', 'Forma']),
    cod_atc: pick(r, ['Cod ATC', 'Cod atc', 'cod atc', 'ATC']),
    mod_prescriere: pick(r, ['Mod de prescriere', 'Mod prescriere', 'mod de prescriere']),
    concentratie: pick(r, ['Concentrație', 'Concentratie', 'Concentrare']),
    forma_ambalare: pick(r, ['Formă de ambalare', 'Forma de ambalare', 'Ambalaj', 'Forma ambalare']),
    nume_detinator_app: pick(r, ['Nume deținător APP', 'Nume detinator APP', 'Nume detinator', 'Producator', 'Nume producator']),
    tara_detinator_app: pick(r, ['Țara deținător APP', 'Tara detinator APP', 'Tara']),
    cantitate_pe_forma_ambalare: pick(r, ['Cantitate', 'Cantitate pe forma ambalare', 'Cantitate per ambalare']),
    pret_max_forma_ambalare: pick(r, ['Preț', 'Preț maximal', 'Preț maximal al medicamentului raportat la forma de ambalare', 'Pret']),
    pret_max_ut: pick(r, ['Pret maximal al medicamentului raportat la UT', 'Pret UT', 'Pret maximal UT']),
    contributie_max_100: pick(r, ['Contribuție 100%', 'Contributie maxima 100', 'Contributie 100', 'Contributie max 100']),
    contributie_max_90_50_20: pick(r, ['Contribuție 90/50/20', 'Contributie 90', 'Contributie 90_50_20']),
    contributie_max_pensionari_90: pick(r, ['Contribuție pensionari 90', 'Contributie pensionari 90']),
    categorie_varsta: pick(r, ['Categorie vârstă', 'CategorieVarsta', 'CategorieVarsta', 'categorie varsta', 'Categorie']),
    coduri_boli: pick(r, ['Coduri boli', 'Coduri_Boli', 'coduri_boli', 'Boli'])
  }
}

const run = async () => {
  try {
    console.log('Fetching CNAS page...')
    const html = await fetchPage(PAGE_URL)
    const $ = cheerioLoad(html)
    const table = $('table').first()
    if (!table || table.length === 0) throw new Error('No table found')

    const headers = []
    table.find('thead tr').first().find('th').each((i, th) => headers.push($(th).text().trim()))
    if (headers.length === 0) {
      const firstTds = table.find('tbody tr').first().find('td')
      firstTds.each((i) => headers.push(`col${i}`))
    }

    const rawRows = []
    table.find('tbody tr').each((i, tr) => {
      const cols = $(tr).find('td')
      if (cols.length === 0) return
      const row = {}
      cols.each((j, td) => {
        const key = headers[j] || `col${j}`
        row[key] = $(td).text().trim()
      })
      rawRows.push(row)
    })

    const prepared = rawRows.map(mapRow)

    // Get existing codes and names from DB
    const existing = await new Promise((resolve, reject) => {
      db.all('SELECT cod_medicament, denumire_medicament FROM medications', (err, rows) => {
        if (err) reject(err); else resolve(rows)
      })
    })

    const existingCodes = new Set()
    const existingNames = new Set()
    existing.forEach(e => {
      if (e.cod_medicament) existingCodes.add(e.cod_medicament.toString().trim())
      if (e.denumire_medicament) existingNames.add(e.denumire_medicament.toString().toLowerCase().trim())
    })

    const newRows = []
    for (const r of prepared) {
      const code = (r.cod_medicament || '').toString().trim()
      const name = (r.denumire_medicament || '').toString().toLowerCase().trim()
      if (code && existingCodes.has(code)) continue
      if ((!code || code === '') && name && existingNames.has(name)) continue
      newRows.push(r)
    }

    console.log(`Total source rows: ${rawRows.length}`)
    console.log(`Prepared rows: ${prepared.length}`)
    console.log(`New rows (would be inserted): ${newRows.length}`)
    console.log('\nFirst 20 new rows (JSON):')
    console.log(JSON.stringify(newRows.slice(0,20), null, 2))

    db.close()
  } catch (err) {
    console.error('ERROR:', err.message)
    db.close()
    process.exit(1)
  }
}

// Use cheerio dynamically to avoid import error if not available
import('cheerio').then(({ load }) => {
  global.cheerioLoad = load
  // but we already imported above, proceed
}).catch(() => {})

run()
