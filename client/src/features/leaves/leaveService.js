import api from '../../api/axiosClient'

export async function fetchMyLeaveBalancesRequest(year) {
  const { data } = await api.get('/leaves/my/balances', {
    params: year ? { year } : {},
  })
  return data.data
}

export async function fetchMyLeaveRequestsRequest() {
  const { data } = await api.get('/leaves/my/requests')
  return data.data
}

export async function applyLeaveRequest(payload) {
  const { data } = await api.post('/leaves/apply', payload)
  return data.data
}

export async function fetchAdminLeaveRequestsRequest(params) {
  const { data } = await api.get('/leaves/admin/requests', { params })
  return data.data
}

export async function approveLeaveRequest(id) {
  const { data } = await api.patch(`/leaves/${id}/approve`)
  return data.data
}

export async function rejectLeaveRequest({ id, rejectionReason }) {
  const { data } = await api.patch(`/leaves/${id}/reject`, { rejectionReason })
  return data.data
}
