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

const fetchPage = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const pickName = (raw, headers) => {
  // try common header names
  const keys = headers.map(h => h.trim())
  const candidates = ['Denumire', 'Denumire medicament', 'denumire', 'denumire produs', 'denumire comercială']
  for (const c of candidates) {
    const idx = keys.findIndex(k => k.toLowerCase() === c.toLowerCase())
    if (idx >= 0) return raw[idx]
  }
  // fallback: first column
  return raw[0]
}

const run = async () => {
  try {
    const html = await fetchPage(PAGE_URL)
    const $ = cheerioLoad(html)
    const table = $('table').first()
    if (!table || table.length === 0) throw new Error('No table found')

    // build headers array
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
      const values = []
      cols.each((j, td) => values.push($(td).text().trim()))
      rawRows.push(values)
    })

    const cnasNames = rawRows.map(r => pickName(r, headers)).map(n => n || '')
    const cnasNormalized = cnasNames.map(n => normalize(n))

    const existingRows = await new Promise((resolve, reject) => {
      db.all('SELECT denumire_medicament FROM medications', (err, rows) => {
        if (err) reject(err); else resolve(rows)
      })
    })
    const existingNames = existingRows.map(r => normalize(r.denumire_medicament || ''))

    const exactMatches = new Set()
    const fuzzyMatches = []
    const unmatched = []

    // Build index for existing names by prefix for speed
    const prefixIndex = new Map()
    existingNames.forEach(en => {
      const p = en.slice(0,3)
      if (!prefixIndex.has(p)) prefixIndex.set(p, [])
      prefixIndex.get(p).push(en)
    })

    for (let i = 0; i < cnasNormalized.length; i++) {
      const n = cnasNormalized[i]
      if (!n) { unmatched.push({index: i, name: cnasNames[i]}); continue }
      if (existingNames.includes(n)) { exactMatches.add(n); continue }

      // fuzzy: compare with candidates sharing prefix
      const p = n.slice(0,3)
      const candidates = prefixIndex.get(p) || existingNames
      let matched = false
      for (const en of candidates) {
        const d = levenshtein(en, n)
        const thresh = Math.max(1, Math.floor(Math.min(en.length, n.length) * 0.2))
        if (d <= thresh) { fuzzyMatches.push({cnas: cnasNames[i], existing: en, dist: d}); matched = true; break }
      }
      if (!matched) unmatched.push({index: i, name: cnasNames[i]})
    }

    console.log('CNAS total rows:', cnasNames.length)
    console.log('Exact normalized matches (by name):', exactMatches.size)
    console.log('Fuzzy matches found:', fuzzyMatches.length)
    console.log('Unmatched (would be new by name-only):', unmatched.length)
    console.log('\nFirst 50 unmatched names:')
    console.log(JSON.stringify(unmatched.slice(0,50), null, 2))
    if (fuzzyMatches.length > 0) {
      console.log('\nFuzzy samples:')
      console.log(JSON.stringify(fuzzyMatches.slice(0,50), null, 2))
    }

    db.close()
  } catch (err) {
    console.error('ERROR:', err.message)
    db.close()
    process.exit(1)
  }
}

run()
