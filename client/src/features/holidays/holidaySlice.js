import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createHolidayRequest,
  deleteHolidayRequest,
  fetchHolidayByIdRequest,
  fetchHolidaysRequest,
  updateHolidayRequest,
} from './holidayService'

const initialState = {
  items: [],
  detail: null,
  listStatus: 'idle',
  detailStatus: 'idle',
  submitStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
}

export const fetchHolidays = createAsyncThunk(
  'holidays/fetchHolidays',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchHolidaysRequest(params)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch holidays.',
      )
    }
  },
)

export const fetchHolidayById = createAsyncThunk(
  'holidays/fetchHolidayById',
  async (id, { rejectWithValue }) => {
    try {
      return await fetchHolidayByIdRequest(id)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch holiday.',
      )
    }
  },
)

export const createHoliday = createAsyncThunk(
  'holidays/createHoliday',
  async (payload, { rejectWithValue }) => {
    try {
      return await createHolidayRequest(payload)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to create holiday.',
      )
    }
  },
)

export const updateHoliday = createAsyncThunk(
  'holidays/updateHoliday',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateHolidayRequest({ id, payload })
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to update holiday.',
      )
    }
  },
)

export const deleteHoliday = createAsyncThunk(
  'holidays/deleteHoliday',
  async (id, { rejectWithValue }) => {
    try {
      return await deleteHolidayRequest(id)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to delete holiday.',
      )
    }
  },
)

const holidaySlice = createSlice({
  name: 'holidays',
  initialState,
  reducers: {
    resetHolidayDetail(state) {
      state.detail = null
      state.detailStatus = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHolidays.pending, (state) => {
        state.listStatus = 'loading'
        state.error = null
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchHolidayById.pending, (state) => {
        state.detailStatus = 'loading'
      })
      .addCase(fetchHolidayById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(fetchHolidayById.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.error = action.payload
      })
      .addCase(createHoliday.pending, (state) => {
        state.submitStatus = 'loading'
        state.error = null
      })
      .addCase(createHoliday.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(createHoliday.rejected, (state, action) => {
        state.submitStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateHoliday.pending, (state) => {
        state.submitStatus = 'loading'
        state.error = null
      })
      .addCase(updateHoliday.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(updateHoliday.rejected, (state, action) => {
        state.submitStatus = 'failed'
        state.error = action.payload
      })
      .addCase(deleteHoliday.pending, (state) => {
        state.deleteStatus = 'loading'
        state.error = null
      })
      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded'
        state.items = state.items.filter((item) => item.id !== action.meta.arg)
      })
      .addCase(deleteHoliday.rejected, (state, action) => {
        state.deleteStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetHolidayDetail } = holidaySlice.actions
export default holidaySlice.reducer
