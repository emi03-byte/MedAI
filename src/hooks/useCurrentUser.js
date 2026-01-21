import { useEffect, useState } from 'react'
import { getCurrentUser } from '../utils/storage'

export const useCurrentUser = () => {
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser())

  useEffect(() => {
    const refresh = () => setCurrentUserState(getCurrentUser())

    // Same-tab updates (our custom event)
    const onCustom = () => refresh()
    window.addEventListener('currentUserChanged', onCustom)

    // Other-tab updates
    const onStorage = (e) => {
      if (!e || e.key === null) return
      if (e.key === 'currentUser') refresh()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('currentUserChanged', onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return currentUser
}

