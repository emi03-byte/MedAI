import { useState, useEffect } from 'react'
import './MedicinesTable.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const AdminPanel = ({ currentUser, onClose }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('toate') // 'toate', 'pending', 'approved', 'rejected'
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const status = activeTab === 'toate' ? '' : activeTab
      const url = `${API_BASE_URL}/api/admin/requests?userId=${currentUser.id}${status ? `&status=${status}` : ''}`
      
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
    if (!confirm(`Ești sigur că vrei să ${message} acest cont?`)) {
      return
    }
    
    try {
      setActionLoading(userId)
      const response = await fetch(`${API_BASE_URL}/api/admin/change-status/${userId}?userId=${currentUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
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
    { id: 'rejected', label: 'Respinse', count: requests.filter(r => r.status === 'rejected').length }
  ]

  const filteredRequests = activeTab === 'toate' 
    ? requests 
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
            Nu există cereri {activeTab !== 'toate' ? `cu status "${activeTab}"` : ''}
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => (
                  <tr key={request.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{request.nume}</td>
                    <td style={{ padding: '12px' }}>{request.email}</td>
                    <td style={{ padding: '12px' }}>{formatDate(request.data_creare)}</td>
                    <td style={{ padding: '12px' }}>
                      {getStatusBadge(request.status)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Buton pentru pending */}
                        {request.status !== 'pending' && (
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
                        
                        {/* Buton pentru approved */}
                        {request.status !== 'approved' && (
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
                        
                        {/* Buton pentru rejected */}
                        {request.status !== 'rejected' && (
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
                      </div>
                      {request.status === 'approved' && request.data_aprobare && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          Aprobat: {formatDate(request.data_aprobare)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel

