import api from '../api/axiosClient'
import { logoutLocal, refreshSession } from '../features/auth/authSlice'

let isRefreshing = false
let pendingQueue = []

function resolveQueue(error, token = null) {
  pendingQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
      return
    }

    promise.resolve(token)
  })

  pendingQueue = []
}

export function setupInterceptors(store) {
  api.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (
        error.response?.status !== 401 ||
        originalRequest?._retry ||
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const resultAction = await store.dispatch(refreshSession())

        if (refreshSession.fulfilled.match(resultAction)) {
          const nextToken = resultAction.payload.accessToken
          resolveQueue(null, nextToken)
          originalRequest.headers.Authorization = `Bearer ${nextToken}`
          return api(originalRequest)
        }

        throw new Error('Session refresh failed.')
      } catch (refreshError) {
        resolveQueue(refreshError, null)
        store.dispatch(logoutLocal())
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    },
  )
}
