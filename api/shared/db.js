const sql = require('mssql');
const { ensureInitialized } = require('./initDb');

// Connection string pentru Azure SQL Database
const CONNECTION_STRING = process.env.AZURE_SQL_CONNECTION_STRING || 
  'Server=tcp:medai01.database.windows.net,1433;Initial Catalog=MedAI;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Authentication="Active Directory Default";';

console.log('🔍 [DB] Configurare Azure SQL Database...');
console.log(`   [DB] Server: medai01.database.windows.net`);
console.log(`   [DB] Database: MedAI`);
console.log(`   [DB] Authentication: Active Directory Default`);

// Configurare connection pool
// Pentru Azure AD Default, mssql folosește automat credențialele Azure
const config = {
  server: 'medai01.database.windows.net',
  database: 'MedAI',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  authentication: {
    type: 'azure-active-directory-default',
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Parse connection string dacă este setat
if (process.env.AZURE_SQL_CONNECTION_STRING) {
  try {
    // Parse connection string manual pentru a extrage configurația
    const connStr = process.env.AZURE_SQL_CONNECTION_STRING;
    const parts = connStr.split(';');
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        const keyLower = key.trim().toLowerCase();
        if (keyLower === 'server') {
          const serverMatch = value.match(/tcp:([^,]+),(\d+)/);
          if (serverMatch) {
            config.server = serverMatch[1];
            config.port = parseInt(serverMatch[2]);
          }
        } else if (keyLower === 'initial catalog') {
          config.database = value.trim();
        } else if (keyLower === 'encrypt') {
          config.options.encrypt = value.trim().toLowerCase() === 'true';
        } else if (keyLower === 'trustservercertificate') {
          config.options.trustServerCertificate = value.trim().toLowerCase() === 'true';
        } else if (keyLower === 'connection timeout') {
          config.connectionTimeout = parseInt(value.trim()) * 1000;
        } else if (keyLower === 'authentication' && value.includes('Active Directory Default')) {
          config.authentication = {
            type: 'azure-active-directory-default',
          };
        }
      }
    });
    console.log(`✅ [DB] Connection string parsat cu succes`);
    console.log(`   [DB] Server: ${config.server}:${config.port}`);
    console.log(`   [DB] Database: ${config.database}`);
  } catch (err) {
    console.warn(`⚠️ [DB] Eroare la parsarea connection string, folosind config default:`, err.message);
  }
}

let pool = null;
let initPromise = null;

async function getPool() {
  if (!pool) {
    console.log(`🔌 [DB] Creare connection pool la Azure SQL Database...`);
    try {
      pool = await sql.connect(config);
      console.log(`✅ [DB] Connection pool creat cu succes`);
      
      // Test connection
      const result = await pool.request().query('SELECT 1 as test');
      console.log(`✅ [DB] Test connection reușit`);
      
      // Inițializează baza de date la prima conexiune
      if (!initPromise) {
        console.log(`🔄 [DB] Inițializare baza de date...`);
        initPromise = ensureInitialized().catch(err => {
          console.error('❌ [DB] Database initialization error:', err);
          console.error('   [DB] Stack:', err.stack);
          initPromise = null;
          throw err;
        });
      }
      await initPromise;
      console.log(`✅ [DB] Baza de date inițializată cu succes`);
    } catch (err) {
      console.error('❌ [DB] Eroare la conectarea la Azure SQL Database:', err);
      console.error('   [DB] Error code:', err.code);
      console.error('   [DB] Error message:', err.message);
      console.error('   [DB] Stack:', err.stack);
      pool = null;
      throw err;
    }
  }
  return pool;
}

// Helper pentru a converti parametri SQLite (?) la SQL Server (@param)
function convertParams(pool, sqlQuery, params = []) {
  if (!params || params.length === 0) {
    return { query: sqlQuery, request: pool.request() };
  }
  
  // Creează un request
  const request = pool.request();
  
  // Înlocuiește ? cu @p0, @p1, etc.
  let paramIndex = 0;
  const convertedQuery = sqlQuery.replace(/\?/g, () => {
    const paramName = `p${paramIndex}`;
    const paramValue = params[paramIndex];
    paramIndex++;
    
    // Adaugă parametrul la request (detectează tipul automat)
    if (paramValue === null || paramValue === undefined) {
      request.input(paramName, sql.NVarChar, null);
    } else if (typeof paramValue === 'number') {
      // Folosește Int pentru numere întregi, Float pentru zecimale
      if (Number.isInteger(paramValue)) {
        request.input(paramName, sql.Int, paramValue);
      } else {
        request.input(paramName, sql.Float, paramValue);
      }
    } else if (typeof paramValue === 'boolean') {
      request.input(paramName, sql.Bit, paramValue ? 1 : 0);
    } else {
      // Folosește NVarChar(MAX) pentru string-uri
      request.input(paramName, sql.NVarChar, paramValue);
    }
    
    return `@${paramName}`;
  });
  
  return { query: convertedQuery, request };
}

async function runAsync(sqlQuery, params = []) {
  const pool = await getPool();
  const startTime = Date.now();
  const sqlPreview = sqlQuery.length > 100 ? sqlQuery.substring(0, 100) + '...' : sqlQuery;
  console.log(`📝 [DB] Executare SQL (run): ${sqlPreview}`);
  if (params && params.length > 0) {
    console.log(`   [DB] Parametri:`, params);
  }
  
  try {
    const { query, request } = convertParams(pool, sqlQuery, params);
    
    const result = await request.query(query);
    const duration = Date.now() - startTime;
    
    console.log(`✅ [DB] SQL (run) executat cu succes în ${duration}ms`);
    if (result.recordset && result.recordset.length > 0) {
      console.log(`   [DB] Rânduri returnate: ${result.recordset.length}`);
    }
    if (result.rowsAffected && result.rowsAffected.length > 0) {
      console.log(`   [DB] Rânduri afectate: ${result.rowsAffected[0]}`);
    }
    
    // Returnează un obiect similar cu SQLite pentru compatibilitate
    // Pentru SQL Server, lastID vine din OUTPUT INSERTED.id
    let lastID = null;
    if (result.recordset && result.recordset.length > 0) {
      // Verifică dacă există un câmp 'id' în recordset (din OUTPUT INSERTED.id)
      const firstRow = result.recordset[0];
      if (firstRow.id !== undefined) {
        lastID = firstRow.id;
      } else if (firstRow.ID !== undefined) {
        lastID = firstRow.ID;
      }
    }
    
    return {
      lastID: lastID,
      changes: result.rowsAffected && result.rowsAffected.length > 0 ? result.rowsAffected[0] : 0,
      result: result,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [DB] Eroare SQL (run) după ${duration}ms:`, err);
    console.error(`   [DB] SQL: ${sqlQuery}`);
    console.error(`   [DB] Parametri:`, params);
    console.error(`   [DB] Error code:`, err.code);
    console.error(`   [DB] Error message:`, err.message);
    console.error(`   [DB] Stack:`, err.stack);
    throw err;
  }
}

async function getAsync(sqlQuery, params = []) {
  const pool = await getPool();
  const startTime = Date.now();
  const sqlPreview = sqlQuery.length > 100 ? sqlQuery.substring(0, 100) + '...' : sqlQuery;
  console.log(`🔍 [DB] Executare SQL (get): ${sqlPreview}`);
  if (params && params.length > 0) {
    console.log(`   [DB] Parametri:`, params);
  }
  
  try {
    const { query, request } = convertParams(pool, sqlQuery, params);
    
    const result = await request.query(query);
    const duration = Date.now() - startTime;
    
    const row = result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
    
    if (row) {
      console.log(`✅ [DB] SQL (get) executat cu succes în ${duration}ms - rând găsit`);
    } else {
      console.log(`✅ [DB] SQL (get) executat cu succes în ${duration}ms - niciun rând găsit`);
    }
    
    return row;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [DB] Eroare SQL (get) după ${duration}ms:`, err);
    console.error(`   [DB] SQL: ${sqlQuery}`);
    console.error(`   [DB] Parametri:`, params);
    console.error(`   [DB] Error code:`, err.code);
    console.error(`   [DB] Error message:`, err.message);
    console.error(`   [DB] Stack:`, err.stack);
    throw err;
  }
}

async function allAsync(sqlQuery, params = []) {
  const pool = await getPool();
  const startTime = Date.now();
  const sqlPreview = sqlQuery.length > 100 ? sqlQuery.substring(0, 100) + '...' : sqlQuery;
  console.log(`🔍 [DB] Executare SQL (all): ${sqlPreview}`);
  if (params && params.length > 0) {
    console.log(`   [DB] Parametri:`, params);
  }
  
  try {
    const { query, request } = convertParams(pool, sqlQuery, params);
    
    const result = await request.query(query);
    const duration = Date.now() - startTime;
    
    const rows = result.recordset || [];
    console.log(`✅ [DB] SQL (all) executat cu succes în ${duration}ms - ${rows.length} rânduri returnate`);
    
    return rows;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [DB] Eroare SQL (all) după ${duration}ms:`, err);
    console.error(`   [DB] SQL: ${sqlQuery}`);
    console.error(`   [DB] Parametri:`, params);
    console.error(`   [DB] Error code:`, err.code);
    console.error(`   [DB] Error message:`, err.message);
    console.error(`   [DB] Stack:`, err.stack);
    throw err;
  }
}

// Funcție pentru a obține pool-ul direct (pentru seedMedications)
async function getDb() {
  return await getPool();
}

module.exports = {
  getDb,
  runAsync,
  getAsync,
  allAsync,
  DB_PATH: 'Azure SQL Database (MedAI)',
  DB_DIR: 'Azure SQL Database',
  sql, // Export mssql pentru utilizări avansate
};
