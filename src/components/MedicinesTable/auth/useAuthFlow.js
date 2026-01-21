import { useCallback } from 'react'

export const useAuthFlow = ({
  setShowLoginModal,
  setLoginEmail,
  setLoginPassword,
  setLoginError,
  setShowLoginPassword,
  setShowSignUpModal,
  setSignUpName,
  setSignUpEmail,
  setSignUpPassword,
  setSignUpConfirmPassword,
  setSignUpError,
  setShowSignUpPassword,
  setShowSignUpConfirmPassword,
  setShowRecoverModal,
  setRecoverError,
} = {}) => {
  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false)
    setLoginEmail('')
    setLoginPassword('')
    setLoginError('')
    setShowLoginPassword(false)
  }, [setLoginEmail, setLoginError, setLoginPassword, setShowLoginModal, setShowLoginPassword])

  const closeSignUpModal = useCallback(() => {
    setShowSignUpModal(false)
    setSignUpName('')
    setSignUpEmail('')
    setSignUpPassword('')
    setSignUpConfirmPassword('')
    setSignUpError('')
    setShowSignUpPassword(false)
    setShowSignUpConfirmPassword(false)
  }, [
    setShowSignUpConfirmPassword,
    setShowSignUpModal,
    setShowSignUpPassword,
    setSignUpConfirmPassword,
    setSignUpEmail,
    setSignUpError,
    setSignUpName,
    setSignUpPassword,
  ])

  const closeRecoverModal = useCallback(() => {
    setShowRecoverModal(false)
    setRecoverError('')
  }, [setRecoverError, setShowRecoverModal])

  return { closeLoginModal, closeSignUpModal, closeRecoverModal }
}

