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

const start = async () => {
  try {
    await ensureTable();
    const seeded = await seedIfEmpty();
    if (seeded.skipped) {
      console.log(`Database already populated (${seeded.rows} înregistrări).`);
    } else {
      console.log(`Am importat ${seeded.rows} înregistrări din CSV.`);
    }

    if (process.argv.includes('--seed-only')) {
      db.close();
      return;
    }

    app.listen(PORT, () => {
      console.log(`Backend ascultă pe portul ${PORT}`);
    });
  } catch (error) {
    console.error('Eroare la inițializare:', error);
    process.exit(1);
  }
};

start();

