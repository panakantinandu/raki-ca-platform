import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
})

function getTokens() {
  return {
    accessToken: localStorage.getItem('Raki_access_token'),
    refreshToken: localStorage.getItem('Raki_refresh_token')
  }
}

function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('Raki_access_token', accessToken)
  if (refreshToken) localStorage.setItem('Raki_refresh_token', refreshToken)
}

function clearTokens() {
  localStorage.removeItem('Raki_access_token')
  localStorage.removeItem('Raki_refresh_token')
}

apiClient.interceptors.request.use((config) => {
  const { accessToken } = getTokens()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let isRefreshing = false
let refreshQueue = []

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  refreshQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Never try to "refresh" the refresh call itself, or auth endpoints in general.
    const isAuthRoute = originalRequest.url?.includes('/auth/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      const { refreshToken } = getTokens()
      if (!refreshToken) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const base = import.meta.env.VITE_API_BASE_URL || '/api'
        const { data } = await axios.post(`${base}/auth/refresh`, { refreshToken })
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export { getTokens, setTokens, clearTokens }
export default apiClient
