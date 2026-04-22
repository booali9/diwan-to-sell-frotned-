import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import '../styles/forgotPassword.css'
import { resetPassword as resetPasswordApi } from '../services/userService'

interface SetNewPasswordProps {
    email: string
    resetToken: string
    onConfirm: () => void
}

export default function SetNewPassword({ email, resetToken, onConfirm }: SetNewPasswordProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password || password !== confirmPassword) {
            setError(password !== confirmPassword ? 'Passwords do not match' : 'Please enter a password')
            return
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        setError('')
        setLoading(true)
        try {
            await resetPasswordApi(email, resetToken, password)
            onConfirm()
        } catch (err: any) {
            setError(err.message || 'Password reset failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="forgot-password-container">
            {/* Decorative Spheres */}
            <div className="spheres-container">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="sphere" />
                ))}
            </div>

            <div className="screen-content">
                <h1 className="screen-title">Set a New Account Password</h1>
                <p className="screen-subtitle">
                    Create a new password that meets security requirements
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group-password">
                        <label className="custom-label">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="custom-input"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle-btn"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group-password">
                        <label className="custom-label">Confirm Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="custom-input"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="password-toggle-btn"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" className="custom-button" disabled={loading}>
                        {loading ? 'Resetting...' : 'Confirm'}
                    </button>
                </form>
            </div>
        </div>
    )
}
