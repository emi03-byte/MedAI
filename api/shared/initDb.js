const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Path către CSV (pentru seeding) - nu este folosit în Azure Functions, doar pentru referință
const CSV_PATH = process.env.CSV_PATH || path.join(process.cwd(), 'public', 'medicamente_cu_boli_COMPLET.csv');

// Import direct pentru a evita dependențe circulare
// Pentru Azure Functions, folosim /home pentru storage persistent
const DB_DIR = process.env.DB_DIR || 
  (process.env.WEBSITE_INSTANCE_ID 
    ? path.join('/home', 'data')  // Azure Functions production
    : path.join(__dirname, '../../backend/data'));  // Local development
const DB_PATH = path.join(DB_DIR, 'medicamente.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let initDbInstance = null;

function getInitDb() {
  if (!initDbInstance) {
    initDbInstance = new sqlite3.Database(DB_PATH);
  }
  return initDbInstance;
}

function runAsyncInit(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getInitDb();
    db.run(sql, params, function runCallback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAsyncInit(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getInitDb();
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

const ensureTable = async () => {
  await runAsyncInit(
    `CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      denumire_medicament TEXT,
      substanta_activa TEXT,
      lista_compensare TEXT,
      cod_medicament TEXT,
      forma_farmaceutica TEXT,
      cod_atc TEXT,
      mod_prescriere TEXT,
      concentratie TEXT,
      forma_ambalare TEXT,
      nume_detinator_app TEXT,
      tara_detinator_app TEXT,
      cantitate_pe_forma_ambalare TEXT,
      pret_max_forma_ambalare TEXT,
      pret_max_ut TEXT,
      contributie_max_100 TEXT,
      contributie_max_90_50_20 TEXT,
      contributie_max_pensionari_90 TEXT,
      categorie_varsta TEXT,
      coduri_boli TEXT
    )`
  );

  // Tabelă pentru utilizatori
  await runAsyncInit(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nume TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      parola TEXT NOT NULL,
      data_creare DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      is_admin INTEGER DEFAULT 0,
      data_aprobare DATETIME,
      deleted_at DATETIME
    )`
  );

  // Migrare: adăugare coloane pentru utilizatori existenți (dacă nu există deja)
  try {
    await runAsyncInit(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsyncInit(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsyncInit(`ALTER TABLE users ADD COLUMN data_aprobare DATETIME`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsyncInit(`ALTER TABLE users ADD COLUMN deleted_at DATETIME`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }

  // Setare status 'approved' pentru utilizatori existenți (migrare)
  await runAsyncInit(`UPDATE users SET status = 'approved' WHERE status IS NULL OR status = ''`);

  // Setare automată contul caruntu.emanuel@gmail.com ca admin (dacă există deja)
  const adminEmail = 'caruntu.emanuel@gmail.com';
  const adminUser = await getAsyncInit('SELECT id, is_admin, status FROM users WHERE email = ?', [adminEmail]);
  if (adminUser) {
    if (!adminUser.is_admin || adminUser.is_admin === 0) {
      await runAsyncInit(
        'UPDATE users SET is_admin = 1, status = ?, data_aprobare = ? WHERE email = ?',
        ['approved', new Date().toISOString(), adminEmail]
      );
    }
  }

  // Tabelă pentru rețete
  await runAsyncInit(
    `CREATE TABLE IF NOT EXISTS retete (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nume_pacient TEXT,
      medicamente TEXT NOT NULL,
      planuri_tratament TEXT,
      indicatii_pacient TEXT,
      indicatii_medic TEXT,
      data_creare DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );

  // Tabelă pentru medicamente adăugate de utilizatori
  await runAsyncInit(
    `CREATE TABLE IF NOT EXISTS user_medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      denumire TEXT NOT NULL,
      forma_farmaceutica TEXT,
      concentratie TEXT,
      substanta_activa TEXT,
      cod_atc TEXT,
      mod_prescriere TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );

  // Migrare: adăugare coloane pentru user_medicines (dacă nu există deja)
  try {
    await runAsyncInit(`ALTER TABLE user_medicines ADD COLUMN substanta_activa TEXT`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsyncInit(`ALTER TABLE user_medicines ADD COLUMN cod_atc TEXT`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsyncInit(`ALTER TABLE user_medicines ADD COLUMN mod_prescriere TEXT`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
};

// Inițializează baza de date (apelat la prima invocare)
let initPromise = null;
let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await ensureTable();
      initialized = true;
    } catch (error) {
      console.error('Error initializing database:', error);
      initialized = false;
      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

module.exports = {
  ensureInitialized,
  ensureTable,
};
