import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  fetchAdminPayrollsRequest,
  fetchMyPayrollsRequest,
  runPayrollRequest,
} from './payrollService'

const initialState = {
  adminItems: [],
  myItems: [],
  listStatus: 'idle',
  myListStatus: 'idle',
  runStatus: 'idle',
  error: null,
}

export const runPayroll = createAsyncThunk(
  'payroll/runPayroll',
  async (payload, { rejectWithValue }) => {
    try {
      return await runPayrollRequest(payload)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to run payroll.',
      )
    }
  },
)

export const fetchAdminPayrolls = createAsyncThunk(
  'payroll/fetchAdminPayrolls',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchAdminPayrollsRequest(params)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch payroll history.',
      )
    }
  },
)

export const fetchMyPayrolls = createAsyncThunk(
  'payroll/fetchMyPayrolls',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchMyPayrollsRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch salary slips.',
      )
    }
  },
)

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    clearPayrollError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runPayroll.pending, (state) => {
        state.runStatus = 'loading'
        state.error = null
      })
      .addCase(runPayroll.fulfilled, (state, action) => {
        state.runStatus = 'succeeded'
        const updates = new Map(action.payload.map((item) => [item.id, item]))
        const unchangedItems = state.adminItems.filter((item) => !updates.has(item.id))
        state.adminItems = [...action.payload, ...unchangedItems].sort((left, right) => {
          if (right.year !== left.year) {
            return right.year - left.year
          }

          if (right.month !== left.month) {
            return right.month - left.month
          }

          return new Date(right.processedAt) - new Date(left.processedAt)
        })
      })
      .addCase(runPayroll.rejected, (state, action) => {
        state.runStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchAdminPayrolls.pending, (state) => {
        state.listStatus = 'loading'
        state.error = null
      })
      .addCase(fetchAdminPayrolls.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.adminItems = action.payload
      })
      .addCase(fetchAdminPayrolls.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchMyPayrolls.pending, (state) => {
        state.myListStatus = 'loading'
        state.error = null
      })
      .addCase(fetchMyPayrolls.fulfilled, (state, action) => {
        state.myListStatus = 'succeeded'
        state.myItems = action.payload
      })
      .addCase(fetchMyPayrolls.rejected, (state, action) => {
        state.myListStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { clearPayrollError } = payrollSlice.actions
export default payrollSlice.reducer
