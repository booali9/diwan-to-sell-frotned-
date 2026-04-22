import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall } from '@/lib/api'

interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const savedUser = localStorage.getItem('adminUser')
    if (token && savedUser) {
      setIsAuthenticated(true)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const data = await apiCall('/admin/login', 'POST', { email, password })
      const token = data.token || data.accessToken
      if (token) {
        localStorage.setItem('adminToken', token)
        localStorage.setItem('adminUser', JSON.stringify(data.user || data.admin || { email }))
        setIsAuthenticated(true)
        setUser(data.user || data.admin || { email })
        navigate('/dashboard')
      } else {
        throw new Error('No token received')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setIsAuthenticated(false)
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
