import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ClerkAuth() {
    const { isLoaded, isSignedIn, user } = useUser()
    const navigate = useNavigate()
    const { login } = useAuth()
    const { toast } = useToast()

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            syncWithBackend(user)
        }
    }, [isLoaded, isSignedIn, user])

    const syncWithBackend = async (clerkUser: any) => {
        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/users/clerk-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clerkUser })
            })

            if (!response.ok) throw new Error('Backend sync failed')

            const data = await response.json()
            localStorage.setItem('userInfo', JSON.stringify(data))
            login()
            toast('Successfully logged in with Facebook!', 'success')
            navigate('/dashboard/trade')
        } catch (error) {
            console.error('Clerk sync error:', error)
            toast('Sync failed. Please try again.', 'error')
            navigate('/signin')
        }
    }

    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', color: '#fff' }}>
            <div className="loading-spinner">Verifying Facebook account...</div>
        </div>
    )
}
