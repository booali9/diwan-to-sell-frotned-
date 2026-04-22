import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Undo2, UserRound, ScanFace, ChevronDown, Upload, Check, Loader2 } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import '../../styles/kyc.css'
import { submitKYC, getKYCStatus } from '../../services/userService'

type KYCStep = 'loading' | 'intro' | 'document-type' | 'upload' | 'selfie' | 'submitting' | 'submitted' | 'verified' | 'rejected'

export default function KYCVerification() {
    const navigate = useNavigate()
    const [step, setStep] = useState<KYCStep>('loading')
    const [selectedDoc, setSelectedDoc] = useState('Passport')
    const [documentFront, setDocumentFront] = useState<string>('')
    const [documentFrontName, setDocumentFrontName] = useState('')
    const [selfieImage, setSelfieImage] = useState<string>('')
    const [selfieName, setSelfieName] = useState('')
    const [error, setError] = useState('')
    const docInputRef = useRef<HTMLInputElement>(null)
    const selfieInputRef = useRef<HTMLInputElement>(null)

    const docTypes = ['Drivers license', 'ID card', 'Residence permit', 'Passport']

    // Check existing KYC status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const data = await getKYCStatus()
                if (data.kycStatus === 'verified') {
                    setStep('verified')
                } else if (data.kycStatus === 'pending') {
                    setStep('submitted')
                } else if (data.kycStatus === 'rejected') {
                    setStep('rejected')
                } else {
                    setStep('intro')
                }
            } catch {
                setStep('intro')
            }
        }
        checkStatus()
    }, [])

    const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(file)
            img.onload = () => {
                URL.revokeObjectURL(url)
                const canvas = document.createElement('canvas')
                let { width, height } = img
                // Scale down to maxWidth
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width)
                    width = maxWidth
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                if (!ctx) { reject(new Error('Canvas not supported')); return }
                ctx.drawImage(img, 0, 0, width, height)

                // Compress iteratively until under 500KB
                let q = quality
                let base64 = canvas.toDataURL('image/jpeg', q)
                while (base64.length > 500 * 1024 && q > 0.1) {
                    q -= 0.1
                    base64 = canvas.toDataURL('image/jpeg', q)
                }
                console.log(`[KYC] Image compressed: ${(base64.length / 1024).toFixed(0)}KB, quality=${q.toFixed(1)}, ${width}x${height}`)
                resolve(base64)
            }
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
            img.src = url
        })
    }

    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be under 10MB')
            return
        }
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }
        try {
            setError('Compressing image...')
            const base64 = await compressImage(file)
            setDocumentFront(base64)
            setDocumentFrontName(file.name)
            setError('')
        } catch {
            setError('Failed to process image')
        }
    }

    const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be under 10MB')
            return
        }
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }
        try {
            setError('Compressing image...')
            const base64 = await compressImage(file)
            setSelfieImage(base64)
            setSelfieName(file.name)
            setError('')
        } catch {
            setError('Failed to process image')
        }
    }

    const handleSubmitKYC = async () => {
        if (!documentFront || !selfieImage) {
            setError('Please upload both document and selfie')
            return
        }
        setStep('submitting')
        setError('')
        try {
            await submitKYC(selectedDoc.toLowerCase().replace(/ /g, '_'), documentFront, '', selfieImage)
            setStep('submitted')
        } catch (err: any) {
            setError(err.message || 'KYC submission failed')
            setStep('selfie') // Go back to allow retry
        }
    }

    const handleBack = () => {
        if (step === 'intro') navigate('/dashboard/profile')
        else if (step === 'document-type') setStep('intro')
        else if (step === 'upload') setStep('document-type')
        else if (step === 'selfie') setStep('upload')
    }

    return (
        <Layout activePage="profile">
            <div className="kyc-page-container">
                <div className="kyc-card">
                    {!['loading', 'submitting', 'submitted', 'verified'].includes(step) && (
                        <button className="kyc-back-btn" onClick={handleBack}>
                            <Undo2 size={20} />
                        </button>
                    )}

                    {step === 'loading' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                            <Loader2 size={32} className="animate-spin" style={{ color: '#1B9B8C' }} />
                            <p className="kyc-subtitle" style={{ marginTop: '16px' }}>Checking verification status...</p>
                        </div>
                    )}

                    {step === 'intro' && (
                        <>
                            <h2 className="kyc-title">Let's get you verified</h2>
                            <p className="kyc-subtitle">Follow the steps below to get verified</p>

                            <div className="kyc-steps-list">
                                <div className="kyc-step-item">
                                    <div className="step-icon-bg">
                                        <UserRound size={20} />
                                    </div>
                                    <div className="step-text-container">
                                        <span className="step-number-label">Step 1</span>
                                        <span className="step-label-title">Provide identity document</span>
                                    </div>
                                </div>
                                <div className="kyc-step-item">
                                    <div className="step-icon-bg">
                                        <ScanFace size={20} />
                                    </div>
                                    <div className="step-text-container">
                                        <span className="step-number-label">Step 2</span>
                                        <span className="step-label-title">Take a selfie photo</span>
                                    </div>
                                </div>
                            </div>

                            <div className="kyc-actions">
                                <button className="kyc-btn-primary" onClick={() => setStep('document-type')}>Start verification</button>
                            </div>
                        </>
                    )}

                    {step === 'document-type' && (
                        <>
                            <h2 className="kyc-title">Select your identity document type</h2>
                            <p className="kyc-subtitle">Choose the document you want to verify with</p>

                            <div className="kyc-form">
                                <label className="kyc-label">Document Type</label>
                                <div className="kyc-option-list" style={{ marginBottom: '32px' }}>
                                    {docTypes.map(doc => (
                                        <div
                                            key={doc}
                                            className={`kyc-radio-option ${selectedDoc === doc ? 'active' : ''}`}
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            <div className="radio-circle">
                                                <div className="radio-inner"></div>
                                            </div>
                                            <span className="option-label">{doc}</span>
                                            {selectedDoc === doc && <Check size={16} style={{ marginLeft: 'auto', color: '#1B9B8C' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="kyc-actions">
                                <button className="kyc-btn-primary" onClick={() => setStep('upload')}>Continue</button>
                            </div>
                        </>
                    )}

                    {step === 'upload' && (
                        <>
                            <h2 className="kyc-title">Upload your document</h2>
                            <p className="kyc-subtitle">Ensure all details on photo are readable</p>

                            <div className="kyc-form">
                                <label className="kyc-label">Document type</label>
                                <div className="kyc-select-wrapper">
                                    <div className="kyc-select">
                                        <span style={{ fontSize: '18px' }}>📇</span>
                                        <span>{selectedDoc}</span>
                                        <ChevronDown size={18} style={{ marginLeft: 'auto', color: '#71717A' }} />
                                    </div>
                                </div>

                                <input
                                    ref={docInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleDocUpload}
                                />

                                <div
                                    className="upload-area"
                                    onClick={() => docInputRef.current?.click()}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {documentFront ? (
                                        <>
                                            <Check size={24} style={{ color: '#1B9B8C' }} />
                                            <span className="upload-title" style={{ color: '#1B9B8C' }}>{documentFrontName}</span>
                                            <span className="upload-action-text">Click to change</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="upload-icon-bg">
                                                <Upload size={24} />
                                            </div>
                                            <span className="upload-title">{selectedDoc} photo page</span>
                                            <span className="upload-action-text"><span style={{ color: '#1B9B8C' }}>Choose</span> or drag and drop</span>
                                        </>
                                    )}
                                </div>

                                <p className="upload-constraints">Jpg, Png, webp, HEIC (Max 50mb)</p>
                            </div>

                            {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

                            <div className="kyc-actions" style={{ marginTop: '32px' }}>
                                <button className="kyc-btn-primary" onClick={() => { if (documentFront) setStep('selfie'); else setError('Please upload your document') }}>Continue</button>
                            </div>
                        </>
                    )}

                    {step === 'selfie' && (
                        <>
                            <h2 className="kyc-title">Take a selfie</h2>
                            <p className="kyc-subtitle">Upload a clear photo of your face</p>

                            <div className="kyc-form">
                                <input
                                    ref={selfieInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleSelfieUpload}
                                />

                                <div
                                    className="upload-area"
                                    onClick={() => selfieInputRef.current?.click()}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {selfieImage ? (
                                        <>
                                            <Check size={24} style={{ color: '#1B9B8C' }} />
                                            <span className="upload-title" style={{ color: '#1B9B8C' }}>{selfieName}</span>
                                            <span className="upload-action-text">Click to change</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="upload-icon-bg">
                                                <ScanFace size={24} />
                                            </div>
                                            <span className="upload-title">Selfie photo</span>
                                            <span className="upload-action-text"><span style={{ color: '#1B9B8C' }}>Choose</span> or take a photo</span>
                                        </>
                                    )}
                                </div>

                                <p className="upload-constraints">Jpg, Png, webp, HEIC (Max 50mb)</p>
                            </div>

                            {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</p>}

                            <div className="kyc-actions" style={{ marginTop: '32px' }}>
                                <button className="kyc-btn-primary" onClick={handleSubmitKYC}>Submit verification</button>
                            </div>
                        </>
                    )}

                    {step === 'submitting' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                            <Loader2 size={32} className="animate-spin" style={{ color: '#1B9B8C' }} />
                            <p className="kyc-subtitle" style={{ marginTop: '16px' }}>Submitting your documents...</p>
                        </div>
                    )}

                    {step === 'submitted' && (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(27, 155, 140, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                    <Check size={32} style={{ color: '#1B9B8C' }} />
                                </div>
                                <h2 className="kyc-title">Verification Submitted</h2>
                                <p className="kyc-subtitle" style={{ textAlign: 'center' }}>
                                    Your documents have been submitted for review. You'll be notified once verification is complete.
                                </p>
                                <button className="kyc-btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/dashboard/profile')}>
                                    Back to Profile
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'verified' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(27, 155, 140, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <Check size={32} style={{ color: '#1B9B8C' }} />
                            </div>
                            <h2 className="kyc-title">Identity Verified</h2>
                            <p className="kyc-subtitle" style={{ textAlign: 'center' }}>
                                Your identity has been successfully verified.
                            </p>
                            <button className="kyc-btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/dashboard/profile')}>
                                Back to Profile
                            </button>
                        </div>
                    )}

                    {step === 'rejected' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <Undo2 size={32} style={{ color: '#ef4444' }} />
                            </div>
                            <h2 className="kyc-title">Verification Rejected</h2>
                            <p className="kyc-subtitle" style={{ textAlign: 'center' }}>
                                Your verification was not approved. Please try again with clearer documents.
                            </p>
                            <button className="kyc-btn-primary" style={{ marginTop: '24px' }} onClick={() => {
                                setDocumentFront('')
                                setDocumentFrontName('')
                                setSelfieImage('')
                                setSelfieName('')
                                setStep('intro')
                            }}>
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}
