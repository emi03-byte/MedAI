import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import './MedicinesTable.css'

const hospitalFaviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Hospital icon">
  <rect width="64" height="64" fill="#f5f5f5"/>
  <rect x="8" y="20" width="48" height="36" rx="4" fill="#e0ecff" stroke="#3a6ad6" stroke-width="2"/>
  <rect x="28" y="38" width="8" height="18" fill="#3a6ad6"/>
  <rect x="18" y="24" width="28" height="18" fill="#ffffff" stroke="#c2d4ff" stroke-width="1.5"/>
  <rect x="30" y="26" width="4" height="14" fill="#d93025"/>
  <rect x="24" y="32" width="16" height="4" fill="#d93025"/>
  <rect x="12" y="46" width="12" height="10" fill="#3a6ad6" opacity="0.4"/>
  <rect x="40" y="46" width="12" height="10" fill="#3a6ad6" opacity="0.4"/>
  <rect x="12" y="12" width="10" height="6" fill="#3a6ad6" rx="2"/>
  <text x="17" y="17" font-size="4" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">H</text>
</svg>
`.trim()

const hospitalFaviconDataUrl = `data:image/svg+xml,${encodeURIComponent(hospitalFaviconSvg)}`

const MedicinesTable = ({ ageCategory = 'toate', ageCategoryData = null, ageCategories = [], onCategoryChange = () => {} }) => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({})
  const [itemsPerPage, setItemsPerPage] = useState(10)
  // Sortare eliminată - nu mai este necesară
  const [filters, setFilters] = useState({})
  const [searchTerms, setSearchTerms] = useState({})
  const [showFilters, setShowFilters] = useState({})
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [skipFadeAnimation, setSkipFadeAnimation] = useState(false)
  const [diseases, setDiseases] = useState({})
  const [selectedCompensationCategory, setSelectedCompensationCategory] = useState('toate')
  const [showPatientNotes, setShowPatientNotes] = useState(false)
  const [patientNotes, setPatientNotes] = useState('')
  const [showDoctorNotes, setShowDoctorNotes] = useState(false)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [aiAdvice, setAiAdvice] = useState([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedMedicineForPlan, setSelectedMedicineForPlan] = useState(null)
  const [medicinePlans, setMedicinePlans] = useState({})
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false)
  const [newMedicineName, setNewMedicineName] = useState('')
  const [showNewPatientModal, setShowNewPatientModal] = useState(false)
  const [isNightMode, setIsNightMode] = useState(false)
  const [isRecordingMic, setIsRecordingMic] = useState(false)
  const recognitionRef = useRef(null)
  const [recordedText, setRecordedText] = useState('')
  const [isRecordingMicPatient, setIsRecordingMicPatient] = useState(false)
  const recognitionPatientRef = useRef(null)
  const [recordedTextPatient, setRecordedTextPatient] = useState('')

  useEffect(() => {
    document.body.classList.toggle('med-ai-dark', isNightMode)

    return () => {
      document.body.classList.remove('med-ai-dark')
    }
  }, [isNightMode])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
      if (recognitionPatientRef.current) {
        recognitionPatientRef.current.abort()
        recognitionPatientRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const body = document.body
    if (!body) return

    if (isNightMode) {
      body.classList.add('medai-dark-mode')
    } else {
      body.classList.remove('medai-dark-mode')
    }

    return () => {
      body.classList.remove('medai-dark-mode')
    }
  }, [isNightMode])

  // Primele 4 coloane afișate implicit (fără Coduri_Boli)
  const defaultVisibleColumns = [
    'Denumire medicament',
    'Substanta activa', 
    'Lista de compensare',
    'Cod medicament'
  ]

  // Categorii de compensare - ordonate după procentul de compensare
  const compensationCategories = [
    { 
      id: 'toate', 
      label: 'Toate', 
      percentage: 'Toate', 
      description: '', 
      isSpecial: true, 
      pieValue: null,
      tooltip: 'Toate categoriile de compensare'
    },
    { 
      id: 'C1', 
      label: 'C1', 
      percentage: '100%', 
      description: 'C1', 
      pieValue: 100,
      tooltip: 'C – procentul de compensare a medicamentelor corespunzătoare denumirilor comune internaționale (DCI) prevăzute în secțiunea C1 este de 100% din prețul de referință pentru respectiva clasă de medicamente'
    },
    { 
      id: 'C2', 
      label: 'C2', 
      percentage: '100%', 
      description: 'C2', 
      pieValue: 100,
      tooltip: 'C – procentul de compensare a medicamentelor corespunzătoare denumirilor comune internaționale (DCI) prevăzute în secțiunea C2 este de 100% din prețul de decontare (include TVA) sau din prețul cu ridicata de decontare (la care se adaugă TVA) pentru respectiva clasă de medicamente'
    },
    { 
      id: 'C3', 
      label: 'C3', 
      percentage: '100%', 
      description: 'C3', 
      pieValue: 100,
      tooltip: 'C – procentul de compensare a medicamentelor corespunzătoare denumirilor comune internaționale (DCI) prevăzute în secțiunea C3 este de 100% din prețul de referință pentru respectiva clasă de medicamente'
    },
    { 
      id: 'A', 
      label: 'A', 
      percentage: '90%', 
      description: 'A', 
      pieValue: 90,
      tooltip: 'A – procentul de compensare a medicamentelor corespunzătoare denumirilor comune internaționale (DCI) prevăzute în sublista A este de 90% din prețul de referință pentru respectiva clasă de medicamente'
    },
    { 
      id: 'B', 
      label: 'B', 
      percentage: '50%', 
      description: 'B', 
      pieValue: 50,
      tooltip: 'B – procentul de compensare a medicamentelor corespunzătoare denumirilor comune internaționale (DCI) prevăzute în sublista B este de 50% din prețul de referință pentru respectiva clasă de medicamente'
    },
    { 
      id: 'D', 
      label: 'D', 
      percentage: '20%', 
      description: 'D', 
      pieValue: 20,
      tooltip: 'D – procentul de compensare a medicamentelor corespunzătoare denumirilor comune internaționale (DCI) prevăzute în sublista D este de 20% din prețul de referință pentru respectiva clasă de medicamente'
    }
  ]

  // Funcție pentru a genera graficul pie
  const generatePieChart = (percentage) => {
    const size = 40
    const radius = size / 2 - 2
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    
    // Culori diferite pentru fiecare procentaj
    const getColor = (percent) => {
      if (percent === 100) return '#10b981' // Verde pentru 100%
      if (percent === 90) return '#3b82f6'  // Albastru pentru 90%
      if (percent === 50) return '#f59e0b'  // Portocaliu pentru 50%
      if (percent === 20) return '#ef4444'  // Roșu pentru 20%
      return '#6b7280' // Gri pentru alte valori
    }
    
    return (
      <svg width={size} height={size} className="pie-chart">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(percentage)}
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
    )
  }

  // Funcție pentru parsing CSV corect (gestionează ghilimele)
  const parseCSVLine = (line) => {
    const values = []
    let currentValue = ''
    let insideQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())
    return values
  }

  // Funcție pentru încărcarea bolilor
  const fetchDiseases = async () => {
    try {
      const response = await fetch('/coduri_boala.csv')
      const csvText = await response.text()
      const lines = csvText.split('\n')
      const diseasesMap = {}
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line) {
          const values = parseCSVLine(line)
          if (values.length >= 2) {
            diseasesMap[values[0]] = values[1]
          }
        }
      }
      
      setDiseases(diseasesMap)
      console.log(`✅ Încărcate ${Object.keys(diseasesMap).length} boli`)
    } catch (error) {
      console.error('❌ Eroare la încărcarea bolilor:', error)
    }
  }

  // Funcție pentru încărcarea medicamentelor
  const fetchMedicines = async () => {
    try {
      setLoading(true)
      console.log('🔄 Încerc să încarc fișierul CSV...')
      const response = await fetch('/medicamente_cu_boli_COMPLET.csv')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const csvText = await response.text()
      console.log('✅ CSV încărcat cu succes, încep procesarea...')
      
      const lines = csvText.split('\n')
      const headers = parseCSVLine(lines[0])
      
      const medicinesData = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line) {
          const values = parseCSVLine(line)
          const medicine = {}
          headers.forEach((header, index) => {
            medicine[header] = values[index] || ''
          })
          medicinesData.push(medicine)
        }
      }
      
      console.log(`✅ Procesat cu succes: ${medicinesData.length} medicamente`)
      console.log('📊 Exemplu medicament:', medicinesData[0])
      setMedicines(medicinesData)
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error('❌ Eroare la încărcarea medicamentelor:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  // Funcție pentru a încărca toate filtrele din JSON
  const loadAllFiltersFromJSON = async () => {
    try {
      console.log('🔄 Încerc să încarc filtrele din all-filters.json...')
      const response = await fetch('/all-filters.json')
      if (response.ok) {
        console.log('✅ Fișier JSON găsit, procesez...')
        const data = await response.json()
        console.log('✅ JSON parsat cu succes, coloane găsite:', Object.keys(data).length)
        const initialFilters = {}
        const initialSearchTerms = {}
        const initialShowFilters = {}
        
        Object.keys(data).forEach(column => {
          initialFilters[column] = {}
          initialSearchTerms[column] = ''
          initialShowFilters[column] = false
          
          data[column].forEach(value => {
            initialFilters[column][value] = false
          })
        })
        
        setFilters(initialFilters)
        setSearchTerms(initialSearchTerms)
        setShowFilters(initialShowFilters)
        
        console.log(`✅ Încărcate filtre pentru ${Object.keys(data).length} coloane din all-filters.json`)
      } else {
        console.warn('⚠️ Nu s-a putut încărca all-filters.json, folosesc CSV-ul')
        loadFiltersFromCSV()
      }
    } catch (error) {
      console.error('❌ Eroare la încărcarea all-filters.json:', error)
      loadFiltersFromCSV()
    }
  }

  // Fallback pentru a încărca filtrele din CSV
  const loadFiltersFromCSV = () => {
    console.log('🔄 Încarc filtrele din CSV...')
    if (medicines.length === 0) {
      console.warn('⚠️ Nu există medicamente încărcate pentru filtre')
      return
    }
    
    const allColumns = Object.keys(medicines[0])
    console.log('📋 Coloane găsite:', allColumns.length)
    const initialFilters = {}
    const initialSearchTerms = {}
    const initialShowFilters = {}
    
    allColumns.forEach(column => {
      if (column !== 'Denumire medicament') {
        const uniqueValues = [...new Set(medicines.map(medicine => medicine[column]).filter(val => val && val.trim() !== ''))]
        initialFilters[column] = {}
        initialSearchTerms[column] = ''
        initialShowFilters[column] = false
        
        uniqueValues.forEach(value => {
          initialFilters[column][value] = false
        })
      }
    })
    
    setFilters(initialFilters)
    setSearchTerms(initialSearchTerms)
    setShowFilters(initialShowFilters)
    console.log(`✅ Filtre încărcate din CSV pentru ${Object.keys(initialFilters).length} coloane`)
  }

  // Inițializează coloanele vizibile când se încarcă datele
  useEffect(() => {
    if (medicines.length > 0) {
      const allColumns = Object.keys(medicines[0])
      
      // Inițializează doar primele 4 coloane ca fiind vizibile implicit
      const initialVisibleColumns = {}
      allColumns.forEach(col => {
        initialVisibleColumns[col] = defaultVisibleColumns.includes(col)
      })
      setVisibleColumns(initialVisibleColumns)

      // Încarcă filtrele din all-filters.json
      loadAllFiltersFromJSON()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicines.length])

  // useEffect pentru încărcarea inițială
  useEffect(() => {
    fetchDiseases()
    fetchMedicines()
    // Încarcă notițele salvate din localStorage
    const savedPatientNotes = localStorage.getItem('patientNotes')
    if (savedPatientNotes) {
      setPatientNotes(savedPatientNotes)
    }
    
    const savedDoctorNotes = localStorage.getItem('doctorNotes')
    if (savedDoctorNotes) {
      setDoctorNotes(savedDoctorNotes)
    }
    
    // Încarcă produsele selectate salvate
    const savedSelectedProducts = localStorage.getItem('selectedProducts')
    if (savedSelectedProducts) {
      try {
        const parsedProducts = JSON.parse(savedSelectedProducts)
        setSelectedProducts(parsedProducts)
        console.log('✅ Produse selectate încărcate din localStorage:', parsedProducts.length)
      } catch (error) {
        console.error('❌ Eroare la încărcarea produselor selectate:', error)
        localStorage.removeItem('selectedProducts')
      }
    }

    // Încarcă planurile de medicamente salvate
    const savedMedicinePlans = localStorage.getItem('medicinePlans')
    if (savedMedicinePlans) {
      try {
        const parsedPlans = JSON.parse(savedMedicinePlans)
        setMedicinePlans(parsedPlans)
        console.log('✅ Planuri medicamente încărcate din localStorage:', Object.keys(parsedPlans).length)
      } catch (error) {
        console.error('❌ Eroare la încărcarea planurilor de medicamente:', error)
        localStorage.removeItem('medicinePlans')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Salvează notițele în localStorage când se schimbă
  useEffect(() => {
    if (patientNotes !== '') {
      localStorage.setItem('patientNotes', patientNotes)
    }
  }, [patientNotes])

  useEffect(() => {
    if (doctorNotes !== '') {
      localStorage.setItem('doctorNotes', doctorNotes)
    }
  }, [doctorNotes])

  // Salvează produsele selectate în localStorage când se schimbă
  useEffect(() => {
    if (selectedProducts.length > 0) {
      localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts))
    } else {
      localStorage.removeItem('selectedProducts')
    }
  }, [selectedProducts])

  // Salvează planurile de medicamente în localStorage când se schimbă
  useEffect(() => {
    if (Object.keys(medicinePlans).length > 0) {
      localStorage.setItem('medicinePlans', JSON.stringify(medicinePlans))
    } else {
      localStorage.removeItem('medicinePlans')
    }
  }, [medicinePlans])

  // Funcția AI Medic - analizează indicațiile pacientului și generează sfaturi
  const generateAIAdvice = useCallback(async (patientNotesText) => {
    console.log('🧠 AI: Analizez textul:', patientNotesText)
    
    if (!patientNotesText || patientNotesText.trim() === '') {
      console.log('📝 AI: Text gol, returnez array gol')
      return []
    }

    // AI Medic - folosește ChatGPT pentru a genera sfaturi medicale
    const advice = []
    
    try {
      const response = await fetch('/api/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Ești un medic specialist cu experiență vastă. Analizează indicațiile pacientului și oferă 5-6 sfaturi medicale profesionale, concrete și practice.

IMPORTANT:
- Scrie ca un medic real, natural și familiar
- Fiecare sfat să fie specific și acționabil
- Nu folosi template-uri formale
- Răspunde în limba română
- NU folosi emoji-uri în sfaturi
- NU folosi numerotare în NICIUN FEL (1., 2., -, *, etc.)
- NU folosi prefixe sau simboluri
- Fiecare sfat să fie DOAR TEXT SIMPLU
- Fiecare sfat să fie pe o linie separată
- Sfaturile să fie bazate pe simptomele/observațiile menționate

Formatul răspunsului (DOAR TEXT SIMPLU):
Pentru durerile de cap, încearcă mai întâi paracetamol
Monitorizează temperatura regulat dacă ai febră
Verifică tensiunea arterială dacă durerile persistă
Consideră odihna și hidratarea abundentă
Programează o consultație dacă simptomele persistă`
            },
            {
              role: 'user',
              content: `Indicațiile pacientului: "${patientNotesText}"`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      const aiResponse = data.choices[0].message.content
      
      // Parsează răspunsul AI în sfaturi individuale
      const lines = aiResponse.split('\n').filter(line => line.trim())
      lines.forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine && trimmedLine.length > 0) {
          // Adaugă sfatul fără emoji-uri
          advice.push({ icon: '', text: trimmedLine })
        }
      })

    } catch (error) {
      console.error('Error calling OpenAI for medical advice:', error)
    }

    console.log('✅ AI: Sfaturi finale generate:', advice.slice(0, 6))
    return advice.slice(0, 6) // Maxim 6 sfaturi
  }, [selectedProducts])

  // Inițializează sfaturile AI ca fiind goale la încărcarea componentei
  useEffect(() => {
    console.log('🚀 AI: Inițializez sfaturile AI ca fiind goale')
    setAiAdvice([])
  }, [])

  const handleGenerateAIAdvice = useCallback(async () => {
    if (!patientNotes || patientNotes.trim() === '') {
      console.log('⚠️ Nu există indicații pacient pentru generarea sfaturilor AI')
      return
    }

    console.log('🤖 Generez sfaturi AI suplimentare la cererea medicului')
    setIsLoadingAI(true)

    try {
      const newAdvice = await generateAIAdvice(patientNotes)
      console.log('✅ Sfaturi AI suplimentare:', newAdvice)
      setAiAdvice(prevAdvice => [...prevAdvice, ...newAdvice])
    } catch (error) {
      console.error('Eroare la generarea sfaturilor AI:', error)
      setAiAdvice(prevAdvice => [...prevAdvice, { icon: '❌', text: 'Eroare la generarea sfaturilor AI' }])
    } finally {
      setIsLoadingAI(false)
    }
  }, [generateAIAdvice, patientNotes])

  // Funcție pentru afișarea bolilor asociate unui medicament
  const getDiseasesForMedicine = (coduriBoli) => {
    if (!coduriBoli || !diseases || Object.keys(diseases).length === 0) {
      return []
    }
    
    const coduri = coduriBoli.replace(/"/g, '').split(',').map(cod => cod.trim())
    return coduri.map(cod => ({
      cod: cod,
      nume: diseases[cod] || `Boală necunoscută (${cod})`
    })).filter(disease => disease.cod)
  }

  // Funcții de sortare eliminate - nu mai sunt necesare

  // Memoize filtered data pentru performanță
  const filteredMedicines = useMemo(() => {
    let filtered = medicines

    // Aplică filtrarea pe bază de categorie de vârstă folosind coloana CategorieVarsta
    if (ageCategory && ageCategory !== 'toate') {
      filtered = filtered.filter(medicine => {
        const categorieVarsta = medicine['CategorieVarsta'] || ''
        
        // Mapare între ID-ul categoriei și valoarea din CSV
        const categoryMap = {
          'copii': 'Copii',
          'adolescenti': 'Adolescenți',
          'tineri': 'Tineri',
          'adulti': 'Adulți',
          'batrani': 'Bătrâni'
        }
        
        const categoryValue = categoryMap[ageCategory]
        if (!categoryValue) return false
        
        // Verifică dacă categoria selectată apare în CategorieVarsta
        // (poate fi "Copii", "Adolescenți+Tineri", "Adulți+Bătrâni", etc.)
        return categorieVarsta.includes(categoryValue)
      })
    }

    // Aplică filtrarea pe bază de categorie de compensare folosind coloana Lista de compensare
    if (selectedCompensationCategory && selectedCompensationCategory !== 'toate') {
      filtered = filtered.filter(medicine => {
        const listaCompensare = medicine['Lista de compensare'] || ''
        return listaCompensare.includes(selectedCompensationCategory)
      })
    }

    // Aplică căutarea globală
    if (searchTerm) {
      filtered = filtered.filter(medicine => 
        Object.values(medicine).some(value => 
          value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Aplică filtrele pentru toate coloanele
    Object.keys(filters).forEach(column => {
      const selectedValues = Object.keys(filters[column] || {}).filter(value => filters[column][value])
      
      if (selectedValues.length > 0) {
        filtered = filtered.filter(medicine => 
          selectedValues.includes(medicine[column])
        )
      }
    })

    return filtered
  }, [medicines, searchTerm, filters, ageCategory, ageCategoryData, selectedCompensationCategory])

  // Datele nu mai sunt sortate - se folosesc direct datele filtrate
  const sortedMedicines = filteredMedicines

  // Calculează paginarea
  const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(sortedMedicines.length / itemsPerPage)
  const startIndex = itemsPerPage === 'All' ? 0 : (currentPage - 1) * itemsPerPage
  const endIndex = itemsPerPage === 'All' ? sortedMedicines.length : startIndex + itemsPerPage
  const currentMedicines = sortedMedicines.slice(startIndex, endIndex)

  // Reset la pagina 1 când se schimbă itemsPerPage
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  // Toate hook-urile TREBUIE să fie înainte de orice return condiționat!
  const handleColumnToggle = useCallback((columnName) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }))
  }, [])

  const handleItemsPerPageChange = useCallback((value) => {
    setItemsPerPage(value)
  }, [])

  // Funcții generice pentru filtre
  const handleFilterToggle = useCallback((filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [value]: !prev[filterKey][value]
      }
    }))
  }, [])

  const clearFilters = useCallback((filterKey) => {
    const clearedFilters = {}
    Object.keys(filters[filterKey] || {}).forEach(value => {
      clearedFilters[value] = false
    })
    setFilters(prev => ({
      ...prev,
      [filterKey]: clearedFilters
    }))
  }, [filters])

  const clearAllFilters = useCallback(() => {
    const clearedFilters = {}
    Object.keys(filters).forEach(column => {
      clearedFilters[column] = {}
      Object.keys(filters[column] || {}).forEach(value => {
        clearedFilters[column][value] = false
      })
    })
    setFilters(clearedFilters)
  }, [filters])

  const handleContextMenuClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenuPosition({
      x: rect.left,
      y: rect.bottom + 5
    })
    setSkipFadeAnimation(false) // Permite animația pentru deschiderea normală
    setShowContextMenu(true)
  }, [])

  const handleContextMenuClose = useCallback(() => {
    setShowContextMenu(false)
    setSkipFadeAnimation(false)
  }, [])

  const handleFilterClick = useCallback((filterKey) => {
    setShowFilters(prev => ({
      ...prev,
      [filterKey]: true
    }))
    setShowContextMenu(false)
  }, [])

  const handleSearchTermChange = useCallback((filterKey, value) => {
    setSearchTerms(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }, [])

  // Funcții pentru gestionarea produselor selectate
  const handleProductSelect = useCallback((medicine) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(selected => selected['Cod medicament'] === medicine['Cod medicament'])
      if (isSelected) {
        return prev.filter(selected => selected['Cod medicament'] !== medicine['Cod medicament'])
      } else {
        return [...prev, medicine]
      }
    })
  }, [])

  const clearSelectedProducts = useCallback(() => {
    setSelectedProducts([])
  }, [])

  // Funcție pentru deschiderea modalului de confirmare
  const openNewPatientModal = useCallback(() => {
    setShowNewPatientModal(true)
  }, [])

  // Funcție pentru ștergerea tuturor datelor (pacient nou)
  const clearAllPatientData = useCallback(() => {
    // Șterge indicatiile pacientului
    setPatientNotes('')
    localStorage.removeItem('patientNotes')
    
    // Șterge indicatiile medicului
    setDoctorNotes('')
    localStorage.removeItem('doctorNotes')
    
    // Șterge medicamentele selectate
    setSelectedProducts([])
    localStorage.removeItem('selectedProducts')
    
    // Șterge planurile de medicamente
    setMedicinePlans({})
    localStorage.removeItem('medicinePlans')
    
    // Șterge sfaturile AI
    setAiAdvice([])
    
    // Închide modalele deschise
    setShowPatientNotes(false)
    setShowDoctorNotes(false)
    setShowNewPatientModal(false)
    
    console.log('✅ Toate datele pacientului au fost șterse')
  }, [])


  const removeSelectedProduct = useCallback((medicineCode) => {
    setSelectedProducts(prev => prev.filter(selected => selected['Cod medicament'] !== medicineCode))
  }, [])

  // Funcție pentru a obține procentul de compensare
  const getCompensationPercentage = useCallback((compensationCategory) => {
    const category = compensationCategories.find(cat => cat.id === compensationCategory)
    return category ? category.percentage : compensationCategory
  }, [])

  // Funcție helper pentru a converti frecvența în text lizibil
  const getFrequencyText = useCallback((frequency) => {
    const frequencyMap = {
      '1': 'o dată pe zi',
      '2': 'de două ori pe zi',
      '3': 'de trei ori pe zi',
      '4': 'de patru ori pe zi',
      '6': 'la 4 ore',
      '8': 'de opt ori pe zi',
      '12': 'la 12 ore'
    }
    return frequencyMap[frequency] || `${frequency} ori pe zi`
  }, [])

  const getTimeText = useCallback((time) => {
    const timeMap = {
      'dimineata': 'dimineața',
      'amiaza': 'amiaza',
      'seara': 'seara',
      'noaptea': 'noaptea',
      'la4ore': 'la 4 ore',
      'la6ore': 'la 6 ore',
      'la8ore': 'la 8 ore',
      'la12ore': 'la 12 ore'
    }
    return timeMap[time] || time
  }, [])

  // Funcții pentru gestionarea planurilor de medicamente
  const openPlanModal = useCallback((medicine) => {
    setSelectedMedicineForPlan(medicine)
    setShowPlanModal(true)
  }, [])

  const closePlanModal = useCallback(() => {
    setShowPlanModal(false)
    setSelectedMedicineForPlan(null)
  }, [])

  const saveMedicinePlan = useCallback((medicineCode, plan) => {
    setMedicinePlans(prev => ({
      ...prev,
      [medicineCode]: plan
    }))
    closePlanModal()
  }, [closePlanModal])

  const removeMedicinePlan = useCallback((medicineCode) => {
    setMedicinePlans(prev => {
      const newPlans = { ...prev }
      delete newPlans[medicineCode]
      return newPlans
    })
  }, [])

  // Funcții pentru gestionarea medicamentelor personalizate
  const openAddMedicineModal = useCallback(() => {
    setShowAddMedicineModal(true)
    setNewMedicineName('')
  }, [])

  const closeAddMedicineModal = useCallback(() => {
    setShowAddMedicineModal(false)
    setNewMedicineName('')
  }, [])

  const addCustomMedicine = useCallback(() => {
    if (!newMedicineName.trim()) {
      alert('Te rog introdu numele medicamentului!')
      return
    }

    const customMedicine = {
      'Denumire medicament': newMedicineName.trim().toUpperCase(),
      'Cod medicament': 'N/A',
      'Substanta activa': 'Personalizat',
      'Lista de compensare': 'Personalizat',
      'CategorieVarsta': 'Toate',
      'Coduri_Boli': '',
      'isCustom': true // Flag pentru a identifica medicamentele personalizate
    }

    setSelectedProducts(prev => [...prev, customMedicine])
    closeAddMedicineModal()
  }, [newMedicineName, closeAddMedicineModal])

  // Funcție pentru descărcarea produselor selectate în format PDF
  const downloadSelectedProducts = useCallback(async () => {
    console.log('🔄 Actualizez datele pentru PDF...')
    const hasMedicines = selectedProducts.length > 0
    const hasPatientNotes = patientNotes && patientNotes.trim() !== ''
    const hasDoctorNotes = doctorNotes && doctorNotes.trim() !== ''

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link rel="icon" type="image/svg+xml" href="${hospitalFaviconDataUrl}">
          <title>Rețetă</title>
          <style>
            * {
              box-sizing: border-box;
            }
            html, body {
              background-color: #ffffff !important;
              color: #333333 !important;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 28px;
              color: #333 !important;
              background-color: #ffffff !important;
            }
            .pdf-container {
              margin-top: 35px;
              padding: 24px 30px 36px;
              background-color: #ffffff !important;
            }
            .header {
              text-align: center;
              margin-bottom: 28px;
              border-bottom: 2px solid #1a3c7c;
              padding-bottom: 10px;
              background-color: #ffffff !important;
            }
            .header h1 {
              color: #1a3c7c !important;
              margin: 0;
              font-size: 24.5px;
            }
            .header p {
              margin: 6px 0 0 0;
              color: #666666 !important;
              font-size: 14px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              background-color: #ffffff !important;
            }
            .table th {
              background-color: #f5f5f5 !important;
              color: #555555 !important;
              padding: 12px 10px;
              text-align: left;
              font-weight: 600;
              border-bottom: 1px solid #d0d7e4;
              font-size: 13.6px;
            }
            .table td {
              padding: 11px 9px;
              border-bottom: 1px solid #e1e5ed;
              font-size: 13px;
              color: #333333 !important;
              background-color: #ffffff !important;
            }
            .table td:nth-child(2),
            .table td:nth-child(3),
            .table td:nth-child(4) {
              font-size: 14.5px;
            }
            .table tr:nth-child(even) {
              background-color: #f9f9f9 !important;
            }
            .table tr:nth-child(even) td {
              background-color: #f9f9f9 !important;
            }
            .table tr:hover {
              background-color: #f0f8ff !important;
            }
            .table tr:hover td {
              background-color: #f0f8ff !important;
            }
            .patient-indications-section {
              margin-top: 30px;
              page-break-inside: avoid;
            }
            .patient-indications-section h2 {
              color: #1a3c7c !important;
              font-size: 18.2px;
              margin-bottom: 15px;
              border-bottom: 2px solid #1a3c7c;
              padding-bottom: 5px;
            }
            .patient-indications-content {
              background-color: #f8f9fa !important;
              border: 1px solid #e9ecef !important;
              border-radius: 5px;
              padding: 16px;
              font-size: 14.7px;
              line-height: 1.6;
              color: #333333 !important;
              white-space: pre-line;
              text-align: left;
              text-indent: 0 !important;
              margin: 0 !important;
              padding-left: 10px !important;
            }
            .patient-indications-content p {
              margin: 0 !important;
              padding: 0 !important;
              text-indent: 0 !important;
              color: #333333 !important;
            }
            .patient-indications-content::first-line {
              text-indent: 0 !important;
            }
            .doctor-indications-section {
              margin-top: 30px;
              page-break-inside: avoid;
            }
            .doctor-indications-section h2 {
              color: #1a3c7c !important;
              font-size: 18.2px;
              margin-bottom: 15px;
              border-bottom: 2px solid #1a3c7c;
              padding-bottom: 5px;
            }
            .doctor-indications-content {
              background-color: #f8f9fa !important;
              border: 1px solid #e9ecef !important;
              border-radius: 5px;
              padding: 16px;
              font-size: 14.7px;
              line-height: 1.6;
              color: #333333 !important;
              white-space: pre-line;
              text-align: left;
              text-indent: 0 !important;
              margin: 0 !important;
              padding-left: 10px !important;
            }
            .doctor-indications-content p {
              margin: 0 !important;
              padding: 0 !important;
              text-indent: 0 !important;
              color: #333333 !important;
            }
            .doctor-indications-content::first-line {
              text-indent: 0 !important;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12.5px;
              color: #666666 !important;
              border-top: 1px solid #dddddd;
              padding-top: 10px;
              background-color: #ffffff !important;
            }
            .footer p {
              color: #666666 !important;
            }
          </style>
        </head>
        <body>
          <div class="pdf-container">
            <div class="header">
              <h1>${hasMedicines ? 'Rețetă' : 'Notițe Medicale'}</h1>
              <p>Generat la: ${new Date().toLocaleString('ro-RO')}</p>
              ${hasMedicines ? `<p>Total medicamente: ${selectedProducts.length}</p>` : ''}
            </div>
            
            ${hasMedicines ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>Denumire Medicament</th>
                  <th>Cod Medicament</th>
                  <th>Plan de Tratament</th>
                </tr>
              </thead>
              <tbody>
                ${selectedProducts.map((product, index) => {
                  const medicineCode = product['Cod medicament']
                  const plan = medicinePlans[medicineCode]
                  let planDescription = 'Fără plan'
                  
                  if (plan) {
                    const parts = []
                    
                    if (plan.duration) {
                      parts.push(plan.duration === '1' ? '1 zi' : `${plan.duration} zile`)
                    }
                    
                    if (plan.frequency) {
                      if (plan.isCustomFrequency) {
                        parts.push(`${plan.frequency} ori pe zi`)
                      } else {
                        const frequencyMap = {
                          '1': 'o dată pe zi',
                          '2': 'de două ori pe zi',
                          '3': 'de trei ori pe zi',
                          '4': 'de patru ori pe zi'
                        }
                        parts.push(frequencyMap[plan.frequency] || `${plan.frequency} ori pe zi`)
                      }
                    }
                    
                    if (plan.times && plan.times.length > 0) {
                      const timesText = plan.times.map(time => {
                        const timeMap = {
                          'dimineata': 'dimineața',
                          'amiaza': 'amiaza',
                          'seara': 'seara',
                          'noaptea': 'noaptea',
                          'la4ore': 'la 4 ore',
                          'la6ore': 'la 6 ore',
                          'la8ore': 'la 8 ore',
                          'la12ore': 'la 12 ore'
                        }
                        return timeMap[time] || time
                      }).join(', ')
                      parts.push(timesText)
                    }
                    
                    planDescription = parts.join(', ')
                  }
                  
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${product['Denumire medicament'] || 'N/A'}</td>
                      <td>${product['Cod medicament'] || 'N/A'}</td>
                      <td>${planDescription}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
            ` : ''}
            
            ${patientNotes && patientNotes.trim() ? `
            <div class="patient-indications-section">
              <h2>Indicații Pacient</h2>
              <div class="patient-indications-content">
                ${patientNotes}
              </div>
            </div>
            ` : ''}
            
            ${doctorNotes && doctorNotes.trim() ? `
            <div class="doctor-indications-section">
              <h2>Indicații Medic</h2>
              <div class="doctor-indications-content">
                ${doctorNotes}
              </div>
            </div>
            ` : ''}
            
            <div class="footer">
              <p>Document generat automat de aplicația MedAI</p>
            </div>
          </div>
        </body>
      </html>
    `

    const filename = `reteta-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`

    try {
      const worker = html2pdf()
        .set({
          margin: 0,
          filename,
          html2canvas: { scale: 2, dpi: 192, letterRendering: true, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(htmlContent)
        .toPdf()

      await worker.save()

      const pdfBlob = await worker.output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      link.click()

      window.open(blobUrl, '_blank', 'noopener,noreferrer')

      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000)
    } catch (error) {
      console.error('❌ Eroare la generarea PDF-ului:', error)
      alert('A apărut o eroare la generarea PDF-ului. Încearcă din nou.')
    }
  }, [selectedProducts, medicinePlans, patientNotes, doctorNotes])

  const handleFinalize = useCallback(async () => {
    await downloadSelectedProducts()
    clearAllPatientData()
  }, [downloadSelectedProducts, clearAllPatientData])

  // Filtrează valorile pe baza termenului de căutare
  const getFilteredValues = (filterKey) => {
    return Object.keys(filters[filterKey] || {}).filter(value =>
      value.toLowerCase().includes(searchTerms[filterKey]?.toLowerCase() || '')
    )
  }

  // Obține coloanele care au filtre active
  const getActiveFilterColumns = () => {
    return Object.keys(filters).filter(column => {
      const selectedValues = Object.keys(filters[column] || {}).filter(value => filters[column][value])
      return selectedValues.length > 0
    })
  }

  const activeFilterColumns = getActiveFilterColumns()

  // Obține coloanele vizibile
  const getVisibleHeaders = () => {
    if (medicines.length === 0) return []
    const allColumns = Object.keys(medicines[0])
    return allColumns.filter(col => visibleColumns[col])
  }

  const headers = getVisibleHeaders()
  const canGenerateAIAdvice = patientNotes && patientNotes.trim() !== ''


  const handleMicRecord = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Browserul tău nu suportă recunoașterea vocală. Folosește Chrome sau Edge.')
      return
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ro-RO'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition
    }

    const recognition = recognitionRef.current

    if (isRecordingMic) {
      setIsRecordingMic(false)
      recognition.stop()
      
      // Adaugă textul înregistrat la început
      if (recordedText.trim()) {
        const existingText = doctorNotes.replace(recordedText, '').trim()
        setDoctorNotes(recordedText + (existingText ? `\n\n${existingText}` : ''))
        setRecordedText('')
      }
      return
    }

    // Salvează textul existent (fără textul înregistrat)
    const existingText = doctorNotes.replace(recordedText, '').trim()
    setRecordedText('')

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let newRecordedText = recordedText

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newRecordedText = (newRecordedText ? `${newRecordedText} ${transcript}` : transcript).trim()
          setRecordedText(newRecordedText)
        } else {
          interimTranscript += transcript
        }
      }

      // Afișează textul live: textul înregistrat + interim + textul existent
      const displayText = newRecordedText + (interimTranscript ? ` ${interimTranscript}` : '') + (existingText ? `\n\n${existingText}` : '')
      setDoctorNotes(displayText)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'no-speech') {
        alert('Nu am putut prelua vocea. Încearcă din nou.')
      }
      setIsRecordingMic(false)
    }

    recognition.onend = () => {
      if (isRecordingMic) {
        try {
          recognition.start()
        } catch (error) {
          console.error('Speech recognition restart error:', error)
          setIsRecordingMic(false)
        }
      }
    }

    try {
      recognition.start()
      setIsRecordingMic(true)
    } catch (error) {
      console.error('Speech recognition start error:', error)
      setIsRecordingMic(false)
    }
  }, [isRecordingMic, doctorNotes, recordedText])

  const handleStopMic = useCallback(() => {
    if (recognitionRef.current && isRecordingMic) {
      setIsRecordingMic(false)
      recognitionRef.current.stop()
      
      // Adaugă textul înregistrat la început
      if (recordedText.trim()) {
        const existingText = doctorNotes.replace(recordedText, '').trim()
        setDoctorNotes(recordedText + (existingText ? `\n\n${existingText}` : ''))
        setRecordedText('')
      }
    }
  }, [isRecordingMic, recordedText, doctorNotes])

  const handleMicRecordPatient = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Browserul tău nu suportă recunoașterea vocală. Folosește Chrome sau Edge.')
      return
    }

    if (!recognitionPatientRef.current) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ro-RO'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognitionPatientRef.current = recognition
    }

    const recognition = recognitionPatientRef.current

    if (isRecordingMicPatient) {
      setIsRecordingMicPatient(false)
      recognition.stop()
      
      // Adaugă textul înregistrat la început
      if (recordedTextPatient.trim()) {
        const existingText = patientNotes.replace(recordedTextPatient, '').trim()
        setPatientNotes(recordedTextPatient + (existingText ? `\n\n${existingText}` : ''))
        setRecordedTextPatient('')
      }
      return
    }

    // Salvează textul existent (fără textul înregistrat)
    const existingText = patientNotes.replace(recordedTextPatient, '').trim()
    setRecordedTextPatient('')

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let newRecordedText = recordedTextPatient

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newRecordedText = (newRecordedText ? `${newRecordedText} ${transcript}` : transcript).trim()
          setRecordedTextPatient(newRecordedText)
        } else {
          interimTranscript += transcript
        }
      }

      // Afișează textul live: textul înregistrat + interim + textul existent
      const displayText = newRecordedText + (interimTranscript ? ` ${interimTranscript}` : '') + (existingText ? `\n\n${existingText}` : '')
      setPatientNotes(displayText)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'no-speech') {
        alert('Nu am putut prelua vocea. Încearcă din nou.')
      }
      setIsRecordingMicPatient(false)
    }

    recognition.onend = () => {
      if (isRecordingMicPatient) {
        try {
          recognition.start()
        } catch (error) {
          console.error('Speech recognition restart error:', error)
          setIsRecordingMicPatient(false)
        }
      }
    }

    try {
      recognition.start()
      setIsRecordingMicPatient(true)
    } catch (error) {
      console.error('Speech recognition start error:', error)
      setIsRecordingMicPatient(false)
    }
  }, [isRecordingMicPatient, patientNotes, recordedTextPatient])

  const handleStopMicPatient = useCallback(() => {
    if (recognitionPatientRef.current && isRecordingMicPatient) {
      setIsRecordingMicPatient(false)
      recognitionPatientRef.current.stop()
      
      // Adaugă textul înregistrat la început
      if (recordedTextPatient.trim()) {
        const existingText = patientNotes.replace(recordedTextPatient, '').trim()
        setPatientNotes(recordedTextPatient + (existingText ? `\n\n${existingText}` : ''))
        setRecordedTextPatient('')
      }
    }
  }, [isRecordingMicPatient, recordedTextPatient, patientNotes])

  // Obține toate coloanele pentru modal
  const getAllColumns = () => {
    if (medicines.length === 0) return []
    return Object.keys(medicines[0])
  }

  const allColumns = getAllColumns()


  // Loading și Error states DUPĂ toate hook-urile
  if (loading) {
  return (
    <div className={`medicines-container ${isNightMode ? 'dark-mode' : ''}`}>
        <div className="loading">Se încarcă datele...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="medicines-container">
        <div className="error">Eroare: {error}</div>
      </div>
    )
  }

  return (
    <div className={`medicines-container ${isNightMode ? 'dark-mode' : ''}`}>
      {/* Buton Pacient Nou - în colțul din dreapta sus */}
      <div className="new-patient-button-container">
        <button
          type="button"
          className={`theme-toggle-button ${isNightMode ? 'theme-toggle-button--night' : ''}`}
          onClick={() => setIsNightMode(prev => !prev)}
          aria-label={isNightMode ? 'Comută la modul zi' : 'Comută la modul noapte'}
          aria-pressed={isNightMode}
        >
          <span className={`theme-icon ${isNightMode ? 'theme-icon--moon' : 'theme-icon--sun'}`}></span>
        </button>
        <button 
          className="new-patient-button"
          onClick={openNewPatientModal}
        >
          🆕 Pacient nou
        </button>
      </div>

      {/* Butoane Indicații */}
      <div className="notes-buttons-container">
        <button 
          className="patient-notes-button"
          onClick={() => setShowPatientNotes(!showPatientNotes)}
        >
          📝 Indicații Pacient
        </button>
        <button 
          className="doctor-notes-button"
          onClick={async () => {
            // Deschide modalul direct
            setShowDoctorNotes(!showDoctorNotes)
            
            // Verifică dacă există indicații pacient și generează sfaturi AI
            if (patientNotes && patientNotes.trim() !== '') {
              console.log('🔍 Verifică indicațiile pacientului:', patientNotes)
              setIsLoadingAI(true)
              setAiAdvice([]) // Șterge sfaturile vechi
              
              try {
                const newAdvice = await generateAIAdvice(patientNotes)
                console.log('🤖 Generez sfaturi AI bazate pe indicațiile pacientului:', newAdvice)
                setAiAdvice(newAdvice)
              } catch (error) {
                console.error('Eroare la generarea sfaturilor AI:', error)
                setAiAdvice([{ icon: '❌', text: 'Eroare la generarea sfaturilor AI' }])
              } finally {
                setIsLoadingAI(false)
              }
            } else {
              console.log('⚠️ Nu există indicații pacient - afișez mesaj informativ')
              setAiAdvice([])
              setIsLoadingAI(false)
            }
          }}
        >
          👨‍⚕️ Indicații Medic
        </button>
      </div>


      {/* Zona de notițe pentru pacient */}
      {showPatientNotes && (
        <div className="patient-notes-overlay">
          <div className="patient-notes-content">
            <div className="patient-notes-header-content">
              <h3>📝 Indicații Pacient</h3>
              <button 
                className="patient-notes-close"
                onClick={() => setShowPatientNotes(false)}
              >
                ✕
              </button>
            </div>
            <div className="patient-notes-textarea-wrapper">
              <textarea
                className="patient-notes-textarea"
                placeholder="Scrie aici exact ce spune pacientul - simptomele, durerile, observațiile lui."
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
              />
              <div className="mic-buttons-container">
                {isRecordingMicPatient && (
                  <button
                    type="button"
                    className="mic-cancel-button"
                    aria-label="Oprește înregistrarea"
                    title="Oprește înregistrarea"
                    onClick={handleStopMicPatient}
                  >
                    STOP
                  </button>
                )}
                <button
                  type="button"
                  className={`mic-record-button ${isRecordingMicPatient ? 'recording' : ''}`}
                  aria-label={isRecordingMicPatient ? 'Se înregistrează...' : 'Înregistrează notițe vocale'}
                  title={isRecordingMicPatient ? 'Înregistrare în curs - apasă pentru a opri' : 'Înregistrează notițe vocale'}
                  onClick={handleMicRecordPatient}
                >
                  <span className="mic-emoji" aria-hidden="true">🎙️</span>
                </button>
              </div>
            </div>
            <div className="patient-notes-footer">
              <p>Notițele se salvează automat</p>
              <button 
                className="patient-notes-done-button"
                onClick={() => setShowPatientNotes(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zona de notițe pentru medic */}
      {showDoctorNotes && (
        <div className="doctor-notes-overlay">
          <div className="doctor-notes-content">
            <div className="doctor-notes-header-content">
              <h3>👨‍⚕️ Indicații Medic</h3>
              <button 
                className="doctor-notes-close"
                onClick={() => setShowDoctorNotes(false)}
              >
                ✕
              </button>
            </div>
            <div className="doctor-notes-main-content">
              {/* Jumătatea de sus - Notițele medicului */}
              <div className="doctor-notes-section">
                <div className="doctor-notes-section-header">
                  <h4>📝 Notițele mele</h4>
                  <button 
                    className="format-notes-button"
                    onClick={async () => {
                      if (!doctorNotes || doctorNotes.trim() === '') {
                        alert('Nu există text de formatat!')
                        return
                      }
                      
                      try {
                        const response = await fetch('/api/openai/v1/chat/completions', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [
                              {
                                role: 'system',
                                content: `Ești un asistent medical care formatează textul medical. 

IMPORTANT:
- Formatează textul într-un mod plăcut și organizat
- Folosește bullet points (-) pentru a organiza informațiile
- NU folosi emoji-uri
- NU folosi numerotare (1., 2., etc.)
- Păstrează toate informațiile importante
- Organizează textul logic și clar
- Fiecare bullet point să fie pe o linie separată

Formatul răspunsului:
- Prima informație importantă
- A doua informație importantă
- A treia informație importantă
etc.`
                              },
                              {
                                role: 'user',
                                content: `Formatează următorul text medical: "${doctorNotes}"`
                              }
                            ],
                            temperature: 0.3,
                            max_tokens: 800
                          })
                        })

                        if (!response.ok) {
                          throw new Error('Eroare la formatarea textului')
                        }

                        const data = await response.json()
                        const formattedText = data.choices[0].message.content
                        
                        // Înlocuiește textul vechi cu cel formatat
                        setDoctorNotes(formattedText)
                        
                      } catch (error) {
                        console.error('Eroare la formatarea textului:', error)
                        alert('Eroare la formatarea textului. Încearcă din nou.')
                      }
                    }}
                  >
                    ✨ Formatează
                  </button>
                </div>
                <textarea
                  className="doctor-notes-textarea"
                  placeholder="Scrie aici indicațiile medicale, recomandările, observațiile..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                />
                <div className="mic-buttons-container">
                  {isRecordingMic && (
                    <button
                      type="button"
                      className="mic-cancel-button"
                      aria-label="Oprește înregistrarea"
                      title="Oprește înregistrarea"
                      onClick={handleStopMic}
                    >
                      STOP
                    </button>
                  )}
                  <button
                    type="button"
                    className={`mic-record-button ${isRecordingMic ? 'recording' : ''}`}
                    aria-label={isRecordingMic ? 'Se înregistrează...' : 'Înregistrează notițe vocale'}
                    title={isRecordingMic ? 'Înregistrare în curs - apasă pentru a opri' : 'Înregistrează notițe vocale'}
                    onClick={handleMicRecord}
                  >
                    <span className="mic-emoji" aria-hidden="true">🎙️</span>
                  </button>
                </div>
              </div>
              
              {/* Jumătatea de jos - Sfaturile AI */}
              <div className="ai-advice-section">
                <div className="ai-advice-section-header">
                  <h4>🤖 Sfaturi AI</h4>
                  <button
                    className="ai-generate-button"
                    onClick={handleGenerateAIAdvice}
                    disabled={!canGenerateAIAdvice || isLoadingAI}
                  >
                    {isLoadingAI ? 'Se generează...' : 'Generează sfaturi'}
                  </button>
                </div>
                <div className="ai-advice-content">
                  {aiAdvice.length > 0 && aiAdvice.map((advice, index) => (
                    <div key={`${advice.text}-${index}`} className="ai-advice-item">
                      {advice.icon && <span className="ai-advice-icon">{advice.icon}</span>}
                      <span className="ai-advice-text">{advice.text}</span>
                      <div className="ai-advice-actions">
                        <button 
                          className="ai-advice-delete-btn"
                          onClick={() => {
                            const newAdvice = aiAdvice.filter((_, i) => i !== index)
                            setAiAdvice(newAdvice)
                          }}
                        >
                          ✕
                        </button>
                        <button 
                          className="ai-advice-save-btn"
                          onClick={() => {
                            console.log('💾 Salvând sfatul:', advice)
                            console.log('📝 Notițele medicului înainte:', doctorNotes)
                            
                            // Adaugă sfatul la notițele medicului pe un rând nou
                            const newDoctorNotes = doctorNotes + (doctorNotes ? '\n' : '') + (advice.icon ? `${advice.icon} ` : '') + advice.text
                            console.log('📝 Notițele medicului după:', newDoctorNotes)
                            
                            // Actualizează state-ul
                            setDoctorNotes(newDoctorNotes)
                            
                            // Șterge sfatul din lista AI
                            const newAdvice = aiAdvice.filter((_, i) => i !== index)
                            console.log('🗑️ Sfaturi AI după ștergere:', newAdvice)
                            setAiAdvice(newAdvice)
                            
                            // Mesaj de confirmare
                            console.log('✅ Sfatul a fost salvat în notițele medicului!')
                          }}
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  ))}

                  {isLoadingAI && (
                    <div className="ai-advice-loading">
                      <div className="ai-loading-spinner">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="ai-loading-text">🤖 AI-ul analizează indicațiile și generează sfaturi medicale...</span>
                    </div>
                  )}

                  {!isLoadingAI && aiAdvice.length === 0 && (
                    <div className="ai-advice-empty">
                      <span className="ai-advice-icon">🤖</span>
                      <span className="ai-advice-text">
                        {canGenerateAIAdvice
                          ? 'Apasă „Generează sfaturi” pentru a obține recomandări AI bazate pe indicațiile pacientului'
                          : 'Scrie indicațiile pacientului pentru a primi sfaturi AI personalizate'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="doctor-notes-footer">
              <p>Indicațiile se salvează automat</p>
            </div>
          </div>
        </div>
      )}

      <div className="search-container">
        <input
          type="text"
          placeholder="Caută..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <button 
          className="column-toggle-button"
          onClick={() => setShowColumnModal(true)}
        >
          ⚙️
        </button>
        <button 
          className="substance-filter-toggle-button"
          onClick={handleContextMenuClick}
        >
          🔬
        </button>
        {activeFilterColumns.length > 0 && (
          <button 
            className="clear-all-filters-button"
            onClick={clearAllFilters}
          >
            🗑️ Șterge filtrele
          </button>
        )}
        <div className="items-per-page">
          <label htmlFor="itemsPerPage">Elemente pe pagină:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value === 'All' ? 'All' : parseInt(e.target.value))}
            className="items-per-page-select"
          >
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={7}>7</option>
            <option value={8}>8</option>
            <option value={9}>9</option>
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="All">Toate</option>
          </select>
        </div>
      </div>

      {/* Layout cu trei coloane */}
      <div className="main-content-layout">
        {/* Coloana stângă - Filtre */}
        <div className="filters-column">
          {/* Categorii de vârstă și compensare */}
          {ageCategories.length > 0 && (
            <div className="categories-section">
              {/* Categorii de vârstă */}
              <div className="age-categories-column">
                <h4 className="filter-section-title">📋 Categorii de vârstă</h4>
                <div className="categories-grid">
                  {ageCategories.map(category => (
                    <button
                      key={category.id}
                      className={`category-btn age-category-btn ${ageCategory === category.id ? 'active' : ''}`}
                      onClick={() => onCategoryChange(category.id)}
                    >
                      {category.isSpecial ? (
                        <div className="category-info">
                          <span className="category-label" style={{fontSize: '1rem', fontWeight: '700'}}>{category.percentage}</span>
                        </div>
                      ) : (
                        <>
                          <span className="category-icon">{category.icon}</span>
                          <div className="category-info">
                            <span className="category-label">{category.label}</span>
                            <span className="category-description">{category.description}</span>
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Categorii de compensare */}
              <div className="compensation-categories-column">
                <h4 className="filter-section-title">💰 Categorii de compensare</h4>
                <div className="categories-grid">
                  {compensationCategories.map(category => (
                    <button
                      key={category.id}
                      className={`category-btn compensation-category-btn ${selectedCompensationCategory === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCompensationCategory(category.id)}
                    >
                      <div className="category-info">
                        {category.isSpecial ? (
                          <span className="category-label" style={{fontSize: '1rem', fontWeight: '700'}}>{category.percentage}</span>
                        ) : (
                          <>
                            <span className="category-label">{category.percentage}</span>
                            <span className="category-description">{category.description}</span>
                          </>
                        )}
                      </div>
                      {category.pieValue && (
                        <div className="pie-chart-container">
                          {generatePieChart(category.pieValue)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coloana dreaptă - Tabelul de medicamente */}
        <div className="table-column">
          <div className={`table-container items-${itemsPerPage}`}>
            <table className="medicines-table">
              <thead>
                <tr>
                  <th className="row-number-header">#</th>
                  {headers.map((header, index) => (
                    <th 
                      key={index} 
                      className="sortable-header"
                    >
                      <div className="header-content">
                        <span>{header}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentMedicines.map((medicine, index) => {
                  const isSelected = selectedProducts.some(selected => selected['Cod medicament'] === medicine['Cod medicament'])
                  return (
                    <tr 
                      key={index} 
                      className={`medicine-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleProductSelect(medicine)}
                    >
                      <td className="row-number">
                        {itemsPerPage === 'All' 
                          ? startIndex + index + 1 
                          : (currentPage - 1) * itemsPerPage + index + 1
                        }
                      </td>
                    {headers.map((header, headerIndex) => {
                      const isNameColumn = header === 'Denumire medicament'
                      return (
                        <td 
                          key={headerIndex}
                          className={isNameColumn ? 'medicine-name-cell' : undefined}
                        >
                          {header === 'Coduri_Boli' ? (
                            <div className="diseases-cell">
                              {getDiseasesForMedicine(medicine[header]).map((disease, idx) => (
                                <span key={idx} className="disease-tag">
                                  {disease.cod}
                                </span>
                              ))}
                            </div>
                          ) : isNameColumn ? (
                            <span className="medicine-name">{medicine[header]}</span>
                          ) : (
                            medicine[header]
                          )}
                        </td>
                      )
                    })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {itemsPerPage !== 'All' && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Anterior
              </button>
              
              <span className="pagination-info">
                {currentPage}/{totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Următor
              </button>
            </div>
          )}

          {itemsPerPage === 'All' && (
            <div className="pagination">
              <span className="pagination-info">
                Afișate toate {sortedMedicines.length} elemente
              </span>
            </div>
          )}
        </div>

        {/* Coloana dreaptă - Produse selectate */}
        <div className="selected-products-column">
          <div className="selected-products-section">
            <div className="selected-products-header">
              <h4 className="filter-section-title">Lista Medicamente</h4>
              <div className="selected-products-header-buttons">
                <button 
                  className="add-medicine-button"
                  onClick={openAddMedicineModal}
                >
                  ➕
                </button>
                {selectedProducts.length > 0 && (
                  <button 
                    className="clear-selected-products-button"
                    onClick={clearSelectedProducts}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            
            <div className="selected-products-list">
              {selectedProducts.length === 0 ? (
                <div className="no-selected-products">
                  <p>Nu ai selectat încă niciun produs.</p>
                  <p>Click pe un medicament din tabel pentru a-l adăuga aici.</p>
                </div>
              ) : (
                selectedProducts.map((product, index) => (
                  <div key={product['Cod medicament']} className="selected-product-item">
                    <div className="selected-product-info">
                      <div className="selected-product-name">
                        {product['Denumire medicament']}
                      </div>
                      <div className="selected-product-details">
                        <span className="selected-product-code">
                          Cod: {product['Cod medicament']}
                        </span>
                        {product['Lista de compensare'] && (
                          <span className="selected-product-compensation">
                            Compensare: {getCompensationPercentage(product['Lista de compensare'])}
                          </span>
                        )}
                      </div>
                      <div className="selected-product-plan-section">
                        <div className="plan-display-container">
                          <button 
                            className="plan-medicine-button"
                            onClick={() => openPlanModal(product)}
                          >
                            📋 Plan
                          </button>
                          {medicinePlans[product['Cod medicament']] && (
                            <div className="saved-plan-display">
                              {(() => {
                                const plan = medicinePlans[product['Cod medicament']]
                                const parts = []
                                
                                if (plan.duration) {
                                  parts.push(plan.duration === '1' ? '1 zi' : `${plan.duration} zile`)
                                }
                                
                                if (plan.frequency) {
                                  if (plan.isCustomFrequency) {
                                    // Dacă e personalizare, afișează direct valoarea cu "ori pe zi"
                                    parts.push(`${plan.frequency} ori pe zi`)
                                  } else {
                                    // Dacă e selecție predefinită, folosește maparea
                                    parts.push(getFrequencyText(plan.frequency))
                                  }
                                }
                                
                                if (plan.times && plan.times.length > 0) {
                                  const timesText = plan.times.map(time => getTimeText(time)).join(' | ')
                                  parts.push(timesText)
                                }
                                
                                return parts.join(' | ')
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="selected-product-actions">
                      <button 
                        className="remove-selected-product-button"
                        onClick={() => removeSelectedProduct(product['Cod medicament'])}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="selected-products-summary">
              <p className="selected-products-summary-text">
                Total produse selectate: <strong>{selectedProducts.length}</strong>
              </p>
              <button 
                className="download-selected-products-button download-selected-products-button--compact"
                onClick={handleFinalize}
                title="Descarcă lista de medicamente selectate"
              >
                Finalizare
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template pentru modalele de filtre */}
      {Object.entries(showFilters).map(([filterKey, isVisible]) => {
        if (!isVisible) return null
        
        const filteredValues = getFilteredValues(filterKey)
        
        return (
          <div key={filterKey} className="filter-modal-overlay" onClick={() => {
            setShowFilters(prev => ({ ...prev, [filterKey]: false }))
            setSkipFadeAnimation(true) // Oprește animația pentru revenirea rapidă
            setTimeout(() => {
              setShowContextMenu(true)
            }, 50)
          }}>
            <div className="filter-modal-section show" onClick={(e) => e.stopPropagation()}>
              <div className="filter-modal-header">
                <h3>{filterKey}</h3>
                <div className="filter-modal-header-buttons">
                  <button className="clear-filters-btn" onClick={() => clearFilters(filterKey)}>
                    Șterge filtrele
                  </button>
                  <button className="close-filters-btn" onClick={() => {
                    setShowFilters(prev => ({ ...prev, [filterKey]: false }))
                    setSkipFadeAnimation(true) // Oprește animația pentru revenirea rapidă
                    setTimeout(() => {
                      setShowContextMenu(true)
                    }, 50)
                  }}>
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="filter-modal-content">
                <div className="filter-search-container">
                  <input
                    type="text"
                    placeholder={`Caută în ${filterKey}...`}
                    value={searchTerms[filterKey] || ''}
                    onChange={(e) => handleSearchTermChange(filterKey, e.target.value)}
                    className="filter-search-input"
                  />
                  <button className="clear-filters-inline-btn" onClick={() => clearFilters(filterKey)}>
                    Șterge filtrele
                  </button>
                </div>
                
                <div className="filter-options-grid">
                  {filteredValues.slice(0, 50).map(value => (
                    <label key={value} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filters[filterKey]?.[value] || false}
                        onChange={() => handleFilterToggle(filterKey, value)}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                  {filteredValues.length === 0 && searchTerms[filterKey] && (
                    <div className="filter-no-results">
                      Nu s-au găsit rezultate care să conțină "{searchTerms[filterKey]}"
                    </div>
                  )}
                  {filteredValues.length > 50 && (
                    <div className="filter-more">
                      ... și încă {filteredValues.length - 50} rezultate
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Meniu de filtre centrat */}
      {showContextMenu && (
        <div className={`filter-menu-overlay ${skipFadeAnimation ? 'no-animation' : ''}`} onClick={handleContextMenuClose}>
          <div className={`filter-menu-modal ${skipFadeAnimation ? 'no-animation' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="filter-menu-header">
              <h3>🔬 Meniu Filtre</h3>
              <button className="filter-menu-close" onClick={handleContextMenuClose}>
                ✕
              </button>
            </div>
            <div className="filter-menu-content">
              <p className="filter-menu-description">
                Selectează o coloană pentru a filtra medicamentele:
              </p>
              <div className="filter-menu-grid">
                {Object.keys(filters).map(column => (
                  <div 
                    key={column} 
                    className="filter-menu-item" 
                    onClick={() => handleFilterClick(column)}
                  >
                    <div className="filter-menu-item-icon">🔬</div>
                    <div className="filter-menu-item-content">
                      <span className="filter-menu-item-title">{column}</span>
                      <span className="filter-menu-item-count">
                        {Object.keys(filters[column] || {}).length} opțiuni
                      </span>
                    </div>
                    <div className="filter-menu-item-arrow">→</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal pentru selecția coloanelor */}
      {showColumnModal && (
        <div className="modal-overlay" onClick={() => setShowColumnModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selectează coloanele de afișat</h3>
              <button 
                className="modal-close"
                onClick={() => setShowColumnModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="column-list">
                {allColumns.map(column => (
                  <label key={column} className="column-checkbox">
                    <input
                      type="checkbox"
                      checked={visibleColumns[column] || false}
                      onChange={() => handleColumnToggle(column)}
                    />
                    <span>{column}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button"
                onClick={() => setShowColumnModal(false)}
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pentru crearea planului de tratament */}
      {showPlanModal && selectedMedicineForPlan && (
        <PlanModal 
          medicine={selectedMedicineForPlan}
          onClose={closePlanModal}
          onSave={saveMedicinePlan}
          existingPlan={medicinePlans[selectedMedicineForPlan['Cod medicament']]}
        />
      )}

      {/* Modal pentru adăugarea medicamentelor personalizate */}
      {showAddMedicineModal && (
        <div className="add-medicine-modal-overlay" onClick={closeAddMedicineModal}>
          <div className="add-medicine-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="add-medicine-modal-header">
              <h3>➕ Adaugă medicament personalizat</h3>
              <button className="add-medicine-modal-close" onClick={closeAddMedicineModal}>✕</button>
            </div>
            
            <div className="add-medicine-modal-body">
              <div className="add-medicine-form">
                <label htmlFor="medicineName">Numele medicamentului:</label>
                <input
                  id="medicineName"
                  type="text"
                  placeholder="Introdu numele medicamentului..."
                  value={newMedicineName}
                  onChange={(e) => setNewMedicineName(e.target.value)}
                  className="add-medicine-input"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomMedicine()
                    }
                  }}
                />
              </div>
            </div>

            <div className="add-medicine-modal-footer">
              <button className="add-medicine-cancel-button" onClick={closeAddMedicineModal}>
                Anulează
              </button>
              <button className="add-medicine-save-button" onClick={addCustomMedicine}>
                Salvează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmare pentru Pacient nou */}
      {showNewPatientModal && (
        <div className="new-patient-modal-overlay" onClick={() => setShowNewPatientModal(false)}>
          <div className="new-patient-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="new-patient-modal-header">
              <div className="new-patient-modal-icon">🆕</div>
              <h3>Pacient nou</h3>
              <button 
                className="new-patient-modal-close"
                onClick={() => setShowNewPatientModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="new-patient-modal-body">
              <div className="new-patient-modal-warning">
                <div className="warning-icon">⚠️</div>
                <h4>Ești sigur că vrei să începi cu un pacient nou?</h4>
                <p>Această acțiune va șterge:</p>
                <ul className="warning-list">
                  <li>📝 Indicațiile pacientului</li>
                  <li>👨‍⚕️ Indicațiile medicului</li>
                  <li>💊 Medicamentele selectate</li>
                  <li>📋 Planurile de tratament</li>
                  <li>🤖 Sfaturile AI generate</li>
                </ul>
                <p className="warning-note">
                  <strong>Toate datele vor fi șterse permanent și nu vor putea fi recuperate!</strong>
                </p>
              </div>
            </div>

            <div className="new-patient-modal-footer">
              <button 
                className="new-patient-cancel-button"
                onClick={() => setShowNewPatientModal(false)}
              >
                Anulează
              </button>
              <button 
                className="new-patient-confirm-button"
                onClick={clearAllPatientData}
              >
                🆕 Da, începe cu pacient nou
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componenta pentru modalul de plan de tratament
const PlanModal = ({ medicine, onClose, onSave, existingPlan }) => {
  const [selectedDuration, setSelectedDuration] = useState('')
  const [selectedFrequency, setSelectedFrequency] = useState('')
  const [selectedTimes, setSelectedTimes] = useState([])
  const [customDuration, setCustomDuration] = useState('')
  const [customFrequency, setCustomFrequency] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [showCustomFrequency, setShowCustomFrequency] = useState(false)
  const [showCustomTime, setShowCustomTime] = useState(false)

  // Inițializează modalul cu planul existent dacă există
  useEffect(() => {
    if (existingPlan) {
      setSelectedDuration(existingPlan.duration || '')
      setSelectedFrequency(existingPlan.frequency || '')
      setSelectedTimes(existingPlan.times || [])
      setCustomDuration(existingPlan.customDuration || '')
      setCustomFrequency(existingPlan.customFrequency || '')
      setCustomTime(existingPlan.customTime || '')
    }
  }, [existingPlan])

  const durationOptions = [
    { value: '7', label: '7 zile' },
    { value: '10', label: '10 zile' },
    { value: '14', label: '14 zile' },
    { value: '21', label: '21 zile' },
    { value: '30', label: '30 zile' },
    { value: '40', label: '40 zile' },
    { value: '60', label: '60 zile' },
    { value: '90', label: '90 zile' }
  ]

  const frequencyOptions = [
    { value: '1', label: 'O dată pe zi' },
    { value: '2', label: 'De două ori pe zi' },
    { value: '3', label: 'De trei ori pe zi' },
    { value: '4', label: 'De patru ori pe zi' },
    { value: '6', label: 'La 4 ore' },
    { value: '8', label: 'La 8 ore' },
    { value: '12', label: 'La 12 ore' }
  ]

  const timeOptions = [
    { value: 'dimineata', label: 'Dimineața' },
    { value: 'amiaza', label: 'Amiaza' },
    { value: 'seara', label: 'Seara' },
    { value: 'noaptea', label: 'Noaptea' },
    { value: 'la4ore', label: 'La 4 ore' },
    { value: 'la6ore', label: 'La 6 ore' },
    { value: 'la8ore', label: 'La 8 ore' },
    { value: 'la12ore', label: 'La 12 ore' }
  ]

  const handleTimeToggle = (timeValue) => {
    setSelectedTimes(prev => 
      prev.includes(timeValue) 
        ? prev.filter(t => t !== timeValue) // Deselectează dacă e deja selectat
        : [...prev, timeValue] // Selectează dacă nu e selectat
    )
  }

  const handleCustomDuration = () => {
    if (customDuration && !isNaN(customDuration) && customDuration > 0) {
      setSelectedDuration('') // Șterge selecția predefinită
      setShowCustomDuration(false)
    }
  }

  const handleCustomFrequency = () => {
    if (customFrequency && !isNaN(customFrequency) && customFrequency > 0) {
      setSelectedFrequency('') // Șterge selecția predefinită
      setShowCustomFrequency(false)
    }
  }

  const handleCustomTime = () => {
    if (customTime.trim()) {
      setSelectedTimes(prev => [...prev, customTime.trim()])
      setCustomTime('')
      setShowCustomTime(false)
    }
  }

  const handleSave = () => {
    const hasDuration = selectedDuration || customDuration
    const hasFrequency = selectedFrequency || customFrequency
    const hasTimes = selectedTimes.length > 0 || customTime
    
    // Verifică dacă există vreo selecție sau personalizare
    if (!hasDuration && !hasFrequency && !hasTimes) {
      // Nu salva nimic dacă nu s-a selectat sau personalizat nimic
      onClose()
      return
    }

    const plan = {
      duration: selectedDuration || customDuration || '',
      frequency: selectedFrequency || customFrequency || '',
      times: selectedTimes,
      customDuration: customDuration,
      customFrequency: customFrequency,
      customTime: customTime,
      isCustomFrequency: !!customFrequency, // Flag pentru a ști dacă e personalizare
      medicineName: medicine['Denumire medicament'],
      medicineCode: medicine['Cod medicament']
    }

    onSave(medicine['Cod medicament'], plan)
  }

  return (
    <div className="plan-modal-overlay" onClick={onClose}>
      <div className="plan-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="plan-modal-header">
          <h3>📋 Plan de tratament</h3>
          <button className="plan-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="plan-modal-body">
          <div className="medicine-info">
            <h4>{medicine['Denumire medicament']}</h4>
            <p>Cod: {medicine['Cod medicament']}</p>
          </div>

          <div className="plan-options">
            <div className="plan-section">
              <h5>Durata tratamentului:</h5>
              <div className="plan-buttons-grid">
                {durationOptions.map(option => (
                  <button
                    key={option.value}
                    className={`plan-option-button ${selectedDuration === option.value && !customDuration ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedDuration === option.value) {
                        setSelectedDuration('') // Deselectează dacă e deja selectat
                      } else {
                        setSelectedDuration(option.value)
                        setCustomDuration('')
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  className="plan-custom-button"
                  onClick={() => setShowCustomDuration(!showCustomDuration)}
                >
                  ✏️ Personalizează
                </button>
              </div>
              {showCustomDuration && (
                <div className="custom-input-section">
                  <input
                    type="number"
                    placeholder="Introdu numărul de zile"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="custom-input"
                    min="1"
                  />
                  <button
                    className="custom-save-button"
                    onClick={handleCustomDuration}
                  >
                    Salvează
                  </button>
                  <button
                    className="custom-cancel-button"
                    onClick={() => {
                      setShowCustomDuration(false)
                      setCustomDuration('')
                    }}
                  >
                    Anulează
                  </button>
                </div>
              )}
              {customDuration && (
                <div className="custom-display">
                  <span className="custom-label">Personalizat:</span>
                  <span className="custom-value">{customDuration} zile</span>
                </div>
              )}
            </div>

            <div className="plan-section">
              <h5>Frecvența administrării:</h5>
              <div className="plan-buttons-grid">
                {frequencyOptions.map(option => (
                  <button
                    key={option.value}
                    className={`plan-option-button ${selectedFrequency === option.value && !customFrequency ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedFrequency === option.value) {
                        setSelectedFrequency('') // Deselectează dacă e deja selectat
                      } else {
                        setSelectedFrequency(option.value)
                        setCustomFrequency('')
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  className="plan-custom-button"
                  onClick={() => setShowCustomFrequency(!showCustomFrequency)}
                >
                  ✏️ Personalizează
                </button>
              </div>
              {showCustomFrequency && (
                <div className="custom-input-section">
                  <input
                    type="number"
                    placeholder="Introdu numărul de administrări pe zi"
                    value={customFrequency}
                    onChange={(e) => setCustomFrequency(e.target.value)}
                    className="custom-input"
                    min="1"
                    max="24"
                  />
                  <button
                    className="custom-save-button"
                    onClick={handleCustomFrequency}
                  >
                    Salvează
                  </button>
                  <button
                    className="custom-cancel-button"
                    onClick={() => {
                      setShowCustomFrequency(false)
                      setCustomFrequency('')
                    }}
                  >
                    Anulează
                  </button>
                </div>
              )}
              {customFrequency && (
                <div className="custom-display">
                  <span className="custom-label">Personalizat:</span>
                  <span className="custom-value">{customFrequency} ori pe zi</span>
                </div>
              )}
            </div>

            <div className="plan-section">
              <h5>Orele administrării:</h5>
              <div className="plan-buttons-grid">
                {timeOptions.map(option => (
                  <button
                    key={option.value}
                    className={`plan-option-button ${selectedTimes.includes(option.value) ? 'selected' : ''}`}
                    onClick={() => handleTimeToggle(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  className="plan-custom-button"
                  onClick={() => setShowCustomTime(!showCustomTime)}
                >
                  ✏️ Personalizează
                </button>
              </div>
              {showCustomTime && (
                <div className="custom-input-section">
                  <input
                    type="text"
                    placeholder="Ex: 08:00, 14:00, 20:00"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="custom-input"
                  />
                  <button
                    className="custom-save-button"
                    onClick={handleCustomTime}
                  >
                    Adaugă
                  </button>
                  <button
                    className="custom-cancel-button"
                    onClick={() => {
                      setShowCustomTime(false)
                      setCustomTime('')
                    }}
                  >
                    Anulează
                  </button>
                </div>
              )}
              {customTime && (
                <div className="custom-display">
                  <span className="custom-label">Personalizat:</span>
                  <span className="custom-value">{customTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="plan-modal-footer">
          <button className="plan-cancel-button" onClick={onClose}>
            Anulează
          </button>
          <button className="plan-save-button" onClick={handleSave}>
            Salvează Plan
          </button>
        </div>
      </div>

    </div>
  )
}

export default MedicinesTable