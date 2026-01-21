import { useCallback, useState } from 'react'
import { deletePrescription, getUserPrescriptions } from '../api/adminApi'

export const useUserPrescriptions = ({ adminUserId } = {}) => {
  const [selectedUser, setSelectedUser] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)

  const openForUser = useCallback(
    async ({ id, nume, email }) => {
      if (!adminUserId) return
      setSelectedUser({ id, nume, email })
      setLoadingPrescriptions(true)
      try {
        const data = await getUserPrescriptions({ adminUserId, userId: id })
        setPrescriptions(data?.prescriptions || [])
      } finally {
        setLoadingPrescriptions(false)
      }
    },
    [adminUserId]
  )

  const close = useCallback(() => {
    setSelectedUser(null)
    setPrescriptions([])
  }, [])

  const removePrescription = useCallback(
    async (prescriptionId) => {
      if (!adminUserId) return
      await deletePrescription({ adminUserId, prescriptionId })
      if (selectedUser) {
        await openForUser(selectedUser)
      }
    },
    [adminUserId, openForUser, selectedUser]
  )

  return {
    selectedUser,
    prescriptions,
    loadingPrescriptions,
    openForUser,
    close,
    removePrescription,
  }
}

