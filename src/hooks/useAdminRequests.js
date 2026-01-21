import { useCallback, useEffect, useMemo, useState } from 'react'
import { changeUserStatus, deleteUser, getAdminRequests, restoreUser } from '../api/adminApi'

export const useAdminRequests = ({ adminUserId } = {}) => {
  const [requests, setRequests] = useState([])
  const [deletedRequests, setDeletedRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('toate') // 'toate', 'pending', 'approved', 'rejected', 'istoric'
  const [actionLoading, setActionLoading] = useState(null)

  const fetchRequests = useCallback(async () => {
    if (!adminUserId) return
    try {
      setLoading(true)
      setError('')
      const data = await getAdminRequests({ adminUserId, showDeleted: false })
      setRequests(data?.requests || [])
    } catch (err) {
      setError(err?.message || 'Eroare la încărcarea cererilor')
    } finally {
      setLoading(false)
    }
  }, [adminUserId])

  const fetchDeletedRequests = useCallback(async () => {
    if (!adminUserId) return
    try {
      const data = await getAdminRequests({ adminUserId, showDeleted: true })
      setDeletedRequests(data?.requests || [])
    } catch {
      // silent (same as previous behavior)
    }
  }, [adminUserId])

  useEffect(() => {
    if (!adminUserId) return
    fetchRequests()
  }, [adminUserId, fetchRequests])

  useEffect(() => {
    if (!adminUserId) return
    fetchDeletedRequests()
  }, [adminUserId, fetchDeletedRequests])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchRequests(), fetchDeletedRequests()])
  }, [fetchDeletedRequests, fetchRequests])

  const updateStatus = useCallback(
    async (userId, newStatus) => {
      if (!adminUserId) return
      setActionLoading(userId)
      try {
        const body = { status: newStatus }
        if (newStatus === 'approved') {
          const request = requests.find((r) => r.id === userId)
          body.is_admin = request?.is_admin === 1 ? true : false
        }
        await changeUserStatus({ adminUserId, userId, ...body })
        await refreshAll()
      } finally {
        setActionLoading(null)
      }
    },
    [adminUserId, refreshAll, requests]
  )

  const softDelete = useCallback(
    async (userId) => {
      if (!adminUserId) return
      setActionLoading(userId)
      try {
        await deleteUser({ adminUserId, userId })
        await refreshAll()
      } finally {
        setActionLoading(null)
      }
    },
    [adminUserId, refreshAll]
  )

  const restore = useCallback(
    async (userId) => {
      if (!adminUserId) return
      setActionLoading(userId)
      try {
        await restoreUser({ adminUserId, userId })
        await refreshAll()
      } finally {
        setActionLoading(null)
      }
    },
    [adminUserId, refreshAll]
  )

  const filteredRequests = useMemo(() => {
    if (activeTab === 'toate') return requests
    if (activeTab === 'istoric') return deletedRequests
    return requests.filter((r) => r.status === activeTab)
  }, [activeTab, deletedRequests, requests])

  return {
    requests,
    deletedRequests,
    filteredRequests,
    loading,
    error,
    activeTab,
    setActiveTab,
    actionLoading,
    fetchRequests,
    fetchDeletedRequests,
    refreshAll,
    updateStatus,
    softDelete,
    restore,
  }
}

