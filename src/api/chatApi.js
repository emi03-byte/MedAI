import { requestJson } from './httpClient'

export const createChatCompletion = async (payload) => {
  return await requestJson('/api/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

