#!/usr/bin/env node
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'medicamente.db')
const sqlite = sqlite3.verbose()
const db = new sqlite3.Database(DB_PATH)

// All relevant columns to compare (except id)
const columns = [
  'denumire_medicament','substanta_activa','lista_compensare','cod_medicament','forma_farmaceutica','cod_atc','mod_prescriere','concentratie','forma_ambalare','nume_detinator_app','tara_detinator_app','cantitate_pe_forma_ambalare','pret_max_forma_ambalare','pret_max_ut','contributie_max_100','contributie_max_90_50_20','contributie_max_pensionari_90'
]

db.all(`SELECT ${columns.join(',')} FROM cnas_medicines`, (err, cnasRows) => {
  if (err) { console.error('Error reading cnas_medicines:', err.message); db.close(); return }
  let missing = 0
  let missingRows = []
  let checked = 0
  db.all(`SELECT ${columns.join(',')} FROM medications`, (err2, medRows) => {
    if (err2) { console.error('Error reading medications:', err2.message); db.close(); return }
    for (const c of cnasRows) {
      // Find a row in medications that matches all columns
      const found = medRows.some(m => columns.every(col => (m[col]||'').trim() === (c[col]||'').trim()))
      if (!found) {
        missing++
        if (missingRows.length < 20) missingRows.push(c)
      }
      checked++
    }
    console.log('Total CNAS rows checked:', checked)
    console.log('Missing in medications:', missing)
    if (missingRows.length > 0) {
      console.log('First 20 missing examples:')
      console.log(JSON.stringify(missingRows, null, 2))
    }
    db.close()
  })
})