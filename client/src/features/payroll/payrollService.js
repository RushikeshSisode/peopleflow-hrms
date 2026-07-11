import api from '../../api/axiosClient'

export async function runPayrollRequest(payload) {
  const { data } = await api.post('/payroll/run', payload)
  return data.data
}

export async function fetchAdminPayrollsRequest(params) {
  const { data } = await api.get('/payroll/admin', { params })
  return data.data
}

export async function fetchMyPayrollsRequest() {
  const { data } = await api.get('/payroll/me')
  return data.data
}

export async function downloadSalarySlipRequest(id) {
  const response = await api.get(`/payroll/${id}/slip`, {
    responseType: 'blob',
  })

  const disposition = response.headers['content-disposition'] || ''
  const fileNameMatch = disposition.match(/filename="(.+)"/)

  return {
    blob: response.data,
    fileName: fileNameMatch?.[1] || `salary-slip-${id}.pdf`,
  }
}
