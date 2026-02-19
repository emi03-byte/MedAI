#!/usr/bin/env node
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'medicamente.db')
const sqlite = sqlite3.verbose()
const db = new sqlite3.Database(DB_PATH)

const columns = [
  'pret_max_forma_ambalare',
  'pret_max_ut',
  'contributie_max_100',
  'contributie_max_90_50_20'
]

// For each medication, update columns from cnas_medicines by cod_medicament if possible, else by denumire_medicament
db.serialize(() => {
  db.all('SELECT id, denumire_medicament, cod_medicament FROM medications', (err, meds) => {
    if (err) { console.error('Error reading medications:', err.message); db.close(); return }
    let updates = 0
    let queries = 0
    for (const med of meds) {
      let where = ''
      let param = ''
      if (med.cod_medicament && med.cod_medicament.trim() !== '') {
        where = 'cod_medicament = ?'
        param = med.cod_medicament.trim()
      } else {
        where = 'denumire_medicament = ?'
        param = med.denumire_medicament.trim()
      }
      db.get(`SELECT ${columns.join(', ')} FROM cnas_medicines WHERE ${where} LIMIT 1`, [param], (e, cnas) => {
        queries++
        if (!e && cnas) {
          const sets = []
          const vals = []
          for (const col of columns) {
            if (cnas[col] && cnas[col] !== '') {
              sets.push(`${col} = ?`)
              vals.push(cnas[col])
            }
          }
          if (sets.length > 0) {
            vals.push(med.id)
            db.run(`UPDATE medications SET ${sets.join(', ')} WHERE id = ?`, vals, (uErr) => {
              if (!uErr) updates++
            })
          }
        }
      })
    }
    // Wait a bit for all updates to finish
    setTimeout(() => {
      console.log('Sync complete. Updated rows:', updates)
      db.close()
    }, 3000)
  })
})