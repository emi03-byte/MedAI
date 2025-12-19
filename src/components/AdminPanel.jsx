import { useState, useEffect } from 'react'
import './MedicinesTable.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const AdminPanel = ({ currentUser, onClose }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('toate') // 'toate', 'pending', 'approved', 'rejected', 'istoric'
  const [actionLoading, setActionLoading] = useState(null)
  const [deletedCount, setDeletedCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null) // Utilizatorul selectat pentru vizualizare rețete
  const [userPrescriptions, setUserPrescriptions] = useState([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const status = activeTab === 'toate' ? '' : activeTab === 'istoric' ? '' : activeTab
      const showDeleted = activeTab === 'istoric' ? 'true' : 'false'
      const url = `${API_BASE_URL}/api/admin/requests?userId=${currentUser.id}${status ? `&status=${status}` : ''}&showDeleted=${showDeleted}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Eroare la încărcarea cererilor')
      }
      
      setRequests(data.requests || [])
    } catch (err) {
      console.error('Eroare la încărcarea cererilor:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser?.id) {
      fetchRequests()
    }
  }, [activeTab, currentUser])

  // Încarcă numărul de conturi șterse
  useEffect(() => {
    const fetchDeletedCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/requests?userId=${currentUser.id}&showDeleted=true`)
        const data = await response.json()
        if (response.ok) {
          setDeletedCount(data.requests?.length || 0)
        }
      } catch (err) {
        console.error('Eroare la încărcarea numărului de conturi șterse:', err)
      }
    }
    if (currentUser?.id) {
      fetchDeletedCount()
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
      setLoadingPrescriptions(true)
      setSelectedUser({ id: userId, nume: userName, email: userEmail })
      
      const response = await fetch(`${API_BASE_URL}/api/admin/user-prescriptions/${userId}?userId=${currentUser.id}`)
      
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
        throw new Error(data.error || `Eroare la încărcarea rețetelor: ${response.status}`)
      }
      
      setUserPrescriptions(data.prescriptions || [])
    } catch (err) {
      console.error('Eroare la încărcarea rețetelor:', err)
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
    { id: 'istoric', label: 'Istoric (Șterse)', count: deletedCount, isHistory: true }
  ]

  const filteredRequests = activeTab === 'toate' 
    ? requests 
    : activeTab === 'istoric'
    ? requests // Pentru istoric, toate request-urile sunt deja filtrate de backend
    : requests.filter(r => r.status === activeTab)

  return (
    <div className="new-patient-modal-overlay" onClick={onClose}>
      <div className="new-patient-modal-content admin-panel-content" onClick={(e) => e.stopPropagation()}>
        <div className="new-patient-modal-header">
          <h2>🔐 Panou Management - Cereri Conturi</h2>
          <button 
            className="close-button"
            onClick={onClose}
            style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            margin: '10px 0', 
            background: '#fee', 
            color: '#c33', 
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          borderBottom: '2px solid #e0e0e0'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: activeTab === tab.id ? '#3a6ad6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #3a6ad6' : '3px solid transparent',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Lista cereri */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>⏳ Se încarcă...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {activeTab === 'istoric' 
              ? 'Nu există conturi șterse în istoric' 
              : `Nu există cereri ${activeTab !== 'toate' ? `cu status "${activeTab}"` : ''}`}
          </div>
        ) : (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Nume</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Data înregistrării</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  {activeTab === 'istoric' && <th style={{ padding: '12px', textAlign: 'left' }}>Data ștergerii</th>}
                  <th style={{ padding: '12px', textAlign: 'left' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => {
                  const currentRole = request.is_admin === 1 ? 'admin' : 'user'
                  return (
                  <tr key={request.id} style={{ borderBottom: '1px solid #eee', opacity: activeTab === 'istoric' ? 0.7 : 1 }}>
                    <td style={{ padding: '12px' }}>{request.nume}</td>
                    <td style={{ padding: '12px' }}>{request.email}</td>
                    <td style={{ padding: '12px' }}>{formatDate(request.data_creare)}</td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(request.status)}
                    </td>
                    {activeTab === 'istoric' && (
                      <td style={{ padding: '12px', color: '#dc3545' }}>
                        {formatDate(request.deleted_at)}
                      </td>
                    )}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Pentru conturile șterse, afișează buton de restaurare */}
                        {activeTab === 'istoric' && request.deleted_at ? (
                          <button
                            onClick={() => handleRestoreUser(request.id)}
                            disabled={actionLoading === request.id}
                            style={{
                              padding: '6px 12px',
                              background: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: actionLoading === request.id ? 'wait' : 'pointer',
                              opacity: actionLoading === request.id ? 0.6 : 1,
                              fontSize: '12px'
                            }}
                            title="Restaurează cont"
                          >
                            {actionLoading === request.id ? '⏳' : '♻️'} Restaurează
                          </button>
                        ) : (
                          <>
                        {/* Buton pentru aprobare */}
                        {request.status !== 'approved' && activeTab !== 'istoric' && (
                          <button
                            onClick={() => handleChangeStatus(request.id, 'approved')}
                            disabled={actionLoading === request.id}
                            style={{
                              padding: '6px 12px',
                              background: '#4caf50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: actionLoading === request.id ? 'wait' : 'pointer',
                              opacity: actionLoading === request.id ? 0.6 : 1,
                              fontSize: '12px'
                            }}
                            title="Aprobă cont"
                          >
                            {actionLoading === request.id ? '⏳' : '✅'} Aprobă
                          </button>
                        )}
                        {/* Buton pentru respingere */}
                        {request.status !== 'rejected' && activeTab !== 'istoric' && (
                          <button
                            onClick={() => handleChangeStatus(request.id, 'rejected')}
                            disabled={actionLoading === request.id}
                            style={{
                              padding: '6px 12px',
                              background: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: actionLoading === request.id ? 'wait' : 'pointer',
                              opacity: actionLoading === request.id ? 0.6 : 1,
                              fontSize: '12px'
                            }}
                            title="Respinge cont"
                          >
                            {actionLoading === request.id ? '⏳' : '❌'} Respinge
                          </button>
                        )}
                        {/* Buton pentru pending */}
                        {request.status !== 'pending' && activeTab !== 'istoric' && (
                          <button
                            onClick={() => handleChangeStatus(request.id, 'pending')}
                            disabled={actionLoading === request.id}
                            style={{
                              padding: '6px 12px',
                              background: '#ff9800',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: actionLoading === request.id ? 'wait' : 'pointer',
                              opacity: actionLoading === request.id ? 0.6 : 1,
                              fontSize: '12px'
                            }}
                            title="Pune în așteptare"
                          >
                            {actionLoading === request.id ? '⏳' : '⏳'} În așteptare
                          </button>
                        )}
                        {/* Buton pentru vizualizare rețete */}
                        <button
                          onClick={() => handleViewPrescriptions(request.id, request.nume, request.email)}
                          disabled={actionLoading === request.id}
                          style={{
                            padding: '6px 12px',
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: actionLoading === request.id ? 'wait' : 'pointer',
                            opacity: actionLoading === request.id ? 0.6 : 1,
                            fontSize: '12px'
                          }}
                          title="Vezi rețete"
                        >
                          📋 Rețete
                        </button>
                        {/* Buton pentru ștergere - doar pentru conturile active */}
                        {activeTab !== 'istoric' && (
                          <button
                            onClick={() => handleDeleteUser(request.id)}
                            disabled={actionLoading === request.id}
                            style={{
                              padding: '6px 12px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: actionLoading === request.id ? 'wait' : 'pointer',
                              opacity: actionLoading === request.id ? 0.6 : 1,
                              fontSize: '12px'
                            }}
                            title="Șterge cont"
                          >
                            {actionLoading === request.id ? '⏳' : '🗑️'} Șterge
                          </button>
                        )}
                          </>
                        )}
                      </div>
                      {request.status === 'approved' && request.data_aprobare && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          Aprobat: {formatDate(request.data_aprobare)}
                        </div>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pentru vizualizare rețete */}
      {selectedUser && (
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
                          {prescription.medicamente.map((med, idx) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                              {med.denumire || med.Denumire_medicament || 'Medicament necunoscut'}
                            </li>
                          ))}
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

                    {prescription.planuri_tratament && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#1a3c7c' }}>📅 Planuri Tratament:</strong>
                        <pre style={{ margin: '8px 0', padding: '8px', background: '#fff', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
                          {JSON.stringify(prescription.planuri_tratament, null, 2)}
                        </pre>
                      </div>
                    )}
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

