import { useState, useEffect } from 'react'
import MedicinesTable from './components/MedicinesTable'
import ChatBot from './components/ChatBot/ChatBot'
import { API_BASE_URL } from './config/env'
import { mapMedicationRowsToUi } from './domain/medications'
import './App.css'

function App() {
  const [medicinesData, setMedicinesData] = useState([])
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('toate')
  const [showHistoryPage, setShowHistoryPage] = useState(false)
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
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

  // Încarcă datele din backend (SQLite) pentru a le trimite la ChatBot
  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/medications?limit=all`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        const items = Array.isArray(data.items) ? data.items : []
        const mapped = mapMedicationRowsToUi(items)
        setMedicinesData(mapped)
      } catch (error) {
        console.error('Error loading medications for chatbot from backend:', error)
      }
    }
    fetchFromBackend()
  }, [])

  try {
    return (
      <div className="App">
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
