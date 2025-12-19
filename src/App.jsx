import { useState, useEffect } from 'react'
import MedicinesTable from './components/MedicinesTable'
import ChatBot from './components/ChatBot'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

function App() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:8',message:'App component starting',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const [medicinesData, setMedicinesData] = useState([])
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('toate')
  const [showHistoryPage, setShowHistoryPage] = useState(false)
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:14',message:'Initializing darkMode state',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  // Categorii de vârstă (keywords nu mai sunt necesare - folosim coloana CategorieVarsta din CSV)
  const ageCategories = [
    { id: 'toate', label: 'Toate', percentage: 'Toate', description: '', isSpecial: true },
    { id: 'copii', label: 'Copii', icon: '👶', description: '0-12 ani' },
    { id: 'adolescenti', label: 'Adolescenți', icon: '🧒', description: '13-17 ani' },
    { id: 'tineri', label: 'Tineri', icon: '👨', description: '18-35 ani' },
    { id: 'adulti', label: 'Adulți', icon: '👨‍💼', description: '36-64 ani' },
    { id: 'batrani', label: 'Bătrâni', icon: '👴', description: '65+ ani' }
  ]

  // Mapare rând din backend către format folosit de ChatBot (similar cu tabelul)
  const mapMedicationRowToUi = (row) => ({
    'Denumire medicament': row.denumire_medicament || '',
    'Substanta activa': row.substanta_activa || '',
    'Lista de compensare': row.lista_compensare || '',
    'Cod medicament': row.cod_medicament || '',
    'Formă farmaceutica': row.forma_farmaceutica || '',
    'Cod ATC': row.cod_atc || '',
    'Mod de prescriere': row.mod_prescriere || '',
    'Concentratie': row.concentratie || '',
    'Forma de ambalare': row.forma_ambalare || '',
    'Nume detinator APP': row.nume_detinator_app || '',
    'Tara detinator APP': row.tara_detinator_app || '',
    'Cantitate pe forma ambalare': row.cantitate_pe_forma_ambalare || '',
    'Preț maximal al medicamentului raportat la forma de ambalare': row.pret_max_forma_ambalare || '',
    'Pret maximal al medicamentului raportat la UT': row.pret_max_ut || '',
    'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiază de compensare 100% din prețul de referinta':
      row.contributie_max_100 || '',
    'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiaza de compensare 90% - sublista A, 50% - sublista B, 20% - sublista D din prețul de referinta':
      row.contributie_max_90_50_20 || '',
    'Contribuție maxima a asiguratului raportat la UT, pentru asiguratii care beneficiază de compensare 90% din pretul de referinta, pentru pensionari cu venituri de pana la 1.299 lei/luna inclusiv':
      row.contributie_max_pensionari_90 || '',
  })

  // Încarcă datele din backend (SQLite) pentru a le trimite la ChatBot
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:53',message:'useEffect started',data:{apiBaseUrl:API_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const fetchFromBackend = async () => {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:56',message:'Fetching medications',data:{url:`${API_BASE_URL}/api/medications?limit=all`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        const response = await fetch(`${API_BASE_URL}/api/medications?limit=all`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        const items = Array.isArray(data.items) ? data.items : []
        const mapped = items.map(mapMedicationRowToUi)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:63',message:'Medications loaded',data:{itemsCount:items.length,mappedCount:mapped.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setMedicinesData(mapped)
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:65',message:'Error loading medications',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Error loading medications for chatbot from backend:', error)
      }
    }
    fetchFromBackend()
  }, [])

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:71',message:'App render starting',data:{selectedAgeCategory,showHistoryPage,medicinesDataCount:medicinesData.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return (
      <div className="App">
        {/* #region agent log */}
        {(() => { fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:74',message:'Rendering MedicinesTable',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{}); return null; })()}
        {/* #endregion */}
        <MedicinesTable 
          ageCategory={selectedAgeCategory}
          ageCategoryData={ageCategories.find(c => c.id === selectedAgeCategory)}
          ageCategories={ageCategories}
          onCategoryChange={setSelectedAgeCategory}
          onHistoryPageChange={setShowHistoryPage}
        />
        {!showHistoryPage && <ChatBot medicinesData={medicinesData} />}
      </div>
    )
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf22f2ee-2fc6-4f7d-a6e7-95c0aad9a0ae',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:85',message:'Error in App render',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.error('Error in App component:', error)
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Eroare în componenta App</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    )
  }
}

export default App
