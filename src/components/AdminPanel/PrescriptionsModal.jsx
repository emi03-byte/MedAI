const PrescriptionsModal = ({
  selectedUser,
  prescriptions,
  loading,
  onClose,
  onDeletePrescription,
  formatDate,
}) => {
  if (!selectedUser) return null

  return (
    <div
      className="new-patient-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 10001 }}
    >
      <div
        className="new-patient-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}
      >
        <div className="new-patient-modal-header">
          <h2>
            📋 Rețete - {selectedUser.nume} ({selectedUser.email})
          </h2>
          <button
            className="close-button"
            onClick={onClose}
            style={{
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            type="button"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>⏳ Se încarcă rețetele...</div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Nu există rețete pentru acest utilizator.
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {prescriptions.map((prescription, index) => (
              <div
                key={prescription.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  background: '#f9f9f9',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: '#1a3c7c' }}>
                      Rețetă #{index + 1} -{' '}
                      {prescription.nume_pacient || 'Fără nume pacient'}
                    </h3>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                      Data: {formatDate(prescription.data_creare)}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeletePrescription(prescription.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    type="button"
                  >
                    🗑️ Șterge
                  </button>
                </div>

                {prescription.medicamente && prescription.medicamente.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#1a3c7c' }}>
                      Medicamente ({prescription.medicamente.length}):
                    </strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {prescription.medicamente.map((med, idx) => {
                        const denumire =
                          med['Denumire medicament'] ||
                          med.denumire_medicament ||
                          med.denumire ||
                          med.Denumire_medicament ||
                          med.denumireMedicament ||
                          (typeof med === 'string' ? med : 'Medicament necunoscut')
                        return (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            {denumire}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {prescription.indicatii_pacient && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#1a3c7c' }}>📝 Indicații Pacient:</strong>
                    <p
                      style={{
                        margin: '8px 0',
                        padding: '8px',
                        background: '#fff',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {prescription.indicatii_pacient}
                    </p>
                  </div>
                )}

                {prescription.indicatii_medic && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#1a3c7c' }}>👨‍⚕️ Indicații Medic:</strong>
                    <p
                      style={{
                        margin: '8px 0',
                        padding: '8px',
                        background: '#fff',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {prescription.indicatii_medic}
                    </p>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#1a3c7c' }}>📅 Planuri Tratament:</strong>
                  {prescription.planuri_tratament &&
                  prescription.planuri_tratament !== null &&
                  typeof prescription.planuri_tratament === 'object' &&
                  Object.keys(prescription.planuri_tratament).length > 0 ? (
                    <div
                      style={{
                        margin: '8px 0',
                        padding: '12px',
                        background: '#fff',
                        borderRadius: '4px',
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      {Object.values(prescription.planuri_tratament).map((plan, idx) => (
                        <div
                          key={idx}
                          style={{
                            marginBottom:
                              idx < Object.values(prescription.planuri_tratament).length - 1
                                ? '16px'
                                : '0',
                            paddingBottom:
                              idx < Object.values(prescription.planuri_tratament).length - 1
                                ? '16px'
                                : '0',
                            borderBottom:
                              idx < Object.values(prescription.planuri_tratament).length - 1
                                ? '1px solid #e0e0e0'
                                : 'none',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: '#1a3c7c',
                              marginBottom: '8px',
                              fontSize: '14px',
                            }}
                          >
                            💊 {plan.medicineName || plan.medicine_name || 'Medicament necunoscut'}
                            {plan.medicineCode && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: '#666',
                                  fontWeight: 'normal',
                                  marginLeft: '8px',
                                }}
                              >
                                (Cod: {plan.medicineCode || plan.medicine_code})
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#333' }}>
                            {plan.duration && (
                              <div>
                                <strong>Durată:</strong> {plan.duration}{' '}
                                {plan.customDuration ? plan.customDuration : 'zile'}
                              </div>
                            )}
                            {plan.frequency && (
                              <div>
                                <strong>Frecvență:</strong> {plan.frequency}{' '}
                                {plan.customFrequency ? plan.customFrequency : 'ori pe zi'}
                              </div>
                            )}
                            {plan.times &&
                              Array.isArray(plan.times) &&
                              plan.times.length > 0 && (
                                <div>
                                  <strong>Ore de administrare:</strong> {plan.times.join(', ')}
                                </div>
                              )}
                            {plan.customTime && (
                              <div>
                                <strong>Orar personalizat:</strong> {plan.customTime}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      style={{
                        margin: '8px 0',
                        padding: '8px',
                        background: '#f5f5f5',
                        borderRadius: '4px',
                        color: '#666',
                        fontStyle: 'italic',
                      }}
                    >
                      Nu există planuri de tratament
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PrescriptionsModal

