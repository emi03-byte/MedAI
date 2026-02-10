/**
 * Azure SQL Database for Azure Functions.
 * Set AZURE_SQL_CONNECTION_STRING in Azure: Static Web App → Configuration → Application settings.
 * Example: Server=medai01.database.windows.net;Database=MedAI;User Id=user;Password=pass;Encrypt=true;
 */
const sql = require('mssql')

let pool = null

async function getPool () {
  if (pool) return pool
  const connStr = process.env.AZURE_SQL_CONNECTION_STRING
  if (!connStr || connStr.trim() === '') {
    throw new Error('AZURE_SQL_CONNECTION_STRING is not set. Add it in Azure Portal → Static Web App → Configuration → Application settings.')
  }
  pool = await sql.connect(connStr)
  return pool
}

/**
 * GET /api/medications – query with search, limit, offset.
 * Returns { items, count }.
 */
async function queryMedications (search, limit, offset) {
  const p = await getPool()
  const request = p.request()
  request.input('offset', sql.Int, offset)
  request.input('limit', sql.Int, limit)

  let result
  if (search && search.trim() !== '') {
    request.input('search', sql.NVarChar(500), '%' + search.trim() + '%')
    result = await request.query(`
      SELECT * FROM medications
      WHERE denumire_medicament LIKE @search OR substanta_activa LIKE @search OR cod_medicament LIKE @search
      ORDER BY id
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `)
  } else {
    result = await request.query(`
      SELECT * FROM medications
      ORDER BY id
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `)
  }
  const items = result.recordset || []
  return { items, count: items.length }
}

module.exports = { getPool, queryMedications }
