import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  fetchCurrentUser,
  loginByRole,
  logoutRequest,
  refreshSessionRequest,
} from './authService'

const initialState = {
  user: null,
  accessToken: null,
  status: 'bootstrapping',
  loginStatus: 'idle',
  error: null,
}

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      return await loginByRole('admin', credentials)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Admin login failed.',
      )
    }
  },
)

export const loginEmployee = createAsyncThunk(
  'auth/loginEmployee',
  async (credentials, { rejectWithValue }) => {
    try {
      return await loginByRole('employee', credentials)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Employee login failed.',
      )
    }
  },
)

export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      return await refreshSessionRequest()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to restore session.',
      )
    }
  },
)

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchCurrentUser()
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to fetch user profile.',
      )
    }
  },
)

export const logoutSession = createAsyncThunk(
  'auth/logoutSession',
  async (_, { rejectWithValue }) => {
    try {
      await logoutRequest()
      return true
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to log out.',
      )
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutLocal(state) {
      state.user = null
      state.accessToken = null
      state.status = 'guest'
      state.loginStatus = 'idle'
      state.error = null
    },
    setCredentials(state, action) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.status = 'authenticated'
      state.loginStatus = 'succeeded'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loginStatus = 'loading'
        state.error = null
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.status = 'authenticated'
        state.loginStatus = 'succeeded'
        state.error = null
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loginStatus = 'failed'
        state.error = action.payload
      })
      .addCase(loginEmployee.pending, (state) => {
        state.loginStatus = 'loading'
        state.error = null
      })
      .addCase(loginEmployee.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.status = 'authenticated'
        state.loginStatus = 'succeeded'
        state.error = null
      })
      .addCase(loginEmployee.rejected, (state, action) => {
        state.loginStatus = 'failed'
        state.error = action.payload
      })
      .addCase(refreshSession.pending, (state) => {
        state.status = 'bootstrapping'
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.status = 'authenticated'
        state.error = null
      })
      .addCase(refreshSession.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.status = 'guest'
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(logoutSession.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.status = 'guest'
        state.loginStatus = 'idle'
        state.error = null
      })
  },
})

export const { logoutLocal, setCredentials } = authSlice.actions
export default authSlice.reducer
