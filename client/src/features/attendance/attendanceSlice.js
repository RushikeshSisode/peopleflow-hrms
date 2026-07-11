import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  fetchAdminAttendanceRecordsRequest,
  fetchAdminAttendanceReportRequest,
  fetchMyAttendanceCalendarRequest,
  fetchMyAttendanceHistoryRequest,
  fetchMyTodayAttendanceRequest,
  punchInRequest,
  punchOutRequest,
} from './attendanceService'

const initialState = {
  today: null,
  calendar: null,
  history: [],
  adminRecords: [],
  adminReport: null,
  todayStatus: 'idle',
  calendarStatus: 'idle',
  historyStatus: 'idle',
  adminRecordsStatus: 'idle',
  adminReportStatus: 'idle',
  punchStatus: 'idle',
  error: null,
}

export const fetchMyTodayAttendance = createAsyncThunk(
  'attendance/fetchMyTodayAttendance',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchMyTodayAttendanceRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch today attendance.',
      )
    }
  },
)

export const punchIn = createAsyncThunk(
  'attendance/punchIn',
  async (_, { rejectWithValue }) => {
    try {
      return await punchInRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to punch in.',
      )
    }
  },
)

export const punchOut = createAsyncThunk(
  'attendance/punchOut',
  async (_, { rejectWithValue }) => {
    try {
      return await punchOutRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to punch out.',
      )
    }
  },
)

export const fetchMyAttendanceCalendar = createAsyncThunk(
  'attendance/fetchMyAttendanceCalendar',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchMyAttendanceCalendarRequest(params)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch attendance calendar.',
      )
    }
  },
)

export const fetchMyAttendanceHistory = createAsyncThunk(
  'attendance/fetchMyAttendanceHistory',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchMyAttendanceHistoryRequest(params)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch attendance history.',
      )
    }
  },
)

export const fetchAdminAttendanceRecords = createAsyncThunk(
  'attendance/fetchAdminAttendanceRecords',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchAdminAttendanceRecordsRequest(params)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch attendance records.',
      )
    }
  },
)

export const fetchAdminAttendanceReport = createAsyncThunk(
  'attendance/fetchAdminAttendanceReport',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchAdminAttendanceReportRequest(params)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch attendance report.',
      )
    }
  },
)

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTodayAttendance.pending, (state) => {
        state.todayStatus = 'loading'
        state.error = null
      })
      .addCase(fetchMyTodayAttendance.fulfilled, (state, action) => {
        state.todayStatus = 'succeeded'
        state.today = action.payload
      })
      .addCase(fetchMyTodayAttendance.rejected, (state, action) => {
        state.todayStatus = 'failed'
        state.error = action.payload
      })
      .addCase(punchIn.pending, (state) => {
        state.punchStatus = 'loading'
        state.error = null
      })
      .addCase(punchIn.fulfilled, (state, action) => {
        state.punchStatus = 'succeeded'
        state.today = action.payload
      })
      .addCase(punchIn.rejected, (state, action) => {
        state.punchStatus = 'failed'
        state.error = action.payload
      })
      .addCase(punchOut.pending, (state) => {
        state.punchStatus = 'loading'
        state.error = null
      })
      .addCase(punchOut.fulfilled, (state, action) => {
        state.punchStatus = 'succeeded'
        state.today = action.payload
      })
      .addCase(punchOut.rejected, (state, action) => {
        state.punchStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchMyAttendanceCalendar.pending, (state) => {
        state.calendarStatus = 'loading'
      })
      .addCase(fetchMyAttendanceCalendar.fulfilled, (state, action) => {
        state.calendarStatus = 'succeeded'
        state.calendar = action.payload
      })
      .addCase(fetchMyAttendanceCalendar.rejected, (state, action) => {
        state.calendarStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchMyAttendanceHistory.pending, (state) => {
        state.historyStatus = 'loading'
      })
      .addCase(fetchMyAttendanceHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded'
        state.history = action.payload
      })
      .addCase(fetchMyAttendanceHistory.rejected, (state, action) => {
        state.historyStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchAdminAttendanceRecords.pending, (state) => {
        state.adminRecordsStatus = 'loading'
        state.error = null
      })
      .addCase(fetchAdminAttendanceRecords.fulfilled, (state, action) => {
        state.adminRecordsStatus = 'succeeded'
        state.adminRecords = action.payload.records
      })
      .addCase(fetchAdminAttendanceRecords.rejected, (state, action) => {
        state.adminRecordsStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchAdminAttendanceReport.pending, (state) => {
        state.adminReportStatus = 'loading'
        state.error = null
      })
      .addCase(fetchAdminAttendanceReport.fulfilled, (state, action) => {
        state.adminReportStatus = 'succeeded'
        state.adminReport = action.payload
      })
      .addCase(fetchAdminAttendanceReport.rejected, (state, action) => {
        state.adminReportStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { clearAttendanceError } = attendanceSlice.actions
export default attendanceSlice.reducer
