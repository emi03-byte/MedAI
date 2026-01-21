import { useEffect, useState } from 'react'

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

      // Identifică orele personalizate din times array și le setează în customTime pentru afișare
      if (existingPlan.times && existingPlan.times.length > 0) {
        const timeOptionsValues = [
          'dimineata',
          'amiaza',
          'seara',
          'noaptea',
          'la4ore',
          'la6ore',
          'la8ore',
          'la12ore',
        ]
        const customTimes = existingPlan.times.filter((time) => {
          const isPredefined = timeOptionsValues.includes(time)
          const isCustomFormat = time.match(/^\d{1,2}:\d{2}(,\s*\d{1,2}:\d{2})*$/)
          return !isPredefined && (isCustomFormat || time.trim() !== '')
        })
        if (customTimes.length > 0) {
          setCustomTime(customTimes.join(', '))
        } else {
          setCustomTime(existingPlan.customTime || '')
        }
      } else {
        setCustomTime(existingPlan.customTime || '')
      }
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
    { value: '90', label: '90 zile' },
  ]

  const frequencyOptions = [
    { value: '1', label: 'O dată pe zi' },
    { value: '2', label: 'De două ori pe zi' },
    { value: '3', label: 'De trei ori pe zi' },
    { value: '4', label: 'De patru ori pe zi' },
    { value: '6', label: 'La 4 ore' },
    { value: '8', label: 'La 8 ore' },
    { value: '12', label: 'La 12 ore' },
  ]

  const timeOptions = [
    { value: 'dimineata', label: 'Dimineața' },
    { value: 'amiaza', label: 'Amiaza' },
    { value: 'seara', label: 'Seara' },
    { value: 'noaptea', label: 'Noaptea' },
    { value: 'la4ore', label: 'La 4 ore' },
    { value: 'la6ore', label: 'La 6 ore' },
    { value: 'la8ore', label: 'La 8 ore' },
    { value: 'la12ore', label: 'La 12 ore' },
  ]

  const handleTimeToggle = (timeValue) => {
    setSelectedTimes((prev) =>
      prev.includes(timeValue) ? prev.filter((t) => t !== timeValue) : [...prev, timeValue]
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
      setSelectedTimes((prev) => [...prev, customTime.trim()])
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
      medicineCode: medicine['Cod medicament'],
    }

    onSave(medicine['Cod medicament'], plan)
  }

  return (
    <div className="plan-modal-overlay" onClick={onClose}>
      <div className="plan-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="plan-modal-header">
          <h3>📋 Plan de tratament</h3>
          <button className="plan-modal-close" onClick={onClose} type="button">
            ✕
          </button>
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
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`plan-option-button ${
                      selectedDuration === option.value && !customDuration ? 'selected' : ''
                    }`}
                    onClick={() => {
                      if (selectedDuration === option.value) {
                        setSelectedDuration('') // Deselectează dacă e deja selectat
                      } else {
                        setSelectedDuration(option.value)
                        setCustomDuration('')
                      }
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  className="plan-custom-button"
                  onClick={() => setShowCustomDuration(!showCustomDuration)}
                  type="button"
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
                  <button className="custom-save-button" onClick={handleCustomDuration} type="button">
                    Salvează
                  </button>
                  <button
                    className="custom-cancel-button"
                    onClick={() => {
                      setShowCustomDuration(false)
                      setCustomDuration('')
                    }}
                    type="button"
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
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`plan-option-button ${
                      selectedFrequency === option.value && !customFrequency ? 'selected' : ''
                    }`}
                    onClick={() => {
                      if (selectedFrequency === option.value) {
                        setSelectedFrequency('') // Deselectează dacă e deja selectat
                      } else {
                        setSelectedFrequency(option.value)
                        setCustomFrequency('')
                      }
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  className="plan-custom-button"
                  onClick={() => setShowCustomFrequency(!showCustomFrequency)}
                  type="button"
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
                    type="button"
                  >
                    Salvează
                  </button>
                  <button
                    className="custom-cancel-button"
                    onClick={() => {
                      setShowCustomFrequency(false)
                      setCustomFrequency('')
                    }}
                    type="button"
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
                {timeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`plan-option-button ${
                      selectedTimes.includes(option.value) ? 'selected' : ''
                    }`}
                    onClick={() => handleTimeToggle(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  className="plan-custom-button"
                  onClick={() => setShowCustomTime(!showCustomTime)}
                  type="button"
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
                  <button className="custom-save-button" onClick={handleCustomTime} type="button">
                    Adaugă
                  </button>
                  <button
                    className="custom-cancel-button"
                    onClick={() => {
                      setShowCustomTime(false)
                      setCustomTime('')
                    }}
                    type="button"
                  >
                    Anulează
                  </button>
                </div>
              )}
              {(() => {
                // Identifică orele personalizate (cele care nu sunt în timeOptions)
                const customTimes = selectedTimes.filter((time) => {
                  const isPredefined = timeOptions.some((option) => option.value === time)
                  // Verifică dacă este un format de oră personalizată (HH:MM sau HH:MM, HH:MM)
                  const isCustomFormat = time.match(/^\d{1,2}:\d{2}(,\s*\d{1,2}:\d{2})*$/)
                  return !isPredefined && (isCustomFormat || time.trim() !== '')
                })

                // Dacă există customTime sau ore personalizate în selectedTimes, afișează-le
                if (customTime || customTimes.length > 0) {
                  const displayValue = customTime || customTimes.join(', ')
                  return (
                    <div className="custom-display">
                      <span className="custom-label">Personalizat:</span>
                      <span className="custom-value">{displayValue}</span>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>

        <div className="plan-modal-footer">
          <button className="plan-cancel-button" onClick={onClose} type="button">
            Anulează
          </button>
          <button className="plan-save-button" onClick={handleSave} type="button">
            Salvează Plan
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlanModal

