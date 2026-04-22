import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, User, Settings as SettingsIcon, LogOut, Menu, X, ShieldCheck, BadgeCheck, Copy, TrendingUp } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getBalance } from '../../services/walletService'
import { useToast } from '../../context/ToastContext'

interface HeaderProps {
  activePage: string
  hideMobile?: boolean
}

function Header({ activePage, hideMobile = false }: HeaderProps) {
  const navigate = useNavigate()
  const { isLoggedIn, logout } = useAuth()
  const { toast } = useToast()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isFuturesDropdownOpen, setIsFuturesDropdownOpen] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const futuresDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (futuresDropdownRef.current && !futuresDropdownRef.current.contains(event.target as Node)) {
        setIsFuturesDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      const fetchBalance = async () => {
        try {
          const data = await getBalance()
          setBalance(data.balance)
        } catch (error) {
          console.error('Header balance fetch error:', error)
        }
      }
      fetchBalance()
      // Optional: interval to refresh balance
      const interval = setInterval(fetchBalance, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn])

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
    setIsMobileMenuOpen(false)
    toast('Logged out successfully', 'success')
    navigate('/')
  }

  return (
    <header className={`header ${hideMobile ? 'hide-on-mobile' : ''}`}>
      <div className="header-left">
        <div className="logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="Diwanfinance" className="logo-img" />
        </div>

        <nav className="nav-menu desktop-only">
          <div
            className={`nav-item dropdown ${activePage === 'deposit' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/deposit')}
            style={{ cursor: 'pointer' }}
          >
            <span>Deposit crypto</span>
            <ChevronDown size={16} />
          </div>
          <div
            className={`nav-item dropdown ${activePage === 'withdraw' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/withdraw')}
            style={{ cursor: 'pointer' }}
          >
            <span>Withdraw crypto</span>
            <ChevronDown size={16} />
          </div>
          <div
            className={`nav-item dropdown ${activePage === 'transfer' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/transfer')}
            style={{ cursor: 'pointer' }}
          >
            <span>Transfer</span>
            <ChevronDown size={16} />
          </div>
          <div
            className={`nav-item dropdown ${activePage === 'market' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/market?view=list&tab=spot')}
            style={{ cursor: 'pointer' }}
          >
            <span>Market</span>
            <ChevronDown size={16} />
          </div>
          <div
            className={`nav-item dropdown ${activePage === 'trade' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/trade')}
            style={{ cursor: 'pointer' }}
          >
            <span>Trade</span>
            <ChevronDown size={16} />
          </div>
          <div className="nav-item-dropdown-container" ref={futuresDropdownRef}>
            <div
              className={`nav-item dropdown ${activePage === 'futures' ? 'active' : ''}`}
              onClick={() => setIsFuturesDropdownOpen(!isFuturesDropdownOpen)}
              style={{ cursor: 'pointer' }}
            >
              <span>Futures</span>
              <ChevronDown size={16} style={{ transform: isFuturesDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {isFuturesDropdownOpen && (
              <div className="nav-dropdown-menu">
                <div className="nav-dropdown-item" onClick={() => { navigate('/dashboard/futures'); setIsFuturesDropdownOpen(false); }}>
                  <TrendingUp size={18} />
                  <span>Futures Trading</span>
                </div>
                <div className="nav-dropdown-item" onClick={() => { navigate('/dashboard/futures-copy'); setIsFuturesDropdownOpen(false); }}>
                  <Copy size={18} />
                  <span>Copy Trade</span>
                </div>
              </div>
            )}
          </div>
          <Link to="/dashboard/campaign" className="nav-link">Campaign</Link>
          <div
            className={`nav-item dropdown ${activePage === 'academy' || activePage === 'staking' || activePage === 'earn' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/staking')}
            style={{ cursor: 'pointer' }}
          >
            <span>Earn</span>
            <ChevronDown size={16} />
          </div>
          <div
            className={`nav-item dropdown ${activePage === 'academy' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/academy')}
            style={{ cursor: 'pointer' }}
          >
            <span>Academy</span>
            <ChevronDown size={16} />
          </div>
        </nav>
      </div>

      <div className="header-right">
        {isLoggedIn ? (
          <>
            <div className="header-balance-btn desktop-only" onClick={() => navigate('/dashboard/assets')} style={{ cursor: 'pointer' }}>
              <div className="balance-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <span className="balance-amount">${balance !== null ? balance.toFixed(2) : '...'}</span>
              <ChevronDown size={14} />
            </div>

            <button className="header-icon-btn">
              <Search size={20} />
            </button>


            <div className="profile-container" ref={dropdownRef}>
              <div
                className={`profile-btn ${activePage === 'profile' || activePage === 'settings' ? 'active' : ''}`}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ cursor: 'pointer' }}
              >
                <span>B</span>
                <ChevronDown className="desktop-only" size={14} style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {isProfileOpen && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-user-info">
                    <div className="user-avatar-small">B</div>
                    <div className="user-details">
                      <div className="user-id">ID: 88463259</div>
                      <div className="user-email">ajames@gmail.com</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item" onClick={() => { navigate('/dashboard/profile'); setIsProfileOpen(false); }}>
                    <User size={18} />
                    <span>Profile</span>
                  </div>
                  <div className="dropdown-item" onClick={() => { navigate('/dashboard/settings'); setIsProfileOpen(false); }}>
                    <SettingsIcon size={18} />
                    <span>Settings</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="header-icon-btn">
              <Search size={20} />
            </button>
            <button className="auth-btn signin-header-btn" onClick={() => navigate('/signin')}>
              Sign In
            </button>
            <button className="auth-btn signup-header-btn desktop-only" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </>
        )}

        <button className="header-icon-btn mobile-only" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-content">
            {isLoggedIn ? (
              <>
                {/* User Header Section */}
                <div className="md-user-header">
                  <div className="md-user-info-row">
                    <div className="md-avatar-wrapper">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=James" alt="James Howard" className="md-avatar" />
                      <div className="md-badge">
                        <BadgeCheck size={14} className="text-white fill-emerald-500" />
                      </div>
                    </div>
                    <div className="md-user-meta">
                      <h3 className="md-user-name">James Howard</h3>
                      <p className="md-user-email">ajames@gmail.com</p>
                    </div>
                    <div className="md-verified-chip">
                      <ShieldCheck size={14} />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>

                <div className="md-divider"></div>

                {/* Navigation Menu */}
                <nav className="md-menu-list">
                  <div className="md-menu-section-title">Navigation</div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/market'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                    </div>
                    <span>Market</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/trade'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18"></path>
                        <path d="m19 9-5 5-4-4-3 3"></path>
                      </svg>
                    </div>
                    <span>Trade</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/futures'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                        <path d="M3 9h18"></path>
                        <path d="M9 21V9"></path>
                      </svg>
                    </div>
                    <span>Futures</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/deposit'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20"></path>
                        <path d="m17 7-5-5-5 5"></path>
                        <rect x="3" y="17" width="18" height="4" rx="1"></rect>
                      </svg>
                    </div>
                    <span>Deposit Crypto</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/withdraw'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22V2"></path>
                        <path d="m7 17 5 5 5-5"></path>
                        <rect x="3" y="3" width="18" height="4" rx="1"></rect>
                      </svg>
                    </div>
                    <span>Withdraw Crypto</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/assets'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                        <line x1="2" y1="10" x2="22" y2="10"></line>
                      </svg>
                    </div>
                    <span>Assets</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/transfer'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 3h5v5"></path>
                        <path d="M8 21H3v-5"></path>
                        <path d="M21 3L14 10"></path>
                        <path d="M3 21l7-7"></path>
                      </svg>
                    </div>
                    <span>Transfer</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/campaign'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="m4.93 4.93 1.41 1.41"></path>
                        <path d="m17.66 17.66 1.41 1.41"></path>
                        <path d="M2 12h2"></path>
                        <path d="M20 12h2"></path>
                        <path d="m6.34 17.66-1.41 1.41"></path>
                        <path d="m19.07 4.93-1.41 1.41"></path>
                      </svg>
                    </div>
                    <span>Campaign</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/academy'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                    </div>
                    <span>Academy</span>
                  </div>
                </nav>

                <div className="md-divider"></div>

                {/* Account Menu */}
                <nav className="md-menu-list">
                  <div className="md-menu-section-title">Account</div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/profile'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box"><User size={20} /></div>
                    <span>Profile</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/kyc'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box"><ShieldCheck size={20} /></div>
                    <span>Verification</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/settings'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box"><SettingsIcon size={20} /></div>
                    <span>Settings</span>
                  </div>
                </nav>

                <div className="md-footer mt-auto">
                  <div className="md-menu-item logout" onClick={handleLogout}>
                    <div className="md-icon-box"><LogOut size={20} /></div>
                    <span>Logout</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Guest Mobile Menu */}
                <div className="md-guest-header">
                  <h3 className="md-guest-title">Welcome to Diwanfinance</h3>
                  <p className="md-guest-subtitle">Sign in to start trading</p>
                </div>

                <div className="md-auth-buttons">
                  <button className="md-auth-btn primary" onClick={() => { navigate('/signin'); setIsMobileMenuOpen(false); }}>
                    Sign In
                  </button>
                  <button className="md-auth-btn secondary" onClick={() => { navigate('/signup'); setIsMobileMenuOpen(false); }}>
                    Create Account
                  </button>
                </div>

                <div className="md-divider"></div>

                <nav className="md-menu-list">
                  <div className="md-menu-section-title">Explore</div>
                  <div className="md-menu-item" onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    <span>Home</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/academy'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                    </div>
                    <span>Academy</span>
                  </div>
                  <div className="md-menu-item" onClick={() => { navigate('/dashboard/campaign'); setIsMobileMenuOpen(false); }}>
                    <div className="md-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"></path>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                      </svg>
                    </div>
                    <span>Campaign</span>
                  </div>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
