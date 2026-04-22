import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface UserData {
    _id: string
    name: string
    email: string
    phone?: string
    token: string
    isEmailVerified?: boolean
    isProfileComplete?: boolean
    kycStatus?: string
}

interface AuthContextType {
    isLoggedIn: boolean
    user: UserData | null
    login: (userData?: any) => void
    logout: () => void
    refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getUserFromStorage(): UserData | null {
    try {
        const raw = localStorage.getItem('userInfo')
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(getUserFromStorage)
    const isLoggedIn = !!user

    const login = useCallback((userData?: any) => {
        if (userData) {
            localStorage.setItem('userInfo', JSON.stringify(userData))
            setUser(userData)
        } else {
            setUser(getUserFromStorage())
        }
    }, [])

    const logout = useCallback(() => {
        localStorage.removeItem('userInfo')
        setUser(null)
    }, [])

    const refreshUser = useCallback(() => {
        setUser(getUserFromStorage())
    }, [])

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout, refreshUser }}>
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
