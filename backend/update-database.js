import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'medicamente.db');

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(DB_PATH);

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const updateDatabase = async () => {
  try {
    console.log('🔄 Actualizare baza de date...');
    
    // Adaugă coloanele noi dacă nu există
    try {
      await runAsync(`ALTER TABLE medications ADD COLUMN categorie_varsta TEXT`);
      console.log('✅ Coloana categorie_varsta adăugată');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log('ℹ️  Coloana categorie_varsta există deja');
      } else {
        throw e;
      }
    }
    
    try {
      await runAsync(`ALTER TABLE medications ADD COLUMN coduri_boli TEXT`);
      console.log('✅ Coloana coduri_boli adăugată');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        console.log('ℹ️  Coloana coduri_boli există deja');
      } else {
        throw e;
      }
    }
    
    console.log('✅ Baza de date actualizată cu succes!');
    console.log('💡 Pentru a reîncărca datele cu noile coloane, șterge tabelul medications sau resetează baza de date.');
    
  } catch (error) {
    console.error('❌ Eroare la actualizarea bazei de date:', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

updateDatabase();
