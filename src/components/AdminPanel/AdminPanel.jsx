import '../MedicinesTable.css'
import { useCallback, useState } from 'react'
import { useAdminRequests } from '../../hooks/useAdminRequests'
import { useUserPrescriptions } from '../../hooks/useUserPrescriptions'
import PrescriptionsModal from './PrescriptionsModal'
import RequestsTable from './RequestsTable'
import DbQueryTab from './DbQueryTab'
import Tabs from './Tabs'

const AdminPanel = ({ currentUser, onClose, isFullPage = false, onLogout }) => {
  const adminUserId = currentUser?.id

  const {
    requests,
    deletedRequests,
    filteredRequests,
    loading,
    error,
    activeTab,
    setActiveTab,
    actionLoading,
    updateStatus,
    softDelete,
    restore,
  } = useAdminRequests({ adminUserId })

  // Prescriptions modal logic (kept for compatibility with existing UI)
  const {
    selectedUser,
    prescriptions: userPrescriptions,
    loadingPrescriptions,
    close: closePrescriptions,
    removePrescription,
  } = useUserPrescriptions({ adminUserId })

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'În așteptare', class: 'status-pending', emoji: '⏳' },
      approved: { text: 'Aprobat', class: 'status-approved', emoji: '✅' },
      rejected: { text: 'Respinse', class: 'status-rejected', emoji: '❌' },
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
      minute: '2-digit',
    })
  }

  const [showDbQuery, setShowDbQuery] = useState(false)

  const tabs = [
    { id: 'toate', label: 'Toate', count: requests.length },
    { id: 'pending', label: 'În așteptare', count: requests.filter((r) => r.status === 'pending').length },
    { id: 'approved', label: 'Aprobate', count: requests.filter((r) => r.status === 'approved').length },
    { id: 'rejected', label: 'Respinse', count: requests.filter((r) => r.status === 'rejected').length },
    { id: 'istoric', label: 'Șterse', count: deletedRequests.length, isHistory: true },
    { id: 'db-query', label: '🔍 SQL Query', count: null, isDbQuery: true },
  ]

  const handleChangeStatus = useCallback(
    async (userId, newStatus) => {
      const statusMessages = {
        pending: 'pune în așteptare',
        approved: 'aprobe',
        rejected: 'respinge',
      }

      const message = statusMessages[newStatus]
      const confirmMessage = `Ești sigur că vrei să ${message} acest cont?`
      if (!confirm(confirmMessage)) return

      try {
        await updateStatus(userId, newStatus)
      } catch (err) {
        alert(`Eroare: ${err?.message || 'Eroare la schimbare status'}`)
      }
    },
    [updateStatus]
  )

  const handleDeleteUser = useCallback(
    async (userId) => {
      if (
        !window.confirm(
          'Ești sigur că vrei să ștergi acest cont? Contul va fi marcat ca șters și va apărea în istoric.'
        )
      ) {
        return
      }
      try {
        await softDelete(userId)
        alert('Cont șters cu succes! Poți vedea conturile șterse în tab-ul "Istoric".')
      } catch (err) {
        alert(`Eroare: ${err?.message || 'Eroare la ștergere cont'}`)
      }
    },
    [softDelete]
  )

  const handleRestoreUser = useCallback(
    async (userId) => {
      if (!window.confirm('Ești sigur că vrei să restaurezi acest cont?')) {
        return
      }
      try {
        await restore(userId)
        alert('Cont restaurat cu succes!')
      } catch (err) {
        alert(`Eroare: ${err?.message || 'Eroare la restaurare cont'}`)
      }
    },
    [restore]
  )

  const handleDeletePrescription = useCallback(
    async (prescriptionId) => {
      if (!window.confirm('Ești sigur că vrei să ștergi această rețetă?')) {
        return
      }
      try {
        await removePrescription(prescriptionId)
        alert('Rețetă ștearsă cu succes!')
      } catch (err) {
        alert(`Eroare: ${err?.message || 'Eroare la ștergerea rețetei'}`)
      }
    },
    [removePrescription]
  )

  const content = (
    <div className={`admin-panel ${isFullPage ? 'admin-panel-full' : ''}`}>
      <div className="admin-panel-header">
        <div>
          <h2 className="admin-title">Administrare conturi</h2>
          <p className="admin-subtitle">Monitorizare și aprobări utilizatori</p>
        </div>
        <div className="admin-header-actions">
          {isFullPage ? (
            <button className="admin-logout-button" onClick={onLogout} type="button">
              Deconectare
            </button>
          ) : (
            <button className="admin-close-button" onClick={onClose} type="button">
              ✕
            </button>
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
          <div className="admin-stat-value">{requests.filter((r) => r.status === 'pending').length}</div>
        </div>
        <div className="admin-stat-card approved">
          <div className="admin-stat-label">Aprobate</div>
          <div className="admin-stat-value">{requests.filter((r) => r.status === 'approved').length}</div>
        </div>
        <div className="admin-stat-card rejected">
          <div className="admin-stat-label">Respinse</div>
          <div className="admin-stat-value">{requests.filter((r) => r.status === 'rejected').length}</div>
        </div>
        <div className="admin-stat-card deleted">
          <div className="admin-stat-label">Șterse</div>
          <div className="admin-stat-value">{deletedRequests.length}</div>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <Tabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === 'db-query' ? (
        <DbQueryTab adminUserId={adminUserId} />
      ) : loading ? (
        <div className="admin-loading">Se încarcă...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="admin-empty">
          {activeTab === 'istoric'
            ? 'Nu există conturi șterse.'
            : `Nu există cereri${activeTab !== 'toate' ? ` cu status \"${activeTab}\"` : ''}.`}
        </div>
      ) : (
        <RequestsTable
          requests={filteredRequests}
          activeTab={activeTab}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
          actionLoading={actionLoading}
          onChangeStatus={handleChangeStatus}
          onDeleteUser={handleDeleteUser}
          onRestoreUser={handleRestoreUser}
        />
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
        <PrescriptionsModal
          selectedUser={selectedUser}
          prescriptions={userPrescriptions}
          loading={loadingPrescriptions}
          onClose={closePrescriptions}
          onDeletePrescription={handleDeletePrescription}
          formatDate={formatDate}
        />
      )}
    </div>
  )
}

export default AdminPanel

