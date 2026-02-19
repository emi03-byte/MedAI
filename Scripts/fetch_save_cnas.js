#!/usr/bin/env node
import sqlite3 from 'sqlite3'
import path from 'path'
import { load as cheerioLoad } from 'cheerio'
import { normalizeName } from '../backend/utils/normalize.js'

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'medicamente.db')
const PAGE_URL = 'https://cnas.ro/lista-medicamente/'

const sqlite = sqlite3.verbose()
const db = new sqlite.Database(DB_PATH, (err) => {
  if (err) {
    console.error('ERROR opening DB:', err.message)
    process.exit(1)
  }
})

const fetchPage = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

const pick = (r, candidates) => {
  for (const c of candidates) {
    if (r[c] && r[c].toString().trim() !== '') return r[c].toString().trim()
  }
  return ''
}

const mapRow = (raw) => {
  const r = {}
  Object.keys(raw).forEach(k => r[k] = raw[k])
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
    contributie_max_100: pick(r, [
      'Contribuție 100%',
      'Contributie maxima 100',
      'Contributie 100',
      'Contributie max 100',
      'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiază de compensare 100% din prețul de referinta',
      'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiaza de compensare 100% din pretul de referinta'
    ]),
    contributie_max_90_50_20: pick(r, [
      'Contribuție 90/50/20',
      'Contributie 90',
      'Contributie 90_50_20',
      'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiaza de compensare 90% - sublista A, 50% - sublista B, 20% - sublista D din prețul de referinta',
      'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiaza de compensare 90% - sublista A, 50% - sublista B, 20% - sublista D din pretul de referinta'
    ]),
    contributie_max_pensionari_90: pick(r, ['Contribuție pensionari 90', 'Contributie pensionari 90']),
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

    const prepared = rawRows.map(r => mapRow(r))
    console.log('Prepared rows:', prepared.length)

    // Insert into cnas_medicines (replace snapshot)
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION')
        db.run('DELETE FROM cnas_medicines')
        const stmt = db.prepare(`INSERT INTO cnas_medicines (
          denumire_medicament, normalized_name, cod_medicament, substanta_activa, lista_compensare, forma_farmaceutica, cod_atc, mod_prescriere, concentratie, forma_ambalare, nume_detinator_app, tara_detinator_app, cantitate_pe_forma_ambalare, pret_max_forma_ambalare, pret_max_ut, contributie_max_100, contributie_max_90_50_20, contributie_max_pensionari_90, source_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        for (const r of prepared) {
          const name = r.denumire_medicament || ''
          const norm = normalizeName(name)
          stmt.run([
            name,
            norm,
            r.cod_medicament || '',
            r.substanta_activa || '',
            r.lista_compensare || '',
            r.forma_farmaceutica || '',
            r.cod_atc || '',
            r.mod_prescriere || '',
            r.concentratie || '',
            r.forma_ambalare || '',
            r.nume_detinator_app || '',
            r.tara_detinator_app || '',
            r.cantitate_pe_forma_ambalare || '',
            r.pret_max_forma_ambalare || '',
            r.pret_max_ut || '',
            r.contributie_max_100 || '',
            r.contributie_max_90_50_20 || '',
            r.contributie_max_pensionari_90 || '',
            PAGE_URL
          ])
        }
        stmt.finalize((err) => {
          if (err) return reject(err)
          db.run('COMMIT', (cErr) => {
            if (cErr) return reject(cErr)
            resolve()
          })
        })
      })
    })

    console.log('CNAS snapshot saved to cnas_medicines (all columns)')
    db.close()
  } catch (err) {
    console.error('ERROR:', err.message)
    db.close()
    process.exit(1)
  }
}

run()
