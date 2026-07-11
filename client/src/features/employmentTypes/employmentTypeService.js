import api from '../../api/axiosClient'

export async function fetchEmploymentTypesRequest() {
  const { data } = await api.get('/employment-types')
  return data.data
}

export async function fetchEmploymentTypeOptionsRequest() {
  const { data } = await api.get('/employment-types/options')
  return data.data
}

export async function fetchEmploymentTypeByIdRequest(id) {
  const { data } = await api.get(`/employment-types/${id}`)
  return data.data
}

export async function createEmploymentTypeRequest(payload) {
  const { data } = await api.post('/employment-types', payload)
  return data.data
}

export async function updateEmploymentTypeRequest({ id, payload }) {
  const { data } = await api.patch(`/employment-types/${id}`, payload)
  return data.data
}

export async function updateLeavePolicyRequest({ id, leaveRules }) {
  const { data } = await api.patch(`/employment-types/${id}/policy`, {
    leaveRules,
  })
  return data.data
}
