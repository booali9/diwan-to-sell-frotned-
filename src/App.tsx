import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, ChevronDown, Search } from 'lucide-react'
import { type Country, COUNTRIES } from './pages/SignUp'
import './styles/login.css'
import { useAuth } from './context/AuthContext'
import SignUp from './pages/SignUp'
import DepositCrypto from './pages/dashboard/DepositCrypto'
import WithdrawCrypto from './pages/dashboard/WithdrawCrypto'
import BuySellCrypto from './pages/dashboard/BuySellCrypto'
import Market from './pages/dashboard/Market'
import Trade from './pages/dashboard/Trade'
import Campaign from './pages/dashboard/Campaign'
import ForgotPassword from './pages/ForgotPassword'
import OTPVerification from './pages/OTPVerification'
import SetNewPassword from './pages/SetNewPassword'
import PasswordResetSuccess from './pages/PasswordResetSuccess'
import ProfileOverview from './pages/dashboard/ProfileOverview'
import FuturesCopy from './pages/dashboard/FuturesCopy'
import Futures from './pages/dashboard/Futures'
import Notifications from './pages/dashboard/Notifications'
import Assets from './pages/dashboard/Assets'
import Settings from './pages/dashboard/Settings'
import KYCVerification from './pages/dashboard/KYCVerification'
import Academy from './pages/dashboard/Academy'
import History from './pages/dashboard/History'
import Home from './pages/dashboard/Home'
import SpotGrid from './pages/dashboard/SpotGrid'
import BotOrder from './pages/dashboard/BotOrder'
import PnLAnalysis from './pages/dashboard/PnLAnalysis'
import StrategyPlaza from './pages/dashboard/StrategyPlaza'
import AdvanceTrade from './pages/dashboard/AdvanceTrade'
import Staking from './pages/dashboard/Staking'
import Earn from './pages/dashboard/Earn'
import TransferCrypto from './pages/dashboard/TransferCrypto'

// Informational Pages
import TermsOfUse from './pages/info/TermsOfUse'
import PrivacyPolicy from './pages/info/PrivacyPolicy'
import CookiePolicy from './pages/info/CookiePolicy'
import Disclaimer from './pages/info/Disclaimer'
import SupportPolicy from './pages/info/SupportPolicy'
import AboutUs from './pages/info/AboutUs'
import Fees from './pages/info/Fees'
import ClerkAuth from './pages/ClerkAuth'
import { loginUser, verifyOTP, resendOTP, verifyResetOTP, forgotPassword as forgotPasswordApi } from './services/userService'
import { useToast } from './context/ToastContext'


import CompleteProfile from './pages/dashboard/CompleteProfile'
import ProfileGuard from './components/ProfileGuard'

// Protected Route Wrapper with Profile Completion Check
function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  return (
    <ProfileGuard>
      {children}
    </ProfileGuard>
  )
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Phone country picker state (sign-in)
  const [signinSelectedCountry, setSigninSelectedCountry] = useState<Country>(
    COUNTRIES.find(c => c.iso === 'US') || COUNTRIES[0]
  )
  const [signinDropdownOpen, setSigninDropdownOpen] = useState(false)
  const [signinCountrySearch, setSigninCountrySearch] = useState('')
  const signinDropdownRef = useRef<HTMLDivElement>(null)

  // Password reset flow state
  const [resetEmail, setResetEmail] = useState('')
  const [resetToken, setResetToken] = useState('')

  // Auto-detect country by IP for sign-in phone picker
  useEffect(() => {
    const applyCountry = (isoCode: string) => {
      const detected = COUNTRIES.find(c => c.iso === isoCode.toUpperCase())
      if (detected) setSigninSelectedCountry(detected)
    }
    fetch('https://api.country.is/')
      .then(res => res.json())
      .then(data => {
        if (data.country) applyCountry(data.country)
        else throw new Error('country.is failed')
      })
      .catch(() =>
        fetch('https://freeipapi.com/api/json')
          .then(res => res.json())
          .then(data => {
            if (data.countryCode) applyCountry(data.countryCode)
            else throw new Error('freeipapi failed')
          })
          .catch(() => { /* all failed, keep US default */ })
      )
  }, [])

  // Close sign-in country dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (signinDropdownRef.current && !signinDropdownRef.current.contains(e.target as Node)) {
        setSigninDropdownOpen(false)
        setSigninCountrySearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredSigninCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(signinCountrySearch.toLowerCase()) ||
    c.dialCode.includes(signinCountrySearch)
  )

  const handleSignIn = async () => {
    setError('')

    // Validation
    if (activeTab === 'email' && !email) {
      setError('Please enter your email address')
      return
    }
    if (activeTab === 'phone' && !phone) {
      setError('Please enter your phone number')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    try {
      const emailOrPhone = activeTab === 'email' ? email : `${signinSelectedCountry.dialCode}${phone}`
      await loginUser(emailOrPhone, password, activeTab === 'email')
      login()
      toast('Login successful!', 'success')
      navigate('/dashboard/trade')
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSignIn()
  }

  // Navigation handlers
  const goToSignIn = () => navigate('/signin')
  const goToSignUp = () => navigate('/signup')
  const goToForgotPassword = () => navigate('/forgot-password')
  const goToOTP = (userEmail: string) => {
    setResetEmail(userEmail)
    navigate('/otp-verification')
  }
  const goToNewPassword = async (otp: string) => {
    // Call verifyResetOTP API - this returns a resetToken
    const data = await verifyResetOTP(resetEmail, otp)
    setResetToken(data.resetToken)
    navigate('/set-new-password')
  }
  const goToSuccess = () => navigate('/success')

  // Registration email verification handlers
  const handleVerifyRegistration = async (otp: string) => {
    const regState = location.state as { email?: string } | null
    const regEmail = regState?.email || email
    await verifyOTP(regEmail, otp)
    login() // Now fully logged in
    toast('Email verified successfully!', 'success')
    navigate('/dashboard/trade')
  }
  const handleResendRegistration = async () => {
    const regState = location.state as { email?: string } | null
    const regEmail = regState?.email || email
    await resendOTP(regEmail)
    toast('Verification code resent', 'success')
  }
  const handleResendReset = async () => {
    await forgotPasswordApi(resetEmail)
    toast('Reset code resent', 'success')
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Auth routes */}
      <Route path="/signin" element={
        <div className="login-container">
          <div className="login-left-panel">
            <img
              src="/sigin.png"
              alt="Diwanfinance Sign In"
              className="login-image"
            />
          </div>

          <div className="login-right-panel">
            <div className="login-form-container">
              <div className="login-header">
                <h2 className="login-title">Welcome back</h2>
                <p className="login-subtitle">Enter your personal data to create your account</p>
              </div>

              <form onSubmit={handleSignInSubmit}>

              <div className="tabs">
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className={`tab-btn ${activeTab === 'email' ? 'active' : 'inactive'}`}
                >
                  Email address
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('phone')}
                  className={`tab-btn ${activeTab === 'phone' ? 'active' : 'inactive'}`}
                >
                  Phone number
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {activeTab === 'email' ? 'Email address' : 'Phone number'}
                </label>
                {activeTab === 'email' ? (
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="E.g John@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="phone-input-wrapper">
                    {/* Country Code Dropdown */}
                    <div className="country-code-dropdown" ref={signinDropdownRef}>
                      <button
                        type="button"
                        className="country-code-trigger"
                        onClick={() => { setSigninDropdownOpen(prev => !prev); setSigninCountrySearch('') }}
                      >
                        <span className="country-flag">{signinSelectedCountry.flag}</span>
                        <span className="country-dial">{signinSelectedCountry.dialCode}</span>
                        <ChevronDown size={14} className={`dropdown-chevron${signinDropdownOpen ? ' open' : ''}`} />
                      </button>
                      {signinDropdownOpen && (
                        <div className="country-dropdown-menu">
                          <div className="country-search-wrapper">
                            <Search size={14} className="country-search-icon" />
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={signinCountrySearch}
                              onChange={e => setSigninCountrySearch(e.target.value)}
                              className="country-search-input"
                              autoFocus
                            />
                          </div>
                          <div className="country-list">
                            {filteredSigninCountries.map(country => (
                              <button
                                key={country.iso}
                                type="button"
                                className={`country-option${signinSelectedCountry.iso === country.iso ? ' selected' : ''}`}
                                onClick={() => {
                                  setSigninSelectedCountry(country)
                                  setSigninDropdownOpen(false)
                                  setSigninCountrySearch('')
                                }}
                              >
                                <span className="country-flag">{country.flag}</span>
                                <span className="country-name">{country.name}</span>
                                <span className="country-dial-muted">{country.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Phone number input */}
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="form-input phone-number-input"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="forgot-password">
                <button type="button" className="forgot-btn" onClick={goToForgotPassword}>Forgot password?</button>
              </div>

              {error && <div className="login-error-message" style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

              <button
                type="submit"
                className="signin-btn"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              </form>

              <p className="signup-link">
                Don't have an account?
                <button type="button" className="signup-btn" onClick={goToSignUp}>Sign up</button>
              </p>
            </div>
          </div>
        </div>
      } />

      <Route path="/signup" element={<SignUp onSwitchToSignIn={goToSignIn} />} />
      <Route path="/forgot-password" element={<ForgotPassword onBackToLogin={goToSignIn} onSendCode={goToOTP} />} />
      <Route path="/otp-verification" element={<OTPVerification email={resetEmail} mode="reset" onVerify={goToNewPassword} onResend={handleResendReset} />} />
      <Route path="/set-new-password" element={<SetNewPassword email={resetEmail} resetToken={resetToken} onConfirm={goToSuccess} />} />
      <Route path="/verify-email" element={
        <OTPVerification
          email={(location.state as any)?.email || email}
          mode="register"
          onVerify={handleVerifyRegistration}
          onResend={handleResendRegistration}
        />
      } />
      <Route path="/success" element={<PasswordResetSuccess onSignIn={goToSignIn} />} />
      <Route path="/social-auth" element={<ClerkAuth />} />

      {/* Public informational pages */}
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/support-policy" element={<SupportPolicy />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/fees" element={<Fees />} />

      {/* Public home page */}
      <Route path="/" element={<Home />} />

      {/* Profile completion route */}
      <Route path="/complete-profile" element={<CompleteProfile />} />

      {/* Dashboard routes */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/home" replace />} />
      <Route path="/home" element={<ProtectedDashboard><Home /></ProtectedDashboard>} />
      <Route path="/dashboard/home" element={<ProtectedDashboard><Home /></ProtectedDashboard>} />
      <Route path="/dashboard/market" element={<ProtectedDashboard><Market /></ProtectedDashboard>} />
      <Route path="/dashboard/profile" element={<ProtectedDashboard><ProfileOverview /></ProtectedDashboard>} />
      <Route path="/dashboard/trade" element={<ProtectedDashboard><Trade /></ProtectedDashboard>} />
      <Route path="/dashboard/deposit" element={<ProtectedDashboard><DepositCrypto /></ProtectedDashboard>} />
      <Route path="/dashboard/transfer" element={<ProtectedDashboard><TransferCrypto /></ProtectedDashboard>} />
      <Route path="/dashboard/withdraw" element={<ProtectedDashboard><WithdrawCrypto /></ProtectedDashboard>} />
      <Route path="/dashboard/futures" element={<ProtectedDashboard><Futures /></ProtectedDashboard>} />
      <Route path="/dashboard/futures-copy" element={<ProtectedDashboard><FuturesCopy /></ProtectedDashboard>} />
      <Route path="/dashboard/notifications" element={<ProtectedDashboard><Notifications /></ProtectedDashboard>} />
      <Route path="/dashboard/assets" element={<ProtectedDashboard><Assets /></ProtectedDashboard>} />
      <Route path="/dashboard/settings" element={<ProtectedDashboard><Settings /></ProtectedDashboard>} />
      <Route path="/dashboard/campaign" element={<ProtectedDashboard><Campaign /></ProtectedDashboard>} />
      <Route path="/dashboard/buy" element={<ProtectedDashboard><BuySellCrypto defaultTab="buy" /></ProtectedDashboard>} />
      <Route path="/dashboard/sell" element={<ProtectedDashboard><BuySellCrypto defaultTab="sell" /></ProtectedDashboard>} />
      <Route path="/dashboard/kyc" element={<ProtectedDashboard><KYCVerification /></ProtectedDashboard>} />
      <Route path="/dashboard/academy" element={<ProtectedDashboard><Academy /></ProtectedDashboard>} />
      <Route path="/dashboard/history" element={<ProtectedDashboard><History /></ProtectedDashboard>} />
      <Route path="/dashboard/spot-grid" element={<ProtectedDashboard><SpotGrid /></ProtectedDashboard>} />
      <Route path="/dashboard/bot-order" element={<ProtectedDashboard><BotOrder /></ProtectedDashboard>} />
      <Route path="/dashboard/pnl-analysis" element={<ProtectedDashboard><PnLAnalysis /></ProtectedDashboard>} />
      <Route path="/dashboard/strategy-plaza" element={<ProtectedDashboard><StrategyPlaza /></ProtectedDashboard>} />
      <Route path="/dashboard/advance-trade" element={<ProtectedDashboard><AdvanceTrade /></ProtectedDashboard>} />
      <Route path="/dashboard/staking" element={<ProtectedDashboard><Staking /></ProtectedDashboard>} />
      <Route path="/dashboard/earn" element={<ProtectedDashboard><Earn /></ProtectedDashboard>} />

      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  )
}

export default App
