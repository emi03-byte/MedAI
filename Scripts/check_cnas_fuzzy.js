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

const normalize = (s) => {
  if (!s) return ''
  return s.toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const levenshtein = (a, b) => {
  if (a === b) return 0
  const al = a.length, bl = b.length
  if (al === 0) return bl
  if (bl === 0) return al
  const v0 = new Array(bl + 1).fill(0)
  const v1 = new Array(bl + 1).fill(0)
  for (let j = 0; j <= bl; j++) v0[j] = j
  for (let i = 0; i < al; i++) {
    v1[0] = i + 1
    for (let j = 0; j < bl; j++) {
      const cost = a[i] === b[j] ? 0 : 1
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
    }
    for (let j = 0; j <= bl; j++) v0[j] = v1[j]
  }
  return v1[bl]
}

const pick = (r, candidates) => {
  for (const c of candidates) {
    if (r[c] && r[c].toString().trim() !== '') return r[c].toString().trim()
  }
  return ''
}

const mapRow = (raw, headers) => {
  const r = {}
  headers.forEach((h, i) => {
    r[h] = raw[h]
  })
  return {
    denumire_medicament: pick(r, ['Denumire', 'Denumire medicament', 'denumire', 'denumire produs', 'denumire comercială']),
    cod_medicament: pick(r, ['Cod', 'Cod medicament', 'cod medicament', 'cod', 'cod produs'])
  }
}

const run = async () => {
  try {
    const res = await fetch(PAGE_URL)
    if (!res.ok) throw new Error('Failed to fetch CNAS')
    const html = await res.text()
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

    const prepared = rawRows.map(r => mapRow(r, headers))

    const existing = await new Promise((resolve, reject) => {
      db.all('SELECT cod_medicament, denumire_medicament FROM medications', (err, rows) => {
        if (err) reject(err); else resolve(rows)
      })
    })

    const existingCodes = new Set()
    const existingNames = []
    existing.forEach(e => {
      if (e.cod_medicament) existingCodes.add(e.cod_medicament.toString().trim())
      if (e.denumire_medicament) existingNames.push(normalize(e.denumire_medicament))
    })

    const results = {
      total: prepared.length,
      byCode: 0,
      byNormalizedName: 0,
      byFuzzy: 0,
      unmatched: 0,
      fuzzySamples: []
    }

    for (const p of prepared) {
      const code = (p.cod_medicament || '').toString().trim()
      const name = (p.denumire_medicament || '').toString().trim()
      const nname = normalize(name)
      if (code && existingCodes.has(code)) { results.byCode += 1; continue }
      if (nname && existingNames.includes(nname)) { results.byNormalizedName += 1; continue }

      // fuzzy: compare only to existingNames with same first 3 chars or length within 3
      let matched = false
      const prefix = nname.slice(0,3)
      for (const en of existingNames) {
        if (Math.abs(en.length - nname.length) > 4) continue
        if (en.slice(0,3) !== prefix) continue
        const d = levenshtein(en, nname)
        const thresh = Math.max(1, Math.floor(Math.min(en.length, nname.length) * 0.2))
        if (d <= thresh) {
          matched = true
          results.byFuzzy += 1
          if (results.fuzzySamples.length < 20) results.fuzzySamples.push({cnas: name, existing: en, dist: d})
          break
        }
      }
      if (!matched) {
        results.unmatched += 1
      }
    }

    console.log(JSON.stringify(results, null, 2))
    if (results.fuzzySamples.length > 0) console.log('\nFuzzy samples:\n', JSON.stringify(results.fuzzySamples, null, 2))

    db.close()
  } catch (err) {
    console.error('ERROR:', err.message)
    db.close()
    process.exit(1)
  }
}

run()
