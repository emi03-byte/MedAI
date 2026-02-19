#!/usr/bin/env node
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'medicamente.db')
const sqlite = sqlite3.verbose()
const db = new sqlite3.Database(DB_PATH)

const columns = [
  'denumire_medicament','substanta_activa','lista_compensare','cod_medicament','forma_farmaceutica','cod_atc','mod_prescriere','concentratie','forma_ambalare','nume_detinator_app','tara_detinator_app','cantitate_pe_forma_ambalare','pret_max_forma_ambalare','pret_max_ut','contributie_max_100','contributie_max_90_50_20','contributie_max_pensionari_90'
]

db.all(`SELECT ${columns.join(',')} FROM medications`, (err, medRows) => {
  if (err) { console.error('Error reading medications:', err.message); db.close(); return }
  let extra = 0
  let extraRows = []
  let checked = 0
  db.all(`SELECT ${columns.join(',')} FROM cnas_medicines`, (err2, cnasRows) => {
    if (err2) { console.error('Error reading cnas_medicines:', err2.message); db.close(); return }
    for (const m of medRows) {
      // Find a row in cnas_medicines that matches all columns
      const found = cnasRows.some(c => columns.every(col => (c[col]||'').trim() === (m[col]||'').trim()))
      if (!found) {
        extra++
        if (extraRows.length < 20) extraRows.push(m)
      }
      checked++
    }
    console.log('Total medications checked:', checked)
    console.log('Extra in medications (not in CNAS):', extra)
    if (extraRows.length > 0) {
      console.log('First 20 extra examples:')
      console.log(JSON.stringify(extraRows, null, 2))
    }
    db.close()
  })
})