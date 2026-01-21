export const getStorageKey = (key, userId) => {
  return userId ? `${key}_user_${userId}` : key
}

export const getStorageItem = (key, userId) => {
  const storageKey = getStorageKey(key, userId)
  return localStorage.getItem(storageKey)
}

export const setStorageItem = (key, value, userId) => {
  const storageKey = getStorageKey(key, userId)
  if (value !== null && value !== undefined && value !== '') {
    localStorage.setItem(storageKey, value)
  } else {
    localStorage.removeItem(storageKey)
  }
}

export const removeStorageItem = (key, userId) => {
  const storageKey = getStorageKey(key, userId)
  localStorage.removeItem(storageKey)
}

