const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { seedIfEmpty } = require('./seedMedications');

// Folosim DB_PATH din db.js prin lazy loading pentru a evita dependențe circulare
let DB_PATH = null;
let DB_DIR = null;

function getDbPath() {
  if (!DB_PATH) {
    // Import lazy pentru a evita dependențe circulare
    const dbModule = require('./db');
    DB_PATH = dbModule.DB_PATH;
    DB_DIR = dbModule.DB_DIR;
    console.log(`📁 [INIT] Folosind DB_PATH din db.js: ${DB_PATH}`);
  }
  return DB_PATH;
}

let initDbInstance = null;

function getInitDb() {
  if (!initDbInstance) {
    const dbPath = getDbPath();
    console.log(`🔌 [INIT] Deschidere conexiune init la baza de date: ${dbPath}`);
    initDbInstance = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ [INIT] Eroare la deschiderea bazei de date:', err);
        console.error('   [INIT] Path:', dbPath);
        console.error('   [INIT] Error code:', err.code);
        console.error('   [INIT] Error message:', err.message);
        throw err;
      }
      console.log(`✅ [INIT] Baza de date deschisă pentru inițializare: ${dbPath}`);
    });
  }
  return initDbInstance;
}

function runAsyncInit(sql, params = []) {
  const startTime = Date.now();
  const sqlPreview = sql.length > 100 ? sql.substring(0, 100) + '...' : sql;
  console.log(`📝 [INIT] Executare SQL (run): ${sqlPreview}`);
  if (params && params.length > 0) {
    console.log(`   [INIT] Parametri:`, params);
  }
  
  return new Promise((resolve, reject) => {
    const db = getInitDb();
    db.run(sql, params, function runCallback(err) {
      const duration = Date.now() - startTime;
      if (err) {
        console.error(`❌ [INIT] Eroare SQL (run) după ${duration}ms:`, err);
        console.error(`   [INIT] SQL: ${sql}`);
        console.error(`   [INIT] Parametri:`, params);
        console.error(`   [INIT] Error code:`, err.code);
        console.error(`   [INIT] Error message:`, err.message);
        reject(err);
      } else {
        console.log(`✅ [INIT] SQL (run) executat cu succes în ${duration}ms`);
        if (this.lastID) {
          console.log(`   [INIT] Last insert ID: ${this.lastID}`);
        }
        if (this.changes !== undefined) {
          console.log(`   [INIT] Rânduri afectate: ${this.changes}`);
        }
        resolve(this);
      }
    });
  });
}

function getAsyncInit(sql, params = []) {
  const startTime = Date.now();
  const sqlPreview = sql.length > 100 ? sql.substring(0, 100) + '...' : sql;
  console.log(`🔍 [INIT] Executare SQL (get): ${sqlPreview}`);
  if (params && params.length > 0) {
    console.log(`   [INIT] Parametri:`, params);
  }
  
  return new Promise((resolve, reject) => {
    const db = getInitDb();
    db.get(sql, params, (err, row) => {
      const duration = Date.now() - startTime;
      if (err) {
        console.error(`❌ [INIT] Eroare SQL (get) după ${duration}ms:`, err);
        console.error(`   [INIT] SQL: ${sql}`);
        console.error(`   [INIT] Parametri:`, params);
        console.error(`   [INIT] Error code:`, err.code);
        console.error(`   [INIT] Error message:`, err.message);
        reject(err);
      } else {
        if (row) {
          console.log(`✅ [INIT] SQL (get) executat cu succes în ${duration}ms - rând găsit`);
        } else {
          console.log(`✅ [INIT] SQL (get) executat cu succes în ${duration}ms - niciun rând găsit`);
        }
        resolve(row);
      }
    });
  });
}

const ensureTable = async () => {
  console.log(`🔄 [INIT] Început inițializare tabele...`);
  
  console.log(`📋 [INIT] Creare tabelă medications...`);
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
  console.log(`✅ [INIT] Tabelă medications creată/verificată`);

  console.log(`📋 [INIT] Creare tabelă users...`);
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
  console.log(`✅ [INIT] Tabelă users creată/verificată`);

  console.log(`🔄 [INIT] Verificare migrări coloane users...`);
  // Migrare: adăugare coloane pentru utilizatori existenți (dacă nu există deja)
  try {
    await runAsyncInit(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'`);
    console.log(`   ✅ [INIT] Coloană 'status' adăugată`);
  } catch (e) {
    console.log(`   ℹ️ [INIT] Coloană 'status' există deja`);
  }
  try {
    await runAsyncInit(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
    console.log(`   ✅ [INIT] Coloană 'is_admin' adăugată`);
  } catch (e) {
    console.log(`   ℹ️ [INIT] Coloană 'is_admin' există deja`);
  }
  try {
    await runAsyncInit(`ALTER TABLE users ADD COLUMN data_aprobare DATETIME`);
    console.log(`   ✅ [INIT] Coloană 'data_aprobare' adăugată`);
  } catch (e) {
    console.log(`   ℹ️ [INIT] Coloană 'data_aprobare' există deja`);
  }
  try {
    await runAsyncInit(`ALTER TABLE users ADD COLUMN deleted_at DATETIME`);
    console.log(`   ✅ [INIT] Coloană 'deleted_at' adăugată`);
  } catch (e) {
    console.log(`   ℹ️ [INIT] Coloană 'deleted_at' există deja`);
  }

  console.log(`🔄 [INIT] Actualizare status utilizatori existenți...`);
  // Setare status 'approved' pentru utilizatori existenți (migrare)
  const updateResult = await runAsyncInit(`UPDATE users SET status = 'approved' WHERE status IS NULL OR status = ''`);
  console.log(`✅ [INIT] Status utilizatori actualizat (${updateResult.changes} rânduri afectate)`);

  console.log(`👤 [INIT] Seeding utilizator admin...`);
  // Seeding automat pentru utilizatorul admin
  const adminEmail = 'caruntu.emanuel@gmail.com';
  const adminName = 'Emi';
  const adminPassword = 'MedAi123';
  
  const adminUser = await getAsyncInit('SELECT id, is_admin, status FROM users WHERE email = ?', [adminEmail]);
  
  if (adminUser) {
    // Utilizatorul există - actualizează dacă nu este admin
    if (!adminUser.is_admin || adminUser.is_admin === 0) {
      console.log(`   🔄 [INIT] Actualizare cont ${adminEmail} ca admin...`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await runAsyncInit(
        'UPDATE users SET is_admin = 1, status = ?, data_aprobare = ?, parola = ? WHERE email = ?',
        ['approved', new Date().toISOString(), hashedPassword, adminEmail]
      );
      console.log(`✅ [SETUP] Cont ${adminEmail} actualizat ca admin`);
    } else {
      console.log(`✅ [SETUP] Cont ${adminEmail} este deja admin`);
    }
  } else {
    // Utilizatorul nu există - creează-l ca admin
    console.log(`   🔄 [INIT] Creare cont admin: ${adminName} (${adminEmail})...`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await runAsyncInit(
      `INSERT INTO users (nume, email, parola, status, is_admin, data_aprobare) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminName, adminEmail, hashedPassword, 'approved', 1, new Date().toISOString()]
    );
    console.log(`✅ [SETUP] Cont admin creat: ${adminName} (${adminEmail})`);
  }

  console.log(`👤 [INIT] Seeding utilizator test...`);
  // Seeding automat pentru utilizatorul test
  const testEmail = 'test@gmail.com';
  const testName = 'test';
  const testPassword = 'test1223';
  
  const testUser = await getAsyncInit('SELECT id, status FROM users WHERE email = ?', [testEmail]);
  
  if (testUser) {
    // Utilizatorul există - actualizează dacă nu este aprobat
    if (testUser.status !== 'approved') {
      console.log(`   🔄 [INIT] Actualizare cont ${testEmail} ca aprobat...`);
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      await runAsyncInit(
        'UPDATE users SET status = ?, data_aprobare = ?, parola = ? WHERE email = ?',
        ['approved', new Date().toISOString(), hashedPassword, testEmail]
      );
      console.log(`✅ [SETUP] Cont ${testEmail} actualizat ca aprobat`);
    } else {
      console.log(`✅ [SETUP] Cont ${testEmail} este deja aprobat`);
    }
  } else {
    // Utilizatorul nu există - creează-l ca aprobat
    console.log(`   🔄 [INIT] Creare cont test: ${testName} (${testEmail})...`);
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    await runAsyncInit(
      `INSERT INTO users (nume, email, parola, status, is_admin, data_aprobare) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [testName, testEmail, hashedPassword, 'approved', 0, new Date().toISOString()]
    );
    console.log(`✅ [SETUP] Cont test creat: ${testName} (${testEmail})`);
  }

  console.log(`📋 [INIT] Creare tabelă retete...`);
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
  console.log(`✅ [INIT] Tabelă retete creată/verificată`);

  console.log(`📋 [INIT] Creare tabelă user_medicines...`);
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
  console.log(`✅ [INIT] Tabelă user_medicines creată/verificată`);

  console.log(`🔄 [INIT] Verificare migrări coloane user_medicines...`);
  // Migrare: adăugare coloane pentru user_medicines (dacă nu există deja)
  try {
    await runAsyncInit(`ALTER TABLE user_medicines ADD COLUMN substanta_activa TEXT`);
    console.log(`   ✅ [INIT] Coloană 'substanta_activa' adăugată`);
  } catch (e) {
    console.log(`   ℹ️ [INIT] Coloană 'substanta_activa' există deja`);
  }
  try {
    await runAsyncInit(`ALTER TABLE user_medicines ADD COLUMN cod_atc TEXT`);
    console.log(`   ✅ [INIT] Coloană 'cod_atc' adăugată`);
  } catch (e) {
    console.log(`   ℹ️ [INIT] Coloană 'cod_atc' există deja`);
  }
  try {
    await runAsyncInit(`ALTER TABLE user_medicines ADD COLUMN mod_prescriere TEXT`);
    console.log(`   ✅ [INIT] Coloană 'mod_prescriere' adăugată`);
  } catch (e) {
    console.log(`   ℹ️ [INIT] Coloană 'mod_prescriere' există deja`);
  }
  
  console.log(`✅ [INIT] Inițializare tabele completă`);
};

// Inițializează baza de date (apelat la prima invocare)
let initPromise = null;
let initialized = false;

async function ensureInitialized() {
  if (initialized) {
    console.log(`ℹ️ [INIT] Baza de date este deja inițializată`);
    return;
  }
  if (initPromise) {
    console.log(`⏳ [INIT] Inițializare în curs, așteptare...`);
    return initPromise;
  }

  console.log(`🚀 [INIT] ========================================`);
  console.log(`🚀 [INIT] Început inițializare baza de date`);
  console.log(`🚀 [INIT] ========================================`);

  initPromise = (async () => {
    try {
      await ensureTable();
      
      console.log(`🌱 [INIT] Verificare seeding medicamente...`);
      // Populează medicamentele dacă baza de date este goală
      const db = getInitDb();
      const seedResult = await seedIfEmpty(db, getAsyncInit, runAsyncInit);
      if (seedResult.skipped && seedResult.rows > 0) {
        console.log(`✅ [INIT] Database already populated (${seedResult.rows} medicamente).`);
      } else if (!seedResult.skipped) {
        console.log(`✅ [INIT] Am importat ${seedResult.rows} medicamente din CSV.`);
      } else if (seedResult.reason) {
        console.log(`⚠️ [INIT] Seeding skipped: ${seedResult.reason}`);
      }
      
      initialized = true;
      console.log(`✅ [INIT] ========================================`);
      console.log(`✅ [INIT] Inițializare baza de date completă`);
      console.log(`✅ [INIT] ========================================`);
    } catch (error) {
      console.error('❌ [INIT] Error initializing database:', error);
      console.error('   [INIT] Stack:', error.stack);
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
