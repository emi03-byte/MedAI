const safeJsonParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const getJson = (key) => safeJsonParse(localStorage.getItem(key))

export const setJson = (key, value) => localStorage.setItem(key, JSON.stringify(value))

export const removeItem = (key) => localStorage.removeItem(key)

export const CURRENT_USER_KEY = 'currentUser'
export const DARK_MODE_KEY = 'darkMode'

export const getCurrentUser = () => getJson(CURRENT_USER_KEY)

export const setCurrentUser = (user) => {
  setJson(CURRENT_USER_KEY, user)
  window.dispatchEvent(new CustomEvent('currentUserChanged', { detail: user }))
}

export const clearCurrentUser = () => {
  removeItem(CURRENT_USER_KEY)
  window.dispatchEvent(new CustomEvent('currentUserChanged', { detail: null }))
}

export const getDarkMode = () => {
  const stored = getJson(DARK_MODE_KEY)
  return typeof stored === 'boolean' ? stored : false
}

export const setDarkMode = (value) => {
  setJson(DARK_MODE_KEY, !!value)
}

