const bcrypt = require('bcryptjs');
const { seedIfEmpty } = require('./seedMedications');
const { runAsync, getAsync, getDb } = require('./db');

// Funcții wrapper pentru compatibilitate
async function runAsyncInit(sqlQuery, params = []) {
  return await runAsync(sqlQuery, params);
}

async function getAsyncInit(sqlQuery, params = []) {
  return await getAsync(sqlQuery, params);
}

function getInitDb() {
  return getDb();
}

// Helper pentru a verifica dacă o tabelă există în SQL Server
async function tableExists(tableName) {
  try {
    const result = await getAsyncInit(
      `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?`,
      [tableName]
    );
    return result !== null;
  } catch (err) {
    console.warn(`⚠️ [INIT] Eroare la verificarea tabelei ${tableName}:`, err.message);
    return false;
  }
}

// Helper pentru a verifica dacă o coloană există
async function columnExists(tableName, columnName) {
  try {
    const result = await getAsyncInit(
      `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );
    return result !== null;
  } catch (err) {
    return false;
  }
}

const ensureTable = async () => {
  console.log(`🔄 [INIT] Început inițializare tabele...`);
  
  console.log(`📋 [INIT] Creare tabelă medications...`);
  if (!(await tableExists('medications'))) {
    await runAsyncInit(
      `CREATE TABLE medications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        denumire_medicament NVARCHAR(MAX),
        substanta_activa NVARCHAR(MAX),
        lista_compensare NVARCHAR(MAX),
        cod_medicament NVARCHAR(MAX),
        forma_farmaceutica NVARCHAR(MAX),
        cod_atc NVARCHAR(MAX),
        mod_prescriere NVARCHAR(MAX),
        concentratie NVARCHAR(MAX),
        forma_ambalare NVARCHAR(MAX),
        nume_detinator_app NVARCHAR(MAX),
        tara_detinator_app NVARCHAR(MAX),
        cantitate_pe_forma_ambalare NVARCHAR(MAX),
        pret_max_forma_ambalare NVARCHAR(MAX),
        pret_max_ut NVARCHAR(MAX),
        contributie_max_100 NVARCHAR(MAX),
        contributie_max_90_50_20 NVARCHAR(MAX),
        contributie_max_pensionari_90 NVARCHAR(MAX),
        categorie_varsta NVARCHAR(MAX),
        coduri_boli NVARCHAR(MAX)
      )`
    );
    console.log(`✅ [INIT] Tabelă medications creată`);
  } else {
    console.log(`✅ [INIT] Tabelă medications există deja`);
  }

  console.log(`📋 [INIT] Creare tabelă users...`);
  if (!(await tableExists('users'))) {
    await runAsyncInit(
      `CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nume NVARCHAR(MAX) NOT NULL,
        email NVARCHAR(MAX) NOT NULL UNIQUE,
        parola NVARCHAR(MAX) NOT NULL,
        data_creare DATETIME2 DEFAULT GETDATE(),
        status NVARCHAR(MAX) DEFAULT 'pending',
        is_admin INT DEFAULT 0,
        data_aprobare DATETIME2,
        deleted_at DATETIME2
      )`
    );
    console.log(`✅ [INIT] Tabelă users creată`);
  } else {
    console.log(`✅ [INIT] Tabelă users există deja`);
  }

  console.log(`🔄 [INIT] Verificare migrări coloane users...`);
  // Migrare: adăugare coloane pentru utilizatori existenți (dacă nu există deja)
  if (!(await columnExists('users', 'status'))) {
    await runAsyncInit(`ALTER TABLE users ADD status NVARCHAR(MAX) DEFAULT 'pending'`);
    console.log(`   ✅ [INIT] Coloană 'status' adăugată`);
  } else {
    console.log(`   ℹ️ [INIT] Coloană 'status' există deja`);
  }
  if (!(await columnExists('users', 'is_admin'))) {
    await runAsyncInit(`ALTER TABLE users ADD is_admin INT DEFAULT 0`);
    console.log(`   ✅ [INIT] Coloană 'is_admin' adăugată`);
  } else {
    console.log(`   ℹ️ [INIT] Coloană 'is_admin' există deja`);
  }
  if (!(await columnExists('users', 'data_aprobare'))) {
    await runAsyncInit(`ALTER TABLE users ADD data_aprobare DATETIME2`);
    console.log(`   ✅ [INIT] Coloană 'data_aprobare' adăugată`);
  } else {
    console.log(`   ℹ️ [INIT] Coloană 'data_aprobare' există deja`);
  }
  if (!(await columnExists('users', 'deleted_at'))) {
    await runAsyncInit(`ALTER TABLE users ADD deleted_at DATETIME2`);
    console.log(`   ✅ [INIT] Coloană 'deleted_at' adăugată`);
  } else {
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
    const result = await runAsyncInit(
      `INSERT INTO users (nume, email, parola, status, is_admin, data_aprobare) 
       OUTPUT INSERTED.id
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
       OUTPUT INSERTED.id
       VALUES (@p0, @p1, @p2, @p3, @p4, @p5)`,
      [testName, testEmail, hashedPassword, 'approved', 0, new Date().toISOString()]
    );
    console.log(`✅ [SETUP] Cont test creat: ${testName} (${testEmail})`);
  }

  console.log(`📋 [INIT] Creare tabelă retete...`);
  if (!(await tableExists('retete'))) {
    await runAsyncInit(
      `CREATE TABLE retete (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        nume_pacient NVARCHAR(MAX),
        medicamente NVARCHAR(MAX) NOT NULL,
        planuri_tratament NVARCHAR(MAX),
        indicatii_pacient NVARCHAR(MAX),
        indicatii_medic NVARCHAR(MAX),
        data_creare DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );
    console.log(`✅ [INIT] Tabelă retete creată`);
  } else {
    console.log(`✅ [INIT] Tabelă retete există deja`);
  }

  console.log(`📋 [INIT] Creare tabelă user_medicines...`);
  if (!(await tableExists('user_medicines'))) {
    await runAsyncInit(
      `CREATE TABLE user_medicines (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        denumire NVARCHAR(MAX) NOT NULL,
        forma_farmaceutica NVARCHAR(MAX),
        concentratie NVARCHAR(MAX),
        substanta_activa NVARCHAR(MAX),
        cod_atc NVARCHAR(MAX),
        mod_prescriere NVARCHAR(MAX),
        note NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );
    console.log(`✅ [INIT] Tabelă user_medicines creată`);
  } else {
    console.log(`✅ [INIT] Tabelă user_medicines există deja`);
  }

  console.log(`🔄 [INIT] Verificare migrări coloane user_medicines...`);
  // Migrare: adăugare coloane pentru user_medicines (dacă nu există deja)
  if (!(await columnExists('user_medicines', 'substanta_activa'))) {
    await runAsyncInit(`ALTER TABLE user_medicines ADD substanta_activa NVARCHAR(MAX)`);
    console.log(`   ✅ [INIT] Coloană 'substanta_activa' adăugată`);
  } else {
    console.log(`   ℹ️ [INIT] Coloană 'substanta_activa' există deja`);
  }
  if (!(await columnExists('user_medicines', 'cod_atc'))) {
    await runAsyncInit(`ALTER TABLE user_medicines ADD cod_atc NVARCHAR(MAX)`);
    console.log(`   ✅ [INIT] Coloană 'cod_atc' adăugată`);
  } else {
    console.log(`   ℹ️ [INIT] Coloană 'cod_atc' există deja`);
  }
  if (!(await columnExists('user_medicines', 'mod_prescriere'))) {
    await runAsyncInit(`ALTER TABLE user_medicines ADD mod_prescriere NVARCHAR(MAX)`);
    console.log(`   ✅ [INIT] Coloană 'mod_prescriere' adăugată`);
  } else {
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
  console.log(`🚀 [INIT] Început inițializare baza de date Azure SQL`);
  console.log(`🚀 [INIT] ========================================`);

  initPromise = (async () => {
    try {
      await ensureTable();
      
      console.log(`🌱 [INIT] Verificare seeding medicamente...`);
      // Populează medicamentele dacă baza de date este goală
      const seedResult = await seedIfEmpty(null, getAsyncInit, runAsyncInit);
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
  runAsyncInit,
  getAsyncInit,
  getInitDb,
};
