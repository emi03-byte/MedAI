import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'medicamente.db');
// CSV-ul este în directorul rădăcină al proiectului, nu în backend
const CSV_PATH = path.join(__dirname, '..', 'public', 'medicamente_cu_boli_COMPLET.csv');

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(DB_PATH);

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const normalizeField = (row, key) => (row[key] ?? '').toString().trim();

const mapRow = (row) => {
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

const reloadMedications = async () => {
  try {
    console.log('🔄 Reîncărcare medicamente din CSV...');
    
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file missing at ${CSV_PATH}`);
    }

    // Șterge toate datele existente
    console.log('🗑️  Ștergere date existente...');
    await runAsync('DELETE FROM medications');
    console.log('✅ Date vechi șterse');

    // Reîncarcă datele din CSV
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

    await new Promise((resolve, reject) => {
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
          processed++;
        })
        .on('end', () => {
          stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
          });
        })
        .on('error', reject);
    });

    console.log(`✅ Am reîncărcat ${processed} medicamente din CSV-ul nou!`);
    console.log(`📁 CSV folosit: ${CSV_PATH}`);
    
  } catch (error) {
    console.error('❌ Eroare la reîncărcarea medicamentelor:', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

reloadMedications();
