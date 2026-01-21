import { API_BASE_URL } from '../config/env'
import { buildUrl, requestJson } from './httpClient'

export const getMedications = async ({ search = '', limit = 50, offset = 0 } = {}) => {
  const url = buildUrl(API_BASE_URL, '/api/medications', { search, limit, offset })
  return await requestJson(url)
}

export const getAllMedications = async () => {
  const url = buildUrl(API_BASE_URL, '/api/medications', { limit: 'all' })
  return await requestJson(url)
}

