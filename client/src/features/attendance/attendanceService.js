import api from '../../api/axiosClient'

export async function fetchMyTodayAttendanceRequest() {
  const { data } = await api.get('/attendance/me/today')
  return data.data
}

export async function punchInRequest() {
  const { data } = await api.post('/attendance/punch-in')
  return data.data
}

export async function punchOutRequest() {
  const { data } = await api.post('/attendance/punch-out')
  return data.data
}

export async function fetchMyAttendanceCalendarRequest(params) {
  const { data } = await api.get('/attendance/me/calendar', { params })
  return data.data
}

export async function fetchMyAttendanceHistoryRequest(params) {
  const { data } = await api.get('/attendance/me/history', { params })
  return data.data
}

export async function fetchAdminAttendanceRecordsRequest(params) {
  const { data } = await api.get('/attendance/admin/records', { params })
  return data.data
}

export async function fetchAdminAttendanceReportRequest(params) {
  const { data } = await api.get('/attendance/admin/report', { params })
  return data.data
}
