import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createEmploymentTypeRequest,
  fetchEmploymentTypeByIdRequest,
  fetchEmploymentTypeOptionsRequest,
  fetchEmploymentTypesRequest,
  updateEmploymentTypeRequest,
  updateLeavePolicyRequest,
} from './employmentTypeService'

const initialState = {
  items: [],
  options: [],
  detail: null,
  listStatus: 'idle',
  optionsStatus: 'idle',
  detailStatus: 'idle',
  submitStatus: 'idle',
  error: null,
}

export const fetchEmploymentTypes = createAsyncThunk(
  'employmentTypes/fetchEmploymentTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchEmploymentTypesRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch employment types.',
      )
    }
  },
)

export const fetchEmploymentTypeOptions = createAsyncThunk(
  'employmentTypes/fetchEmploymentTypeOptions',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchEmploymentTypeOptionsRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Unable to fetch employment type options.',
      )
    }
  },
)

export const fetchEmploymentTypeById = createAsyncThunk(
  'employmentTypes/fetchEmploymentTypeById',
  async (id, { rejectWithValue }) => {
    try {
      return await fetchEmploymentTypeByIdRequest(id)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch employment type.',
      )
    }
  },
)

export const createEmploymentType = createAsyncThunk(
  'employmentTypes/createEmploymentType',
  async (payload, { rejectWithValue }) => {
    try {
      return await createEmploymentTypeRequest(payload)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to create employment type.',
      )
    }
  },
)

export const updateEmploymentType = createAsyncThunk(
  'employmentTypes/updateEmploymentType',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateEmploymentTypeRequest({ id, payload })
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to update employment type.',
      )
    }
  },
)

export const updateLeavePolicy = createAsyncThunk(
  'employmentTypes/updateLeavePolicy',
  async ({ id, leaveRules }, { rejectWithValue }) => {
    try {
      return await updateLeavePolicyRequest({ id, leaveRules })
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to update leave policy.',
      )
    }
  },
)

const employmentTypeSlice = createSlice({
  name: 'employmentTypes',
  initialState,
  reducers: {
    resetEmploymentTypeDetail(state) {
      state.detail = null
      state.detailStatus = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmploymentTypes.pending, (state) => {
        state.listStatus = 'loading'
        state.error = null
      })
      .addCase(fetchEmploymentTypes.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchEmploymentTypes.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchEmploymentTypeOptions.pending, (state) => {
        state.optionsStatus = 'loading'
      })
      .addCase(fetchEmploymentTypeOptions.fulfilled, (state, action) => {
        state.optionsStatus = 'succeeded'
        state.options = action.payload
      })
      .addCase(fetchEmploymentTypeOptions.rejected, (state, action) => {
        state.optionsStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchEmploymentTypeById.pending, (state) => {
        state.detailStatus = 'loading'
        state.detail = null
        state.error = null
      })
      .addCase(fetchEmploymentTypeById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(fetchEmploymentTypeById.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.error = action.payload
      })
      .addCase(createEmploymentType.pending, (state) => {
        state.submitStatus = 'loading'
        state.error = null
      })
      .addCase(createEmploymentType.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(createEmploymentType.rejected, (state, action) => {
        state.submitStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateEmploymentType.pending, (state) => {
        state.submitStatus = 'loading'
        state.error = null
      })
      .addCase(updateEmploymentType.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(updateEmploymentType.rejected, (state, action) => {
        state.submitStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateLeavePolicy.pending, (state) => {
        state.submitStatus = 'loading'
        state.error = null
      })
      .addCase(updateLeavePolicy.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(updateLeavePolicy.rejected, (state, action) => {
        state.submitStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetEmploymentTypeDetail } = employmentTypeSlice.actions
export default employmentTypeSlice.reducer
