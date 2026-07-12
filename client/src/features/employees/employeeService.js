import api from '../../api/axiosClient'

export async function fetchEmployeesRequest(params) {
  const { data } = await api.get('/employees', { params })
  return {
    items: data.data,
    pagination: data.pagination,
  }
}

export async function fetchEmployeeRequest(id) {
  const { data } = await api.get(`/employees/${id}`)
  return data.data
}

export async function createEmployeeRequest(payload) {
  const { data } = await api.post('/employees', payload)
  return data.data
}

export async function updateEmployeeRequest({ id, payload }) {
  const { data } = await api.patch(`/employees/${id}`, payload)
  return data.data
}

export async function updateEmployeeStatusRequest({ id, status }) {
  const { data } = await api.patch(`/employees/${id}/status`, { status })
  return data.data
}

export async function deleteEmployeeRequest(id) {
  const { data } = await api.delete(`/employees/${id}`)
  return data.data
}

export async function fetchManagersRequest() {
  const { data } = await api.get('/employees/managers')
  return data.data
}
