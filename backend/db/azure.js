/**
 * Azure SQL DB adapter for production (App Service).
 * Set AZURE_SQL_CONNECTION_STRING in environment.
 */
import sql from 'mssql';

let pool = null;

export function isAzure() {
  return true;
}

export async function init() {
  const connStr = process.env.AZURE_SQL_CONNECTION_STRING;
  if (!connStr || !connStr.trim()) {
    throw new Error('AZURE_SQL_CONNECTION_STRING is not set');
  }
  pool = await sql.connect(connStr);
}

export function close() {
  if (pool) {
    sql.close();
    pool = null;
  }
}

function convertSqlAndParams(sqlText, params = []) {
  let s = sqlText;
  const newParams = [...params];
  // LIMIT ? OFFSET ? -> OFFSET @pN ROWS FETCH NEXT @pN+1 ROWS ONLY (params are [...other, limit, offset])
  const limitOffsetMatch = s.match(/ LIMIT \? OFFSET \?$/i);
  if (limitOffsetMatch) {
    const n = newParams.length - 2;
    const limit = newParams[n];
    const offset = newParams[n + 1];
    newParams.length = n;
    newParams.push(offset, limit);
    s = s.replace(/ LIMIT \? OFFSET \?$/i, ` OFFSET @p${n} ROWS FETCH NEXT @p${n + 1} ROWS ONLY`);
  }
  let i = 0;
  s = s.replace(/\?/g, () => `@p${i++}`);
  return { sql: s, params: newParams };
}

export async function runAsync(sqlText, params = []) {
  const { sql: s, params: p } = convertSqlAndParams(sqlText, params);
  const request = pool.request();
  p.forEach((val, idx) => {
    const name = `p${idx}`;
    if (val === null || val === undefined) {
      request.input(name, sql.NVarChar(sql.MAX), null);
    } else if (typeof val === 'number') {
      request.input(name, sql.Int, val);
    } else {
      request.input(name, sql.NVarChar(sql.MAX), String(val));
    }
  });
  const isInsert = /^\s*INSERT\s+/i.test(sqlText.trim());
  if (isInsert) {
    request.multiple = true;
    const result = await request.query(s + '; SELECT SCOPE_IDENTITY() AS id');
    const lastSet = result.recordsets && result.recordsets[result.recordsets.length - 1];
    const row = lastSet && lastSet[0];
    const lastID = row && row.id != null ? Number(row.id) : 0;
    return { lastID, changes: 1 };
  }
  const result = await request.query(s);
  const changes = result.rowsAffected ? result.rowsAffected[0] : 0;
  return { lastID: 0, changes };
}

export async function getAsync(sqlText, params = []) {
  const { sql: s, params: p } = convertSqlAndParams(sqlText, params);
  const request = pool.request();
  p.forEach((val, idx) => {
    const name = `p${idx}`;
    if (val === null || val === undefined) {
      request.input(name, sql.NVarChar(sql.MAX), null);
    } else if (typeof val === 'number') {
      request.input(name, sql.Int, val);
    } else {
      request.input(name, sql.NVarChar(sql.MAX), String(val));
    }
  });
  const result = await request.query(s);
  const rows = result.recordset || [];
  return rows[0] || null;
}

export async function allAsync(sqlText, params = []) {
  const { sql: s, params: p } = convertSqlAndParams(sqlText, params);
  const request = pool.request();
  p.forEach((val, idx) => {
    const name = `p${idx}`;
    if (val === null || val === undefined) {
      request.input(name, sql.NVarChar(sql.MAX), null);
    } else if (typeof val === 'number') {
      request.input(name, sql.Int, val);
    } else {
      request.input(name, sql.NVarChar(sql.MAX), String(val));
    }
  });
  const result = await request.query(s);
  return result.recordset || [];
}
