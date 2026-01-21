import { API_BASE_URL } from '../config/env'
import { buildUrl, requestJson } from './httpClient'

export const listUserMedicines = async ({ userId } = {}) => {
  const url = buildUrl(API_BASE_URL, '/api/user-medicines', { userId })
  return await requestJson(url)
}

export const createUserMedicine = async ({
  userId,
  denumire,
  forma_farmaceutica,
  concentratie,
  substanta_activa,
  cod_atc,
  mod_prescriere,
  note,
} = {}) => {
  const url = `${API_BASE_URL}/api/user-medicines`
  return await requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      denumire,
      forma_farmaceutica,
      concentratie,
      substanta_activa,
      cod_atc,
      mod_prescriere,
      note,
    }),
  })
}

export const updateUserMedicine = async ({
  id,
  userId,
  denumire,
  forma_farmaceutica,
  concentratie,
  substanta_activa,
  cod_atc,
  mod_prescriere,
  note,
} = {}) => {
  const url = `${API_BASE_URL}/api/user-medicines/${id}`
  return await requestJson(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      denumire,
      forma_farmaceutica,
      concentratie,
      substanta_activa,
      cod_atc,
      mod_prescriere,
      note,
    }),
  })
}

export const deleteUserMedicine = async ({ id, userId } = {}) => {
  const url = buildUrl(API_BASE_URL, `/api/user-medicines/${id}`, { userId })
  return await requestJson(url, { method: 'DELETE' })
}

