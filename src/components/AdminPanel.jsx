import { useState, useEffect } from 'react'
import './MedicinesTable.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const AdminPanel = ({ currentUser, onClose, isFullPage = false, onLogout }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('toate') // 'toate', 'pending', 'approved', 'rejected', 'istoric'
  const [actionLoading, setActionLoading] = useState(null)
  const [deletedRequests, setDeletedRequests] = useState([])
  const [selectedUser, setSelectedUser] = useState(null) // Utilizatorul selectat pentru vizualizare rețete
  const [userPrescriptions, setUserPrescriptions] = useState([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const url = `${API_BASE_URL}/api/admin/requests?userId=${currentUser.id}&showDeleted=false`
      console.log('📋 [FRONTEND] Fetching requests:', { activeTab, url })
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Eroare la încărcarea cererilor')
      }
      
      console.log('📋 [FRONTEND] Requests primite:', { count: data.requests?.length, requests: data.requests })
      if (data.requests && data.requests.length > 0) {
        console.log('📋 [FRONTEND] Primul request:', { 
          id: data.requests[0].id, 
          idType: typeof data.requests[0].id,
          email: data.requests[0].email,
          deleted_at: data.requests[0].deleted_at
        })
      }
      
      setRequests(data.requests || [])
    } catch (err) {
      console.error('❌ [FRONTEND] Eroare la încărcarea cererilor:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeletedRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/requests?userId=${currentUser.id}&showDeleted=true`)
      const data = await response.json()
      if (response.ok) {
        setDeletedRequests(data.requests || [])
      }
    } catch (err) {
      console.error('Eroare la încărcarea conturilor șterse:', err)
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      fetchRequests()
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser?.id) {
      fetchDeletedRequests()
    }
  }, [currentUser])

  const handleApprove = async (userId) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`${API_BASE_URL}/api/admin/approve/${userId}?userId=${currentUser.id}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Eroare la aprobare')
      }
      
      // Reîncarcă lista
      await fetchRequests()
    } catch (err) {
      console.error('Eroare la aprobare:', err)
      alert(`Eroare: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Ești sigur că vrei să respingi acest cont?')) {
      return
    }
    
    try {
      setActionLoading(userId)
      const response = await fetch(`${API_BASE_URL}/api/admin/reject/${userId}?userId=${currentUser.id}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Eroare la respingere')
      }
      
      // Reîncarcă lista
      await fetchRequests()
    } catch (err) {
      console.error('Eroare la respingere:', err)
      alert(`Eroare: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeStatus = async (userId, newStatus) => {
    const statusMessages = {
      pending: 'pune în așteptare',
      approved: 'aprobe',
      rejected: 'respinge'
    }
    
    const message = statusMessages[newStatus]
    const confirmMessage = `Ești sigur că vrei să ${message} acest cont?`
    
    if (!confirm(confirmMessage)) {
      return
    }
    
    try {
      setActionLoading(userId)
      const body = { status: newStatus }
      
      // Dacă se aprobă, păstrează rolul actual (is_admin)
      if (newStatus === 'approved') {
        const request = requests.find(r => r.id === userId)
        body.is_admin = request?.is_admin === 1 ? true : false
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/change-status/${userId}?userId=${currentUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Eroare la schimbare status')
      }
      
      // Reîncarcă lista
      await fetchRequests()
    } catch (err) {
      console.error('Eroare la schimbare status:', err)
      alert(`Eroare: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest cont? Contul va fi marcat ca șters și va apărea în istoric.')) {
      return
    }

    try {
      setActionLoading(userId)
      const response = await fetch(`${API_BASE_URL}/api/admin/delete-user/${userId}?userId=${currentUser.id}`, {
        method: 'DELETE'
      })
      
      // Verifică dacă răspunsul este JSON înainte de a-l parsa
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // Dacă nu este JSON, încercă să citești textul pentru debugging
        const text = await response.text()
        console.error('Răspuns non-JSON primit:', text)
        throw new Error(`Eroare server: ${response.status} ${response.statusText}`)
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Eroare la ștergere cont: ${response.status}`)
      }
      
      // Reîncarcă lista
      await fetchRequests()
      await fetchDeletedRequests()
      alert('Cont șters cu succes! Poți vedea conturile șterse în tab-ul "Istoric".')
    } catch (err) {
      console.error('Eroare la ștergere cont:', err)
      alert(`Eroare: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestoreUser = async (userId) => {
    if (!window.confirm('Ești sigur că vrei să restaurezi acest cont?')) {
      return
    }

    try {
      setActionLoading(userId)
      const response = await fetch(`${API_BASE_URL}/api/admin/restore-user/${userId}?userId=${currentUser.id}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Eroare la restaurare cont')
      }
      
      // Reîncarcă lista
      await fetchRequests()
      await fetchDeletedRequests()
      alert('Cont restaurat cu succes!')
    } catch (err) {
      console.error('Eroare la restaurare cont:', err)
      alert(`Eroare: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewPrescriptions = async (userId, userName, userEmail) => {
    try {
      console.log('📋 [FRONTEND] Deschidere rețete pentru utilizator:', { userId, userName, userEmail, userIdType: typeof userId })
      setLoadingPrescriptions(true)
      setSelectedUser({ id: userId, nume: userName, email: userEmail })
      
      const url = `${API_BASE_URL}/api/admin/user-prescriptions/${userId}?userId=${currentUser.id}`
      console.log('📋 [FRONTEND] URL cerere:', url)
      
      const response = await fetch(url)
      
      // Verifică dacă răspunsul este JSON înainte de a-l parsa
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
        console.log('📋 [FRONTEND] Răspuns primit:', { status: response.status, ok: response.ok, data })
      } else {
        // Dacă nu este JSON, încercă să citești textul pentru debugging
        const text = await response.text()
        console.error('❌ [FRONTEND] Răspuns non-JSON primit:', text)
        throw new Error(`Eroare server: ${response.status} ${response.statusText}`)
      }
      
      if (!response.ok) {
        console.error('❌ [FRONTEND] Răspuns negativ:', { status: response.status, error: data.error })
        throw new Error(data.error || `Eroare la încărcarea rețetelor: ${response.status}`)
      }
      
      console.log('✅ [FRONTEND] Rețete încărcate cu succes:', data.prescriptions?.length || 0)
      setUserPrescriptions(data.prescriptions || [])
    } catch (err) {
      console.error('❌ [FRONTEND] Eroare la încărcarea rețetelor:', err)
      alert(`Eroare: ${err.message}`)
      setSelectedUser(null)
    } finally {
      setLoadingPrescriptions(false)
    }
  }

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Ești sigur că vrei să ștergi această rețetă?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/prescriptions/${prescriptionId}?userId=${currentUser.id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Eroare la ștergerea rețetei')
      }
      
      // Reîncarcă rețetele
      if (selectedUser) {
        await handleViewPrescriptions(selectedUser.id, selectedUser.nume, selectedUser.email)
      }
      alert('Rețetă ștearsă cu succes!')
    } catch (err) {
      console.error('Eroare la ștergerea rețetei:', err)
      alert(`Eroare: ${err.message}`)
    }
  }
  
  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'În așteptare', class: 'status-pending', emoji: '⏳' },
      approved: { text: 'Aprobat', class: 'status-approved', emoji: '✅' },
      rejected: { text: 'Respinse', class: 'status-rejected', emoji: '❌' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.emoji} {badge.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'toate', label: 'Toate', count: requests.length },
    { id: 'pending', label: 'În așteptare', count: requests.filter(r => r.status === 'pending').length },
    { id: 'approved', label: 'Aprobate', count: requests.filter(r => r.status === 'approved').length },
    { id: 'rejected', label: 'Respinse', count: requests.filter(r => r.status === 'rejected').length },
    { id: 'istoric', label: 'Șterse', count: deletedRequests.length, isHistory: true }
  ]

  const filteredRequests = activeTab === 'toate' 
    ? requests 
    : activeTab === 'istoric'
    ? deletedRequests
    : requests.filter(r => r.status === activeTab)

  const content = (
    <div className={`admin-panel ${isFullPage ? 'admin-panel-full' : ''}`}>
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-title">Administrare conturi</h2>
          <p className="admin-subtitle">Monitorizare și aprobări utilizatori</p>
        </div>
        <div className="admin-header-actions">
          {isFullPage ? (
            <button className="admin-logout-button" onClick={onLogout}>Deconectare</button>
          ) : (
            <button className="admin-close-button" onClick={onClose}>✕</button>
          )}
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total conturi</div>
          <div className="admin-stat-value">{requests.length + deletedRequests.length}</div>
        </div>
        <div className="admin-stat-card pending">
          <div className="admin-stat-label">În așteptare</div>
          <div className="admin-stat-value">{requests.filter(r => r.status === 'pending').length}</div>
        </div>
        <div className="admin-stat-card approved">
          <div className="admin-stat-label">Aprobate</div>
          <div className="admin-stat-value">{requests.filter(r => r.status === 'approved').length}</div>
        </div>
        <div className="admin-stat-card rejected">
          <div className="admin-stat-label">Respinse</div>
          <div className="admin-stat-value">{requests.filter(r => r.status === 'rejected').length}</div>
        </div>
        <div className="admin-stat-card deleted">
          <div className="admin-stat-label">Șterse</div>
          <div className="admin-stat-value">{deletedRequests.length}</div>
        </div>
      </div>

      {error && (
        <div className="admin-error">{error}</div>
      )}

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label} <span className="admin-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading">Se încarcă...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="admin-empty">
          {activeTab === 'istoric' 
            ? 'Nu există conturi șterse.' 
            : `Nu există cereri${activeTab !== 'toate' ? ` cu status "${activeTab}"` : ''}.`}
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nume</th>
                <th>Email</th>
                <th>Data înregistrării</th>
                <th>Status</th>
                {activeTab === 'istoric' && <th>Data ștergerii</th>}
                <th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr key={request.id} className={activeTab === 'istoric' ? 'muted' : ''}>
                  <td>{request.nume}</td>
                  <td>{request.email}</td>
                  <td>{formatDate(request.data_creare)}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  {activeTab === 'istoric' && (
                    <td>{formatDate(request.deleted_at)}</td>
                  )}
                  <td>
                    <div className="admin-actions">
                      {activeTab === 'istoric' && request.deleted_at && (
                        <button
                          onClick={() => handleRestoreUser(request.id)}
                          disabled={actionLoading === request.id}
                          className="admin-action-button info"
                        >
                          {actionLoading === request.id ? '⏳' : 'Restaurează'}
                        </button>
                      )}
                      {request.status !== 'approved' && activeTab !== 'istoric' && (
                        <button
                          onClick={() => handleChangeStatus(request.id, 'approved')}
                          disabled={actionLoading === request.id}
                          className="admin-action-button success"
                        >
                          {actionLoading === request.id ? '⏳' : 'Aprobă'}
                        </button>
                      )}
                      {request.status !== 'rejected' && activeTab !== 'istoric' && (
                        <button
                          onClick={() => handleChangeStatus(request.id, 'rejected')}
                          disabled={actionLoading === request.id}
                          className="admin-action-button danger"
                        >
                          {actionLoading === request.id ? '⏳' : 'Respinge'}
                        </button>
                      )}
                      {request.status !== 'pending' && activeTab !== 'istoric' && (
                        <button
                          onClick={() => handleChangeStatus(request.id, 'pending')}
                          disabled={actionLoading === request.id}
                          className="admin-action-button warning"
                        >
                          {actionLoading === request.id ? '⏳' : 'În așteptare'}
                        </button>
                      )}
                      {activeTab !== 'istoric' && (
                        <button
                          onClick={() => handleDeleteUser(request.id)}
                          disabled={actionLoading === request.id}
                          className="admin-action-button danger-outline"
                        >
                          {actionLoading === request.id ? '⏳' : 'Șterge'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  if (isFullPage) {
    return <div className="admin-dashboard">{content}</div>
  }

  return (
    <div className="new-patient-modal-overlay" onClick={onClose}>
      <div className="new-patient-modal-content admin-panel-content" onClick={(e) => e.stopPropagation()}>
        {content}
      </div>
      {!isFullPage && selectedUser && (
        <div 
          className="new-patient-modal-overlay" 
          onClick={() => setSelectedUser(null)}
          style={{ zIndex: 10001 }}
        >
          <div 
            className="new-patient-modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}
          >
            <div className="new-patient-modal-header">
              <h2>📋 Rețete - {selectedUser.nume} ({selectedUser.email})</h2>
              <button 
                className="close-button"
                onClick={() => setSelectedUser(null)}
                style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingPrescriptions ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div>⏳ Se încarcă rețetele...</div>
              </div>
            ) : userPrescriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Nu există rețete pentru acest utilizator.
              </div>
            ) : (
              <div style={{ marginTop: '20px' }}>
                {userPrescriptions.map((prescription, index) => (
                  <div 
                    key={prescription.id} 
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px',
                      background: '#f9f9f9'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: 0, color: '#1a3c7c' }}>
                          Rețetă #{index + 1} - {prescription.nume_pacient || 'Fără nume pacient'}
                        </h3>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                          Data: {formatDate(prescription.data_creare)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeletePrescription(prescription.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Șterge rețetă"
                      >
                        🗑️ Șterge
                      </button>
                    </div>

                    {prescription.medicamente && prescription.medicamente.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#1a3c7c' }}>Medicamente ({prescription.medicamente.length}):</strong>
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                          {prescription.medicamente.map((med, idx) => {
                            // Caută denumirea medicamentului în toate variantele posibile
                            const denumire = med['Denumire medicament'] || 
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
                        <p style={{ margin: '8px 0', padding: '8px', background: '#fff', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                          {prescription.indicatii_pacient}
                        </p>
                      </div>
                    )}

                    {prescription.indicatii_medic && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#1a3c7c' }}>👨‍⚕️ Indicații Medic:</strong>
                        <p style={{ margin: '8px 0', padding: '8px', background: '#fff', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
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
                        <div style={{ margin: '8px 0', padding: '12px', background: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                          {Object.values(prescription.planuri_tratament).map((plan, idx) => (
                            <div key={idx} style={{ 
                              marginBottom: idx < Object.values(prescription.planuri_tratament).length - 1 ? '16px' : '0',
                              paddingBottom: idx < Object.values(prescription.planuri_tratament).length - 1 ? '16px' : '0',
                              borderBottom: idx < Object.values(prescription.planuri_tratament).length - 1 ? '1px solid #e0e0e0' : 'none'
                            }}>
                              <div style={{ fontWeight: 'bold', color: '#1a3c7c', marginBottom: '8px', fontSize: '14px' }}>
                                💊 {plan.medicineName || plan.medicine_name || 'Medicament necunoscut'}
                                {plan.medicineCode && (
                                  <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
                                    (Cod: {plan.medicineCode || plan.medicine_code})
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#333' }}>
                                {plan.duration && (
                                  <div><strong>Durată:</strong> {plan.duration} {plan.customDuration ? plan.customDuration : 'zile'}</div>
                                )}
                                {plan.frequency && (
                                  <div><strong>Frecvență:</strong> {plan.frequency} {plan.customFrequency ? plan.customFrequency : 'ori pe zi'}</div>
                                )}
                                {plan.times && Array.isArray(plan.times) && plan.times.length > 0 && (
                                  <div><strong>Ore de administrare:</strong> {plan.times.join(', ')}</div>
                                )}
                                {plan.customTime && (
                                  <div><strong>Orar personalizat:</strong> {plan.customTime}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: '8px 0', padding: '8px', background: '#f5f5f5', borderRadius: '4px', color: '#666', fontStyle: 'italic' }}>
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
      )}
    </div>
  )
}

export default AdminPanel

