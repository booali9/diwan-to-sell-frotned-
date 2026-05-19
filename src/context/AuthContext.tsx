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
        // Get user ID before clearing userInfo
        const userId = getUserFromStorage()?._id || '';

        localStorage.removeItem('userInfo')

        // Clear user-specific wallet cache
        if (userId) {
            const keysToRemove = [
                `${userId}_dw_local_bal_adj`,
                `${userId}_dw_cached_balance`,
                `${userId}_dw_spot_holdings`,
                `${userId}_dw_futures_balance`,
                `${userId}_dw_adj_v2_migrated`,
                `${userId}_dw_spot_timestamps`,
                `${userId}_dw_cost_basis`,
            ];
            keysToRemove.forEach(key => {
                try { localStorage.removeItem(key); } catch {}
            });
        }

        // Also clear legacy (non-prefixed) keys for clean transition
        try {
            localStorage.removeItem('dw_local_bal_adj');
            localStorage.removeItem('dw_cached_balance');
            localStorage.removeItem('dw_spot_holdings');
            localStorage.removeItem('dw_futures_balance');
            localStorage.removeItem('dw_adj_v2_migrated');
            localStorage.removeItem('dw_spot_timestamps');
            localStorage.removeItem('dw_cost_basis');
        } catch {}

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
