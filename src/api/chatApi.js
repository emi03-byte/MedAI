import { API_BASE_URL } from '../config/env'
import { requestJson } from './httpClient'

export const createChatCompletion = async (payload) => {
  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  return await requestJson(`${base}/api/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

