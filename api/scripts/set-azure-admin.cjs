/**
 * Creează sau actualizează contul admin în Azure SQL.
 * Usage: set AZURE_SQL_CONNECTION_STRING then node scripts/set-azure-admin.cjs [password]
 */
const path = require('path')
const sql = require('mssql')
const bcrypt = require(path.join(__dirname, '..', '..', 'node_modules', 'bcryptjs'))

const email = 'caruntu.emanuel@gmail.com'
const nume = 'caruntu emi'
const parola = process.argv[2] || 'MedAi123'

async function main() {
  const connStr = process.env.AZURE_SQL_CONNECTION_STRING
  if (!connStr?.trim()) {
    console.error('Lipsește AZURE_SQL_CONNECTION_STRING')
    process.exit(1)
  }

  const pool = await sql.connect(connStr)
  const existing = await pool
    .request()
    .input('email', sql.NVarChar, email)
    .query('SELECT id, email FROM users WHERE email = @email')

  const hash = await bcrypt.hash(parola, 10)

  if (existing.recordset.length) {
    await pool
      .request()
      .input('hash', sql.NVarChar(sql.MAX), hash)
      .input('email', sql.NVarChar, email)
      .query(
        "UPDATE users SET parola = @hash, status = 'approved', is_admin = 1, deleted_at = NULL, data_aprobare = GETUTCDATE() WHERE email = @email"
      )
    console.log('Actualizat cont existent, id =', existing.recordset[0].id)
  } else {
    await pool
      .request()
      .input('nume', sql.NVarChar, nume)
      .input('email', sql.NVarChar, email)
      .input('hash', sql.NVarChar(sql.MAX), hash)
      .query(
        "INSERT INTO users (nume, email, parola, status, is_admin, data_aprobare) VALUES (@nume, @email, @hash, 'approved', 1, GETUTCDATE())"
      )
    console.log('Creat cont admin nou')
  }

  const check = await pool
    .request()
    .input('email', sql.NVarChar, email)
    .query('SELECT id, email, status, is_admin FROM users WHERE email = @email')

  console.log('Cont:', check.recordset[0])
  await pool.close()
}

main().catch((err) => {
  console.error('Eroare:', err.message)
  process.exit(1)
})
