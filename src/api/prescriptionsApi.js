import { API_BASE_URL } from '../config/env'
import { buildUrl, requestJson } from './httpClient'

export const createPrescription = async ({
  userId,
  numePacient,
  medicamente,
  planuriTratament,
  indicatiiPacient,
  indicatiiMedic,
} = {}) => {
  return await requestJson(`${API_BASE_URL}/api/prescriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      numePacient,
      medicamente,
      planuriTratament,
      indicatiiPacient,
      indicatiiMedic,
    }),
  })
}

export const getPrescriptions = async ({ userId } = {}) => {
  const url = buildUrl(API_BASE_URL, '/api/prescriptions', { userId })
  return await requestJson(url)
}

export const deletePrescription = async ({ id, userId } = {}) => {
  const url = buildUrl(API_BASE_URL, `/api/prescriptions/${id}`, { userId })
  return await requestJson(url, { method: 'DELETE' })
}

export const deleteAllPrescriptions = async ({ userId } = {}) => {
  const url = buildUrl(API_BASE_URL, '/api/prescriptions', { userId })
  return await requestJson(url, { method: 'DELETE' })
}

