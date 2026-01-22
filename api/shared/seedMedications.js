const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Pentru Azure Functions, CSV-ul este în public/ folder (deployat cu frontend-ul)
// În Azure, public/ este disponibil la rădăcina site-ului
function getCsvPath() {
  // Încearcă mai multe locații posibile
  // Prioritate: api/ folder (pentru Azure Functions), apoi public/ (pentru static files)
  const possiblePaths = [
    // În folderul api/ (accesibil pentru Azure Functions)
    path.join(__dirname, '../medicamente_cu_boli_COMPLET.csv'),
    path.join(process.cwd(), 'medicamente_cu_boli_COMPLET.csv'),
    // În public/ (pentru static files în Azure)
    path.join(process.cwd(), 'public', 'medicamente_cu_boli_COMPLET.csv'),
    path.join(__dirname, '../../public', 'medicamente_cu_boli_COMPLET.csv'),
    // Path-uri Azure specifice
    path.join('/home', 'site', 'wwwroot', 'api', 'medicamente_cu_boli_COMPLET.csv'), // Azure - în api folder
    path.join('/home', 'site', 'wwwroot', 'public', 'medicamente_cu_boli_COMPLET.csv'), // Azure - în public
    path.join('/home', 'site', 'wwwroot', 'medicamente_cu_boli_COMPLET.csv'), // Azure - la rădăcină
  ];
  
  for (const csvPath of possiblePaths) {
    if (fs.existsSync(csvPath)) {
      console.log(`✅ CSV găsit la: ${csvPath}`);
      return csvPath;
    }
  }
  
  console.warn('⚠️ CSV nu a fost găsit în niciuna dintre locațiile așteptate:', possiblePaths);
  return null;
}

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

async function seedFromCsv(runAsyncInit, csvPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) {
      reject(new Error(`CSV file missing at ${csvPath}`));
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

    const rows = [];
    let processed = 0;

    const stream = fs
      .createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const mapped = mapRow(row);
        rows.push([
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
        ]);
        processed += 1;
      })
      .on('end', async () => {
        try {
          console.log(`📊 [SEED] Procesare ${processed} rânduri din CSV...`);
          console.log(`   [SEED] Inserare în baza de date (aceasta poate dura câteva minute)...`);
          
          // Inserează rând cu rând (pentru simplitate și compatibilitate)
          let inserted = 0;
          for (const row of rows) {
            await runAsyncInit(insertSql, row);
            inserted += 1;
            
            // Log progres la fiecare 100 rânduri
            if (inserted % 100 === 0 || inserted === rows.length) {
              console.log(`   ✅ [SEED] Inserat ${inserted} / ${rows.length} medicamente`);
            }
          }
          
          console.log(`✅ [SEED] Import complet: ${processed} medicamente inserate`);
          resolve(processed);
        } catch (err) {
          console.error(`❌ [SEED] Eroare la inserare:`, err);
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function seedIfEmpty(db, getAsyncInit, runAsyncInit) {
  try {
    const existing = await getAsyncInit('SELECT COUNT(*) as count FROM medications');
    const count = existing?.count || 0;
    if (count > 0) {
      console.log(`ℹ️ [SEED] Baza de date conține deja ${count} medicamente`);
      return { skipped: true, rows: count };
    }

    const csvPath = getCsvPath();
    if (!csvPath) {
      console.warn('⚠️ CSV file not found, skipping medication seeding');
      return { skipped: true, rows: 0, reason: 'CSV not found' };
    }

    console.log(`🗑️ [SEED] Ștergere medicamente existente...`);
    await runAsyncInit('DELETE FROM medications');
    console.log(`✅ [SEED] Medicamente șterse`);
    
    console.log(`📥 [SEED] Început import din CSV: ${csvPath}`);
    const rows = await seedFromCsv(runAsyncInit, csvPath);
    return { skipped: false, rows };
  } catch (error) {
    console.error('❌ [SEED] Error seeding medications:', error);
    console.error('   [SEED] Stack:', error.stack);
    return { skipped: true, rows: 0, error: error.message };
  }
}

module.exports = {
  seedIfEmpty,
  getCsvPath,
};
