import { useCallback } from 'react'

export const useCheckout = ({ setIsCheckoutOpen } = {}) => {
  const handleCheckoutBack = useCallback(() => {
    setIsCheckoutOpen(false)
  }, [setIsCheckoutOpen])

  return { handleCheckoutBack }
}

