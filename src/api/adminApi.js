import { API_BASE_URL } from '../config/env'
import { buildUrl, requestJson } from './httpClient'

export const getAdminRequests = async ({ adminUserId, showDeleted = false, status } = {}) => {
  const url = buildUrl(API_BASE_URL, '/api/admin/requests', {
    userId: adminUserId,
    showDeleted: showDeleted ? 'true' : 'false',
    ...(status ? { status } : {}),
  })
  return await requestJson(url)
}

export const approveUser = async ({ adminUserId, userId }) => {
  const url = buildUrl(API_BASE_URL, `/api/admin/approve/${userId}`, { userId: adminUserId })
  return await requestJson(url, { method: 'POST' })
}

export const rejectUser = async ({ adminUserId, userId }) => {
  const url = buildUrl(API_BASE_URL, `/api/admin/reject/${userId}`, { userId: adminUserId })
  return await requestJson(url, { method: 'POST' })
}

export const changeUserStatus = async ({ adminUserId, userId, status, is_admin }) => {
  const url = buildUrl(API_BASE_URL, `/api/admin/change-status/${userId}`, { userId: adminUserId })
  return await requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...(is_admin !== undefined ? { is_admin } : {}) }),
  })
}

export const deleteUser = async ({ adminUserId, userId }) => {
  const url = buildUrl(API_BASE_URL, `/api/admin/delete-user/${userId}`, { userId: adminUserId })
  return await requestJson(url, { method: 'DELETE' })
}

export const restoreUser = async ({ adminUserId, userId }) => {
  const url = buildUrl(API_BASE_URL, `/api/admin/restore-user/${userId}`, { userId: adminUserId })
  return await requestJson(url, { method: 'POST' })
}

export const getUserPrescriptions = async ({ adminUserId, userId }) => {
  const url = buildUrl(API_BASE_URL, `/api/admin/user-prescriptions/${userId}`, { userId: adminUserId })
  return await requestJson(url)
}

export const deletePrescription = async ({ adminUserId, prescriptionId }) => {
  const url = buildUrl(API_BASE_URL, `/api/admin/prescriptions/${prescriptionId}`, { userId: adminUserId })
  return await requestJson(url, { method: 'DELETE' })
}

export const executeDbQuery = async ({ adminUserId, query, type = 'all' }) => {
  const url = buildUrl(API_BASE_URL, '/api/admin/db-query', { userId: adminUserId })
  return await requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: adminUserId, query, type }),
  })
}

