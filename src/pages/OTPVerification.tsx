import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp'
import '../styles/forgotPassword.css'

interface OTPVerificationProps {
    email?: string
    phone?: string
    mode?: 'register' | 'reset'
    onVerify: (otp: string) => void
    onResend: () => void
}

export default function OTPVerification({ email, phone, mode = 'reset', onVerify, onResend }: OTPVerificationProps) {
    const [value, setValue] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resending, setResending] = useState(false)

    const handleVerify = async () => {
        if (value.length !== 6) return
        setError('')
        setLoading(true)
        try {
            await onVerify(value)
        } catch (err: any) {
            setError(err.message || 'Verification failed')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResending(true)
        try {
            await onResend()
        } finally {
            setResending(false)
        }
    }

    const contactInfo = email || phone || 'your device'

    return (
        <div className="forgot-password-container">
            {/* Decorative Spheres */}
            <div className="spheres-container">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="sphere" />
                ))}
            </div>

            <div className="screen-content">
                <h1 className="screen-title">
                    {mode === 'register' ? 'Verify Your Account' : 'OTP Verification'}
                </h1>
                <p className="screen-subtitle">
                    {mode === 'register'
                        ? `We've sent a verification code to ${contactInfo}`
                        : `Enter the one-time code sent to ${contactInfo}`}
                </p>

                <div className="otp-container">
                    <InputOTP
                        maxLength={6}
                        value={value}
                        onChange={(val) => setValue(val)}
                    >
                        <InputOTPGroup className="gap-3">
                            <InputOTPSlot index={0} className="otp-slot" />
                            <InputOTPSlot index={1} className="otp-slot" />
                            <InputOTPSlot index={2} className="otp-slot" />
                            <InputOTPSlot index={3} className="otp-slot" />
                            <InputOTPSlot index={4} className="otp-slot" />
                            <InputOTPSlot index={5} className="otp-slot" />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

                <Button
                    onClick={handleVerify}
                    className="custom-button"
                    disabled={value.length < 6 || loading}
                >
                    {loading ? 'Verifying...' : 'Verify'}
                </Button>

                <p className="resend-text">
                    Didn't receive code?
                    <button onClick={handleResend} className="resend-btn" disabled={resending}>
                        {resending ? 'Sending...' : 'Resend'}
                    </button>
                </p>
            </div>
        </div>
    )
}
