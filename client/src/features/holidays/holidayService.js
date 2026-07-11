import api from '../../api/axiosClient'

export async function fetchHolidaysRequest(params) {
  const { data } = await api.get('/holidays', { params })
  return data.data
}

export async function fetchHolidayByIdRequest(id) {
  const { data } = await api.get(`/holidays/${id}`)
  return data.data
}

export async function createHolidayRequest(payload) {
  const { data } = await api.post('/holidays', payload)
  return data.data
}

export async function updateHolidayRequest({ id, payload }) {
  const { data } = await api.patch(`/holidays/${id}`, payload)
  return data.data
}

export async function deleteHolidayRequest(id) {
  const { data } = await api.delete(`/holidays/${id}`)
  return data.data
}
