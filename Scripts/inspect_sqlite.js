#!/usr/bin/env node
import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

function inspect(dbPath, limit = 5) {
  if (!fs.existsSync(dbPath)) {
    console.error(`ERROR: file not found: ${dbPath}`)
    process.exit(1)
  }

  const sqlite = sqlite3.verbose()
  const db = new sqlite.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('ERROR opening DB:', err.message)
      process.exit(1)
    }
  })

  db.serialize(() => {
    console.log(`Inspecting: ${dbPath}\n`)
    db.all("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (err, tables) => {
      if (err) {
        console.error('ERROR reading sqlite_master:', err.message)
        db.close()
        process.exit(1)
      }

      if (!tables || tables.length === 0) {
        console.log('No user tables found.')
        db.close()
        return
      }

      (async () => {
        for (const t of tables) {
          console.log(`Table: ${t.name}`)
          console.log('Schema:')
          console.log(t.sql)
          await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as c FROM '${t.name}'`, (err2, rowCount) => {
              if (err2) {
                console.log('  Count: ERROR', err2.message)
                resolve()
                return
              }
              console.log('  Rows:', rowCount.c)
              db.all(`SELECT * FROM '${t.name}' LIMIT ?`, [limit], (err3, rows) => {
                if (err3) {
                  console.log('  Sample rows: ERROR', err3.message)
                } else {
                  console.log('  Sample rows:')
                  if (!rows || rows.length === 0) console.log('    (no rows)')
                  else rows.forEach(r => console.log('   ', JSON.stringify(r, null, 2)))
                }
                console.log('\n---\n')
                resolve()
              })
            })
          })
        }
        db.close()
      })()
    })
  })
}

if (process.argv.length < 3) {
  console.error('Usage: node inspect_sqlite.js <path-to-db> [limit]')
  process.exit(2)
}

const dbPath = process.argv[2]
const limit = process.argv[3] ? parseInt(process.argv[3], 10) : 5
inspect(dbPath, limit)
