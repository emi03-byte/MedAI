import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import bcrypt from 'bcryptjs';
import * as db from './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const CSV_PATH = path.join(process.cwd(), 'public', 'medicamente_cu_boli_COMPLET.csv');
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const runAsync = db.runAsync;
const getAsync = db.getAsync;
const allAsync = db.allAsync;

const ensureTable = async () => {
  await runAsync(
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
      contributie_max_pensionari_90 TEXT
    )`
  );
  
  // Tabelă pentru utilizatori
  await runAsync(
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
    await runAsync(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending'`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsync(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsync(`ALTER TABLE users ADD COLUMN data_aprobare DATETIME`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsync(`ALTER TABLE users ADD COLUMN deleted_at DATETIME`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  
  // Setare status 'approved' pentru utilizatori existenți (migrare)
  await runAsync(`UPDATE users SET status = 'approved' WHERE status IS NULL OR status = ''`);
  
  // Setare automată contul caruntu.emanuel@gmail.com ca admin (dacă există deja)
  const adminEmail = 'caruntu.emanuel@gmail.com';
  const adminUser = await getAsync('SELECT id, is_admin, status FROM users WHERE email = ?', [adminEmail]);
  if (adminUser) {
    if (!adminUser.is_admin || adminUser.is_admin === 0) {
      console.log(`🔐 [SETUP] Setare cont ${adminEmail} ca admin...`);
      await runAsync(
        'UPDATE users SET is_admin = 1, status = ?, data_aprobare = ? WHERE email = ?',
        ['approved', new Date().toISOString(), adminEmail]
      );
      console.log(`✅ [SETUP] Cont ${adminEmail} setat ca admin`);
    } else {
      console.log(`✅ [SETUP] Cont ${adminEmail} este deja admin`);
    }
  } else {
    console.log(`ℹ️ [SETUP] Contul ${adminEmail} nu există încă. Va fi creat automat ca admin la primul signup.`);
  }
  
  // Tabelă pentru rețete
  await runAsync(
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
  await runAsync(
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
    await runAsync(`ALTER TABLE user_medicines ADD COLUMN substanta_activa TEXT`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsync(`ALTER TABLE user_medicines ADD COLUMN cod_atc TEXT`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
  try {
    await runAsync(`ALTER TABLE user_medicines ADD COLUMN mod_prescriere TEXT`);
  } catch (e) {
    // Coloana există deja, ignoră eroarea
  }
};

const normalizeField = (row, key) => (row[key] ?? '').toString().trim();

const mapRow = (row) => {
  // Unele CSV-uri pot avea un BOM sau caractere ascunse în primul header,
  // așa că folosim prima coloană ca sursă pentru denumire_medicament.
  const keys = Object.keys(row);
  const firstKey = keys[0] || 'Denumire medicament';

  return {
    denumire_medicament: normalizeField(row, firstKey),
    substanta_activa: normalizeField(row, 'Substanta activa'),
    lista_compensare: normalizeField(row, 'Lista de compensare'),
    cod_medicament: normalizeField(row, 'Cod medicament'),
    forma_farmaceutica: normalizeField(row, 'Formă farmaceutica'),
    cod_atc: normalizeField(row, 'Cod ATC'),
    mod_prescriere: normalizeField(row, 'Mod de prescriere'),
    concentratie: normalizeField(row, 'Concentratie'),
    forma_ambalare: normalizeField(row, 'Forma de ambalare'),
    nume_detinator_app: normalizeField(row, 'Nume detinator APP'),
    tara_detinator_app: normalizeField(row, 'Tara detinator APP'),
    cantitate_pe_forma_ambalare: normalizeField(row, 'Cantitate pe forma ambalare'),
    pret_max_forma_ambalare: normalizeField(
      row,
      'Preț maximal al medicamentului raportat la forma de ambalare'
    ),
    pret_max_ut: normalizeField(row, 'Pret maximal al medicamentului raportat la UT'),
    contributie_max_100: normalizeField(
      row,
      'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiază de compensare 100% din prețul de referinta'
    ),
    contributie_max_90_50_20: normalizeField(
      row,
      'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiaza de compensare 90% - sublista A, 50% - sublista B, 20% - sublista D din prețul de referinta'
    ),
    contributie_max_pensionari_90: normalizeField(
      row,
      'Contribuție maxima a asiguratului raportat la UT, pentru asiguratii care beneficiază de compensare 90% din pretul de referinta, pentru pensionari cu venituri de pana la 1.299 lei/luna inclusiv'
    ),
    categorie_varsta: normalizeField(row, 'CategorieVarsta'),
    coduri_boli: normalizeField(row, 'Coduri_Boli'),
  };
};

const seedFromCsv = async () =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_PATH)) {
      reject(new Error(`CSV file missing at ${CSV_PATH}`));
      return;
    }

    const insertSql = `INSERT INTO medications (
      denumire_medicament,
      substanta_activa,
      lista_compensare,
      cod_medicament,
      forma_farmaceutica,
      cod_atc,
      mod_prescriere,
      concentratie,
      forma_ambalare,
      nume_detinator_app,
      tara_detinator_app,
      cantitate_pe_forma_ambalare,
      pret_max_forma_ambalare,
      pret_max_ut,
      contributie_max_100,
      contributie_max_90_50_20,
      contributie_max_pensionari_90,
      categorie_varsta,
      coduri_boli
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    let processed = 0;
    const stmt = db.prepare(insertSql);

    const stream = fs
      .createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        const mapped = mapRow(row);
        stmt.run(
          [
            mapped.denumire_medicament,
            mapped.substanta_activa,
            mapped.lista_compensare,
            mapped.cod_medicament,
            mapped.forma_farmaceutica,
            mapped.cod_atc,
            mapped.mod_prescriere,
            mapped.concentratie,
            mapped.forma_ambalare,
            mapped.nume_detinator_app,
            mapped.tara_detinator_app,
            mapped.cantitate_pe_forma_ambalare,
            mapped.pret_max_forma_ambalare,
            mapped.pret_max_ut,
            mapped.contributie_max_100,
            mapped.contributie_max_90_50_20,
            mapped.contributie_max_pensionari_90,
            mapped.categorie_varsta,
            mapped.coduri_boli,
          ],
          (err) => {
            if (err) {
              stream.destroy(err);
            }
          }
        );
        processed += 1;
      })
      .on('end', () => {
        stmt.finalize((err) => {
          if (err) reject(err);
          else resolve(processed);
        });
      })
      .on('error', (err) => {
        stmt.finalize(() => reject(err));
      });
  });

const seedIfEmpty = async () => {
  const existing = await getAsync('SELECT COUNT(*) as count FROM medications');
  if (existing?.count > 0) {
    return { skipped: true, rows: existing.count };
  }
  await runAsync('DELETE FROM medications');
  const rows = await seedFromCsv();
  return { skipped: false, rows };
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/medications', async (req, res) => {
  try {
    const { search = '', limit = 50, offset = 0 } = req.query;
    // Permite limită mare pentru a încărca toate medicamentele (max 50000 pentru siguranță)
    const safeLimit = limit === 'all' || limit === '0' ? 50000 : Math.min(Number(limit) || 50, 50000);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const params = [];
    let whereClause = '';

    if (search) {
      whereClause =
        'WHERE denumire_medicament LIKE ? OR substanta_activa LIKE ? OR cod_medicament LIKE ?';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    params.push(safeLimit, safeOffset);

    const rows = await allAsync(
      `SELECT * FROM medications ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
      params
    );

    res.json({ items: rows, count: rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/medications/:id', async (req, res) => {
  try {
    const row = await getAsync('SELECT * FROM medications WHERE id = ?', [req.params.id]);
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pentru înregistrare (sign up)
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('📝 [SIGNUP] Cerere primită:', { 
      nume: req.body.nume, 
      email: req.body.email
    });
    const { nume, email, parola } = req.body;

    // Validare
    if (!nume || !email || !parola) {
      console.log('❌ [SIGNUP] Validare eșuată: câmpuri lipsă');
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    if (parola.length < 6) {
      console.log('❌ [SIGNUP] Validare eșuată: parolă prea scurtă');
      return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 6 caractere' });
    }

    // Verifică dacă email-ul există deja (inclusiv conturi șterse)
    const existingUser = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      if (existingUser.deleted_at) {
        console.log('⚠️ [SIGNUP] Email cu cont șters:', email);
        return res.status(409).json({ 
          error: 'Există un cont șters pe acest email. Poți alege restaurare sau cont nou.',
          code: 'ACCOUNT_DELETED'
        });
      }
      console.log('❌ [SIGNUP] Email deja folosit:', email);
      return res.status(400).json({ error: 'Acest email este deja folosit. Te rugăm să folosești alt email.' });
    }

    // Hash-ui parola înainte de salvare
    console.log('🔐 [SIGNUP] Hash-ui parola...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(parola, saltRounds);

    // Verifică dacă este contul de admin
    const isAdmin = email.toLowerCase() === 'caruntu.emanuel@gmail.com';
    const status = isAdmin ? 'approved' : 'pending';
    const adminFlag = isAdmin ? 1 : 0;
    const dataAprobare = isAdmin ? new Date().toISOString() : null;

    // Inserează utilizatorul nou în baza de date
    console.log('💾 [SIGNUP] Inserare utilizator în baza de date...');
    console.log('💾 [SIGNUP] Valori pentru inserare:', { 
      nume, 
      email, 
      status, 
      adminFlag, 
      dataAprobare
    });
    const result = await runAsync(
      'INSERT INTO users (nume, email, parola, status, is_admin, data_aprobare) VALUES (?, ?, ?, ?, ?, ?)',
      [nume, email, hashedPassword, status, adminFlag, dataAprobare]
    );

    // Returnează datele utilizatorului (fără parolă)
    const newUser = await getAsync('SELECT id, nume, email, data_creare, status, is_admin FROM users WHERE id = ?', [result.lastID]);
    console.log('✅ [SIGNUP] Utilizator creat cu succes:', { 
      id: newUser.id, 
      email: newUser.email, 
      status: newUser.status, 
      is_admin: newUser.is_admin
    });
    
    res.status(201).json({ 
      success: true,
      message: isAdmin ? 'Cont creat cu succes! (Admin)' : 'Cont creat cu succes! Contul tău este în așteptare aprobare.',
      user: newUser
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('❌ [SIGNUP] Constraint UNIQUE eșuat:', error.message);
      return res.status(400).json({ error: 'Acest email este deja folosit. Te rugăm să folosești alt email.' });
    }
    console.error('❌ [SIGNUP] Eroare la înregistrare:', error);
    res.status(500).json({ error: 'Eroare la crearea contului' });
  }
});

// Endpoint pentru recuperare cont șters (restaurare sau cont nou)
app.post('/api/auth/recover', async (req, res) => {
  try {
    const { nume, email, parola, mode } = req.body;

    if (!email || !parola || !mode) {
      return res.status(400).json({ error: 'Email, parola și modul sunt obligatorii' });
    }

    if (mode !== 'restore' && mode !== 'new') {
      return res.status(400).json({ error: 'Mod de recuperare invalid' });
    }

    if (mode === 'new' && !nume) {
      return res.status(400).json({ error: 'Numele este obligatoriu pentru cont nou' });
    }

    const deletedUser = await getAsync(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NOT NULL',
      [email]
    );

    if (!deletedUser) {
      return res.status(404).json({ error: 'Nu există cont șters pentru acest email' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(parola, saltRounds);

    if (mode === 'restore') {
      await runAsync(
        'UPDATE users SET deleted_at = NULL, parola = ? WHERE id = ?',
        [hashedPassword, deletedUser.id]
      );
    } else {
      const isAdmin = email.toLowerCase() === 'caruntu.emanuel@gmail.com';
      const status = isAdmin ? 'approved' : 'pending';
      const adminFlag = isAdmin ? 1 : 0;
      const dataAprobare = isAdmin ? new Date().toISOString() : null;

      await runAsync(
        `UPDATE users 
         SET nume = ?, parola = ?, status = ?, is_admin = ?, data_aprobare = ?, deleted_at = NULL, data_creare = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [nume, hashedPassword, status, adminFlag, dataAprobare, deletedUser.id]
      );
      // Curăță rețetele doar pentru cont nou
      await runAsync('DELETE FROM retete WHERE user_id = ?', [deletedUser.id]);
    }

    const updatedUser = await getAsync(
      'SELECT id, nume, email, data_creare, status, is_admin FROM users WHERE id = ?',
      [deletedUser.id]
    );

    res.json({
      success: true,
      message: mode === 'restore' ? 'Cont restaurat cu succes' : 'Cont recreat cu succes',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ [RECOVER] Eroare la recuperare cont:', error);
    res.status(500).json({ error: 'Eroare la recuperarea contului' });
  }
});

// Endpoint pentru autentificare (login)
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 [LOGIN] Cerere primită pentru email:', req.body.email);
    const { email, parola } = req.body;

    // Validare
    if (!email || !parola) {
      console.log('❌ [LOGIN] Validare eșuată: câmpuri lipsă');
      return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
    }

    // Caută utilizatorul în baza de date (inclusiv conturi șterse)
    console.log('🔍 [LOGIN] Căutare utilizator în baza de date...');
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      console.log('❌ [LOGIN] Utilizator negăsit pentru email:', email);
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    if (user.deleted_at) {
      console.log('⚠️ [LOGIN] Cont șters pentru email:', email);
      return res.status(403).json({ 
        error: 'Contul asociat acestui email a fost șters. Poți merge la Înregistrare pentru restaurare sau cont nou.',
        code: 'ACCOUNT_DELETED'
      });
    }

    // Verifică parola (suportă atât parole hash-uite cât și parole în clar pentru compatibilitate)
    console.log('🔐 [LOGIN] Verificare parolă...');
    let isPasswordValid = false;
    
    // Verifică dacă parola este hash-uită (bcrypt hash-urile încep cu $2b$)
    if (user.parola.startsWith('$2b$') || user.parola.startsWith('$2a$') || user.parola.startsWith('$2y$')) {
      // Parola este hash-uită, folosește bcrypt.compare
      isPasswordValid = await bcrypt.compare(parola, user.parola);
      
      // Dacă parola este corectă și nu este hash-uită, hash-ui-o și actualizează în baza de date
      if (isPasswordValid) {
        console.log('✅ [LOGIN] Parolă hash-uită verificată cu succes');
      }
    } else {
      // Parola este în clar (pentru utilizatori existenți), compară direct
      isPasswordValid = user.parola === parola;
      
      // Dacă parola este corectă, hash-ui-o și actualizează în baza de date
      if (isPasswordValid) {
        console.log('🔄 [LOGIN] Parolă în clar detectată, hash-ui și actualizează...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(parola, saltRounds);
        await runAsync('UPDATE users SET parola = ? WHERE id = ?', [hashedPassword, user.id]);
        console.log('✅ [LOGIN] Parolă hash-uită și actualizată în baza de date');
      }
    }
    
    if (!isPasswordValid) {
      console.log('❌ [LOGIN] Parolă incorectă pentru email:', email);
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    // Returnează datele utilizatorului (fără parolă)
    const { parola: _, ...userWithoutPassword } = user;
    // Asigură-te că status și is_admin sunt incluse
    const userResponse = {
      id: userWithoutPassword.id,
      nume: userWithoutPassword.nume,
      email: userWithoutPassword.email,
      data_creare: userWithoutPassword.data_creare,
      status: userWithoutPassword.status || 'pending',
      is_admin: userWithoutPassword.is_admin || 0
    };
    console.log('✅ [LOGIN] Autentificare reușită pentru:', { id: userResponse.id, email: userResponse.email, status: userResponse.status });
    
    res.json({ 
      success: true,
      message: 'Autentificare reușită!',
      user: userResponse
    });
  } catch (error) {
    console.error('❌ [LOGIN] Eroare la autentificare:', error);
    res.status(500).json({ error: 'Eroare la autentificare' });
  }
});

// Endpoint pentru ștergerea contului propriu (soft delete)
app.delete('/api/auth/delete', async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    const user = await getAsync('SELECT id, deleted_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    if (user.deleted_at) {
      return res.status(400).json({ error: 'Contul este deja șters' });
    }

    await runAsync('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);

    res.json({ success: true, message: 'Cont șters cu succes' });
  } catch (error) {
    console.error('❌ [DELETE SELF] Eroare la ștergerea contului:', error);
    res.status(500).json({ error: 'Eroare la ștergerea contului' });
  }
});

// Endpoint pentru verificare utilizator curent
app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log('👤 [ME] Verificare utilizator cu ID:', userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    const user = await getAsync('SELECT id, nume, email, data_creare, status, is_admin FROM users WHERE id = ? AND deleted_at IS NULL', [userId]);
    
    if (!user) {
      console.log('❌ [ME] Utilizator negăsit pentru ID:', userId);
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    console.log('✅ [ME] Utilizator găsit:', { id: user.id, email: user.email, status: user.status });
    res.json({ user });
  } catch (error) {
    console.error('❌ [ME] Eroare la verificare utilizator:', error);
    res.status(500).json({ error: 'Eroare la verificare' });
  }
});

// Endpoint pentru verificare status cont
app.get('/api/auth/status', async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log('📊 [STATUS] Verificare status pentru ID:', userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    const user = await getAsync('SELECT id, status, is_admin FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    res.json({ status: user.status || 'pending', is_admin: user.is_admin || 0 });
  } catch (error) {
    console.error('❌ [STATUS] Eroare la verificare status:', error);
    res.status(500).json({ error: 'Eroare la verificare status' });
  }
});

// Medicamente adăugate de utilizatori (doar pentru utilizatorul curent)
app.get('/api/user-medicines', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }
    const items = await allAsync(
      'SELECT id, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note, created_at, updated_at FROM user_medicines WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ medicines: items });
  } catch (error) {
    console.error('❌ [USER MEDS] Eroare la listare:', error);
    res.status(500).json({ error: 'Eroare la listarea medicamentelor' });
  }
});

app.post('/api/user-medicines', async (req, res) => {
  try {
    const { userId, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note } = req.body;
    if (!userId || !denumire) {
      return res.status(400).json({ error: 'ID utilizator și denumirea sunt obligatorii' });
    }
    const result = await runAsync(
      'INSERT INTO user_medicines (user_id, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, denumire, forma_farmaceutica || null, concentratie || null, substanta_activa || null, cod_atc || null, mod_prescriere || null, note || null]
    );
    const created = await getAsync(
      'SELECT id, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note, created_at, updated_at FROM user_medicines WHERE id = ? AND user_id = ?',
      [result.lastID, userId]
    );
    res.status(201).json({ success: true, medicine: created });
  } catch (error) {
    console.error('❌ [USER MEDS] Eroare la creare:', error);
    res.status(500).json({ error: 'Eroare la crearea medicamentului' });
  }
});

app.put('/api/user-medicines/:id', async (req, res) => {
  try {
    const userId = req.body.userId || req.query.userId;
    const id = req.params.id;
    const { denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note } = req.body;
    if (!userId || !id) {
      return res.status(400).json({ error: 'ID utilizator sau medicament lipsă' });
    }
    const existing = await getAsync(
      'SELECT id FROM user_medicines WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Medicament negăsit' });
    }
    if (!denumire) {
      return res.status(400).json({ error: 'Denumirea este obligatorie' });
    }
    await runAsync(
      `UPDATE user_medicines
       SET denumire = ?, forma_farmaceutica = ?, concentratie = ?, substanta_activa = ?, cod_atc = ?, mod_prescriere = ?, note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [denumire, forma_farmaceutica || null, concentratie || null, substanta_activa || null, cod_atc || null, mod_prescriere || null, note || null, id, userId]
    );
    const updated = await getAsync(
      'SELECT id, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note, created_at, updated_at FROM user_medicines WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ success: true, medicine: updated });
  } catch (error) {
    console.error('❌ [USER MEDS] Eroare la actualizare:', error);
    res.status(500).json({ error: 'Eroare la actualizarea medicamentului' });
  }
});

app.delete('/api/user-medicines/:id', async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId;
    const id = req.params.id;
    if (!userId || !id) {
      return res.status(400).json({ error: 'ID utilizator sau medicament lipsă' });
    }
    const existing = await getAsync(
      'SELECT id FROM user_medicines WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Medicament negăsit' });
    }
    await runAsync('DELETE FROM user_medicines WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [USER MEDS] Eroare la ștergere:', error);
    res.status(500).json({ error: 'Eroare la ștergerea medicamentului' });
  }
});

// Middleware pentru verificare admin
const checkAdmin = async (req, res, next) => {
  try {
    const userId = req.query.userId || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'ID utilizator lipsă' });
    }

    // Verifică dacă utilizatorul este admin (inclusiv dacă este șters, pentru a permite accesul la date)
    // Nu verificăm deleted_at pentru că vrem să permitem adminului să vadă datele chiar dacă conturile sunt șterse
    let user = await getAsync('SELECT is_admin, deleted_at FROM users WHERE id = ?', [userId]);
    
    // Dacă nu găsește cu ID-ul direct, încercă cu integer
    if (!user) {
      const userIdInt = parseInt(userId, 10);
      if (!isNaN(userIdInt)) {
        user = await getAsync('SELECT is_admin, deleted_at FROM users WHERE id = ?', [userIdInt]);
      }
    }
    
    console.log('🔐 [ADMIN CHECK] Verificare admin:', { 
      userId, 
      found: !!user, 
      is_admin: user?.is_admin,
      deleted_at: user?.deleted_at 
    });
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Acces interzis. Doar administratorii pot accesa această resursă.' });
    }
    next();
  } catch (error) {
    console.error('❌ [ADMIN CHECK] Eroare:', error);
    res.status(500).json({ error: 'Eroare la verificare permisiuni' });
  }
};

// Endpoint pentru listarea tuturor cererilor (admin only)
app.get('/api/admin/requests', checkAdmin, async (req, res) => {
  try {
    console.log('📋 [ADMIN] Listare cereri...');
    const { status } = req.query;
    
    const { showDeleted } = req.query;
    let query = 'SELECT id, nume, email, data_creare, status, data_aprobare, is_admin, deleted_at FROM users';
    const params = [];
    const conditions = [];
    
    // Dacă nu se cere explicit istoricul, exclude conturile șterse
    if (!showDeleted || showDeleted !== 'true') {
      conditions.push('deleted_at IS NULL');
    } else {
      // Dacă se cere istoricul, afișează doar conturile șterse
      conditions.push('deleted_at IS NOT NULL');
    }
    
    if (status && status !== 'toate') {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY data_creare DESC';
    
    const requests = await allAsync(query, params);
    
    // Log pentru debugging
    console.log('📋 [ADMIN] Query executat:', { query, params, showDeleted });
    if (requests.length > 0) {
      console.log('📋 [ADMIN] Exemplu request:', {
        id: requests[0].id,
        idType: typeof requests[0].id,
        email: requests[0].email,
        is_admin: requests[0].is_admin,
        deleted_at: requests[0].deleted_at
      });
      // Log toate ID-urile pentru debugging
      const ids = requests.map(r => ({ id: r.id, idType: typeof r.id, email: r.email, deleted_at: r.deleted_at }));
      console.log('📋 [ADMIN] Toate ID-urile returnate:', ids);
    }
    
    console.log(`✅ [ADMIN] Găsite ${requests.length} cereri`);
    res.json({ requests });
  } catch (error) {
    console.error('❌ [ADMIN] Eroare la listare cereri:', error);
    res.status(500).json({ error: 'Eroare la listare cereri' });
  }
});

// Endpoint pentru aprobare cont (admin only)
app.post('/api/admin/approve/:userId', checkAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const adminUserId = req.query.userId || req.body.userId;
    
    console.log('✅ [ADMIN] Aprobare cont:', { targetUserId, adminUserId });
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    const dataAprobare = new Date().toISOString();
    await runAsync(
      'UPDATE users SET status = ?, data_aprobare = ? WHERE id = ?',
      ['approved', dataAprobare, targetUserId]
    );

    const updatedUser = await getAsync('SELECT id, nume, email, status, data_aprobare FROM users WHERE id = ?', [targetUserId]);
    
    console.log('✅ [ADMIN] Cont aprobat:', { id: updatedUser.id, email: updatedUser.email });
    res.json({ 
      success: true,
      message: 'Cont aprobat cu succes',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ [ADMIN] Eroare la aprobare:', error);
    res.status(500).json({ error: 'Eroare la aprobare cont' });
  }
});

// Endpoint pentru respingere cont (admin only)
app.post('/api/admin/reject/:userId', checkAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const adminUserId = req.query.userId || req.body.userId;
    
    console.log('❌ [ADMIN] Respingere cont:', { targetUserId, adminUserId });
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    await runAsync(
      'UPDATE users SET status = ?, data_aprobare = NULL WHERE id = ?',
      ['rejected', targetUserId]
    );

    const updatedUser = await getAsync('SELECT id, nume, email, status FROM users WHERE id = ?', [targetUserId]);
    
    console.log('✅ [ADMIN] Cont respins:', { id: updatedUser.id, email: updatedUser.email });
    res.json({ 
      success: true,
      message: 'Cont respins',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ [ADMIN] Eroare la respingere:', error);
    res.status(500).json({ error: 'Eroare la respingere cont' });
  }
});

// Endpoint pentru schimbare status cont (admin only) - permite orice status și schimbarea tipului
app.post('/api/admin/change-status/:userId', checkAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { status, is_admin } = req.body;
    const adminUserId = req.query.userId || req.body.userId;
    
    console.log('🔄 [ADMIN] Schimbare status cont:', { targetUserId, status, is_admin, adminUserId });
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status invalid. Trebuie să fie: pending, approved sau rejected' });
    }

    // Dacă se aprobă, setează data_aprobare și tipul (is_admin), altfel o șterge
    if (status === 'approved') {
      const dataAprobare = new Date().toISOString();
      // Dacă este specificat is_admin în body, îl folosim, altfel păstrăm valoarea existentă
      if (is_admin !== undefined && is_admin !== null) {
        const adminFlag = is_admin === true || is_admin === 1 || is_admin === '1' ? 1 : 0;
        await runAsync(
          'UPDATE users SET status = ?, data_aprobare = ?, is_admin = ? WHERE id = ?',
          [status, dataAprobare, adminFlag, targetUserId]
        );
      } else {
        await runAsync(
          'UPDATE users SET status = ?, data_aprobare = ? WHERE id = ?',
          [status, dataAprobare, targetUserId]
        );
      }
    } else {
      await runAsync(
        'UPDATE users SET status = ?, data_aprobare = NULL WHERE id = ?',
        [status, targetUserId]
      );
    }

    const updatedUser = await getAsync('SELECT id, nume, email, status, data_aprobare, is_admin FROM users WHERE id = ?', [targetUserId]);
    
    console.log('✅ [ADMIN] Status cont schimbat:', { id: updatedUser.id, email: updatedUser.email, status: updatedUser.status, is_admin: updatedUser.is_admin });
    res.json({ 
      success: true,
      message: `Status cont schimbat la: ${status}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ [ADMIN] Eroare la schimbare status:', error);
    res.status(500).json({ error: 'Eroare la schimbare status cont' });
  }
});

// Endpoint pentru ștergerea unui cont (admin only)
app.delete('/api/admin/delete-user/:userId', checkAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const adminUserId = req.query.userId || req.body.userId;
    
    console.log('🗑️ [ADMIN] Ștergere cont - Route hit:', { 
      targetUserId, 
      adminUserId,
      method: req.method,
      path: req.path,
      url: req.url
    });
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    // Verifică dacă utilizatorul există (inclusiv dacă e deja șters, pentru a putea fi restaurat)
    let user = await getAsync('SELECT id, email, deleted_at FROM users WHERE id = ?', [targetUserId]);
    
    // Dacă nu găsește cu ID-ul direct, încercă cu integer
    if (!user) {
      const targetUserIdInt = parseInt(targetUserId, 10);
      if (!isNaN(targetUserIdInt)) {
        user = await getAsync('SELECT id, email, deleted_at FROM users WHERE id = ?', [targetUserIdInt]);
      }
    }
    
    console.log('🗑️ [ADMIN] Utilizator găsit pentru ștergere:', { 
      found: !!user, 
      id: user?.id, 
      email: user?.email, 
      alreadyDeleted: !!user?.deleted_at 
    });
    
    if (!user) {
      console.error('❌ [ADMIN] Utilizatorul nu a fost găsit pentru ștergere:', targetUserId);
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
    }

    // Nu permite ștergerea propriului cont
    if (parseInt(targetUserId) === parseInt(adminUserId)) {
      return res.status(400).json({ error: 'Nu poți șterge propriul cont' });
    }

    // Nu permite ștergerea contului principal de admin
    if (user.email.toLowerCase() === 'caruntu.emanuel@gmail.com') {
      return res.status(400).json({ error: 'Nu poți șterge contul principal de administrator' });
    }

    // Soft delete: marchează contul ca șters (dacă nu este deja șters)
    const updateResult = await runAsync('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    // Verifică că update-ul a fost reușit
    const updatedUser = await getAsync('SELECT id, email, deleted_at FROM users WHERE id = ?', [user.id]);
    
    console.log('✅ [ADMIN] Cont marcat ca șters:', { 
      id: user.id, 
      email: user.email,
      deleted_at: updatedUser?.deleted_at,
      updateSuccess: !!updatedUser?.deleted_at
    });
    res.json({ 
      success: true,
      message: 'Cont șters cu succes'
    });
  } catch (error) {
    console.error('❌ [ADMIN] Eroare la ștergere cont:', error);
    res.status(500).json({ error: 'Eroare la ștergere cont' });
  }
});

// Endpoint pentru restaurarea unui cont șters (admin only)
app.post('/api/admin/restore-user/:userId', checkAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const adminUserId = req.query.userId || req.body.userId;
    
    console.log('♻️ [ADMIN] Restaurare cont:', { targetUserId, adminUserId });
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    // Verifică dacă utilizatorul există și este șters
    const user = await getAsync('SELECT id, email, deleted_at FROM users WHERE id = ?', [targetUserId]);
    if (!user) {
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
    }

    if (!user.deleted_at) {
      return res.status(400).json({ error: 'Contul nu este șters' });
    }

    // Restaurează contul (șterge deleted_at)
    await runAsync('UPDATE users SET deleted_at = NULL WHERE id = ?', [targetUserId]);
    
    console.log('✅ [ADMIN] Cont restaurat:', { id: user.id, email: user.email });
    res.json({ 
      success: true,
      message: 'Cont restaurat cu succes'
    });
  } catch (error) {
    console.error('❌ [ADMIN] Eroare la restaurare cont:', error);
    res.status(500).json({ error: 'Eroare la restaurare cont' });
  }
});

// Endpoint pentru obținerea rețetelor unui utilizator (admin only)
app.get('/api/admin/user-prescriptions/:userId', checkAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const adminUserId = req.query.userId || req.body.userId;
    
    console.log('📋 [ADMIN] Cerere rețete pentru utilizator:', { targetUserId, adminUserId, targetUserIdType: typeof targetUserId });
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    // Verifică dacă utilizatorul există (inclusiv conturile șterse, pentru admin)
    // IMPORTANT: NU verificăm deleted_at pentru că vrem să permitem accesul la rețete și pentru conturile șterse
    
    console.log('📋 [ADMIN] Căutare utilizator cu ID:', { 
      original: targetUserId, 
      type: typeof targetUserId
    });
    
    // Convertim ID-ul la integer pentru a se potrivi cu tipul coloanei PRIMARY KEY INTEGER
    const targetUserIdInt = parseInt(targetUserId, 10);
    if (isNaN(targetUserIdInt)) {
      console.error('❌ [ADMIN] ID utilizator invalid (nu este număr):', targetUserId);
      return res.status(400).json({ error: 'ID utilizator invalid' });
    }
    
    // Query simplu - NU verificăm deleted_at pentru a permite accesul și la conturile șterse
    const user = await getAsync('SELECT id, nume, email, deleted_at FROM users WHERE id = ?', [targetUserIdInt]);
    
    console.log('📋 [ADMIN] Rezultat query utilizator:', { 
      found: !!user, 
      searchedId: targetUserIdInt,
      userId: user?.id, 
      email: user?.email, 
      deleted_at: user?.deleted_at,
      isDeleted: !!user?.deleted_at
    });
    
    if (!user) {
      // Verifică dacă există utilizatori în baza de date pentru debugging
      const allUsers = await allAsync('SELECT id, email, deleted_at FROM users ORDER BY id DESC LIMIT 10');
      console.error('❌ [ADMIN] Utilizatorul nu a fost găsit în baza de date pentru ID:', targetUserId);
      console.error('❌ [ADMIN] Ultimii 10 utilizatori din baza de date:', allUsers);
      
      // Verifică dacă există utilizatori cu deleted_at
      const deletedUsers = await allAsync('SELECT id, email, deleted_at FROM users WHERE deleted_at IS NOT NULL ORDER BY id DESC LIMIT 10');
      console.error('❌ [ADMIN] Utilizatori șterși din baza de date:', deletedUsers);
      
      return res.status(404).json({ error: `Utilizatorul nu a fost găsit (ID: ${targetUserId}). Verifică console-ul serverului pentru detalii.` });
    }

    // Obține toate rețetele utilizatorului (rețetele rămân în baza de date chiar dacă contul este șters)
    // Folosim ID-ul utilizatorului găsit pentru a ne asigura că avem cel corect
    const prescriptions = await allAsync(
      `SELECT id, nume_pacient, medicamente, planuri_tratament, indicatii_pacient, indicatii_medic, data_creare 
       FROM retete 
       WHERE user_id = ? 
       ORDER BY data_creare DESC`,
      [user.id]
    );

    console.log(`📋 [ADMIN] Găsite ${prescriptions.length} rețete în baza de date pentru utilizator ${targetUserId}`);

    // Parsează JSON-urile din baza de date
    const parsedPrescriptions = prescriptions.map(prescription => {
      try {
        return {
          ...prescription,
          medicamente: JSON.parse(prescription.medicamente || '[]'),
          planuri_tratament: prescription.planuri_tratament ? JSON.parse(prescription.planuri_tratament) : null
        };
      } catch (parseError) {
        console.error('❌ [ADMIN] Eroare la parsarea JSON pentru rețetă:', prescription.id, parseError);
        return {
          ...prescription,
          medicamente: [],
          planuri_tratament: null
        };
      }
    });

    console.log(`✅ [ADMIN] Rețete parseate cu succes pentru utilizator ${targetUserId}: ${parsedPrescriptions.length} rețete`);
    res.json({ 
      success: true,
      user: { id: user.id, nume: user.nume, email: user.email },
      prescriptions: parsedPrescriptions 
    });
  } catch (error) {
    console.error('❌ [ADMIN] Eroare la obținerea rețetelor:', error);
    console.error('❌ [ADMIN] Stack trace:', error.stack);
    res.status(500).json({ error: 'Eroare la obținerea rețetelor: ' + error.message });
  }
});

// Endpoint pentru ștergerea unei rețete (admin only)
app.delete('/api/admin/prescriptions/:prescriptionId', checkAdmin, async (req, res) => {
  try {
    const prescriptionId = req.params.prescriptionId;
    const adminUserId = req.query.userId || req.body.userId;
    
    console.log('🗑️ [ADMIN] Ștergere rețetă:', { prescriptionId, adminUserId });
    
    if (!prescriptionId) {
      return res.status(400).json({ error: 'ID rețetă lipsă' });
    }

    // Verifică dacă rețeta există
    const prescription = await getAsync('SELECT id, user_id FROM retete WHERE id = ?', [prescriptionId]);
    if (!prescription) {
      return res.status(404).json({ error: 'Rețetă negăsită' });
    }

    // Șterge rețeta
    await runAsync('DELETE FROM retete WHERE id = ?', [prescriptionId]);
    
    console.log('✅ [ADMIN] Rețetă ștearsă:', prescriptionId);
    res.json({ 
      success: true,
      message: 'Rețetă ștearsă cu succes'
    });
  } catch (error) {
    console.error('❌ [ADMIN] Eroare la ștergerea rețetei:', error);
    res.status(500).json({ error: 'Eroare la ștergerea rețetei' });
  }
});

// Endpoint pentru salvarea unei rețete
app.post('/api/prescriptions', async (req, res) => {
  try {
    console.log('💾 [PRESCRIPTION] Cerere de salvare rețetă primită');
    console.log('📦 [PRESCRIPTION] Body primit:', JSON.stringify(req.body, null, 2));
    const { userId, numePacient, medicamente, planuriTratament, indicatiiPacient, indicatiiMedic } = req.body;

    // Validare
    if (!userId) {
      console.error('❌ [PRESCRIPTION] ID utilizator lipsă');
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    console.log(`📋 [PRESCRIPTION] Validare: userId=${userId}, medicamente type=${typeof medicamente}, isArray=${Array.isArray(medicamente)}, length=${medicamente?.length || 0}`);

    // Permite salvarea fără medicamente (pentru notițe medicale)
    const medicamenteArray = medicamente && Array.isArray(medicamente) ? medicamente : [];

    // Verifică dacă utilizatorul există și este aprobat
    const user = await getAsync('SELECT id, status FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Contul tău nu este aprobat. Te rugăm să aștepți aprobarea administratorului.' });
    }

    // Salvează rețeta în baza de date
    const result = await runAsync(
      `INSERT INTO retete (user_id, nume_pacient, medicamente, planuri_tratament, indicatii_pacient, indicatii_medic) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        numePacient || null,
        medicamenteArray.length > 0 ? JSON.stringify(medicamenteArray) : JSON.stringify([]),
        planuriTratament ? JSON.stringify(planuriTratament) : null,
        indicatiiPacient || null,
        indicatiiMedic || null
      ]
    );

    const newPrescription = await getAsync(
      'SELECT * FROM retete WHERE id = ?',
      [result.lastID]
    );

    console.log('✅ [PRESCRIPTION] Rețetă salvată cu succes:', { id: newPrescription.id, userId });
    
    res.status(201).json({
      success: true,
      message: 'Rețetă salvată cu succes!',
      prescription: newPrescription
    });
  } catch (error) {
    console.error('❌ [PRESCRIPTION] Eroare la salvarea rețetei:', error);
    res.status(500).json({ error: 'Eroare la salvarea rețetei' });
  }
});

// Endpoint pentru obținerea istoricului rețetelor unui utilizator
app.get('/api/prescriptions', async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log('📋 [PRESCRIPTIONS] Cerere istoric rețete pentru utilizator:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    // Verifică dacă utilizatorul este aprobat
    const user = await getAsync('SELECT status FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Contul tău nu este aprobat. Te rugăm să aștepți aprobarea administratorului.' });
    }

    const prescriptions = await allAsync(
      `SELECT id, nume_pacient, medicamente, planuri_tratament, indicatii_pacient, indicatii_medic, data_creare 
       FROM retete 
       WHERE user_id = ? 
       ORDER BY data_creare DESC`,
      [userId]
    );

    // Parsează JSON-urile din baza de date
    const parsedPrescriptions = prescriptions.map(prescription => ({
      ...prescription,
      medicamente: JSON.parse(prescription.medicamente || '[]'),
      planuri_tratament: prescription.planuri_tratament ? JSON.parse(prescription.planuri_tratament) : null
    }));

    console.log(`✅ [PRESCRIPTIONS] Găsite ${parsedPrescriptions.length} rețete pentru utilizator ${userId}`);
    res.json({ prescriptions: parsedPrescriptions });
  } catch (error) {
    console.error('❌ [PRESCRIPTIONS] Eroare la obținerea rețetelor:', error);
    res.status(500).json({ error: 'Eroare la obținerea rețetelor' });
  }
});

// Endpoint pentru ștergerea unei rețete individuale
app.delete('/api/prescriptions/:id', async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const userId = req.query.userId;
    
    console.log('🗑️ [DELETE PRESCRIPTION] Cerere ștergere rețetă:', { prescriptionId, userId });

    if (!prescriptionId) {
      return res.status(400).json({ error: 'ID rețetă lipsă' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    // Verifică dacă rețeta există și aparține utilizatorului
    const prescription = await getAsync(
      'SELECT * FROM retete WHERE id = ? AND user_id = ?',
      [prescriptionId, userId]
    );

    if (!prescription) {
      console.log('❌ [DELETE PRESCRIPTION] Rețetă negăsită sau nu aparține utilizatorului');
      return res.status(404).json({ error: 'Rețetă negăsită sau nu ai permisiunea de a o șterge' });
    }

    // Șterge rețeta
    await runAsync('DELETE FROM retete WHERE id = ? AND user_id = ?', [prescriptionId, userId]);

    console.log('✅ [DELETE PRESCRIPTION] Rețetă ștearsă cu succes:', prescriptionId);
    res.json({ 
      success: true,
      message: 'Rețetă ștearsă cu succes'
    });
  } catch (error) {
    console.error('❌ [DELETE PRESCRIPTION] Eroare la ștergerea rețetei:', error);
    res.status(500).json({ error: 'Eroare la ștergerea rețetei' });
  }
});

// Endpoint pentru ștergerea tuturor rețetelor unui utilizator
app.delete('/api/prescriptions', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    console.log('🗑️ [DELETE ALL PRESCRIPTIONS] Cerere ștergere toate rețetele pentru utilizator:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'ID utilizator lipsă' });
    }

    // Șterge toate rețetele utilizatorului
    const result = await runAsync('DELETE FROM retete WHERE user_id = ?', [userId]);

    console.log('✅ [DELETE ALL PRESCRIPTIONS] Toate rețetele au fost șterse pentru utilizator:', userId);
    res.json({ 
      success: true,
      message: 'Toate rețetele au fost șterse cu succes',
      deletedCount: result.changes || 0
    });
  } catch (error) {
    console.error('❌ [DELETE ALL PRESCRIPTIONS] Eroare la ștergerea rețetelor:', error);
    res.status(500).json({ error: 'Eroare la ștergerea rețetelor' });
  }
});

const start = async () => {
  try {
    console.log('🔄 Inițializare backend...');
    await db.init();
    if (db.isAzure()) {
      console.log('✅ Conectat la Azure SQL (producție)');
    } else {
      await ensureTable();
      console.log('✅ Tabele verificate/create');
      const seeded = await seedIfEmpty();
      if (seeded.skipped) {
        console.log(`✅ Database already populated (${seeded.rows} înregistrări).`);
      } else {
        console.log(`✅ Am importat ${seeded.rows} înregistrări din CSV.`);
      }
    }

    if (process.argv.includes('--seed-only')) {
      db.close();
      return;
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅✅✅ Backend ascultă pe portul ${PORT} ✅✅✅\n`);
      console.log(`✅ Rute disponibile:`);
      console.log(`   GET  /health`);
      console.log(`   GET  /api/medications`);
      console.log(`   POST /api/auth/signup`);
      console.log(`   POST /api/auth/login`);
      console.log(`   GET  /api/auth/me`);
      console.log(`   POST /api/prescriptions`);
      console.log(`   GET  /api/prescriptions`);
      console.log(`   DELETE /api/prescriptions/:id`);
      console.log(`   DELETE /api/prescriptions?userId=X\n`);
    });
  } catch (error) {
    console.error('❌ Eroare la inițializare:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

start();

