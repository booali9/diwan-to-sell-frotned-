import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import '../styles/forgotPassword.css'

interface PasswordResetSuccessProps {
    onSignIn: () => void
}

export default function PasswordResetSuccess({ onSignIn }: PasswordResetSuccessProps) {
    return (
        <div className="forgot-password-container">
            {/* Decorative Spheres */}
            <div className="spheres-container">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="sphere" />
                ))}
            </div>

            <div className="screen-content">
                <div className="success-icon-wrapper">
                    <Check className="success-icon" strokeWidth={3} />
                </div>
                <h1 className="screen-title">You're All Set</h1>
                <p className="screen-subtitle">
                    Proceed to sign in and resume access to your trading dashboard and account features
                </p>

                <Button onClick={onSignIn} className="custom-button">
                    Sign in
                </Button>
            </div>
        </div>
    )
}
