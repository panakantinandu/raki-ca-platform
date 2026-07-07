import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiClient, { setTokens, clearTokens, getTokens } from '../api/axiosClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { accessToken } = getTokens()
    const cachedUser = localStorage.getItem('Raki_user')
    if (accessToken && cachedUser) {
      setUser(JSON.parse(cachedUser))
    }
    setLoading(false)
  }, [])

  const persistSession = useCallback((data) => {
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
    localStorage.setItem('Raki_user', JSON.stringify(data.user))
    setUser(data.user)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password })
    persistSession(data)
    return data
  }, [persistSession])

  const register = useCallback(async (fullName, email, password, firmName) => {
    const { data } = await apiClient.post('/auth/register', { fullName, email, password, firmName })
    persistSession(data)
    return data
  }, [persistSession])

  const completeOAuthCallback = useCallback((accessToken, refreshToken) => {
    setTokens({ accessToken, refreshToken })
    // A lightweight profile fetch would normally hydrate `user` here;
    // for now, decode nothing sensitive and let the dashboard's first
    // API call populate context naturally via a /me-style endpoint.
    setUser({ fullName: 'there', email: '' })
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // best-effort - clear local state regardless
    }
    clearTokens()
    localStorage.removeItem('Raki_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, completeOAuthCallback }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
