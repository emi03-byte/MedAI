# -*- coding: utf-8 -*-
"""Conținut text pentru documentația de licență MedAI."""

TITLE = "Dezvoltarea unei aplicații web inteligente pentru gestionarea medicamentelor compensate CNAS și asistarea prescrierii medicale"

BIBLIOGRAPHY = [
    "[1] React Documentation, https://react.dev/, 09.06.2026",
    "[2] Vite Documentation, https://vitejs.dev/, 09.06.2026",
    "[3] Express.js Guide, https://expressjs.com/, 09.06.2026",
    "[4] Microsoft Azure Documentation, https://learn.microsoft.com/azure/, 09.06.2026",
    "[5] OpenAI API Reference, https://platform.openai.com/docs/, 09.06.2026",
    "[6] Playwright Documentation, https://playwright.dev/, 09.06.2026",
    "[7] Casa Națională de Asigurări de Sănătate, https://cnas.ro/, 09.06.2026",
    "[8] Medscape – Drug Reference, https://www.medscape.com/, 09.06.2026",
    "[9] Epocrates – Clinical Reference, https://www.epocrates.com/, 09.06.2026",
    "[10] Drugs.com, https://www.drugs.com/, 09.06.2026",
    "[11] bcrypt – Password Hashing, https://github.com/kelektiv/node.bcrypt.js, 09.06.2026",
    "[12] Web Speech API, https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API, 09.06.2026",
    "[13] PapaParse CSV Parser, https://www.papaparse.com/, 09.06.2026",
    "[14] IEEE Xplore – Digital Health, https://ieeexplore.ieee.org/, 09.06.2026",
    "[15] html2pdf.js, https://github.com/eKoopmans/html2pdf.js, 09.06.2026",
    "[16] SQLite Documentation, https://www.sqlite.org/docs.html, 09.06.2026",
    "[17] Node.js Documentation, https://nodejs.org/docs/, 09.06.2026",
    "[18] ICD-10 Coduri de boală, https://www.who.int/standards/classifications/, 09.06.2026",
]

COMPARISON_HEADERS = [
    "Caracteristică",
    "Medscape",
    "Epocrates",
    "Drugs.com",
    "Lista CNAS",
    "MedAI (aplicația propusă)",
]

COMPARISON_ROWS = [
    ["Bază de date medicamente națională (CNAS)", "Nu", "Nu", "Nu", "Da", "Da"],
    ["Mapare medicament–boală (coduri ICD)", "Parțial", "Parțial", "Nu", "Nu", "Da (99,98%)"],
    ["Filtrare categorie vârstă", "Nu", "Nu", "Nu", "Nu", "Da"],
    ["Filtrare listă compensare", "Nu", "Nu", "Nu", "Da", "Da"],
    ["Rețete digitale + export PDF", "Nu", "Parțial", "Nu", "Nu", "Da"],
    ["Asistent AI pentru simptome", "Nu", "Nu", "Parțial", "Nu", "Da (GPT-3.5)"],
    ["Autentificare + rol administrator", "Da", "Da", "Nu", "Nu", "Da"],
    ["Speech-to-text note medicale", "Nu", "Nu", "Nu", "Nu", "Da (ro-RO)"],
    ["Deploy cloud (Azure)", "Da", "Da", "Da", "Da", "Da"],
    ["Acces gratuit utilizatori finali", "Parțial", "Nu", "Da", "Da", "Da"],
]

DB_TABLES = [
    ("medications", "Stochează cele 6.479 medicamente CNAS cu 19 coloane (denumire, substanță activă, cod ATC, listă compensare, prețuri, coduri boli etc.)"),
    ("users", "Utilizatori înregistrați: nume, email, parolă hash-uită (bcrypt), status (pending/approved/rejected), is_admin, soft delete"),
    ("retete", "Rețete salvate per utilizator: nume pacient, medicamente (JSON), planuri tratament (JSON), indicații pacient/medic"),
    ("user_medicines", "Medicamente personalizate adăugate de utilizatori (denumire, formă, concentrație, cod ATC, note)"),
]

TEST_SCENARIOS = [
    ("T01", "Încărcare tabel medicamente", "Accesare pagina principală", "Tabelul cu medicamente CNAS este afișat", "Trecut"),
    ("T02", "Căutare medicament", "Introducere „paracetamol” în câmpul de căutare", "Rezultatele conțin medicamente relevante", "Trecut"),
    ("T03", "Filtru categorie vârstă", "Selectare categorie „Copii”", "Lista se filtrează conform categoriei", "Trecut"),
    ("T04", "Paginare", "Click pe butonul pagină următoare", "Se afișează următoarea pagină de rezultate", "Trecut"),
    ("T05", "Modal autentificare", "Deschidere meniu cont → Autentificare", "Formularul cu email și parolă apare", "Trecut"),
    ("T06", "Modal înregistrare", "Deschidere flux înregistrare", "Formularul de signup este vizibil", "Trecut"),
    ("T07", "Panou rețetă", "Verificare panou lateral rețetă", "Panoul „LISTA MEDICAMENTE” este vizibil", "Trecut"),
    ("T08", "Adăugare medicament personalizat", "Click buton adăugare medicament", "Modalul de adăugare se deschide", "Trecut"),
    ("T09", "Chatbot – componentă DOM", "Verificare existență buton chat", "Elementul chat este atașat în DOM", "Trecut"),
    ("T10", "Chatbot – deschidere event", "Dispatch event openChatBot", "Modalul chat se deschide", "Trecut"),
    ("T11", "Chatbot – mesaj inițial", "Verificare conținut la deschidere", "Mesaj de bun venit sau cerere autentificare", "Trecut"),
    ("T12", "Raport final", "Rulare npm run test:e2e", "12/12 teste trecute", "Trecut"),
]

CODE_SNIPPETS = {
    "loader": """export async function loadAllMedicationsForUi() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/medications?limit=all`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return mapMedicationRowsToUi(data.items)
  } catch {
    return await loadUiRowsFromCsv()  // fallback PapaParse
  }
}""",
    "prompt": """export const buildSystemPrompt = ({ medicinesData = [] } = {}) => {
  return `Ești un asistent medical specializat în recomandarea
  medicamentelor din lista CNAS din România...`
}""",
    "ai_advice": """const generateAIAdvice = async (patientNotesText) => {
  const data = await createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Ești un medic specialist...' },
      { role: 'user', content: `Indicațiile pacientului: "${patientNotesText}"` },
    ],
    temperature: 0.7,
    max_tokens: 500,
  })
  // Parsează răspunsul în sfaturi individuale
}""",
    "speech": """const recognition = new SpeechRecognition()
recognition.lang = 'ro-RO'
recognition.continuous = true
recognition.interimResults = true""",
    "auth": """app.post('/api/auth/signup', async (req, res) => {
  const hashedPassword = await bcrypt.hash(parola, 10)
  await runAsync(
    'INSERT INTO users (nume, email, parola, status) VALUES (?, ?, ?, ?)',
    [nume, email, hashedPassword, 'pending']
  )
})""",
    "prescription": """app.post('/api/prescriptions', async (req, res) => {
  const { userId, numePacient, medicamente, planuriTratament } = req.body
  await runAsync(
    'INSERT INTO retete (user_id, nume_pacient, medicamente, planuri_tratament) VALUES (?, ?, ?, ?)',
    [userId, numePacient, JSON.stringify(medicamente), JSON.stringify(planuriTratament)]
  )
})""",
}
