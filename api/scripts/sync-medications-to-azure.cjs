/**
 * Copiază medicamentele din SQLite (backend/data/medicamente.db) în Azure SQL.
 *
 * Rulează din rădăcina proiectului:
 *   cd api && npm install && node scripts/sync-medications-to-azure.cjs
 *
 * Setează înainte variabila de mediu AZURE_SQL_CONNECTION_STRING (connection string către Azure SQL).
 */

const path = require('path')
const sqlite3 = require('sqlite3')
const sql = require('mssql')

const SQLITE_DB = path.join(__dirname, '..', '..', 'backend', 'data', 'medicamente.db')

const COLS = [
  'denumire_medicament', 'substanta_activa', 'lista_compensare', 'cod_medicament',
  'forma_farmaceutica', 'cod_atc', 'mod_prescriere', 'concentratie', 'forma_ambalare',
  'nume_detinator_app', 'tara_detinator_app', 'cantitate_pe_forma_ambalare',
  'pret_max_forma_ambalare', 'pret_max_ut', 'contributie_max_100', 'contributie_max_90_50_20',
  'contributie_max_pensionari_90', 'categorie_varsta', 'coduri_boli'
]

function allAsync(db, sqlQuery, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sqlQuery, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

function toStr(val) {
  if (val === null || val === undefined) return null
  return String(val)
}

async function main() {
  const connStr = process.env.AZURE_SQL_CONNECTION_STRING
  if (!connStr || !connStr.trim()) {
    console.error('Lipsește AZURE_SQL_CONNECTION_STRING. Setează variabila de mediu (connection string către Azure SQL) și rulează din nou.')
    process.exit(1)
  }

  const sqlite = new sqlite3.Database(SQLITE_DB, (err) => {
    if (err) {
      console.error('Eroare la deschiderea SQLite:', err.message)
      console.error('Cale așteptată:', SQLITE_DB)
      process.exit(1)
    }
  })

  try {
    const rows = await allAsync(sqlite, 'SELECT * FROM medications ORDER BY id')
    sqlite.close()
    console.log('Citite', rows.length, 'rânduri din SQLite (medicamente.db).')

    if (rows.length === 0) {
      console.log('Nu există medicamente în SQLite. Ieșire.')
      return
    }

    const pool = await sql.connect(connStr)

    let inserted = 0
    for (const row of rows) {
      const request = pool.request()
      COLS.forEach((col, i) => {
        request.input(`p${i}`, sql.NVarChar(sql.MAX), toStr(row[col]))
      })
      const placeholders = COLS.map((_, i) => `@p${i}`).join(', ')
      const colList = COLS.join(', ')
      await request.query(
        `INSERT INTO medications (${colList}) VALUES (${placeholders})`
      )
      inserted++
      if (inserted % 500 === 0) console.log('Inserate', inserted, '/', rows.length)
    }

    console.log('Gata. Total inserate în Azure SQL:', inserted)
  } catch (err) {
    console.error('Eroare:', err.message)
    process.exit(1)
  } finally {
    sqlite.close()
    await sql.close()
  }
}

main()
