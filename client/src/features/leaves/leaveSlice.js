import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  applyLeaveRequest,
  approveLeaveRequest,
  fetchAdminLeaveRequestsRequest,
  fetchMyLeaveBalancesRequest,
  fetchMyLeaveRequestsRequest,
  rejectLeaveRequest,
} from './leaveService'

const initialState = {
  balances: null,
  myRequests: [],
  adminRequests: [],
  balanceStatus: 'idle',
  myRequestsStatus: 'idle',
  adminRequestsStatus: 'idle',
  submitStatus: 'idle',
  reviewStatus: 'idle',
  error: null,
}

export const fetchMyLeaveBalances = createAsyncThunk(
  'leaves/fetchMyLeaveBalances',
  async (year, { rejectWithValue }) => {
    try {
      return await fetchMyLeaveBalancesRequest(year)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch leave balances.',
      )
    }
  },
)

export const fetchMyLeaveRequests = createAsyncThunk(
  'leaves/fetchMyLeaveRequests',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchMyLeaveRequestsRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch leave requests.',
      )
    }
  },
)

export const submitLeaveRequest = createAsyncThunk(
  'leaves/submitLeaveRequest',
  async (payload, { rejectWithValue }) => {
    try {
      return await applyLeaveRequest(payload)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to submit leave request.',
      )
    }
  },
)

export const fetchAdminLeaveRequests = createAsyncThunk(
  'leaves/fetchAdminLeaveRequests',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchAdminLeaveRequestsRequest(params)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch admin leave requests.',
      )
    }
  },
)

export const approveLeave = createAsyncThunk(
  'leaves/approveLeave',
  async (id, { rejectWithValue }) => {
    try {
      return await approveLeaveRequest(id)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to approve leave request.',
      )
    }
  },
)

export const rejectLeave = createAsyncThunk(
  'leaves/rejectLeave',
  async ({ id, rejectionReason }, { rejectWithValue }) => {
    try {
      return await rejectLeaveRequest({ id, rejectionReason })
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to reject leave request.',
      )
    }
  },
)

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    clearLeaveError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLeaveBalances.pending, (state) => {
        state.balanceStatus = 'loading'
        state.error = null
      })
      .addCase(fetchMyLeaveBalances.fulfilled, (state, action) => {
        state.balanceStatus = 'succeeded'
        state.balances = action.payload
      })
      .addCase(fetchMyLeaveBalances.rejected, (state, action) => {
        state.balanceStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.myRequestsStatus = 'loading'
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action) => {
        state.myRequestsStatus = 'succeeded'
        state.myRequests = action.payload
      })
      .addCase(fetchMyLeaveRequests.rejected, (state, action) => {
        state.myRequestsStatus = 'failed'
        state.error = action.payload
      })
      .addCase(submitLeaveRequest.pending, (state) => {
        state.submitStatus = 'loading'
        state.error = null
      })
      .addCase(submitLeaveRequest.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded'
        state.myRequests = [action.payload, ...state.myRequests]
      })
      .addCase(submitLeaveRequest.rejected, (state, action) => {
        state.submitStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchAdminLeaveRequests.pending, (state) => {
        state.adminRequestsStatus = 'loading'
        state.error = null
      })
      .addCase(fetchAdminLeaveRequests.fulfilled, (state, action) => {
        state.adminRequestsStatus = 'succeeded'
        state.adminRequests = action.payload
      })
      .addCase(fetchAdminLeaveRequests.rejected, (state, action) => {
        state.adminRequestsStatus = 'failed'
        state.error = action.payload
      })
      .addCase(approveLeave.pending, (state) => {
        state.reviewStatus = 'loading'
      })
      .addCase(approveLeave.fulfilled, (state, action) => {
        state.reviewStatus = 'succeeded'
        state.adminRequests = state.adminRequests.map((request) =>
          request.id === action.payload.id ? action.payload : request,
        )
      })
      .addCase(approveLeave.rejected, (state, action) => {
        state.reviewStatus = 'failed'
        state.error = action.payload
      })
      .addCase(rejectLeave.pending, (state) => {
        state.reviewStatus = 'loading'
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        state.reviewStatus = 'succeeded'
        state.adminRequests = state.adminRequests.map((request) =>
          request.id === action.payload.id ? action.payload : request,
        )
      })
      .addCase(rejectLeave.rejected, (state, action) => {
        state.reviewStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { clearLeaveError } = leaveSlice.actions
export default leaveSlice.reducer
