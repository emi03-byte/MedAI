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

db.serialize(() => {
  for (const col of columns) {
    db.run(
      `UPDATE medications SET ${col} = REPLACE(${col}, '.', ',') WHERE ${col} LIKE '%.%'`,
      (err) => {
        if (err) console.error(`Error updating ${col}:`, err.message)
        else console.log(`Updated ${col}`)
      }
    )
  }
  db.close()
})