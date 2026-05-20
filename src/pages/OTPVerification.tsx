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

                <div className="otp-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
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

                    <button 
                        type="button" 
                        onClick={async () => {
                            try {
                                const text = await navigator.clipboard.readText();
                                const digits = text.replace(/\D/g, '').substring(0, 6);
                                if (digits) {
                                    setValue(digits);
                                    setError('');
                                } else {
                                    setError('No numbers found in clipboard');
                                }
                            } catch (err) {
                                setError('Failed to read from clipboard. Please paste manually.');
                            }
                        }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#ccc',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s',
                        }}
                    >
                        Paste OTP
                    </button>
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
