#!/usr/bin/env node
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'medicamente.db')
const sqlite = sqlite3.verbose()
const db = new sqlite3.Database(DB_PATH)

// Helper: drop columns by recreating table (SQLite does not support DROP COLUMN directly)
async function dropColumns({table, keepCols}) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all(`PRAGMA table_info(${table})`, (err, cols) => {
        if (err) return reject(err)
        const keep = cols.filter(c => keepCols.includes(c.name))
        if (keep.length === 0) return reject(new Error('No columns to keep'))
        const colDefs = keep.map(c => `${c.name} ${c.type}${c.pk ? ' PRIMARY KEY' : ''}`).join(', ')
        const tmp = `${table}_tmp_${Date.now()}`
        db.run(`CREATE TABLE ${tmp} (${colDefs})`, (e1) => {
          if (e1) return reject(e1)
          db.run(`INSERT INTO ${tmp} SELECT ${keep.map(c=>c.name).join(',')} FROM ${table}`, (e2) => {
            if (e2) return reject(e2)
            db.run(`DROP TABLE ${table}`, (e3) => {
              if (e3) return reject(e3)
              db.run(`ALTER TABLE ${tmp} RENAME TO ${table}`, (e4) => {
                if (e4) return reject(e4)
                resolve()
              })
            })
          })
        })
      })
    })
  })
}

async function main() {
  try {
    // medications: drop normalized_name
    await dropColumns({
      table: 'medications',
      keepCols: [
        'id','denumire_medicament','substanta_activa','lista_compensare','cod_medicament','forma_farmaceutica','cod_atc','mod_prescriere','concentratie','forma_ambalare','nume_detinator_app','tara_detinator_app','cantitate_pe_forma_ambalare','pret_max_forma_ambalare','pret_max_ut','contributie_max_100','contributie_max_90_50_20','contributie_max_pensionari_90','categorie_varsta','coduri_boli'
      ]
    })
    // cnas_medicines: drop normalized_name, source_url, fetched_at
    await dropColumns({
      table: 'cnas_medicines',
      keepCols: [
        'id','denumire_medicament','cod_medicament','substanta_activa','lista_compensare','forma_farmaceutica','cod_atc','mod_prescriere','concentratie','forma_ambalare','nume_detinator_app','tara_detinator_app','cantitate_pe_forma_ambalare','pret_max_forma_ambalare','pret_max_ut','contributie_max_100','contributie_max_90_50_20','contributie_max_pensionari_90'
      ]
    })
    console.log('Columns dropped successfully.')
    db.close()
  } catch (e) {
    console.error('ERROR:', e.message)
    db.close()
    process.exit(1)
  }
}

main()