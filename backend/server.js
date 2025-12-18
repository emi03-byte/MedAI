import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import sqlite3 from 'sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const sqlite = sqlite3.verbose();

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'medicamente.db');
const CSV_PATH = path.join(process.cwd(), 'counter-app', 'public', 'medicamente_cnas.csv');
const PORT = process.env.PORT || 3001;

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite.Database(DB_PATH);

app.use(cors());
app.use(express.json());

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

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
      data_creare DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  
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
      contributie_max_pensionari_90
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
    console.log('📝 [SIGNUP] Cerere primită:', { nume: req.body.nume, email: req.body.email });
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

    // Verifică dacă email-ul există deja
    const existingUser = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      console.log('❌ [SIGNUP] Email deja folosit:', email);
      return res.status(400).json({ error: 'Acest email este deja folosit. Te rugăm să folosești alt email.' });
    }

    // Inserează utilizatorul nou în baza de date
    console.log('💾 [SIGNUP] Inserare utilizator în baza de date...');
    const result = await runAsync(
      'INSERT INTO users (nume, email, parola) VALUES (?, ?, ?)',
      [nume, email, parola]
    );

    // Returnează datele utilizatorului (fără parolă)
    const newUser = await getAsync('SELECT id, nume, email, data_creare FROM users WHERE id = ?', [result.lastID]);
    console.log('✅ [SIGNUP] Utilizator creat cu succes:', { id: newUser.id, email: newUser.email });
    
    res.status(201).json({ 
      success: true,
      message: 'Cont creat cu succes!',
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

    // Caută utilizatorul în baza de date
    console.log('🔍 [LOGIN] Căutare utilizator în baza de date...');
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      console.log('❌ [LOGIN] Utilizator negăsit pentru email:', email);
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    // Verifică parola (în producție ar trebui să fie hash-uită)
    if (user.parola !== parola) {
      console.log('❌ [LOGIN] Parolă incorectă pentru email:', email);
      return res.status(401).json({ error: 'Email sau parolă incorectă' });
    }

    // Returnează datele utilizatorului (fără parolă)
    const { parola: _, ...userWithoutPassword } = user;
    console.log('✅ [LOGIN] Autentificare reușită pentru:', { id: userWithoutPassword.id, email: userWithoutPassword.email });
    
    res.json({ 
      success: true,
      message: 'Autentificare reușită!',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('❌ [LOGIN] Eroare la autentificare:', error);
    res.status(500).json({ error: 'Eroare la autentificare' });
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

    const user = await getAsync('SELECT id, nume, email, data_creare FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      console.log('❌ [ME] Utilizator negăsit pentru ID:', userId);
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    console.log('✅ [ME] Utilizator găsit:', { id: user.id, email: user.email });
    res.json({ user });
  } catch (error) {
    console.error('❌ [ME] Eroare la verificare utilizator:', error);
    res.status(500).json({ error: 'Eroare la verificare' });
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

    // Verifică dacă utilizatorul există
    const user = await getAsync('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
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
    await ensureTable();
    console.log('✅ Tabele verificate/create');
    
    const seeded = await seedIfEmpty();
    if (seeded.skipped) {
      console.log(`✅ Database already populated (${seeded.rows} înregistrări).`);
    } else {
      console.log(`✅ Am importat ${seeded.rows} înregistrări din CSV.`);
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

