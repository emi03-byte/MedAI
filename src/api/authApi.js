import { API_BASE_URL } from '../config/env'
import { buildUrl, requestJson } from './httpClient'

export const login = async ({ email, password } = {}) => {
  return await requestJson(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, parola: password }),
  })
}

export const signup = async ({ name, email, password } = {}) => {
  return await requestJson(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nume: name, email, parola: password }),
  })
}

export const recoverAccount = async ({ name, email, password, mode } = {}) => {
  return await requestJson(`${API_BASE_URL}/api/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nume: name, email, parola: password, mode }),
  })
}

export const deleteSelfAccount = async ({ userId } = {}) => {
  const url = buildUrl(API_BASE_URL, '/api/auth/delete', { userId })
  return await requestJson(url, { method: 'DELETE' })
}

export const getMe = async ({ userId } = {}) => {
  const url = buildUrl(API_BASE_URL, '/api/auth/me', { userId })
  return await requestJson(url)
}

