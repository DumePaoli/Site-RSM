import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rsm_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const setAuth = (token, userData) => {
    localStorage.setItem('rsm_token', token)
    localStorage.setItem('rsm_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('rsm_token')
    localStorage.removeItem('rsm_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setAuth, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
