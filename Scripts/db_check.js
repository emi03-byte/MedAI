#!/usr/bin/env node
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'medicamente.db')

const sqlite = sqlite3.verbose()
const db = new sqlite.Database(DB_PATH, (err) => {
  if (err) {
    console.error('ERROR opening DB:', err.message)
    process.exit(1)
  }

  db.all("PRAGMA table_info('cnas_medicines')", (e, rows) => {
    if (e) {
      console.error('PRAGMA error:', e.message)
      db.close()
      process.exit(1)
    }
    console.log('SCHEMA:', JSON.stringify(rows, null, 2))
    db.get('SELECT COUNT(*) as c FROM cnas_medicines', (err2, row) => {
      if (err2) {
        console.error('COUNT error:', err2.message)
        db.close()
        process.exit(1)
      }
      console.log('COUNT:', row ? row.c : 0)
      db.close()
    })
  })
})
