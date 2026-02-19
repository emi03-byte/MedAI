#!/usr/bin/env node
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'backend', 'data', 'medicamente.db')

const sqlite = sqlite3.verbose()
const db = new sqlite.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('ERROR opening DB:', err.message)
    process.exit(1)
  }
})

db.get('SELECT COUNT(*) as c FROM medications', (err, row) => {
  if (err) {
    console.error('ERROR querying DB:', err.message)
    process.exit(1)
  }
  console.log(row.c)
  db.close()
})
