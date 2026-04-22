import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProfileGuardProps {
    children: React.ReactNode
}

export default function ProfileGuard({ children }: ProfileGuardProps) {
    const { user, isLoggedIn } = useAuth()
    const location = useLocation()

    if (!isLoggedIn) {
        return <Navigate to="/signin" state={{ from: location }} replace />
    }

    // Profile must be complete to access dashboard features
    // Only redirect if explicitly false — undefined means field not set, allow through
    if (user && user.isProfileComplete === false && location.pathname !== '/complete-profile') {
        return <Navigate to="/complete-profile" replace />
    }

    return <>{children}</>
}
