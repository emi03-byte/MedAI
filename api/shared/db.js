const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { ensureInitialized } = require('./initDb');

// Funcție pentru a verifica permisiunile de scriere
function checkWritePermissions(dirPath) {
  try {
    const testFile = path.join(dirPath, '.write_test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    fs.writeFileSync(testFile, 'test', 'utf8');
    fs.unlinkSync(testFile);
    console.log(`✅ [DB] Permisiuni de scriere verificate pentru: ${dirPath}`);
    return true;
  } catch (err) {
    console.error(`❌ [DB] NU există permisiuni de scriere în ${dirPath}:`, err.message);
    return false;
  }
}

// Funcție pentru a găsi un path writable pe Azure
function findWritablePath() {
  console.log('🔍 [DB] Căutare path writable pentru baza de date...');
  console.log(`   [DB] WEBSITE_INSTANCE_ID: ${process.env.WEBSITE_INSTANCE_ID || 'nu este setat'}`);
  console.log(`   [DB] AZURE_FUNCTIONS_ENVIRONMENT: ${process.env.AZURE_FUNCTIONS_ENVIRONMENT || 'nu este setat'}`);
  console.log(`   [DB] DB_DIR (env): ${process.env.DB_DIR || 'nu este setat'}`);

  // Dacă este setat explicit, folosește-l
  if (process.env.DB_DIR) {
    const dbDir = process.env.DB_DIR;
    console.log(`📁 [DB] Încercare cu DB_DIR explicit: ${dbDir}`);
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true, mode: 0o755 });
        console.log(`✅ [DB] Director creat: ${dbDir}`);
      } catch (err) {
        console.error(`❌ [DB] Nu pot crea ${dbDir}:`, err.message);
        console.error(`   [DB] Stack:`, err.stack);
        return null;
      }
    }
    if (checkWritePermissions(dbDir)) {
      console.log(`✅ [DB] Folosind DB_DIR explicit: ${dbDir}`);
      return dbDir;
    }
  }

  // Local development
  if (!process.env.WEBSITE_INSTANCE_ID && !process.env.AZURE_FUNCTIONS_ENVIRONMENT) {
    const localDir = path.join(__dirname, '../../backend/data');
    console.log(`📁 [DB] Modul local development detectat`);
    if (!fs.existsSync(localDir)) {
      try {
        fs.mkdirSync(localDir, { recursive: true });
        console.log(`✅ [DB] Director local creat: ${localDir}`);
      } catch (err) {
        console.error(`❌ [DB] Nu pot crea directorul local:`, err.message);
        throw err;
      }
    }
    if (checkWritePermissions(localDir)) {
      console.log(`✅ [DB] Local development path: ${localDir}`);
      return localDir;
    }
  }

  // Azure - încearcă mai multe path-uri în ordine de prioritate
  console.log(`📁 [DB] Modul Azure detectat - căutare path writable...`);
  const azurePaths = [
    { path: path.join('/home', 'site', 'wwwroot', 'api', 'data'), desc: 'Azure wwwroot/api/data (recomandat)' },
    { path: path.join('/home', 'site', 'wwwroot', 'data'), desc: 'Azure wwwroot/data' },
    { path: path.join('/home', 'data'), desc: 'Azure /home/data (original)' },
    { path: path.join('/tmp', 'medai_db'), desc: '/tmp/medai_db (fallback - nu persistent)' },
  ];

  for (const { path: dirPath, desc } of azurePaths) {
    console.log(`   [DB] Încercare: ${desc} (${dirPath})`);
    try {
      if (!fs.existsSync(dirPath)) {
        console.log(`   [DB] Directorul nu există, încercare creare...`);
        fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
        console.log(`   ✅ [DB] Director creat: ${dirPath}`);
      } else {
        console.log(`   ✅ [DB] Directorul există deja: ${dirPath}`);
      }
      
      if (checkWritePermissions(dirPath)) {
        console.log(`✅ [DB] Path writable găsit: ${dirPath} (${desc})`);
        return dirPath;
      } else {
        console.warn(`⚠️ [DB] Path nu are permisiuni de scriere: ${dirPath}`);
      }
    } catch (err) {
      console.warn(`⚠️ [DB] Eroare la verificarea ${dirPath}:`, err.message);
      console.warn(`   [DB] Stack:`, err.stack);
    }
  }

  console.error('❌ [DB] CRITICAL: Nu s-a găsit niciun path writable!');
  console.error('   [DB] Toate path-urile testate au eșuat.');
  return null;
}

// Găsește path-ul writable
const DB_DIR = findWritablePath();
if (!DB_DIR) {
  const errorMsg = 'Nu s-a putut găsi un director writable pentru baza de date!';
  console.error(`❌ [DB] ${errorMsg}`);
  throw new Error(errorMsg);
}

const DB_PATH = path.join(DB_DIR, 'medicamente.db');
console.log(`📁 [DB] ========================================`);
console.log(`📁 [DB] Baza de date va fi stocată la: ${DB_PATH}`);
console.log(`📁 [DB] Director: ${DB_DIR}`);
console.log(`📁 [DB] ========================================`);

let dbInstance = null;
let initPromise = null;

async function getDb() {
  if (!dbInstance) {
    console.log(`🔌 [DB] Deschidere conexiune la baza de date: ${DB_PATH}`);
    
    // Verifică din nou permisiunile înainte de a deschide baza de date
    if (!checkWritePermissions(DB_DIR)) {
      const errorMsg = `Nu există permisiuni de scriere în ${DB_DIR}`;
      console.error(`❌ [DB] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    dbInstance = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ [DB] Eroare la deschiderea bazei de date:', err);
        console.error('   [DB] Path:', DB_PATH);
        console.error('   [DB] Error code:', err.code);
        console.error('   [DB] Error message:', err.message);
        throw err;
      }
      console.log(`✅ [DB] Baza de date deschisă cu succes: ${DB_PATH}`);
    });
    
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
  }
  return dbInstance;
}

async function runAsync(sql, params = []) {
  const db = await getDb();
  const startTime = Date.now();
  const sqlPreview = sql.length > 100 ? sql.substring(0, 100) + '...' : sql;
  console.log(`📝 [DB] Executare SQL (run): ${sqlPreview}`);
  if (params && params.length > 0) {
    console.log(`   [DB] Parametri:`, params);
  }
  
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      const duration = Date.now() - startTime;
      if (err) {
        console.error(`❌ [DB] Eroare SQL (run) după ${duration}ms:`, err);
        console.error(`   [DB] SQL: ${sql}`);
        console.error(`   [DB] Parametri:`, params);
        console.error(`   [DB] Error code:`, err.code);
        console.error(`   [DB] Error message:`, err.message);
        reject(err);
      } else {
        console.log(`✅ [DB] SQL (run) executat cu succes în ${duration}ms`);
        if (this.lastID) {
          console.log(`   [DB] Last insert ID: ${this.lastID}`);
        }
        if (this.changes !== undefined) {
          console.log(`   [DB] Rânduri afectate: ${this.changes}`);
        }
        resolve(this);
      }
    });
  });
}

async function getAsync(sql, params = []) {
  const db = await getDb();
  const startTime = Date.now();
  const sqlPreview = sql.length > 100 ? sql.substring(0, 100) + '...' : sql;
  console.log(`🔍 [DB] Executare SQL (get): ${sqlPreview}`);
  if (params && params.length > 0) {
    console.log(`   [DB] Parametri:`, params);
  }
  
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      const duration = Date.now() - startTime;
      if (err) {
        console.error(`❌ [DB] Eroare SQL (get) după ${duration}ms:`, err);
        console.error(`   [DB] SQL: ${sql}`);
        console.error(`   [DB] Parametri:`, params);
        console.error(`   [DB] Error code:`, err.code);
        console.error(`   [DB] Error message:`, err.message);
        reject(err);
      } else {
        if (row) {
          console.log(`✅ [DB] SQL (get) executat cu succes în ${duration}ms - rând găsit`);
        } else {
          console.log(`✅ [DB] SQL (get) executat cu succes în ${duration}ms - niciun rând găsit`);
        }
        resolve(row);
      }
    });
  });
}

async function allAsync(sql, params = []) {
  const db = await getDb();
  const startTime = Date.now();
  const sqlPreview = sql.length > 100 ? sql.substring(0, 100) + '...' : sql;
  console.log(`🔍 [DB] Executare SQL (all): ${sqlPreview}`);
  if (params && params.length > 0) {
    console.log(`   [DB] Parametri:`, params);
  }
  
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      const duration = Date.now() - startTime;
      if (err) {
        console.error(`❌ [DB] Eroare SQL (all) după ${duration}ms:`, err);
        console.error(`   [DB] SQL: ${sql}`);
        console.error(`   [DB] Parametri:`, params);
        console.error(`   [DB] Error code:`, err.code);
        console.error(`   [DB] Error message:`, err.message);
        reject(err);
      } else {
        console.log(`✅ [DB] SQL (all) executat cu succes în ${duration}ms - ${rows ? rows.length : 0} rânduri returnate`);
        resolve(rows);
      }
    });
  });
}

module.exports = {
  getDb,
  runAsync,
  getAsync,
  allAsync,
  DB_PATH,
  DB_DIR,
};
