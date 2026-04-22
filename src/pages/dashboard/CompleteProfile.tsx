import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { updateUserProfile } from '../../services/userService'
import { useToast } from '../../context/ToastContext'
import '../../styles/login.css'

interface CountryData {
    name: string
    code: string   // ISO 2-letter
    dial: string   // e.g. "+1"
    flag: string
}

const COUNTRIES: CountryData[] = [
    { name: 'Afghanistan', code: 'AF', dial: '+93', flag: '🇦🇫' },
    { name: 'Albania', code: 'AL', dial: '+355', flag: '🇦🇱' },
    { name: 'Algeria', code: 'DZ', dial: '+213', flag: '🇩🇿' },
    { name: 'Andorra', code: 'AD', dial: '+376', flag: '🇦🇩' },
    { name: 'Angola', code: 'AO', dial: '+244', flag: '🇦🇴' },
    { name: 'Argentina', code: 'AR', dial: '+54', flag: '🇦🇷' },
    { name: 'Armenia', code: 'AM', dial: '+374', flag: '🇦🇲' },
    { name: 'Australia', code: 'AU', dial: '+61', flag: '🇦🇺' },
    { name: 'Austria', code: 'AT', dial: '+43', flag: '🇦🇹' },
    { name: 'Azerbaijan', code: 'AZ', dial: '+994', flag: '🇦🇿' },
    { name: 'Bahrain', code: 'BH', dial: '+973', flag: '🇧🇭' },
    { name: 'Bangladesh', code: 'BD', dial: '+880', flag: '🇧🇩' },
    { name: 'Belarus', code: 'BY', dial: '+375', flag: '🇧🇾' },
    { name: 'Belgium', code: 'BE', dial: '+32', flag: '🇧🇪' },
    { name: 'Bolivia', code: 'BO', dial: '+591', flag: '🇧🇴' },
    { name: 'Bosnia and Herzegovina', code: 'BA', dial: '+387', flag: '🇧🇦' },
    { name: 'Brazil', code: 'BR', dial: '+55', flag: '🇧🇷' },
    { name: 'Brunei', code: 'BN', dial: '+673', flag: '🇧🇳' },
    { name: 'Bulgaria', code: 'BG', dial: '+359', flag: '🇧🇬' },
    { name: 'Cambodia', code: 'KH', dial: '+855', flag: '🇰🇭' },
    { name: 'Cameroon', code: 'CM', dial: '+237', flag: '🇨🇲' },
    { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
    { name: 'Chile', code: 'CL', dial: '+56', flag: '🇨🇱' },
    { name: 'China', code: 'CN', dial: '+86', flag: '🇨🇳' },
    { name: 'Colombia', code: 'CO', dial: '+57', flag: '🇨🇴' },
    { name: 'Congo', code: 'CG', dial: '+242', flag: '🇨🇬' },
    { name: 'Costa Rica', code: 'CR', dial: '+506', flag: '🇨🇷' },
    { name: 'Croatia', code: 'HR', dial: '+385', flag: '🇭🇷' },
    { name: 'Cuba', code: 'CU', dial: '+53', flag: '🇨🇺' },
    { name: 'Cyprus', code: 'CY', dial: '+357', flag: '🇨🇾' },
    { name: 'Czech Republic', code: 'CZ', dial: '+420', flag: '🇨🇿' },
    { name: 'Denmark', code: 'DK', dial: '+45', flag: '🇩🇰' },
    { name: 'Dominican Republic', code: 'DO', dial: '+1', flag: '🇩🇴' },
    { name: 'Ecuador', code: 'EC', dial: '+593', flag: '🇪🇨' },
    { name: 'Egypt', code: 'EG', dial: '+20', flag: '🇪🇬' },
    { name: 'El Salvador', code: 'SV', dial: '+503', flag: '🇸🇻' },
    { name: 'Estonia', code: 'EE', dial: '+372', flag: '🇪🇪' },
    { name: 'Ethiopia', code: 'ET', dial: '+251', flag: '🇪🇹' },
    { name: 'Finland', code: 'FI', dial: '+358', flag: '🇫🇮' },
    { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
    { name: 'Georgia', code: 'GE', dial: '+995', flag: '🇬🇪' },
    { name: 'Germany', code: 'DE', dial: '+49', flag: '🇩🇪' },
    { name: 'Ghana', code: 'GH', dial: '+233', flag: '🇬🇭' },
    { name: 'Greece', code: 'GR', dial: '+30', flag: '🇬🇷' },
    { name: 'Guatemala', code: 'GT', dial: '+502', flag: '🇬🇹' },
    { name: 'Honduras', code: 'HN', dial: '+504', flag: '🇭🇳' },
    { name: 'Hong Kong', code: 'HK', dial: '+852', flag: '🇭🇰' },
    { name: 'Hungary', code: 'HU', dial: '+36', flag: '🇭🇺' },
    { name: 'Iceland', code: 'IS', dial: '+354', flag: '🇮🇸' },
    { name: 'India', code: 'IN', dial: '+91', flag: '🇮🇳' },
    { name: 'Indonesia', code: 'ID', dial: '+62', flag: '🇮🇩' },
    { name: 'Iran', code: 'IR', dial: '+98', flag: '🇮🇷' },
    { name: 'Iraq', code: 'IQ', dial: '+964', flag: '🇮🇶' },
    { name: 'Ireland', code: 'IE', dial: '+353', flag: '🇮🇪' },
    { name: 'Israel', code: 'IL', dial: '+972', flag: '🇮🇱' },
    { name: 'Italy', code: 'IT', dial: '+39', flag: '🇮🇹' },
    { name: 'Jamaica', code: 'JM', dial: '+1', flag: '🇯🇲' },
    { name: 'Japan', code: 'JP', dial: '+81', flag: '🇯🇵' },
    { name: 'Jordan', code: 'JO', dial: '+962', flag: '🇯🇴' },
    { name: 'Kazakhstan', code: 'KZ', dial: '+7', flag: '🇰🇿' },
    { name: 'Kenya', code: 'KE', dial: '+254', flag: '🇰🇪' },
    { name: 'Kuwait', code: 'KW', dial: '+965', flag: '🇰🇼' },
    { name: 'Kyrgyzstan', code: 'KG', dial: '+996', flag: '🇰🇬' },
    { name: 'Latvia', code: 'LV', dial: '+371', flag: '🇱🇻' },
    { name: 'Lebanon', code: 'LB', dial: '+961', flag: '🇱🇧' },
    { name: 'Libya', code: 'LY', dial: '+218', flag: '🇱🇾' },
    { name: 'Lithuania', code: 'LT', dial: '+370', flag: '🇱🇹' },
    { name: 'Luxembourg', code: 'LU', dial: '+352', flag: '🇱🇺' },
    { name: 'Malaysia', code: 'MY', dial: '+60', flag: '🇲🇾' },
    { name: 'Maldives', code: 'MV', dial: '+960', flag: '🇲🇻' },
    { name: 'Malta', code: 'MT', dial: '+356', flag: '🇲🇹' },
    { name: 'Mexico', code: 'MX', dial: '+52', flag: '🇲🇽' },
    { name: 'Moldova', code: 'MD', dial: '+373', flag: '🇲🇩' },
    { name: 'Mongolia', code: 'MN', dial: '+976', flag: '🇲🇳' },
    { name: 'Montenegro', code: 'ME', dial: '+382', flag: '🇲🇪' },
    { name: 'Morocco', code: 'MA', dial: '+212', flag: '🇲🇦' },
    { name: 'Mozambique', code: 'MZ', dial: '+258', flag: '🇲🇿' },
    { name: 'Myanmar', code: 'MM', dial: '+95', flag: '🇲🇲' },
    { name: 'Nepal', code: 'NP', dial: '+977', flag: '🇳🇵' },
    { name: 'Netherlands', code: 'NL', dial: '+31', flag: '🇳🇱' },
    { name: 'New Zealand', code: 'NZ', dial: '+64', flag: '🇳🇿' },
    { name: 'Nicaragua', code: 'NI', dial: '+505', flag: '🇳🇮' },
    { name: 'Nigeria', code: 'NG', dial: '+234', flag: '🇳🇬' },
    { name: 'North Korea', code: 'KP', dial: '+850', flag: '🇰🇵' },
    { name: 'North Macedonia', code: 'MK', dial: '+389', flag: '🇲🇰' },
    { name: 'Norway', code: 'NO', dial: '+47', flag: '🇳🇴' },
    { name: 'Oman', code: 'OM', dial: '+968', flag: '🇴🇲' },
    { name: 'Pakistan', code: 'PK', dial: '+92', flag: '🇵🇰' },
    { name: 'Palestine', code: 'PS', dial: '+970', flag: '🇵🇸' },
    { name: 'Panama', code: 'PA', dial: '+507', flag: '🇵🇦' },
    { name: 'Paraguay', code: 'PY', dial: '+595', flag: '🇵🇾' },
    { name: 'Peru', code: 'PE', dial: '+51', flag: '🇵🇪' },
    { name: 'Philippines', code: 'PH', dial: '+63', flag: '🇵🇭' },
    { name: 'Poland', code: 'PL', dial: '+48', flag: '🇵🇱' },
    { name: 'Portugal', code: 'PT', dial: '+351', flag: '🇵🇹' },
    { name: 'Qatar', code: 'QA', dial: '+974', flag: '🇶🇦' },
    { name: 'Romania', code: 'RO', dial: '+40', flag: '🇷🇴' },
    { name: 'Russia', code: 'RU', dial: '+7', flag: '🇷🇺' },
    { name: 'Rwanda', code: 'RW', dial: '+250', flag: '🇷🇼' },
    { name: 'Saudi Arabia', code: 'SA', dial: '+966', flag: '🇸🇦' },
    { name: 'Senegal', code: 'SN', dial: '+221', flag: '🇸🇳' },
    { name: 'Serbia', code: 'RS', dial: '+381', flag: '🇷🇸' },
    { name: 'Singapore', code: 'SG', dial: '+65', flag: '🇸🇬' },
    { name: 'Slovakia', code: 'SK', dial: '+421', flag: '🇸🇰' },
    { name: 'Slovenia', code: 'SI', dial: '+386', flag: '🇸🇮' },
    { name: 'Somalia', code: 'SO', dial: '+252', flag: '🇸🇴' },
    { name: 'South Africa', code: 'ZA', dial: '+27', flag: '🇿🇦' },
    { name: 'South Korea', code: 'KR', dial: '+82', flag: '🇰🇷' },
    { name: 'Spain', code: 'ES', dial: '+34', flag: '🇪🇸' },
    { name: 'Sri Lanka', code: 'LK', dial: '+94', flag: '🇱🇰' },
    { name: 'Sudan', code: 'SD', dial: '+249', flag: '🇸🇩' },
    { name: 'Sweden', code: 'SE', dial: '+46', flag: '🇸🇪' },
    { name: 'Switzerland', code: 'CH', dial: '+41', flag: '🇨🇭' },
    { name: 'Syria', code: 'SY', dial: '+963', flag: '🇸🇾' },
    { name: 'Taiwan', code: 'TW', dial: '+886', flag: '🇹🇼' },
    { name: 'Tajikistan', code: 'TJ', dial: '+992', flag: '🇹🇯' },
    { name: 'Tanzania', code: 'TZ', dial: '+255', flag: '🇹🇿' },
    { name: 'Thailand', code: 'TH', dial: '+66', flag: '🇹🇭' },
    { name: 'Tunisia', code: 'TN', dial: '+216', flag: '🇹🇳' },
    { name: 'Turkey', code: 'TR', dial: '+90', flag: '🇹🇷' },
    { name: 'Turkmenistan', code: 'TM', dial: '+993', flag: '🇹🇲' },
    { name: 'Uganda', code: 'UG', dial: '+256', flag: '🇺🇬' },
    { name: 'Ukraine', code: 'UA', dial: '+380', flag: '🇺🇦' },
    { name: 'United Arab Emirates', code: 'AE', dial: '+971', flag: '🇦🇪' },
    { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
    { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
    { name: 'Uruguay', code: 'UY', dial: '+598', flag: '🇺🇾' },
    { name: 'Uzbekistan', code: 'UZ', dial: '+998', flag: '🇺🇿' },
    { name: 'Venezuela', code: 'VE', dial: '+58', flag: '🇻🇪' },
    { name: 'Vietnam', code: 'VN', dial: '+84', flag: '🇻🇳' },
    { name: 'Yemen', code: 'YE', dial: '+967', flag: '🇾🇪' },
    { name: 'Zambia', code: 'ZM', dial: '+260', flag: '🇿🇲' },
    { name: 'Zimbabwe', code: 'ZW', dial: '+263', flag: '🇿🇼' },
]

export default function CompleteProfile() {
    const navigate = useNavigate()
    const { user, refreshUser } = useAuth()
    const { toast } = useToast()
    const [name, setName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')   // local part without dial code
    const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [detecting, setDetecting] = useState(true)

    // Auto-detect country via IP on mount
    useEffect(() => {
        const detect = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/')
                const data = await res.json()
                if (data.country_code) {
                    const found = COUNTRIES.find(c => c.code === data.country_code)
                    if (found) setSelectedCountry(found)
                }
            } catch {
                // silently ignore; user can pick manually
            } finally {
                setDetecting(false)
            }
        }
        detect()
    }, [])

    useEffect(() => {
        if (user) {
            setName(user.name || '')
        }
        if (user?.isProfileComplete) {
            navigate('/dashboard/home')
        }
    }, [user, navigate])

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const found = COUNTRIES.find(c => c.code === e.target.value)
        setSelectedCountry(found || null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!name || !phoneNumber || !selectedCountry) {
            setError('Please fill in all fields')
            return
        }

        const fullPhone = `${selectedCountry.dial}${phoneNumber.replace(/^0+/, '')}`

        setLoading(true)
        try {
            await updateUserProfile({ name, phone: fullPhone, country: selectedCountry.name })
            refreshUser()
            toast('Profile completed successfully!', 'success')
            navigate('/dashboard/home')
        } catch (err: any) {
            setError(err.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-left-panel">
                <img
                    src="/sigin.png"
                    alt="Complete Profile"
                    className="login-image"
                />
            </div>

            <div className="login-right-panel">
                <div className="login-form-container">
                    <div className="login-header">
                        <h2 className="login-title">Complete your profile</h2>
                        <p className="login-subtitle">We need a few more details before you can access the dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full name</label>
                            <input
                                type="text"
                                placeholder="E.g John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Country</label>
                            <select
                                value={selectedCountry?.code || ''}
                                onChange={handleCountryChange}
                                className="form-input"
                                required
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="" disabled>
                                    {detecting ? 'Detecting your country…' : 'Select your country'}
                                </option>
                                {COUNTRIES.map(c => (
                                    <option key={c.code} value={c.code}>
                                        {c.flag} {c.name} ({c.dial})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone number</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: '#111118',
                                    border: '1px solid #1C1C2C',
                                    borderRadius: '12px',
                                    padding: '0 12px',
                                    height: '52px',
                                    minWidth: '88px',
                                    fontSize: '15px',
                                    color: '#ffffff',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                }}>
                                    {selectedCountry
                                        ? `${selectedCountry.flag} ${selectedCountry.dial}`
                                        : '🌍 +?'}
                                </div>
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="form-input"
                                    required
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>

                        {error && <div className="login-error-message" style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                        <button
                            type="submit"
                            className="signin-btn"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Complete Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
