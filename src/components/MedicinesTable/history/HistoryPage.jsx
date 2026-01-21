import { useHistoryFilters } from './useHistoryFilters'

const HistoryPage = ({
  showHistoryPage,
  onBack,
  expandedCardId,
  setExpandedCardId,
  isDeleteMode,
  setIsDeleteMode,
  selectedPrescriptions,
  setSelectedPrescriptions,
  showDeleteConfirmModal,
  setShowDeleteConfirmModal,
  historyViewMode,
  setHistoryViewMode,
  historyDateFilter,
  setHistoryDateFilter,
  historySpecificDate,
  setHistorySpecificDate,
  historyNameFilter,
  setHistoryNameFilter,
  loadingHistory,
  prescriptionHistory,
  downloadPrescriptionPDF,
  apiBaseUrl,
  currentUser,
  setPrescriptionHistory,
}) => {
  const { filteredHistory, hasActiveFilters } = useHistoryFilters({
    prescriptionHistory,
    historyDateFilter,
    historySpecificDate,
    historyNameFilter,
  })

  if (!showHistoryPage) return null

  return (
    <>
      <div className={`history-page-container ${expandedCardId ? 'blurred' : ''}`}>
        <div className="history-page-header">
          <button className="history-back-button" onClick={onBack} type="button">
            Înapoi
          </button>
          <h2 className="history-page-title">Istoric Rețete</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isDeleteMode ? (
              <>
                <button
                  className="history-select-all-button"
                  onClick={() => {
                    if (selectedPrescriptions.length === prescriptionHistory.length) {
                      setSelectedPrescriptions([])
                    } else {
                      setSelectedPrescriptions(prescriptionHistory.map((p) => p.id))
                    }
                  }}
                  type="button"
                >
                  {selectedPrescriptions.length === prescriptionHistory.length
                    ? 'Selectate toate'
                    : 'Selectează toate'}
                </button>
                <button
                  className="history-delete-selected-button"
                  onClick={() => {
                    if (selectedPrescriptions.length === 0) {
                      alert('Te rugăm să selectezi cel puțin o rețetă de șters')
                      return
                    }
                    setShowDeleteConfirmModal(true)
                  }}
                  disabled={selectedPrescriptions.length === 0}
                  type="button"
                >
                  Șterge ({selectedPrescriptions.length})
                </button>
                <button
                  className="history-cancel-delete-button"
                  onClick={() => {
                    setIsDeleteMode(false)
                    setSelectedPrescriptions([])
                  }}
                  type="button"
                >
                  ✕ Anulează
                </button>
              </>
            ) : (
              <button
                className="history-delete-button"
                onClick={() => setIsDeleteMode(true)}
                type="button"
              >
                Șterge
              </button>
            )}
            <button
              className="history-view-mode-toggle"
              onClick={() => {
                if (historyViewMode === 'list') {
                  setHistoryViewMode('compact')
                } else if (historyViewMode === 'compact') {
                  setHistoryViewMode('large')
                } else {
                  setHistoryViewMode('list')
                }
              }}
              type="button"
            >
              {historyViewMode === 'list' ? '☰' : historyViewMode === 'compact' ? '☷' : '☰☰'}
            </button>
          </div>
        </div>

        {/* Filtre pentru istoric */}
        <div className="history-filters-container">
          <div className="history-filters-row">
            <div className="history-filter-group">
              <label htmlFor="history-date-filter" className="history-filter-label">
                Filtrare după dată:
              </label>
              <select
                id="history-date-filter"
                className="history-filter-select"
                value={historyDateFilter}
                onChange={(e) => {
                  setHistoryDateFilter(e.target.value)
                  if (e.target.value !== 'specifica') {
                    setHistorySpecificDate('')
                  }
                }}
              >
                <option value="toate">Toate</option>
                <option value="azi">Astăzi</option>
                <option value="saptamana">Ultima săptămână</option>
                <option value="luna">Ultima lună</option>
                <option value="anul">Ultimul an</option>
                <option value="specifica">Dată specifică</option>
              </select>
            </div>
            {historyDateFilter === 'specifica' && (
              <div className="history-filter-group">
                <label htmlFor="history-specific-date" className="history-filter-label">
                  Selectează dată:
                </label>
                <input
                  id="history-specific-date"
                  type="date"
                  className="history-filter-date-input"
                  value={historySpecificDate}
                  onChange={(e) => setHistorySpecificDate(e.target.value)}
                />
              </div>
            )}
            <div className="history-filter-group">
              <label htmlFor="history-name-filter" className="history-filter-label">
                Filtrare după nume:
              </label>
              <input
                id="history-name-filter"
                type="text"
                className="history-filter-input"
                placeholder="Caută după nume pacient..."
                value={historyNameFilter}
                onChange={(e) => setHistoryNameFilter(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <button
                className="history-filter-clear-button"
                onClick={() => {
                  setHistoryDateFilter('toate')
                  setHistorySpecificDate('')
                  setHistoryNameFilter('')
                }}
                type="button"
              >
                ✕ Șterge filtrele
              </button>
            )}
          </div>
        </div>

        <div className="history-page-content">
          {isDeleteMode && (
            <div className="history-selection-info">
              <span>{selectedPrescriptions.length} rețete selectate</span>
            </div>
          )}

          {loadingHistory ? (
            <div className="history-loading">
              <p>Se încarcă istoricul...</p>
            </div>
          ) : prescriptionHistory.length === 0 ? (
            <div className="history-empty">
              <p>Nu ai rețete salvate încă.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="history-empty">
              <p>Nu s-au găsit rețete care să corespundă filtrelor.</p>
            </div>
          ) : (
            <div
              className={`history-cards-grid history-view-${historyViewMode} ${
                isDeleteMode ? 'delete-mode-active' : ''
              }`}
            >
              {filteredHistory.map((prescription, index) => {
                const isSelected = selectedPrescriptions.includes(prescription.id)
                return (
                  <div
                    key={prescription.id}
                    className={`history-card history-card-${historyViewMode} ${
                      isSelected ? 'history-card-selected' : ''
                    }`}
                    onClick={(e) => {
                      // Permite selecția doar dacă suntem în modul de ștergere și click-ul nu este pe butonul "Arată"
                      if (isDeleteMode && !e.target.closest('.history-card-view-button')) {
                        if (isSelected) {
                          setSelectedPrescriptions(
                            selectedPrescriptions.filter((id) => id !== prescription.id)
                          )
                        } else {
                          setSelectedPrescriptions([...selectedPrescriptions, prescription.id])
                        }
                      }
                    }}
                    style={{ cursor: isDeleteMode ? 'pointer' : 'default', position: 'relative' }}
                  >
                    {isDeleteMode && (
                      <div className="history-card-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            if (e.target.checked) {
                              setSelectedPrescriptions([...selectedPrescriptions, prescription.id])
                            } else {
                              setSelectedPrescriptions(
                                selectedPrescriptions.filter((id) => id !== prescription.id)
                              )
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    <div className="history-card-header">
                      <div className="history-card-header-content">
                        <h4 className="history-card-title">
                          Rețetă #{prescriptionHistory.length - index}
                          {prescription.nume_pacient && (
                            <span className="history-card-patient-name">
                              {' '}
                              - {prescription.nume_pacient}
                            </span>
                          )}
                        </h4>
                        <p className="history-card-date">
                          {new Date(prescription.data_creare).toLocaleString('ro-RO')}
                        </p>
                      </div>
                      <div className="history-card-header-buttons">
                        <button
                          className="history-card-pdf-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadPrescriptionPDF(prescription)
                          }}
                          style={{ zIndex: 10, position: 'relative' }}
                          type="button"
                        >
                          📄 PDF
                        </button>
                        {historyViewMode === 'compact' && (
                          <button
                            className="history-card-view-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Buton Arată apăsat pentru rețeta:', prescription.id)
                              setExpandedCardId(prescription.id)
                            }}
                            style={{ zIndex: 10, position: 'relative' }}
                            type="button"
                          >
                            Arată
                          </button>
                        )}
                      </div>
                    </div>

                    {prescription.medicamente && prescription.medicamente.length > 0 && (
                      <div className="history-card-section">
                        <strong className="history-card-label">
                          Medicamente ({prescription.medicamente.length}):
                        </strong>
                        <ul className="history-card-list">
                          {prescription.medicamente
                            .slice(
                              0,
                              historyViewMode === 'large'
                                ? prescription.medicamente.length
                                : historyViewMode === 'list'
                                  ? 5
                                  : 3
                            )
                            .map((med, idx) => (
                              <li key={idx} className="history-card-list-item">
                                {med['Denumire medicament'] || med.denumire_medicament || ''}
                              </li>
                            ))}
                          {historyViewMode !== 'large' &&
                            prescription.medicamente.length >
                              (historyViewMode === 'list' ? 5 : 3) && (
                              <li
                                className="history-card-list-item"
                                style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}
                              >
                                ... și încă{' '}
                                {prescription.medicamente.length - (historyViewMode === 'list' ? 5 : 3)}{' '}
                                medicamente
                              </li>
                            )}
                        </ul>
                      </div>
                    )}

                    {(historyViewMode === 'large' || historyViewMode === 'list') && (
                      <>
                        {prescription.indicatii_pacient && (
                          <div className="history-card-section history-card-indications">
                            <strong className="history-card-label">Indicații Pacient:</strong>
                            <p className="history-card-text">{prescription.indicatii_pacient}</p>
                          </div>
                        )}

                        {prescription.indicatii_medic && (
                          <div className="history-card-section history-card-indications">
                            <strong className="history-card-label">Indicații Medic:</strong>
                            <p className="history-card-text">{prescription.indicatii_medic}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal pentru vizualizare detaliată rețetă */}
      {expandedCardId && showHistoryPage && (
        <div className="history-card-modal-overlay" onClick={() => setExpandedCardId(null)}>
          <div className="history-card-modal-content" onClick={(e) => e.stopPropagation()}>
            {prescriptionHistory.find((p) => p.id === expandedCardId) &&
              (() => {
                const prescription = prescriptionHistory.find((p) => p.id === expandedCardId)
                const index = prescriptionHistory.findIndex((p) => p.id === expandedCardId)
                return (
                  <>
                    <div className="history-card-modal-header">
                      <h3>
                        Rețetă #{prescriptionHistory.length - index}
                        {prescription.nume_pacient && (
                          <span className="history-card-patient-name">
                            {' '}
                            - {prescription.nume_pacient}
                          </span>
                        )}
                      </h3>
                      <button
                        className="history-card-modal-close"
                        onClick={() => setExpandedCardId(null)}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="history-card-modal-body">
                      <div className="history-card-modal-section">
                        <p className="history-card-modal-date">
                          {new Date(prescription.data_creare).toLocaleString('ro-RO')}
                        </p>
                      </div>

                      {prescription.indicatii_pacient && (
                        <div className="history-card-modal-section history-card-indications">
                          <strong className="history-card-label">Indicații Pacient:</strong>
                          <p className="history-card-text">{prescription.indicatii_pacient}</p>
                        </div>
                      )}

                      {prescription.indicatii_medic && (
                        <div className="history-card-modal-section history-card-indications">
                          <strong className="history-card-label">Indicații Medic:</strong>
                          <p className="history-card-text">{prescription.indicatii_medic}</p>
                        </div>
                      )}

                      {prescription.medicamente && prescription.medicamente.length > 0 && (
                        <div className="history-card-modal-section">
                          <strong className="history-card-label">
                            Medicamente ({prescription.medicamente.length}):
                          </strong>
                          <ul className="history-card-list">
                            {prescription.medicamente.map((med, idx) => (
                              <li key={idx} className="history-card-list-item">
                                {med['Denumire medicament'] || med.denumire_medicament || ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
          </div>
        </div>
      )}

      {/* Modal de confirmare pentru ștergerea rețetelor */}
      {showDeleteConfirmModal && (
        <div
          className="history-card-modal-overlay"
          onClick={() => setShowDeleteConfirmModal(false)}
        >
          <div className="history-card-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="history-card-modal-header">
              <h3>Confirmare ștergere</h3>
              <button
                className="history-card-modal-close"
                onClick={() => setShowDeleteConfirmModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="history-card-modal-body">
              <p style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                Ești sigur că vrei să ștergi {selectedPrescriptions.length}{' '}
                {selectedPrescriptions.length === 1 ? 'rețetă' : 'rețete'}?
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Această acțiune nu poate fi anulată.
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  className="history-cancel-delete-button"
                  onClick={() => setShowDeleteConfirmModal(false)}
                  type="button"
                >
                  Anulează
                </button>
                <button
                  className="history-delete-selected-button"
                  onClick={async () => {
                    setShowDeleteConfirmModal(false)
                    try {
                      const deletePromises = selectedPrescriptions.map((id) =>
                        fetch(`${apiBaseUrl}/api/prescriptions/${id}?userId=${currentUser.id}`, {
                          method: 'DELETE',
                        })
                      )

                      const results = await Promise.all(deletePromises)
                      const allSuccess = results.every((r) => r.ok)

                      if (allSuccess) {
                        setPrescriptionHistory(
                          prescriptionHistory.filter((p) => !selectedPrescriptions.includes(p.id))
                        )
                        setSelectedPrescriptions([])
                        setIsDeleteMode(false)
                        alert(`${selectedPrescriptions.length} rețete au fost șterse cu succes!`)
                      } else {
                        const errorData = await Promise.all(
                          results.map((r) =>
                            r.ok ? null : r.json().catch(() => ({ error: 'Eroare necunoscută' }))
                          )
                        )
                        console.error('Eroare la ștergerea rețetelor:', errorData)
                        alert('Eroare la ștergerea unor rețete. Verifică consola pentru detalii.')
                      }
                    } catch (error) {
                      console.error('Eroare la ștergerea rețetelor:', error)
                      alert(`Eroare la ștergerea rețetelor: ${error.message}`)
                    }
                  }}
                  type="button"
                >
                  Șterge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default HistoryPage

