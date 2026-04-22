import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import '../styles/forgotPassword.css'
import { forgotPassword as forgotPasswordApi } from '../services/userService'

interface ForgotPasswordProps {
    onBackToLogin: () => void
    onSendCode: (email: string) => void
}

export default function ForgotPassword({ onBackToLogin, onSendCode }: ForgotPasswordProps) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setError('')
        setLoading(true)
        try {
            await forgotPasswordApi(email)
            onSendCode(email)
        } catch (err: any) {
            setError(err.message || 'Failed to send reset code')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="forgot-password-container">
            {/* Decorative Spheres */}
            <div className="spheres-container">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="sphere" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
            </div>

            <div className="screen-content">
                <h1 className="screen-title">Forgot Password</h1>
                <p className="screen-subtitle">
                    Confirm your registered contact details to receive a one-time code
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="text-left mb-6">
                        <Label htmlFor="email" className="custom-label">
                            Email address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="E.g John@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="custom-input"
                            required
                        />
                    </div>

                    {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

                    <Button type="submit" className="custom-button" disabled={loading}>
                        {loading ? 'Sending...' : 'Send code'}
                    </Button>

                    <button
                        type="button"
                        onClick={onBackToLogin}
                        className="back-link"
                    >
                        ← Back to Sign in
                    </button>
                </form>
            </div>
        </div>
    )
}
