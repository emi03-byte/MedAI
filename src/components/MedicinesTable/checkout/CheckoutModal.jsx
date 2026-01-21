const CheckoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  patientName,
  selectedProducts,
  medicinePlans,
  patientNotes,
  doctorNotes,
  getFrequencyText,
  getTimeText,
  getCompensationPercentage,
}) => {
  if (!isOpen) return null

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-header">
          <h2>
            Previzualizare rețetă
            {patientName && patientName.trim() !== '' && (
              <span
                style={{
                  marginLeft: '10px',
                  fontSize: '18px',
                  fontWeight: 'normal',
                  color: '#64748b',
                }}
              >
                - {patientName}
              </span>
            )}
          </h2>
        </div>

        <div className="checkout-body">
          <div className="checkout-section">
            <h3>Medicamente selectate ({selectedProducts.length})</h3>
            {selectedProducts.length === 0 ? (
              <p>Nu ai selectat niciun medicament.</p>
            ) : (
              <div className="checkout-medicines-list">
                {selectedProducts.map((product, index) => {
                  const code = product['Cod medicament']
                  const plan = code ? medicinePlans[code] : null
                  const parts = []

                  if (plan) {
                    if (plan.duration) {
                      parts.push(plan.duration === '1' ? '1 zi' : `${plan.duration} zile`)
                    }

                    if (plan.frequency) {
                      if (plan.isCustomFrequency) {
                        parts.push(`${plan.frequency} ori pe zi`)
                      } else {
                        parts.push(getFrequencyText(plan.frequency))
                      }
                    }

                    // Afișează orele - fie din times array, fie din customTime
                    if (plan.times && plan.times.length > 0) {
                      const timesText = plan.times
                        .map((time) => {
                          // Verifică dacă este o oră personalizată (format HH:MM) sau o opțiune predefinită
                          if (time.match(/^\d{1,2}:\d{2}$/)) {
                            return time
                          }
                          return getTimeText(time)
                        })
                        .join(' | ')
                      parts.push(timesText)
                    } else if (plan.customTime) {
                      // Dacă nu există times dar există customTime, afișează-l
                      parts.push(plan.customTime)
                    }
                  }

                  const planText = parts.length > 0 ? parts.join(' | ') : 'Fără plan'

                  return (
                    <div
                      key={`${code || product['Denumire medicament'] || index}-checkout`}
                      className="checkout-medicine-chip"
                    >
                      <div className="checkout-medicine-chip-main">
                        <span className="checkout-medicine-chip-name">{product['Denumire medicament']}</span>
                        {product['Cod medicament'] && (
                          <span className="checkout-medicine-chip-code">
                            Cod: {product['Cod medicament']}
                          </span>
                        )}
                        {product['Lista de compensare'] && (
                          <span className="checkout-medicine-chip-comp">
                            Compensare: {getCompensationPercentage(product['Lista de compensare'])}
                          </span>
                        )}
                      </div>
                      <div className="checkout-medicine-chip-plan">Plan: {planText}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="checkout-section">
            <h3>Notițe pacient</h3>
            {patientNotes && patientNotes.trim() ? (
              <p className="checkout-notes-text">{patientNotes}</p>
            ) : (
              <p className="checkout-notes-empty">Nu există notițe pentru pacient.</p>
            )}
          </div>

          <div className="checkout-section">
            <h3>Notițe medic</h3>
            {doctorNotes && doctorNotes.trim() ? (
              <p className="checkout-notes-text">{doctorNotes}</p>
            ) : (
              <p className="checkout-notes-empty">Nu există notițe ale medicului.</p>
            )}
          </div>
        </div>

        <div className="checkout-actions">
          <button
            type="button"
            className="checkout-button checkout-button-secondary"
            onClick={onClose}
          >
            Înapoi la listă
          </button>
          <button
            type="button"
            className="checkout-button checkout-button-primary"
            onClick={onConfirm}
          >
            Finalizează rețeta
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal

