import api from '../../api/axiosClient'

export async function loginByRole(role, credentials) {
  const { data } = await api.post(`/auth/login/${role}`, credentials)
  return data.data
}

export async function refreshSessionRequest() {
  const { data } = await api.post('/auth/refresh')
  return data.data
}

export async function logoutRequest() {
  await api.post('/auth/logout')
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data.data
}

export async function fetchDashboardByRole(role) {
  const endpoint =
    role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'
  const { data } = await api.get(endpoint)
  return data.data
}
