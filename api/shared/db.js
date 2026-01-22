const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { ensureInitialized } = require('./initDb');

// Pentru Azure Functions, folosim storage persistent
// În Azure, folosim /home pentru storage persistent (sau DB_DIR dacă este setat)
// Pentru local development, folosim backend/data
const DB_DIR = process.env.DB_DIR || 
  (process.env.WEBSITE_INSTANCE_ID 
    ? path.join('/home', 'data')  // Azure Functions production
    : path.join(__dirname, '../../backend/data'));  // Local development
const DB_PATH = path.join(DB_DIR, 'medicamente.db');

// Asigură-te că directorul există
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance = null;
let initPromise = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(DB_PATH);
    // Inițializează baza de date la prima conexiune
    if (!initPromise) {
      initPromise = ensureInitialized().catch(err => {
        console.error('Database initialization error:', err);
        initPromise = null;
      });
    }
    await initPromise;
  }
  return dbInstance;
}

async function runAsync(sql, params = []) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function getAsync(sql, params = []) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function allAsync(sql, params = []) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  getDb,
  runAsync,
  getAsync,
  allAsync,
  DB_PATH,
};
