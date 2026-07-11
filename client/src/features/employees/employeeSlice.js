import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createEmployeeRequest,
  fetchEmployeeRequest,
  fetchEmployeesRequest,
  fetchManagersRequest,
  updateEmployeeRequest,
  updateEmployeeStatusRequest,
} from './employeeService'

const initialState = {
  items: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
  listStatus: 'idle',
  detail: null,
  detailStatus: 'idle',
  submitStatus: 'idle',
  managers: [],
  managersStatus: 'idle',
  error: null,
}

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchEmployeesRequest(params)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch employees.',
      )
    }
  },
)

export const fetchEmployeeById = createAsyncThunk(
  'employees/fetchEmployeeById',
  async (id, { rejectWithValue }) => {
    try {
      return await fetchEmployeeRequest(id)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch employee.',
      )
    }
  },
)

export const createEmployee = createAsyncThunk(
  'employees/createEmployee',
  async (payload, { rejectWithValue }) => {
    try {
      return await createEmployeeRequest(payload)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to create employee.',
      )
    }
  },
)

export const updateEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateEmployeeRequest({ id, payload })
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to update employee.',
      )
    }
  },
)

export const updateEmployeeStatus = createAsyncThunk(
  'employees/updateEmployeeStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await updateEmployeeStatusRequest({ id, status })
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to update employee status.',
      )
    }
  },
)

export const fetchManagers = createAsyncThunk(
  'employees/fetchManagers',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchManagersRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch managers.',
      )
    }
  },
)

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    resetEmployeeDetail(state) {
      state.detail = null
      state.detailStatus = 'idle'
      state.error = null
    },
    clearEmployeeError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.listStatus = 'loading'
        state.error = null
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        state.items = action.payload.items
        state.pagination = action.payload.pagination
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchEmployeeById.pending, (state) => {
        state.detailStatus = 'loading'
        state.error = null
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.error = action.payload
      })
      .addCase(createEmployee.pending, (state) => {
        state.submitStatus = 'loading'
        state.error = null
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.submitStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateEmployee.pending, (state) => {
        state.submitStatus = 'loading'
        state.error = null
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.submitStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateEmployeeStatus.fulfilled, (state, action) => {
        state.detail = action.payload
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        )
      })
      .addCase(updateEmployeeStatus.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(fetchManagers.pending, (state) => {
        state.managersStatus = 'loading'
      })
      .addCase(fetchManagers.fulfilled, (state, action) => {
        state.managersStatus = 'succeeded'
        state.managers = action.payload
      })
      .addCase(fetchManagers.rejected, (state, action) => {
        state.managersStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetEmployeeDetail, clearEmployeeError } = employeeSlice.actions
export default employeeSlice.reducer
