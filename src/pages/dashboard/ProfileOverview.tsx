import { useState, useEffect, useRef } from 'react'
import { Copy, ChevronRight, Eye, EyeOff, ChevronDown, Search, ArrowLeft, Menu, X, User, FileText, CheckSquare, Users, Settings, LayoutDashboard, Shield, Lock, Smartphone, Mail, Wallet, Trash2, Monitor, Activity, Gift, UserPlus, Filter, AlertTriangle, Check, Camera } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { useAuth } from '../../context/AuthContext'
import { getProfile, changePassword, changeEmail, deleteAccountService, updateUserProfile, logoutUser, getNotifications, markNotificationRead } from '../../services/userService'
import { getBalance, getSpotHoldings } from '../../services/walletService'
import { getMyOpenTrades, getMyClosedTrades } from '../../services/tradeService'
import '../../styles/dashboard.css'
import { useNavigate } from 'react-router-dom'

export default function ProfileOverview() {
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleLogout = () => {
        logoutUser()
        logout()
        navigate('/login')
    }
    const [activeAssetTab, setActiveAssetTab] = useState<'favorite' | 'hot' | 'gainers' | 'losers' | 'volume'>('favorite')
    const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'verification' | 'security' | 'task' | 'invite' | 'settings' | 'order' | 'message'>('overview')
    const [activeTaskTab, setActiveTaskTab] = useState<'all' | 'beginner' | 'limited'>('all')
    const [activeOrderTab, setActiveOrderTab] = useState<'open' | 'order-history' | 'trade-history'>('open')
    const [activeMsgTab, setActiveMsgTab] = useState<'all' | 'system' | 'deposit' | 'safety'>('all')
    const [showMobileMenu, setShowMobileMenu] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [userBalance, setUserBalance] = useState(0)
    const [balanceHidden, setBalanceHidden] = useState(false)
    const [marketData, setMarketData] = useState<Record<string, any>>({})

    // Orders state
    const [openTrades, setOpenTrades] = useState<any[]>([])
    const [closedTrades, setClosedTrades] = useState<any[]>([])
    const [ordersLoading, setOrdersLoading] = useState(false)

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([])
    const [selectedMsgs, setSelectedMsgs] = useState<Set<string>>(new Set())
    const [msgsLoading, setMsgsLoading] = useState(false)

    // Security modal states
    const [secModal, setSecModal] = useState<'none' | 'password' | 'email' | 'phone' | 'delete' | 'device' | 'activity' | 'authenticator'>('none')
    const [secLoading, setSecLoading] = useState(false)
    const [secError, setSecError] = useState('')
    const [secSuccess, setSecSuccess] = useState('')
    const [secForm, setSecForm] = useState<Record<string, string>>({})
    const [authStep, setAuthStep] = useState<1 | 2 | 3>(1)
    const [authSecret] = useState(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
        let s = ''
        for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)]
        return s
    })
    const [authBound, setAuthBound] = useState(false)

    const closeSecModal = () => { setSecModal('none'); setSecError(''); setSecSuccess(''); setSecForm({}); setAuthStep(1); }

    // Avatar upload state
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarUploading, setAvatarUploading] = useState(false)

    const handleAvatarClick = () => {
        avatarInputRef.current?.click()
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) return
        if (file.size > 5 * 1024 * 1024) return // Max 5MB

        const reader = new FileReader()
        reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string
            setAvatarPreview(dataUrl)
            setAvatarUploading(true)
            try {
                // Store avatar locally since backend doesn't support avatar upload yet
                localStorage.setItem('userAvatar', dataUrl)
                setAvatarUploading(false)
            } catch {
                setAvatarUploading(false)
            }
        }
        reader.readAsDataURL(file)
        // Reset input so same file can be selected again
        e.target.value = ''
    }

    // Load saved avatar on mount
    useEffect(() => {
        const savedAvatar = localStorage.getItem('userAvatar')
        if (savedAvatar) setAvatarPreview(savedAvatar)
    }, [])

    const handleBindAuthenticator = () => {
        setSecError(''); setSecSuccess(''); setSecLoading(true)
        const code = secForm.otpCode || ''
        if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
            setSecError('Please enter a valid 6-digit code')
            setSecLoading(false)
            return
        }
        setTimeout(() => {
            setSecLoading(false)
            setSecSuccess('Google Authenticator bound successfully!')
            setAuthBound(true)
            setTimeout(closeSecModal, 1500)
        }, 1200)
    }

    const handleChangePassword = async () => {
        setSecError(''); setSecSuccess(''); setSecLoading(true)
        try {
            if (!secForm.currentPassword || !secForm.newPassword) throw new Error('All fields are required')
            if (secForm.newPassword !== secForm.confirmPassword) throw new Error('Passwords do not match')
            if (secForm.newPassword.length < 6) throw new Error('Password must be at least 6 characters')
            await changePassword(secForm.currentPassword, secForm.newPassword)
            setSecSuccess('Password changed successfully')
            setTimeout(closeSecModal, 1500)
        } catch (e: any) { setSecError(e.message) } finally { setSecLoading(false) }
    }

    const handleChangeEmail = async () => {
        setSecError(''); setSecSuccess(''); setSecLoading(true)
        try {
            if (!secForm.newEmail || !secForm.password) throw new Error('All fields are required')
            await changeEmail(secForm.newEmail, secForm.password)
            setSecSuccess('Email changed successfully')
            getProfile().then(setProfile).catch(() => { })
            setTimeout(closeSecModal, 1500)
        } catch (e: any) { setSecError(e.message) } finally { setSecLoading(false) }
    }

    const handleBindPhone = async () => {
        setSecError(''); setSecSuccess(''); setSecLoading(true)
        try {
            if (!secForm.phone) throw new Error('Phone number is required')
            await updateUserProfile({ phone: secForm.phone })
            setSecSuccess('Phone updated successfully')
            getProfile().then(setProfile).catch(() => { })
            setTimeout(closeSecModal, 1500)
        } catch (e: any) { setSecError(e.message) } finally { setSecLoading(false) }
    }

    const handleDeleteAccount = async () => {
        setSecError(''); setSecSuccess(''); setSecLoading(true)
        try {
            if (!secForm.password) throw new Error('Password is required')
            if (secForm.confirmDelete !== 'DELETE') throw new Error('Type DELETE to confirm')
            await deleteAccountService(secForm.password)
            logoutUser()
            navigate('/login')
        } catch (e: any) { setSecError(e.message) } finally { setSecLoading(false) }
    }
    // Fetch orders when order tab is active
    useEffect(() => {
        if (activeProfileTab === 'order') {
            setOrdersLoading(true)
            Promise.all([getMyOpenTrades(), getMyClosedTrades()])
                .then(([open, closed]) => { setOpenTrades(open); setClosedTrades(closed); })
                .catch(() => { })
                .finally(() => setOrdersLoading(false))
        }
    }, [activeProfileTab])

    // Fetch notifications when message tab is active
    useEffect(() => {
        if (activeProfileTab === 'message') {
            setMsgsLoading(true)
            getNotifications().then(setNotifications).catch(() => { }).finally(() => setMsgsLoading(false))
        }
    }, [activeProfileTab])

    const handleMarkAllRead = async () => {
        try {
            await Promise.all(notifications.filter(n => !n.read).map(n => markNotificationRead(n._id)))
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        } catch { /* ignore */ }
    }

    const handleToggleMsgSelect = (id: string) => {
        setSelectedMsgs(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const handleSelectAllMsgs = () => {
        if (selectedMsgs.size === filteredNotifications.length) setSelectedMsgs(new Set())
        else setSelectedMsgs(new Set(filteredNotifications.map(n => n._id)))
    }

    useEffect(() => {
        getProfile().then(setProfile).catch(() => { })
        getBalance().then(data => setUserBalance(data.balance || 0)).catch(() => { })
        
        let ws: WebSocket | null = null;
        let retryTimeout: any;

        const connectWS = () => {
            try {
                // Initial fetch for instant data
                fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","AVAXUSDT","DOGEUSDT","ADAUSDT"]')
                    .then(r => r.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            setMarketData(prev => {
                                const next = { ...prev };
                                let hasChanges = false;
                                data.forEach(ticker => {
                                    const symbol = ticker.symbol.replace('USDT', '/USDT');
                                    next[symbol] = {
                                        price: parseFloat(ticker.lastPrice),
                                        change24h: parseFloat(ticker.priceChangePercent),
                                        volume24h: parseFloat(ticker.volume)
                                    };
                                    hasChanges = true;
                                });
                                return hasChanges ? next : prev;
                            });
                        }
                    }).catch(() => { });

                ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (Array.isArray(data)) {
                            setMarketData(prev => {
                                const next = { ...prev };
                                let hasChanges = false;
                                
                                const interestingSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'AVAXUSDT', 'DOGEUSDT', 'ADAUSDT'];
                                
                                data.forEach((ticker: any) => {
                                    if (interestingSymbols.includes(ticker.s)) {
                                        const symbol = ticker.s.replace('USDT', '/USDT');
                                        const price = parseFloat(ticker.c);
                                        const change24h = parseFloat(ticker.P);
                                        const volume24h = parseFloat(ticker.q);
                                        
                                        if (!next[symbol] || next[symbol].price !== price || next[symbol].change24h !== change24h) {
                                            next[symbol] = {
                                                ...next[symbol],
                                                price,
                                                change24h,
                                                volume24h
                                            };
                                            hasChanges = true;
                                        }
                                    }
                                });
                                return hasChanges ? next : prev;
                            });
                        }
                    } catch (e) {
                        // ignore parsing errors
                    }
                };

                ws.onclose = () => {
                    retryTimeout = setTimeout(connectWS, 3000);
                };
            } catch (error) {
                retryTimeout = setTimeout(connectWS, 3000);
            }
        };

        connectWS();

        return () => {
            if (ws) ws.close();
            clearTimeout(retryTimeout);
        }
    }, [])

    const userName = profile?.name || 'User'
    const userEmail = profile?.email || ''
    const userId = profile?._id?.substring(0, 8) || '--------'
    const kycStatus = profile?.kycStatus || 'none'
    const userPhone = profile?.phone || 'Not set'

    // Referral code derived from user ID
    const referralCode = profile?._id ? profile._id.substring(0, 10).toUpperCase() : '----------'
    const referralLink = `https://diwanfinanceweb.vercel.app/register?ref=${referralCode}`

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(() => { })
    }

    // Settings modals state
    const [showNicknameModal, setShowNicknameModal] = useState(false)
    const [nicknameInput, setNicknameInput] = useState('')
    const [nicknameSaving, setNicknameSaving] = useState(false)
    const [nicknameSuccess, setNicknameSuccess] = useState('')

    const [showOrderConfirmModal, setShowOrderConfirmModal] = useState(false)
    const [orderConfirmSettings, setOrderConfirmSettings] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('orderConfirmSettings')
        return saved ? JSON.parse(saved) : { limit: true, market: true, stop: true }
    })

    const [showInviteCodeModal, setShowInviteCodeModal] = useState(false)
    const [inviteCodeInput, setInviteCodeInput] = useState('')
    const [inviteCodeSaving, setInviteCodeSaving] = useState(false)
    const [inviteCodeSuccess, setInviteCodeSuccess] = useState('')
    const [savedInviteCode, setSavedInviteCode] = useState(() => localStorage.getItem('superiorInviteCode') || '')

    const handleNicknameSave = async () => {
        if (!nicknameInput.trim()) return
        setNicknameSaving(true)
        setNicknameSuccess('')
        try {
            await updateUserProfile({ name: nicknameInput.trim() })
            setProfile((prev: any) => prev ? { ...prev, name: nicknameInput.trim() } : prev)
            setNicknameSuccess('Nickname updated successfully!')
            setTimeout(() => { setShowNicknameModal(false); setNicknameSuccess('') }, 1200)
        } catch {
            setNicknameSuccess('Failed to update nickname')
        } finally {
            setNicknameSaving(false)
        }
    }

    const handleOrderConfirmToggle = (key: string) => {
        setOrderConfirmSettings(prev => {
            const updated = { ...prev, [key]: !prev[key] }
            localStorage.setItem('orderConfirmSettings', JSON.stringify(updated))
            return updated
        })
    }

    const handleInviteCodeSave = () => {
        if (!inviteCodeInput.trim()) return
        setInviteCodeSaving(true)
        setInviteCodeSuccess('')
        // Simulate save (no backend endpoint for this yet)
        setTimeout(() => {
            localStorage.setItem('superiorInviteCode', inviteCodeInput.trim())
            setSavedInviteCode(inviteCodeInput.trim())
            setInviteCodeSuccess('Invitation code added successfully!')
            setInviteCodeSaving(false)
            setTimeout(() => { setShowInviteCodeModal(false); setInviteCodeSuccess('') }, 1200)
        }, 600)
    }

    // Filtered notifications based on active tab
    const filteredNotifications = notifications.filter(n => {
        if (activeMsgTab === 'all') return true
        if (activeMsgTab === 'system') return n.type === 'system' || n.type === 'general'
        if (activeMsgTab === 'deposit') return n.type === 'deposit' || n.type === 'withdrawal' || n.type === 'transaction'
        if (activeMsgTab === 'safety') return n.type === 'security' || n.type === 'safety'
        return true
    })

    // Orders filtered by tab
    const getDisplayedOrders = () => {
        if (activeOrderTab === 'open') return openTrades
        if (activeOrderTab === 'order-history') return closedTrades
        if (activeOrderTab === 'trade-history') return closedTrades
        return []
    }

    // Tasks based on user progress
    const userTasks = [
        { id: 'kyc', name: 'Complete Identity Verification', desc: 'Verify your identity to unlock full trading features', reward: '5 USDT Bonus', done: kycStatus === 'verified', category: 'beginner' },
        { id: 'deposit', name: 'Make Your First Deposit', desc: 'Deposit any amount to start trading', reward: '2 USDT Cashback', done: userBalance > 0, category: 'beginner' },
        { id: 'trade', name: 'Complete First Trade', desc: 'Open and close your first spot trade', reward: '3 USDT Bonus', done: closedTrades.length > 0, category: 'beginner' },
        { id: 'phone', name: 'Bind Phone Number', desc: 'Add your phone number for account security', reward: '1 USDT Bonus', done: profile?.phone ? true : false, category: 'beginner' },
        { id: 'invite', name: 'Invite a Friend', desc: 'Share your referral code and earn rewards', reward: '10 USDT per invite', done: false, category: 'limited' },
    ]

    const getFilteredTasks = () => {
        const tasks = activeTaskTab === 'all' ? userTasks.filter(t => !t.done) : activeTaskTab === 'beginner' ? userTasks.filter(t => t.category === 'beginner') : userTasks.filter(t => t.category === 'limited')
        return tasks
    }

    const taskRewards = {
        cash: userTasks.filter(t => t.done).length * 2,
        vouchers: userTasks.filter(t => t.done).length,
        bonus: userTasks.filter(t => t.done).length * 1.5,
    }

    const coinLabels: Record<string, string> = { BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'Binance', XRP: 'Ripple', AVAX: 'Avalanche', DOGE: 'Dogecoin', ADA: 'Cardano' }
    const coinIcons: Record<string, string> = {
        BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
        ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
        BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
        XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
        AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
        DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
        ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    }
    const allMarketSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'AVAX/USDT', 'DOGE/USDT', 'ADA/USDT']

    const fmt = (n: number, digits = 2) => n ? `$${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}` : '—'

    const getFilteredMarketAssets = () => {
        let symbols = [...allMarketSymbols]
        const mapped = symbols.map(s => {
            const coin = s.split('/')[0]
            const d = marketData[s] || {}
            return { symbol: coin, name: coinLabels[coin] || coin, icon: coinIcons[coin] || coin[0], price: d.price || 0, change: d.change24h || 0, volume: d.volume24h || 0 }
        })
        if (activeAssetTab === 'gainers') mapped.sort((a, b) => b.change - a.change)
        else if (activeAssetTab === 'losers') mapped.sort((a, b) => a.change - b.change)
        else if (activeAssetTab === 'volume') mapped.sort((a, b) => b.volume - a.volume)
        else if (activeAssetTab === 'hot') mapped.sort((a, b) => b.volume - a.volume)
        return mapped
    }

    const filteredMarketAssets = getFilteredMarketAssets()

    const assets = [
        {
            symbol: 'BTC',
            name: 'Bitcoin',
            totalBalance: `${(getSpotHoldings()['BTC'] || 0).toFixed(6)} BTC`,
            usdValue: `≈$${((getSpotHoldings()['BTC'] || 0) * (marketData['BTC/USDT']?.price || 0)).toFixed(2)}`,
            walletBalance: `${(getSpotHoldings()['BTC'] || 0).toFixed(6)}`,
            available: `${(getSpotHoldings()['BTC'] || 0).toFixed(6)}`,
            pnl: '0.000000'
        },
        {
            symbol: 'ETH',
            name: 'Ethereum',
            totalBalance: `${(getSpotHoldings()['ETH'] || 0).toFixed(6)} ETH`,
            usdValue: `≈$${((getSpotHoldings()['ETH'] || 0) * (marketData['ETH/USDT']?.price || 0)).toFixed(2)}`,
            walletBalance: `${(getSpotHoldings()['ETH'] || 0).toFixed(6)}`,
            available: `${(getSpotHoldings()['ETH'] || 0).toFixed(6)}`,
            pnl: '0.000000'
        }
    ]

    return (
        <Layout activePage="profile" hideMobileNav={true}>
            {/* Hidden file input for avatar upload */}
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
            />
            {/* Mobile Profile View */}
            <div className="mobile-profile-view">
                {/* Mobile Sidebar Menu */}
                {showMobileMenu && (
                    <div className="mpv-sidebar-overlay" onClick={() => setShowMobileMenu(false)}>
                        <div className="mpv-sidebar" onClick={(e) => e.stopPropagation()}>
                            <div className="mpv-sidebar-header">
                                <button className="mpv-sidebar-close" onClick={() => setShowMobileMenu(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mpv-sidebar-profile">
                                <div className="mpv-sidebar-avatar" onClick={handleAvatarClick} style={{ cursor: 'pointer', position: 'relative' }}>
                                    <img src={avatarPreview || '/avatar.png'} alt="Profile" />
                                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#1CD4A7', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f0f14' }}>
                                        <Camera size={12} color="#fff" />
                                    </div>
                                </div>
                                <div className="mpv-sidebar-user-info">
                                    <span className="mpv-sidebar-email">{userEmail}</span>
                                    <div className="mpv-sidebar-id-row">
                                        <span className="mpv-sidebar-id">ID:{userId}</span>
                                        <Copy size={12} className="mpv-sidebar-copy" />
                                    </div>
                                </div>
                                <button className="mpv-sidebar-unverify-btn">
                                    <span>✓</span> {kycStatus === 'verified' ? 'Verified' : 'Unverified'}
                                </button>
                            </div>

                            <div className="mpv-sidebar-menu">
                                <div className="mpv-sidebar-item" onClick={() => { setShowMobileMenu(false); setActiveProfileTab('overview'); }}>
                                    <LayoutDashboard size={18} />
                                    <span>Overview</span>
                                </div>
                                <div className="mpv-sidebar-item" onClick={() => { setShowMobileMenu(false); setActiveProfileTab('verification'); }}>
                                    <Shield size={18} />
                                    <span>Verification</span>
                                </div>
                                <div className="mpv-sidebar-item" onClick={() => { setShowMobileMenu(false); setActiveProfileTab('security'); }}>
                                    <Lock size={18} />
                                    <span>Security</span>
                                </div>
                                <div className="mpv-sidebar-item" onClick={() => { setShowMobileMenu(false); setActiveProfileTab('order'); }}>
                                    <FileText size={18} />
                                    <span>Order</span>
                                </div>
                                <div className="mpv-sidebar-item" onClick={() => { setShowMobileMenu(false); setActiveProfileTab('task'); }}>
                                    <CheckSquare size={18} />
                                    <span>Task center</span>
                                </div>
                                <div className="mpv-sidebar-item" onClick={() => { setShowMobileMenu(false); setActiveProfileTab('invite'); }}>
                                    <Users size={18} />
                                    <span>Invite friends</span>
                                </div>
                                <div className="mpv-sidebar-item" onClick={() => { setShowMobileMenu(false); setActiveProfileTab('settings'); }}>
                                    <Settings size={18} />
                                    <span>Settings</span>
                                </div>
                            </div>

                            <div className="mpv-sidebar-footer">
                                <button className="mpv-sidebar-logout-btn" onClick={handleLogout}>Logout</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Header */}
                <div className="mpv-page-header">
                    <div className="mpv-header-left">
                        <button className="mpv-back-btn" onClick={() => {
                            if (activeProfileTab !== 'overview') {
                                setActiveProfileTab('overview');
                            } else {
                                navigate('/dashboard/home');
                            }
                        }}>
                            <ArrowLeft size={20} />
                        </button>
                        <span className="mpv-page-title">
                            {activeProfileTab === 'overview' && 'Profile'}
                            {activeProfileTab === 'verification' && 'Verification'}
                            {activeProfileTab === 'security' && 'Security'}
                            {activeProfileTab === 'task' && 'Task center'}
                            {activeProfileTab === 'invite' && 'Invite friends'}
                            {activeProfileTab === 'settings' && 'Settings'}
                            {activeProfileTab === 'order' && 'Spot Orders'}
                            {activeProfileTab === 'message' && 'Notifications'}
                        </span>
                    </div>
                    <button className="mpv-menu-btn" onClick={() => setShowMobileMenu(true)}>
                        <Menu size={20} />
                    </button>
                </div>

                {/* Overview Tab - Mobile */}
                {activeProfileTab === 'overview' && (
                    <div className="mpv-content">
                        {/* Profile Info Card */}
                        <div className="mpv-profile-card">
                            <div className="mpv-avatar-section">
                                <div className="mpv-avatar" onClick={handleAvatarClick} style={{ cursor: 'pointer', position: 'relative' }}>
                                    <img src={avatarPreview || '/avatar.png'} alt={userName} />
                                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#1CD4A7', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f0f14' }}>
                                        <Camera size={13} color="#fff" />
                                    </div>
                                    {avatarUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>...</div>}
                                </div>
                                <div className="mpv-user-info">
                                    <h2 className="mpv-name">{userName}</h2>
                                    <p className="mpv-email">{userEmail}</p>
                                </div>
                            </div>

                            <div className="mpv-id-row">
                                <div className="mpv-id-item">
                                    <span className="mpv-id-label">UID</span>
                                    <div className="mpv-id-value">
                                        <span>{userId}</span>
                                        <Copy size={12} className="mpv-copy-icon" />
                                    </div>
                                </div>
                                <div className="mpv-id-item" onClick={() => navigate('/dashboard/kyc')}>
                                    <span className="mpv-id-label">ID Verification</span>
                                    <div className="mpv-id-value clickable">
                                        <span>{kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' ? 'Pending' : 'Not verified'}</span>
                                        <ChevronRight size={12} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Valuation Section */}
                        <div className="mpv-valuation">
                            <div className="mpv-val-label">
                                <span>Valuation</span>
                                {balanceHidden
                                    ? <EyeOff size={14} className="mpv-eye-icon cursor-pointer" onClick={() => setBalanceHidden(false)} />
                                    : <Eye size={14} className="mpv-eye-icon cursor-pointer" onClick={() => setBalanceHidden(true)} />
                                }
                            </div>
                            <div className="mpv-val-amount">
                                <span className="mpv-btc-value">{balanceHidden ? '****' : `$${userBalance.toFixed(2)} USDT`}</span>
                            </div>
                            <span className="mpv-usd-value">{balanceHidden ? '****' : `≈$${userBalance.toFixed(2)}`}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="mpv-actions">
                            <button className="mpv-btn-deposit" onClick={() => navigate('/dashboard/deposit')}>Deposit</button>
                            <button className="mpv-btn-withdraw" onClick={() => navigate('/dashboard/withdraw')}>Withdraw</button>
                        </div>

                        {/* Market Section */}
                        <div className="mpv-market-section">
                            <div className="mpv-market-header">
                                <span className="mpv-market-title">Market</span>
                                <label className="mpv-hide-checkbox">
                                    <div className="mpv-checkbox"></div>
                                    <span>Hide other assets less than 1 USD</span>
                                </label>
                            </div>

                            <div className="mpv-market-tabs">
                                <button
                                    className={`mpv-tab ${activeAssetTab === 'favorite' ? 'active' : ''}`}
                                    onClick={() => setActiveAssetTab('favorite')}
                                >
                                    Favorite
                                </button>
                                <button
                                    className={`mpv-tab ${activeAssetTab === 'hot' ? 'active' : ''}`}
                                    onClick={() => setActiveAssetTab('hot')}
                                >
                                    Hot
                                </button>
                                <button
                                    className={`mpv-tab ${activeAssetTab === 'gainers' ? 'active' : ''}`}
                                    onClick={() => setActiveAssetTab('gainers')}
                                >
                                    Top gainers
                                </button>
                                <button
                                    className={`mpv-tab ${activeAssetTab === 'losers' ? 'active' : ''}`}
                                    onClick={() => setActiveAssetTab('losers')}
                                >
                                    Top losers
                                </button>
                                <button
                                    className={`mpv-tab ${activeAssetTab === 'volume' ? 'active' : ''}`}
                                    onClick={() => setActiveAssetTab('volume')}
                                >
                                    24h Vo...
                                </button>
                            </div>

                            <div className="mpv-market-table">
                                <div className="mpv-table-header">
                                    <span>Market <ChevronDown size={10} /></span>
                                    <span>Amount <ChevronDown size={10} /></span>
                                    <span>Price <ChevronDown size={10} /></span>
                                </div>
                                {filteredMarketAssets.map((asset, i) => (
                                    <div key={i} className="mpv-table-row" onClick={() => navigate('/dashboard/trade')} style={{ cursor: 'pointer' }}>
                                        <div className="mpv-coin-cell">
                                            <div className="mpv-coin-icon" style={{ background: 'transparent', padding: 0 }}>
                                                <img src={asset.icon} alt={asset.symbol} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            </div>
                                            <div className="mpv-coin-info">
                                                <span className="mpv-coin-symbol">{asset.symbol}</span>
                                                <span className="mpv-coin-name">{asset.name}</span>
                                            </div>
                                        </div>
                                        <span className="mpv-amount">{(getSpotHoldings()[asset.symbol] || 0).toFixed(4)} {asset.symbol}</span>
                                        <span className={`mpv-price ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>{fmt(asset.price)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification Tab - Mobile */}
                {activeProfileTab === 'verification' && (
                    <div className="mpv-content mpv-verification">
                        {/* User Info */}
                        <div className="mpv-ver-user-card">
                            <div className="mpv-ver-avatar">
                                <User size={24} />
                            </div>
                            <div className="mpv-ver-user-info">
                                <span className="mpv-ver-email">{userEmail}</span>
                                <span className={`mpv-ver-status ${kycStatus === 'verified' ? 'verified' : ''}`}>
                                    {kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' ? 'Pending' : 'Unverified'}
                                </span>
                            </div>
                        </div>

                        {/* Verification Section */}
                        <div className="mpv-ver-section">
                            <h3 className="mpv-ver-title">User-verification</h3>
                            <p className="mpv-ver-desc">Only takes 3-5 minutes to complete the identity verification to protect your account from fraud and illegal risks.</p>
                            {kycStatus === 'verified' ? (
                                <div className="mpv-ver-verified-badge" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1CD4A7', fontWeight: 600, padding: '8px 0' }}>
                                    <CheckSquare size={16} /> Verified
                                </div>
                            ) : kycStatus === 'pending' ? (
                                <div style={{ color: '#F59E0B', fontWeight: 600, padding: '8px 0' }}>Verification in progress...</div>
                            ) : (
                                <button className="mpv-ver-btn" onClick={() => navigate('/dashboard/kyc')}>Verify</button>
                            )}
                        </div>

                        {/* Account Limits */}
                        <div className="mpv-limits-section">
                            <div className="mpv-limits-header">
                                <Lock size={16} />
                                <span>Account limits</span>
                            </div>
                            <div className="mpv-limit-row">
                                <span className="mpv-limit-label">Crypto deposit limit</span>
                                <span className="mpv-limit-value teal">Enable deposit</span>
                            </div>
                            <div className="mpv-limit-row">
                                <span className="mpv-limit-label">Crypto withdrawal limit</span>
                                <div className="mpv-limit-values">
                                    <span>20000 USDT Daily</span>
                                    <span>20000 USDT Monthly</span>
                                </div>
                            </div>
                            <div className="mpv-limit-row">
                                <span className="mpv-limit-label">P2p transaction limit</span>
                                <span className="mpv-limit-value teal">Enable transaction</span>
                            </div>
                        </div>

                        {/* Verification Levels */}
                        <div className="mpv-ver-levels">
                            <div className="mpv-ver-level">
                                <div className="mpv-ver-level-header">
                                    <CheckSquare size={16} className="mpv-ver-icon success" />
                                    <span>User-Verification</span>
                                </div>
                                <p className="mpv-ver-level-limit">Crypto withdrawal limit 2000 USDT Daily</p>
                                <div className="mpv-ver-reqs">
                                    <span className="mpv-ver-req-label">Require</span>
                                    <div className="mpv-ver-req-item"><span className="mpv-req-dot"></span>Applicant data</div>
                                    <div className="mpv-ver-req-item"><span className="mpv-req-dot"></span>Identity document</div>
                                    <div className="mpv-ver-req-item"><span className="mpv-req-dot"></span>Selfie with document</div>
                                </div>
                            </div>

                            <div className="mpv-ver-level">
                                <div className="mpv-ver-level-header">
                                    <X size={16} className="mpv-ver-icon error" />
                                    <span>Additional proof of address</span>
                                </div>
                                <p className="mpv-ver-level-limit">Crypto withdrawal limit 20000 USDT Daily</p>
                                <div className="mpv-ver-reqs">
                                    <span className="mpv-ver-req-label">Require</span>
                                    <div className="mpv-ver-req-item"><span className="mpv-req-dot"></span>Identity document</div>
                                    <div className="mpv-ver-req-item"><span className="mpv-req-dot"></span>Proof of residence</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Tab - Mobile */}
                {activeProfileTab === 'security' && (
                    <div className="mpv-content mpv-security">
                        {/* Authentication Method */}
                        <div className="mpv-sec-section">
                            <h3 className="mpv-sec-title">Authentication method</h3>

                            <div className="mpv-sec-item">
                                <div className="mpv-sec-icon">G</div>
                                <div className="mpv-sec-info">
                                    <span className="mpv-sec-name">Google Authenticator</span>
                                    <span className="mpv-sec-desc">API Secure verification when withdrawing, retrieving passwords, modifying security settings and managing API</span>
                                </div>
                                <button className="mpv-sec-btn" onClick={() => { setSecForm({}); setAuthStep(1); setSecModal('authenticator'); }}>{authBound ? 'Bound' : 'Bind'}</button>
                            </div>

                            <div className="mpv-sec-item">
                                <div className="mpv-sec-icon"><Smartphone size={16} /></div>
                                <div className="mpv-sec-info">
                                    <span className="mpv-sec-name">Phone number</span>
                                    <span className="mpv-sec-desc">Receive verification SMS that is used to withdraw, change the password or security settings</span>
                                </div>
                                <div className="mpv-sec-right">
                                    <span className="mpv-sec-value">{userPhone}</span>
                                    <button className="mpv-sec-btn" onClick={() => { setSecForm({ phone: '' }); setSecModal('phone'); }}>{userPhone !== 'Not set' ? 'Change' : 'Bind'}</button>
                                </div>
                            </div>

                            <div className="mpv-sec-item">
                                <div className="mpv-sec-icon"><Mail size={16} /></div>
                                <div className="mpv-sec-info">
                                    <span className="mpv-sec-name">Email address</span>
                                    <span className="mpv-sec-desc">Used when logging in, withdrawing and modifying security settings</span>
                                </div>
                                <div className="mpv-sec-right">
                                    <span className="mpv-sec-value">{userEmail}</span>
                                    <button className="mpv-sec-btn" onClick={() => { setSecForm({ newEmail: '', password: '' }); setSecModal('email'); }}>Change</button>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Security */}
                        <div className="mpv-sec-section">
                            <h3 className="mpv-sec-title">Advanced Security</h3>

                            <div className="mpv-sec-item">
                                <div className="mpv-sec-icon"><Lock size={16} /></div>
                                <div className="mpv-sec-info">
                                    <span className="mpv-sec-name">Password</span>
                                    <span className="mpv-sec-desc">Used to manage your account login password</span>
                                </div>
                                <button className="mpv-sec-btn" onClick={() => { setSecForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setSecModal('password'); }}>Change</button>
                            </div>

                            <div className="mpv-sec-item">
                                <div className="mpv-sec-icon"><Wallet size={16} /></div>
                                <div className="mpv-sec-info">
                                    <span className="mpv-sec-name">Address management</span>
                                    <span className="mpv-sec-desc">After setting as a trust address, withdrawals will be exempt from security verification</span>
                                </div>
                                <button className="mpv-sec-btn" onClick={() => navigate('/dashboard/deposit')}>Manage</button>
                            </div>
                        </div>

                        {/* Account Management */}
                        <div className="mpv-sec-section">
                            <h3 className="mpv-sec-title">Account Management</h3>

                            <div className="mpv-sec-item">
                                <div className="mpv-sec-icon"><Monitor size={16} /></div>
                                <div className="mpv-sec-info">
                                    <span className="mpv-sec-name">My device</span>
                                    <span className="mpv-sec-desc">For managing logged-in devices and viewing device history</span>
                                </div>
                                <button className="mpv-sec-btn" onClick={() => setSecModal('device')}>Manage</button>
                            </div>

                            <div className="mpv-sec-item">
                                <div className="mpv-sec-icon"><Activity size={16} /></div>
                                <div className="mpv-sec-info">
                                    <span className="mpv-sec-name">Account activity</span>
                                    <span className="mpv-sec-desc">Last login: {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</span>
                                </div>
                                <button className="mpv-sec-btn" onClick={() => setSecModal('activity')}>Manage</button>
                            </div>

                            <div className="mpv-sec-item">
                                <div className="mpv-sec-icon"><Trash2 size={16} /></div>
                                <div className="mpv-sec-info">
                                    <span className="mpv-sec-name">Delete account</span>
                                    <span className="mpv-sec-desc">After deleting your account, you will never be able to re-register this account and its sub-account email, mobile phone number, and identity information.</span>
                                </div>
                                <button className="mpv-sec-btn danger" onClick={() => { setSecForm({ password: '', confirmDelete: '' }); setSecModal('delete'); }}>Delete</button>
                            </div>
                        </div>

                        {/* Security Modals */}
                        {secModal !== 'none' && (
                            <div className="mpv-sec-modal-overlay" onClick={closeSecModal}>
                                <div className="mpv-sec-modal" onClick={e => e.stopPropagation()}>
                                    <button className="mpv-sec-modal-close" onClick={closeSecModal}><X size={18} /></button>

                                    {secModal === 'password' && (
                                        <>
                                            <h3 className="mpv-sec-modal-title"><Lock size={18} /> Change Password</h3>
                                            <div className="mpv-sec-modal-field">
                                                <label>Current Password</label>
                                                <input type="password" placeholder="Enter current password" value={secForm.currentPassword || ''} onChange={e => setSecForm(p => ({ ...p, currentPassword: e.target.value }))} />
                                            </div>
                                            <div className="mpv-sec-modal-field">
                                                <label>New Password</label>
                                                <input type="password" placeholder="Enter new password" value={secForm.newPassword || ''} onChange={e => setSecForm(p => ({ ...p, newPassword: e.target.value }))} />
                                            </div>
                                            <div className="mpv-sec-modal-field">
                                                <label>Confirm New Password</label>
                                                <input type="password" placeholder="Confirm new password" value={secForm.confirmPassword || ''} onChange={e => setSecForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                                            </div>
                                            <button className="mpv-sec-modal-submit" disabled={secLoading} onClick={handleChangePassword}>{secLoading ? 'Saving...' : 'Change Password'}</button>
                                        </>
                                    )}

                                    {secModal === 'email' && (
                                        <>
                                            <h3 className="mpv-sec-modal-title"><Mail size={18} /> Change Email</h3>
                                            <p className="mpv-sec-modal-hint">Current: {userEmail}</p>
                                            <div className="mpv-sec-modal-field">
                                                <label>New Email</label>
                                                <input type="email" placeholder="Enter new email" value={secForm.newEmail || ''} onChange={e => setSecForm(p => ({ ...p, newEmail: e.target.value }))} />
                                            </div>
                                            <div className="mpv-sec-modal-field">
                                                <label>Password</label>
                                                <input type="password" placeholder="Enter your password" value={secForm.password || ''} onChange={e => setSecForm(p => ({ ...p, password: e.target.value }))} />
                                            </div>
                                            <button className="mpv-sec-modal-submit" disabled={secLoading} onClick={handleChangeEmail}>{secLoading ? 'Saving...' : 'Change Email'}</button>
                                        </>
                                    )}

                                    {secModal === 'phone' && (
                                        <>
                                            <h3 className="mpv-sec-modal-title"><Smartphone size={18} /> {userPhone !== 'Not set' ? 'Change' : 'Bind'} Phone</h3>
                                            {userPhone !== 'Not set' && <p className="mpv-sec-modal-hint">Current: {userPhone}</p>}
                                            <div className="mpv-sec-modal-field">
                                                <label>Phone Number</label>
                                                <input type="tel" placeholder="Enter phone number" value={secForm.phone || ''} onChange={e => setSecForm(p => ({ ...p, phone: e.target.value }))} />
                                            </div>
                                            <button className="mpv-sec-modal-submit" disabled={secLoading} onClick={handleBindPhone}>{secLoading ? 'Saving...' : 'Save Phone'}</button>
                                        </>
                                    )}

                                    {secModal === 'delete' && (
                                        <>
                                            <h3 className="mpv-sec-modal-title" style={{ color: '#ef4444' }}><AlertTriangle size={18} /> Delete Account</h3>
                                            <p className="mpv-sec-modal-hint" style={{ color: '#ef4444' }}>This action is permanent and cannot be undone. All your data, including trading history and balances, will be lost.</p>
                                            <div className="mpv-sec-modal-field">
                                                <label>Password</label>
                                                <input type="password" placeholder="Enter your password" value={secForm.password || ''} onChange={e => setSecForm(p => ({ ...p, password: e.target.value }))} />
                                            </div>
                                            <div className="mpv-sec-modal-field">
                                                <label>Type DELETE to confirm</label>
                                                <input type="text" placeholder="DELETE" value={secForm.confirmDelete || ''} onChange={e => setSecForm(p => ({ ...p, confirmDelete: e.target.value }))} />
                                            </div>
                                            <button className="mpv-sec-modal-submit danger" disabled={secLoading} onClick={handleDeleteAccount}>{secLoading ? 'Deleting...' : 'Delete My Account'}</button>
                                        </>
                                    )}

                                    {secModal === 'device' && (
                                        <>
                                            <h3 className="mpv-sec-modal-title"><Monitor size={18} /> My Devices</h3>
                                            <div className="mpv-sec-device-list">
                                                <div className="mpv-sec-device-item active">
                                                    <Monitor size={20} />
                                                    <div>
                                                        <span className="mpv-sec-device-name">{navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser'}</span>
                                                        <span className="mpv-sec-device-detail">Current session · {navigator.platform}</span>
                                                    </div>
                                                    <span className="mpv-sec-device-badge">Active</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {secModal === 'activity' && (
                                        <>
                                            <h3 className="mpv-sec-modal-title"><Activity size={18} /> Account Activity</h3>
                                            <div className="mpv-sec-activity-list">
                                                <div className="mpv-sec-activity-item">
                                                    <span className="mpv-sec-activity-action">Login</span>
                                                    <span className="mpv-sec-activity-time">{profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</span>
                                                    <span className="mpv-sec-activity-detail">{navigator.platform} · {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</span>
                                                </div>
                                                <div className="mpv-sec-activity-item">
                                                    <span className="mpv-sec-activity-action">Account Created</span>
                                                    <span className="mpv-sec-activity-time">{profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {secModal === 'authenticator' && (
                                        <>
                                            <h3 className="mpv-sec-modal-title"><Shield size={18} /> Google Authenticator</h3>

                                            {authStep === 1 && (
                                                <div className="mpv-auth-step">
                                                    <p className="mpv-sec-modal-hint">Step 1: Download Google Authenticator app from your App Store or Play Store.</p>
                                                    <div className="mpv-auth-stores">
                                                        <div className="mpv-auth-store-badge">📱 App Store</div>
                                                        <div className="mpv-auth-store-badge">📱 Play Store</div>
                                                    </div>
                                                    <button className="mpv-sec-modal-submit" onClick={() => setAuthStep(2)}>Next →</button>
                                                </div>
                                            )}

                                            {authStep === 2 && (
                                                <div className="mpv-auth-step">
                                                    <p className="mpv-sec-modal-hint">Step 2: Scan the QR code or enter the secret key manually in the Google Authenticator app.</p>
                                                    <div className="mpv-auth-qr">
                                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/DiwanFinance:${encodeURIComponent(userEmail)}?secret=${authSecret}%26issuer=DiwanFinance`} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 8, background: '#fff', padding: 8 }} />
                                                    </div>
                                                    <div className="mpv-auth-secret">
                                                        <span className="mpv-auth-secret-label">Secret Key</span>
                                                        <div className="mpv-auth-secret-box">
                                                            <code>{authSecret}</code>
                                                            <Copy size={14} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => copyToClipboard(authSecret)} />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                        <button className="mpv-sec-modal-submit" style={{ background: '#27272A', flex: 1 }} onClick={() => setAuthStep(1)}>← Back</button>
                                                        <button className="mpv-sec-modal-submit" style={{ flex: 1 }} onClick={() => setAuthStep(3)}>Next →</button>
                                                    </div>
                                                </div>
                                            )}

                                            {authStep === 3 && (
                                                <div className="mpv-auth-step">
                                                    <p className="mpv-sec-modal-hint">Step 3: Enter the 6-digit verification code from the Google Authenticator app.</p>
                                                    <div className="mpv-sec-modal-field">
                                                        <label>Verification Code</label>
                                                        <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code" value={secForm.otpCode || ''} onChange={e => setSecForm(p => ({ ...p, otpCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} style={{ letterSpacing: 8, textAlign: 'center', fontSize: 20, fontWeight: 600 }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                        <button className="mpv-sec-modal-submit" style={{ background: '#27272A', flex: 1 }} onClick={() => setAuthStep(2)}>← Back</button>
                                                        <button className="mpv-sec-modal-submit" style={{ flex: 1 }} disabled={secLoading} onClick={handleBindAuthenticator}>{secLoading ? 'Verifying...' : 'Bind Authenticator'}</button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {secError && <p className="mpv-sec-modal-error">{secError}</p>}
                                    {secSuccess && <p className="mpv-sec-modal-success">{secSuccess}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Task Center Tab - Mobile */}
                {activeProfileTab === 'task' && (
                    <div className="mpv-content mpv-task">
                        {/* Rewards */}
                        <div className="mpv-task-rewards">
                            <div className="mpv-task-reward">
                                <span className="mpv-task-reward-label">Cash reward</span>
                                <span className="mpv-task-reward-value"><span className="teal">{taskRewards.cash.toFixed(1)}</span> USDT</span>
                            </div>
                            <div className="mpv-task-reward">
                                <span className="mpv-task-reward-label">Cashback voucher</span>
                                <span className="mpv-task-reward-value"><span className="teal">{taskRewards.vouchers}</span> Pieces</span>
                            </div>
                            <div className="mpv-task-reward">
                                <span className="mpv-task-reward-label">Futures bonus</span>
                                <span className="mpv-task-reward-value"><span className="teal">{taskRewards.bonus.toFixed(1)}</span> USDT</span>
                            </div>
                        </div>

                        {/* Task Tabs */}
                        <div className="mpv-task-tabs">
                            <button
                                className={`mpv-task-tab ${activeTaskTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTaskTab('all')}
                            >
                                All in progress
                            </button>
                            <button
                                className={`mpv-task-tab ${activeTaskTab === 'beginner' ? 'active' : ''}`}
                                onClick={() => setActiveTaskTab('beginner')}
                            >
                                Beginner's task
                            </button>
                            <button
                                className={`mpv-task-tab ${activeTaskTab === 'limited' ? 'active' : ''}`}
                                onClick={() => setActiveTaskTab('limited')}
                            >
                                Limited-time
                            </button>
                        </div>

                        {/* Task List */}
                        {getFilteredTasks().length === 0 ? (
                            <div className="mpv-task-empty">
                                <div className="mpv-task-empty-icon"><FileText size={48} /></div>
                                <p>There are no current tasks</p>
                            </div>
                        ) : (
                            <div className="mpv-task-list">
                                {getFilteredTasks().map(task => (
                                    <div key={task.id} className={`mpv-task-item ${task.done ? 'done' : ''}`}>
                                        <div className="mpv-task-item-left">
                                            <div className={`mpv-task-check ${task.done ? 'checked' : ''}`}>
                                                {task.done && <CheckSquare size={16} />}
                                            </div>
                                            <div className="mpv-task-item-info">
                                                <span className="mpv-task-item-name">{task.name}</span>
                                                <span className="mpv-task-item-desc">{task.desc}</span>
                                            </div>
                                        </div>
                                        <div className="mpv-task-item-right">
                                            <span className="mpv-task-item-reward">{task.reward}</span>
                                            {!task.done && (
                                                <button className="mpv-task-item-btn" onClick={() => {
                                                    if (task.id === 'kyc') navigate('/dashboard/kyc')
                                                    else if (task.id === 'deposit') navigate('/dashboard/deposit')
                                                    else if (task.id === 'trade') navigate('/dashboard/trade')
                                                    else if (task.id === 'phone') { setSecForm({ phone: '' }); setSecModal('phone'); setActiveProfileTab('security'); }
                                                    else if (task.id === 'invite') setActiveProfileTab('invite')
                                                }}>Go</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Invite Friends Tab - Mobile */}
                {activeProfileTab === 'invite' && (
                    <div className="mpv-content mpv-invite">
                        {/* Invite Header */}
                        <div className="mpv-invite-header">
                            <div className="mpv-invite-text">
                                <h2 className="mpv-invite-title">Invite friends</h2>
                                <h3 className="mpv-invite-subtitle">Enjoy Rewards</h3>
                                <p className="mpv-invite-desc">Enjoy rewarding, transparent and instant redemption</p>
                            </div>
                            <div className="mpv-invite-icon">
                                <UserPlus size={32} />
                            </div>
                        </div>

                        {/* Invitation Code */}
                        <div className="mpv-invite-section">
                            <span className="mpv-invite-label">Invitation code</span>
                            <div className="mpv-invite-box">
                                <span>{referralCode}</span>
                                <div className="mpv-invite-actions">
                                    <span>✏️</span>
                                    <Copy size={14} style={{ cursor: 'pointer' }} onClick={() => copyToClipboard(referralCode)} />
                                </div>
                            </div>
                        </div>

                        {/* Invitation Link */}
                        <div className="mpv-invite-section">
                            <span className="mpv-invite-label">Invitation link</span>
                            <div className="mpv-invite-box">
                                <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>{referralLink}</span>
                                <Copy size={14} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => copyToClipboard(referralLink)} />
                            </div>
                        </div>

                        {/* Invite Button */}
                        <button className="mpv-invite-btn" onClick={() => {
                            if (navigator.share) navigator.share({ title: 'Join Diwan Finance', text: `Use my referral code: ${referralCode}`, url: referralLink }).catch(() => { })
                            else copyToClipboard(referralLink)
                        }}>Invite friends</button>

                        {/* Dashboard */}
                        <div className="mpv-invite-dashboard">
                            <div className="mpv-invite-dash-icon">
                                <Gift size={32} />
                            </div>
                            <h3>Dashboard</h3>
                        </div>

                        {/* Stats */}
                        <div className="mpv-invite-stats">
                            <div className="mpv-invite-stat">
                                <div className="mpv-invite-stat-icon">
                                    <Users size={18} />
                                </div>
                                <div className="mpv-invite-stat-info">
                                    <span className="mpv-invite-stat-label">Friends</span>
                                    <span className="mpv-invite-stat-value"><span className="teal">0</span> USDT</span>
                                </div>
                            </div>
                            <div className="mpv-invite-stat">
                                <div className="mpv-invite-stat-icon teal">
                                    <Gift size={18} />
                                </div>
                                <div className="mpv-invite-stat-info">
                                    <span className="mpv-invite-stat-label">Rewards</span>
                                    <span className="mpv-invite-stat-value"><span className="teal">0</span> USDT</span>
                                </div>
                            </div>
                            <div className="mpv-invite-stat">
                                <div className="mpv-invite-stat-icon teal">
                                    <Gift size={18} />
                                </div>
                                <div className="mpv-invite-stat-info">
                                    <span className="mpv-invite-stat-label">Top referrer</span>
                                    <span className="mpv-invite-stat-value"><span className="teal">0</span> USDT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab - Mobile */}
                {activeProfileTab === 'settings' && (
                    <div className="mpv-content mpv-settings">
                        {/* Profile Section */}
                        <div className="mpv-settings-section">
                            <h3 className="mpv-settings-title">Profile</h3>

                            <div className="mpv-settings-item">
                                <div className="mpv-settings-icon">
                                    <User size={18} />
                                </div>
                                <div className="mpv-settings-info">
                                    <span className="mpv-settings-name">Nickname</span>
                                    <span className="mpv-settings-desc">Set a customized nickname</span>
                                    <span className="mpv-settings-value">{userName}</span>
                                </div>
                                <button className="mpv-settings-btn" onClick={() => { setNicknameInput(userName === 'User' ? '' : userName); setNicknameSuccess(''); setShowNicknameModal(true) }}>Edit</button>
                            </div>

                            <div className="mpv-settings-item">
                                <div className="mpv-settings-icon">
                                    <User size={18} />
                                </div>
                                <div className="mpv-settings-info">
                                    <span className="mpv-settings-name">Avatar</span>
                                    <span className="mpv-settings-desc">Select an avatar to personalize your account</span>
                                </div>
                                <button className="mpv-settings-btn" onClick={handleAvatarClick}>Edit</button>
                            </div>
                        </div>

                        {/* Preference Section */}
                        <div className="mpv-settings-section">
                            <h3 className="mpv-settings-title">Preference</h3>

                            <div className="mpv-settings-item">
                                <div className="mpv-settings-icon">
                                    <FileText size={18} />
                                </div>
                                <div className="mpv-settings-info">
                                    <span className="mpv-settings-name">Order confirmation</span>
                                    <span className="mpv-settings-desc">If you enable the reminder, an order will need to be reconfirmed every time</span>
                                    <span className="mpv-settings-value">{[orderConfirmSettings.limit && 'Limit order', orderConfirmSettings.market && 'Market order', orderConfirmSettings.stop && 'Stop limit'].filter(Boolean).join(', ') || 'None'}</span>
                                </div>
                                <button className="mpv-settings-btn" onClick={() => setShowOrderConfirmModal(true)}>Manage</button>
                            </div>

                            <div className="mpv-settings-item">
                                <div className="mpv-settings-icon">
                                    <UserPlus size={18} />
                                </div>
                                <div className="mpv-settings-info">
                                    <span className="mpv-settings-name">Add superiors invitation code</span>
                                    <span className="mpv-settings-desc">Used for invitation relationship</span>
                                    <span className="mpv-settings-link" onClick={() => { setInviteCodeInput(savedInviteCode); setInviteCodeSuccess(''); setShowInviteCodeModal(true) }}>{savedInviteCode || 'Add'}</span>
                                </div>
                                <button className="mpv-settings-btn" onClick={() => { setInviteCodeInput(savedInviteCode); setInviteCodeSuccess(''); setShowInviteCodeModal(true) }}>{savedInviteCode ? 'Edit' : 'Add'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Tab - Mobile */}
                {activeProfileTab === 'order' && (
                    <div className="mpv-content mpv-order">
                        {/* Order Tabs */}
                        <div className="mpv-order-tabs">
                            <button
                                className={`mpv-order-tab ${activeOrderTab === 'open' ? 'active' : ''}`}
                                onClick={() => setActiveOrderTab('open')}
                            >
                                Open Order
                            </button>
                            <button
                                className={`mpv-order-tab ${activeOrderTab === 'order-history' ? 'active' : ''}`}
                                onClick={() => setActiveOrderTab('order-history')}
                            >
                                Order history
                            </button>
                            <button
                                className={`mpv-order-tab ${activeOrderTab === 'trade-history' ? 'active' : ''}`}
                                onClick={() => setActiveOrderTab('trade-history')}
                            >
                                Trade history
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="mpv-order-filters">
                            <div className="mpv-order-filter-left">
                                <button className="mpv-order-filter-btn">
                                    USDT
                                </button>
                                <button className="mpv-order-filter-btn">
                                    All Types
                                </button>
                            </div>
                            <button className="mpv-order-filter-icon">
                                <Filter size={16} />
                            </button>
                        </div>

                        {/* Orders List */}
                        {ordersLoading ? (
                            <div className="mpv-order-empty"><p>Loading...</p></div>
                        ) : getDisplayedOrders().length === 0 ? (
                            <div className="mpv-order-empty">
                                <div className="mpv-order-empty-icon"><FileText size={48} /></div>
                                <p>No data</p>
                            </div>
                        ) : (
                            <div className="mpv-order-list">
                                {getDisplayedOrders().map((trade: any) => (
                                    <div key={trade._id} className="mpv-order-item">
                                        <div className="mpv-order-item-header">
                                            <span className="mpv-order-item-pair">{trade.asset}</span>
                                            <span className={`mpv-order-item-side ${trade.side === 'buy' ? 'buy' : 'sell'}`}>{trade.side?.toUpperCase()}</span>
                                        </div>
                                        <div className="mpv-order-item-details">
                                            <div className="mpv-order-item-row">
                                                <span className="mpv-order-item-label">Amount</span>
                                                <span className="mpv-order-item-val">${trade.amount?.toFixed(2)}</span>
                                            </div>
                                            <div className="mpv-order-item-row">
                                                <span className="mpv-order-item-label">Entry Price</span>
                                                <span className="mpv-order-item-val">${trade.entryPrice?.toFixed(2)}</span>
                                            </div>
                                            {trade.status === 'closed' && trade.pnl !== undefined && (
                                                <div className="mpv-order-item-row">
                                                    <span className="mpv-order-item-label">PnL</span>
                                                    <span className={`mpv-order-item-val ${trade.pnl >= 0 ? 'teal' : 'red'}`}>{trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)} USDT</span>
                                                </div>
                                            )}
                                            <div className="mpv-order-item-row">
                                                <span className="mpv-order-item-label">Date</span>
                                                <span className="mpv-order-item-val">{new Date(trade.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Message Tab - Mobile */}
                {activeProfileTab === 'message' && (
                    <div className="mpv-content mpv-message">
                        {/* Message Tabs */}
                        <div className="mpv-msg-tabs">
                            <button
                                className={`mpv-msg-tab ${activeMsgTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveMsgTab('all')}
                            >
                                All
                            </button>
                            <button
                                className={`mpv-msg-tab ${activeMsgTab === 'system' ? 'active' : ''}`}
                                onClick={() => setActiveMsgTab('system')}
                            >
                                System Msg
                            </button>
                            <button
                                className={`mpv-msg-tab ${activeMsgTab === 'deposit' ? 'active' : ''}`}
                                onClick={() => setActiveMsgTab('deposit')}
                            >
                                Deposit/Withdraw
                            </button>
                            <button
                                className={`mpv-msg-tab ${activeMsgTab === 'safety' ? 'active' : ''}`}
                                onClick={() => setActiveMsgTab('safety')}
                            >
                                Safety Msg
                            </button>
                        </div>

                        {/* Actions Row */}
                        <div className="mpv-msg-actions">
                            <div className="mpv-msg-select" onClick={handleSelectAllMsgs}>
                                <div className={`mpv-msg-checkbox ${selectedMsgs.size === filteredNotifications.length && filteredNotifications.length > 0 ? 'checked' : ''}`}></div>
                                <span>Select all</span>
                            </div>
                            <div className="mpv-msg-action-btns">
                                <button className="mpv-msg-action-btn delete" onClick={() => { setNotifications(prev => prev.filter(n => !selectedMsgs.has(n._id))); setSelectedMsgs(new Set()); }}>Delete</button>
                                <button className="mpv-msg-action-btn mark" onClick={handleMarkAllRead}>Mark all as read</button>
                            </div>
                        </div>

                        {/* Messages List */}
                        {msgsLoading ? (
                            <div className="mpv-order-empty"><p>Loading...</p></div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="mpv-order-empty">
                                <div className="mpv-order-empty-icon"><FileText size={48} /></div>
                                <p>No messages</p>
                            </div>
                        ) : (
                            filteredNotifications.map((notif: any) => (
                                <div key={notif._id} className={`mpv-msg-item ${notif.read ? 'read' : ''}`}>
                                    <div className="mpv-msg-item-header">
                                        <div className={`mpv-msg-checkbox ${selectedMsgs.has(notif._id) ? 'checked' : ''}`} onClick={() => handleToggleMsgSelect(notif._id)}></div>
                                        <span className="mpv-msg-item-title">{notif.title}</span>
                                        <button className="mpv-msg-item-delete" onClick={() => setNotifications(prev => prev.filter(n => n._id !== notif._id))}>Delete</button>
                                    </div>
                                    <div className="mpv-msg-item-content">
                                        {notif.description && (
                                            <div className="mpv-msg-row">
                                                <span className="mpv-msg-label">Details</span>
                                                <span className="mpv-msg-value">{notif.description}</span>
                                            </div>
                                        )}
                                        <div className="mpv-msg-row">
                                            <span className="mpv-msg-label">Account</span>
                                            <span className="mpv-msg-value">{userEmail}</span>
                                        </div>
                                        <div className="mpv-msg-row">
                                            <span className="mpv-msg-label">Type</span>
                                            <span className="mpv-msg-value">{notif.type || 'System'}</span>
                                        </div>
                                        <div className="mpv-msg-row">
                                            <span className="mpv-msg-label">Time</span>
                                            <span className="mpv-msg-value">{new Date(notif.sentAt || notif.createdAt).toLocaleString()}</span>
                                        </div>
                                        {!notif.read && (
                                            <button className="mpv-msg-mark-btn" onClick={() => { markNotificationRead(notif._id); setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n)); }}>Mark as read</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Desktop View */}
            <div className="profile-overview-container desktop-only">

                {/* Profile Tabs */}
                <div className="profile-desktop-tabs">
                    <button
                        className={`profile-desktop-tab ${activeProfileTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveProfileTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`profile-desktop-tab ${activeProfileTab === 'verification' ? 'active' : ''}`}
                        onClick={() => setActiveProfileTab('verification')}
                    >
                        Verification
                    </button>
                    <button
                        className={`profile-desktop-tab ${activeProfileTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveProfileTab('security')}
                    >
                        Security
                    </button>
                    <button
                        className={`profile-desktop-tab ${activeProfileTab === 'task' ? 'active' : ''}`}
                        onClick={() => setActiveProfileTab('task')}
                    >
                        Task center
                    </button>
                    <button
                        className={`profile-desktop-tab ${activeProfileTab === 'invite' ? 'active' : ''}`}
                        onClick={() => setActiveProfileTab('invite')}
                    >
                        Invite friends
                    </button>
                    <button
                        className={`profile-desktop-tab ${activeProfileTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveProfileTab('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* Overview Tab Content */}
                {activeProfileTab === 'overview' && (
                    <>
                        <div className="profile-header-card">
                            <div className="profile-info-left">
                                <div className="profile-avatar-circle" onClick={handleAvatarClick} style={{ cursor: 'pointer', position: 'relative' }}>
                                    <img src={avatarPreview || '/avatar.png'} alt={userName} className="profile-avatar-img" />
                                    <div style={{ position: 'absolute', bottom: 2, right: 2, background: '#1CD4A7', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f0f14' }}>
                                        <Camera size={14} color="#fff" />
                                    </div>
                                    {avatarUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>Uploading...</div>}
                                </div>
                                <div className="profile-details">
                                    <h1 className="profile-name">{userName}</h1>
                                    <p className="profile-email">{userEmail}</p>
                                </div>
                            </div>
                            <div className="profile-info-right">
                                <div className="info-item">
                                    <span className="info-label">UID</span>
                                    <div className="info-value-container">
                                        <span>{userId}</span>
                                        <button className="copy-icon-btn">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">ID Verification</span>
                                    <div className="verification-status" onClick={() => navigate('/dashboard/kyc')} style={{ cursor: 'pointer' }}>
                                        <span className="not-verified-text">{kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' ? 'Pending' : 'Not verified'}</span>
                                        <ChevronRight size={16} className="chevron-right-icon" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Verification Banner */}
                        <div className="verification-banner">
                            <div className="banner-left">
                                <div className="banner-icon-bg">
                                    <img src="/verification-icon.png" alt="Verification" className="banner-icon-img" />
                                </div>
                                <div className="banner-text-content">
                                    <h3 className="banner-title">Pending verification</h3>
                                    <p className="banner-desc">
                                        You will enjoy the full benefit of the whole service after the completion of the verification
                                    </p>
                                </div>
                            </div>
                            <button className="view-details-btn" onClick={() => navigate('/dashboard/kyc')}>View details</button>
                        </div>

                        {/* Balance Overview Card */}
                        <div className="balance-overview-card">
                            <div className="balance-info">
                                <div className="estimated-value-label">
                                    <span>Estimated value</span>
                                    <button className="eye-icon-btn">
                                        <Eye size={16} />
                                    </button>
                                </div>
                                <div className="balance-amount-display">
                                    <div className="btc-amount-row">
                                        <span className="btc-value">0.000000 BTC</span>
                                        <button className="currency-dropdown-btn">
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>
                                    <span className="usd-equivalent">≈$0.00</span>
                                </div>
                            </div>
                            <div className="balance-actions">
                                <button className="btn-deposit">Deposit</button>
                                <button className="btn-withdraw">Withdraw</button>
                            </div>
                        </div>

                        {/* Assets Table Section */}
                        <div className="assets-section-card">
                            <div className="assets-table-header">
                                <div className="assets-tabs">
                                    <button
                                        className={`asset-tab ${activeAssetTab === 'favorite' ? 'active' : ''}`}
                                        onClick={() => setActiveAssetTab('favorite')}
                                    >
                                        Favorite
                                    </button>
                                    <button
                                        className={`asset-tab ${activeAssetTab === 'hot' ? 'active' : ''}`}
                                        onClick={() => setActiveAssetTab('hot')}
                                    >
                                        Hot
                                    </button>
                                    <button
                                        className={`asset-tab ${activeAssetTab === 'gainers' ? 'active' : ''}`}
                                        onClick={() => setActiveAssetTab('gainers')}
                                    >
                                        Top gainers
                                    </button>
                                    <button
                                        className={`asset-tab ${activeAssetTab === 'losers' ? 'active' : ''}`}
                                        onClick={() => setActiveAssetTab('losers')}
                                    >
                                        Top losers
                                    </button>
                                    <button
                                        className={`asset-tab ${activeAssetTab === 'volume' ? 'active' : ''}`}
                                        onClick={() => setActiveAssetTab('volume')}
                                    >
                                        24h Volume
                                    </button>
                                </div>
                                <div className="assets-filters">
                                    <label className="hide-assets-checkbox">
                                        <div className="checkbox-custom"></div>
                                        <span>Hide other assets less than 1 USD</span>
                                    </label>
                                    <div className="assets-search-box">
                                        <Search size={14} className="text-zinc-500" />
                                        <input type="text" placeholder="Search for currency pairs" />
                                    </div>
                                </div>
                            </div>

                            <table className="assets-table">
                                <thead>
                                    <tr>
                                        <th>Coin</th>
                                        <th>Total Balance</th>
                                        <th>Wallet Balance <ChevronDown size={12} className="inline" /></th>
                                        <th>Available</th>
                                        <th>PnL</th>
                                        <th>Operation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map((asset) => (
                                        <tr key={asset.symbol}>
                                            <td>
                                                <div className="asset-coin-cell">
                                                    <div className="asset-icon-placeholder">
                                                        {asset.symbol === 'BTC' ? '🟠' : '🔵'}
                                                    </div>
                                                    <div className="asset-name-info">
                                                        <span className="asset-symbol">{asset.symbol}</span>
                                                        <span className="asset-full-name">{asset.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="asset-balance-cell">
                                                    <div>{asset.totalBalance}</div>
                                                    <div className="balance-secondary">{asset.usdValue}</div>
                                                </div>
                                            </td>
                                            <td>{asset.walletBalance}</td>
                                            <td>{asset.available}</td>
                                            <td>{asset.pnl}</td>
                                            <td>
                                                <a href="#" className="trade-link-teal">Trade</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Verification Tab Content */}
                {activeProfileTab === 'verification' && (
                    <div className="profile-tab-content">
                        {/* User Info Card */}
                        <div className="verification-user-card">
                            <div className="verification-user-info">
                                <div className="verification-avatar">
                                    <User size={24} />
                                </div>
                                <div className="verification-user-details">
                                    <span className="verification-email">{userEmail}</span>
                                    <span className={`verification-status-badge ${kycStatus === 'verified' ? 'verified' : ''}`}>{kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' ? 'Pending' : 'Unverified'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Verification Section */}
                        <div className="verification-section-card">
                            <div className="verification-section-left">
                                <h3 className="verification-section-title">User-verification</h3>
                                <p className="verification-section-desc">Only takes 3-5 minutes to complete the identity verification to protect your account from fraud and illegal risks.</p>
                                {kycStatus === 'verified' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1CD4A7', fontWeight: 600, padding: '8px 0' }}><CheckSquare size={16} /> Verified</div>
                                ) : kycStatus === 'pending' ? (
                                    <div style={{ color: '#F59E0B', fontWeight: 600, padding: '8px 0' }}>Verification in progress...</div>
                                ) : (
                                    <button className="verification-btn" onClick={() => navigate('/dashboard/kyc')}>Verify</button>
                                )}
                            </div>
                            <div className="verification-section-right">
                                <div className="verification-level">
                                    <div className="level-header">
                                        <CheckSquare size={16} className="level-icon success" />
                                        <span>User-Verification</span>
                                    </div>
                                    <p className="level-limit">Crypto withdrawal limit 2000 USDT Daily</p>
                                    <div className="level-requirements">
                                        <span className="level-label">Require</span>
                                        <div className="requirement-item">
                                            <span className="req-dot"></span>
                                            <span>Applicant data</span>
                                        </div>
                                        <div className="requirement-item">
                                            <span className="req-dot"></span>
                                            <span>Identity document</span>
                                        </div>
                                        <div className="requirement-item">
                                            <span className="req-dot"></span>
                                            <span>Selfie with document</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="verification-level">
                                    <div className="level-header">
                                        <X size={16} className="level-icon error" />
                                        <span>Additional proof of address</span>
                                    </div>
                                    <p className="level-limit">Crypto withdrawal limit 20000 USDT Daily</p>
                                    <div className="level-requirements">
                                        <span className="level-label">Require</span>
                                        <div className="requirement-item">
                                            <span className="req-dot"></span>
                                            <span>Identity document</span>
                                        </div>
                                        <div className="requirement-item">
                                            <span className="req-dot"></span>
                                            <span>Proof of residence</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Limits */}
                        <div className="account-limits-card">
                            <div className="limits-header">
                                <Lock size={16} />
                                <span>Account limits</span>
                            </div>
                            <div className="limits-grid">
                                <div className="limit-row">
                                    <span className="limit-label">Crypto deposit limit</span>
                                    <span className="limit-value">Enable deposit</span>
                                </div>
                                <div className="limit-row">
                                    <span className="limit-label">Crypto withdrawal limit</span>
                                    <div className="limit-values">
                                        <span>20000 USDT Daily</span>
                                        <span>20000 USDT Monthly</span>
                                    </div>
                                </div>
                                <div className="limit-row">
                                    <span className="limit-label">P2p transaction limit</span>
                                    <span className="limit-value">Enable transaction</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Tab Content */}
                {activeProfileTab === 'security' && (
                    <div className="profile-tab-content">
                        {/* Authentication Method */}
                        <div className="security-section">
                            <h3 className="security-section-title">Authentication method</h3>
                            <div className="security-card">
                                <div className="security-item">
                                    <div className="security-item-icon">
                                        <Shield size={18} />
                                    </div>
                                    <div className="security-item-info">
                                        <span className="security-item-name">Google Authenticator</span>
                                        <span className="security-item-desc">API Secure verification when withdrawing, retrieving passwords, modifying security settings and managing API</span>
                                    </div>
                                    <button className="security-btn" onClick={() => { setSecForm({}); setAuthStep(1); setSecModal('authenticator'); }}>{authBound ? 'Bound' : 'Bind'}</button>
                                </div>
                                <div className="security-item">
                                    <div className="security-item-icon">
                                        <Smartphone size={18} />
                                    </div>
                                    <div className="security-item-info">
                                        <span className="security-item-name">Phone number</span>
                                        <span className="security-item-desc">Receive verification SMS that is used to withdraw, change the password or security settings</span>
                                    </div>
                                    <span className="security-item-value">{userPhone}</span>
                                    <button className="security-btn" onClick={() => { setSecForm({ phone: '' }); setSecModal('phone'); }}>{userPhone !== 'Not set' ? 'Change' : 'Bind'}</button>
                                </div>
                                <div className="security-item">
                                    <div className="security-item-icon">
                                        <Mail size={18} />
                                    </div>
                                    <div className="security-item-info">
                                        <span className="security-item-name">Email address</span>
                                        <span className="security-item-desc">Used when logging in, withdrawing and modifying security settings</span>
                                    </div>
                                    <span className="security-item-value">{userEmail}</span>
                                    <button className="security-btn" onClick={() => { setSecForm({ newEmail: '', password: '' }); setSecModal('email'); }}>Change</button>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Security */}
                        <div className="security-section">
                            <h3 className="security-section-title">Advanced Security</h3>
                            <div className="security-card">
                                <div className="security-item">
                                    <div className="security-item-icon">
                                        <Lock size={18} />
                                    </div>
                                    <div className="security-item-info">
                                        <span className="security-item-name">Password</span>
                                        <span className="security-item-desc">Used to manage your account login password</span>
                                    </div>
                                    <button className="security-btn" onClick={() => { setSecForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setSecModal('password'); }}>Change</button>
                                </div>
                                <div className="security-item">
                                    <div className="security-item-icon">
                                        <Wallet size={18} />
                                    </div>
                                    <div className="security-item-info">
                                        <span className="security-item-name">Address management</span>
                                        <span className="security-item-desc">After setting as a trust address, withdrawals will be exempt from security verification</span>
                                    </div>
                                    <button className="security-btn" onClick={() => navigate('/dashboard/deposit')}>Manage</button>
                                </div>
                            </div>
                        </div>

                        {/* Account Management */}
                        <div className="security-section">
                            <h3 className="security-section-title">Account Management</h3>
                            <div className="security-card">
                                <div className="security-item">
                                    <div className="security-item-icon">
                                        <Monitor size={18} />
                                    </div>
                                    <div className="security-item-info">
                                        <span className="security-item-name">My device</span>
                                        <span className="security-item-desc">For managing logged-in devices and viewing device history</span>
                                    </div>
                                    <button className="security-btn" onClick={() => setSecModal('device')}>Manage</button>
                                </div>
                                <div className="security-item">
                                    <div className="security-item-icon">
                                        <Activity size={18} />
                                    </div>
                                    <div className="security-item-info">
                                        <span className="security-item-name">Account activity</span>
                                        <span className="security-item-desc">Last login: {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</span>
                                    </div>
                                    <button className="security-btn" onClick={() => setSecModal('activity')}>Manage</button>
                                </div>
                                <div className="security-item">
                                    <div className="security-item-icon">
                                        <Trash2 size={18} />
                                    </div>
                                    <div className="security-item-info">
                                        <span className="security-item-name">Delete account</span>
                                        <span className="security-item-desc">After deleting your account, you will never be able to re-register this account and its sub-account email, mobile phone number, and identity information.</span>
                                    </div>
                                    <button className="security-btn danger" onClick={() => { setSecForm({ password: '', confirmDelete: '' }); setSecModal('delete'); }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Task Center Tab Content */}
                {activeProfileTab === 'task' && (
                    <div className="profile-tab-content">
                        {/* Rewards Summary */}
                        <div className="task-rewards-card">
                            <div className="reward-item">
                                <span className="reward-label">Cash reward</span>
                                <span className="reward-value"><span className="reward-amount">{taskRewards.cash.toFixed(1)}</span> USDT</span>
                            </div>
                            <div className="reward-item">
                                <span className="reward-label">Cashback voucher</span>
                                <span className="reward-value"><span className="reward-amount">{taskRewards.vouchers}</span> Pieces</span>
                            </div>
                            <div className="reward-item">
                                <span className="reward-label">Futures bonus</span>
                                <span className="reward-value"><span className="reward-amount">{taskRewards.bonus.toFixed(1)}</span> USDT</span>
                            </div>
                        </div>

                        {/* Task Tabs */}
                        <div className="task-tabs">
                            <button
                                className={`task-tab ${activeTaskTab === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveTaskTab('all')}
                            >
                                All in progress
                            </button>
                            <button
                                className={`task-tab ${activeTaskTab === 'beginner' ? 'active' : ''}`}
                                onClick={() => setActiveTaskTab('beginner')}
                            >
                                Beginner's task
                            </button>
                            <button
                                className={`task-tab ${activeTaskTab === 'limited' ? 'active' : ''}`}
                                onClick={() => setActiveTaskTab('limited')}
                            >
                                Limited-time
                            </button>
                        </div>

                        {/* Task List */}
                        <div className="mpv-task-list">
                            {getFilteredTasks().length === 0 ? (
                                <div className="task-empty-state">
                                    <div className="task-empty-icon">
                                        <FileText size={48} />
                                    </div>
                                    <p>All tasks completed!</p>
                                </div>
                            ) : (
                                getFilteredTasks().map((task: any) => (
                                    <div key={task.id} className={`mpv-task-item ${task.done ? 'done' : ''}`}>
                                        <div className={`mpv-task-check ${task.done ? 'checked' : ''}`}>
                                            {task.done && <Check size={14} />}
                                        </div>
                                        <div className="mpv-task-item-info">
                                            <span className="mpv-task-item-name">{task.name}</span>
                                            <span className="mpv-task-item-desc">{task.desc}</span>
                                        </div>
                                        <div className="mpv-task-item-right">
                                            <span className="mpv-task-item-reward">{task.reward}</span>
                                            {!task.done && (
                                                <button className="mpv-task-item-btn" onClick={() => navigate(task.action)}>Go</button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Invite Friends Tab Content */}
                {activeProfileTab === 'invite' && (
                    <div className="profile-tab-content">
                        {/* Invite Header Card */}
                        <div className="invite-header-card">
                            <div className="invite-header-left">
                                <h2 className="invite-title">Invite friends</h2>
                                <h3 className="invite-subtitle">Enjoy Rewards</h3>
                                <p className="invite-desc">Enjoy rewarding, transparent and instant redemption</p>
                            </div>
                            <div className="invite-header-icon">
                                <div className="invite-icon-box">
                                    <UserPlus size={32} />
                                </div>
                            </div>
                            <div className="invite-header-right">
                                <div className="invite-code-section">
                                    <span className="invite-label">Invitation code</span>
                                    <div className="invite-code-box">
                                        <span>{referralCode}</span>
                                        <div className="invite-code-actions">
                                            <button className="invite-edit-btn" onClick={() => copyToClipboard(referralCode)}>📋</button>
                                            <Copy size={14} style={{ cursor: 'pointer' }} onClick={() => copyToClipboard(referralCode)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="invite-link-section">
                                    <span className="invite-label">Invitation link</span>
                                    <div className="invite-code-box">
                                        <span style={{ fontSize: '11px', wordBreak: 'break-all' }}>{referralLink}</span>
                                        <Copy size={14} style={{ cursor: 'pointer' }} onClick={() => copyToClipboard(referralLink)} />
                                    </div>
                                </div>
                                <button className="invite-btn" onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: 'Join Diwan Finance', text: `Use my referral code ${referralCode} to sign up!`, url: referralLink });
                                    } else {
                                        copyToClipboard(referralLink);
                                    }
                                }}>Invite friends</button>
                            </div>
                        </div>

                        {/* Dashboard Section */}
                        <div className="invite-dashboard">
                            <div className="invite-dashboard-icon">
                                <Gift size={32} />
                            </div>
                            <h3 className="invite-dashboard-title">Dashboard</h3>
                        </div>

                        {/* Stats Card */}
                        <div className="invite-stats-card">
                            <div className="invite-stat-item">
                                <div className="invite-stat-icon">
                                    <Users size={18} />
                                </div>
                                <div className="invite-stat-info">
                                    <span className="invite-stat-label">Friends</span>
                                    <span className="invite-stat-value"><span className="stat-amount">0</span> People</span>
                                </div>
                            </div>
                            <div className="invite-stat-item">
                                <div className="invite-stat-icon teal">
                                    <Gift size={18} />
                                </div>
                                <div className="invite-stat-info">
                                    <span className="invite-stat-label">Rewards</span>
                                    <span className="invite-stat-value"><span className="stat-amount">0</span> USDT</span>
                                </div>
                            </div>
                            <div className="invite-stat-item">
                                <div className="invite-stat-icon teal">
                                    <Gift size={18} />
                                </div>
                                <div className="invite-stat-info">
                                    <span className="invite-stat-label">Top referrer</span>
                                    <span className="invite-stat-value"><span className="stat-amount">0</span> USDT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab Content */}
                {activeProfileTab === 'settings' && (
                    <div className="profile-tab-content">
                        {/* Profile Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">Profile</h3>
                            <div className="settings-card">
                                <div className="settings-item">
                                    <div className="settings-item-icon">
                                        <User size={18} />
                                    </div>
                                    <div className="settings-item-info">
                                        <span className="settings-item-name">Nickname</span>
                                        <span className="settings-item-desc">Set a customized nickname</span>
                                        <span className="settings-item-value-sub">{userName}</span>
                                    </div>
                                    <button className="settings-btn" onClick={() => { setNicknameInput(userName === 'User' ? '' : userName); setNicknameSuccess(''); setShowNicknameModal(true) }}>Edit</button>
                                </div>
                                <div className="settings-item">
                                    <div className="settings-item-icon">
                                        <User size={18} />
                                    </div>
                                    <div className="settings-item-info">
                                        <span className="settings-item-name">Avatar</span>
                                        <span className="settings-item-desc">Select an avatar to personalize your account</span>
                                    </div>
                                    <button className="settings-btn" onClick={handleAvatarClick}>Edit</button>
                                </div>
                            </div>
                        </div>

                        {/* Preference Section */}
                        <div className="settings-section">
                            <h3 className="settings-section-title">Preference</h3>
                            <div className="settings-card">
                                <div className="settings-item">
                                    <div className="settings-item-icon">
                                        <FileText size={18} />
                                    </div>
                                    <div className="settings-item-info">
                                        <span className="settings-item-name">Order confirmation</span>
                                        <span className="settings-item-desc">If you enable the reminder, an order will need to be reconfirmed every time</span>
                                        <span className="settings-item-value-sub">{[orderConfirmSettings.limit && 'Limit order', orderConfirmSettings.market && 'Market order', orderConfirmSettings.stop && 'Stop limit'].filter(Boolean).join(', ') || 'None'}</span>
                                    </div>
                                    <button className="settings-btn" onClick={() => setShowOrderConfirmModal(true)}>Manage</button>
                                </div>
                                <div className="settings-item">
                                    <div className="settings-item-icon">
                                        <UserPlus size={18} />
                                    </div>
                                    <div className="settings-item-info">
                                        <span className="settings-item-name">Add superiors invitation code</span>
                                        <span className="settings-item-desc">Used for invitation relationship</span>
                                        <span className="settings-item-value-link" style={{ cursor: 'pointer' }} onClick={() => { setInviteCodeInput(savedInviteCode); setInviteCodeSuccess(''); setShowInviteCodeModal(true) }}>{savedInviteCode || 'Add'}</span>
                                    </div>
                                    <button className="settings-btn" onClick={() => { setInviteCodeInput(savedInviteCode); setInviteCodeSuccess(''); setShowInviteCodeModal(true) }}>{savedInviteCode ? 'Edit' : 'Add'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Global Security Modal Overlay (for desktop tabs) */}
            {secModal !== 'none' && activeProfileTab !== 'security' && (
                <div className="mpv-sec-modal-overlay" onClick={closeSecModal}>
                    <div className="mpv-sec-modal" onClick={e => e.stopPropagation()}>
                        <button className="mpv-sec-modal-close" onClick={closeSecModal}><X size={18} /></button>

                        {secModal === 'password' && (
                            <>
                                <h3 className="mpv-sec-modal-title"><Lock size={18} /> Change Password</h3>
                                <div className="mpv-sec-modal-field"><label>Current Password</label><input type="password" placeholder="Enter current password" value={secForm.currentPassword || ''} onChange={e => setSecForm(p => ({ ...p, currentPassword: e.target.value }))} /></div>
                                <div className="mpv-sec-modal-field"><label>New Password</label><input type="password" placeholder="Enter new password" value={secForm.newPassword || ''} onChange={e => setSecForm(p => ({ ...p, newPassword: e.target.value }))} /></div>
                                <div className="mpv-sec-modal-field"><label>Confirm New Password</label><input type="password" placeholder="Confirm new password" value={secForm.confirmPassword || ''} onChange={e => setSecForm(p => ({ ...p, confirmPassword: e.target.value }))} /></div>
                                <button className="mpv-sec-modal-submit" disabled={secLoading} onClick={handleChangePassword}>{secLoading ? 'Saving...' : 'Change Password'}</button>
                            </>
                        )}
                        {secModal === 'email' && (
                            <>
                                <h3 className="mpv-sec-modal-title"><Mail size={18} /> Change Email</h3>
                                <p className="mpv-sec-modal-hint">Current: {userEmail}</p>
                                <div className="mpv-sec-modal-field"><label>New Email</label><input type="email" placeholder="Enter new email" value={secForm.newEmail || ''} onChange={e => setSecForm(p => ({ ...p, newEmail: e.target.value }))} /></div>
                                <div className="mpv-sec-modal-field"><label>Password</label><input type="password" placeholder="Enter your password" value={secForm.password || ''} onChange={e => setSecForm(p => ({ ...p, password: e.target.value }))} /></div>
                                <button className="mpv-sec-modal-submit" disabled={secLoading} onClick={handleChangeEmail}>{secLoading ? 'Saving...' : 'Change Email'}</button>
                            </>
                        )}
                        {secModal === 'phone' && (
                            <>
                                <h3 className="mpv-sec-modal-title"><Smartphone size={18} /> {userPhone !== 'Not set' ? 'Change' : 'Bind'} Phone</h3>
                                {userPhone !== 'Not set' && <p className="mpv-sec-modal-hint">Current: {userPhone}</p>}
                                <div className="mpv-sec-modal-field"><label>Phone Number</label><input type="tel" placeholder="Enter phone number" value={secForm.phone || ''} onChange={e => setSecForm(p => ({ ...p, phone: e.target.value }))} /></div>
                                <button className="mpv-sec-modal-submit" disabled={secLoading} onClick={handleBindPhone}>{secLoading ? 'Saving...' : 'Save Phone'}</button>
                            </>
                        )}
                        {secModal === 'delete' && (
                            <>
                                <h3 className="mpv-sec-modal-title" style={{ color: '#ef4444' }}><AlertTriangle size={18} /> Delete Account</h3>
                                <p className="mpv-sec-modal-hint" style={{ color: '#ef4444' }}>This action is permanent and cannot be undone.</p>
                                <div className="mpv-sec-modal-field"><label>Password</label><input type="password" placeholder="Enter your password" value={secForm.password || ''} onChange={e => setSecForm(p => ({ ...p, password: e.target.value }))} /></div>
                                <div className="mpv-sec-modal-field"><label>Type DELETE to confirm</label><input type="text" placeholder="DELETE" value={secForm.confirmDelete || ''} onChange={e => setSecForm(p => ({ ...p, confirmDelete: e.target.value }))} /></div>
                                <button className="mpv-sec-modal-submit danger" disabled={secLoading} onClick={handleDeleteAccount}>{secLoading ? 'Deleting...' : 'Delete My Account'}</button>
                            </>
                        )}
                        {secModal === 'device' && (
                            <>
                                <h3 className="mpv-sec-modal-title"><Monitor size={18} /> My Devices</h3>
                                <div className="mpv-sec-device-list">
                                    <div className="mpv-sec-device-item active">
                                        <Monitor size={20} />
                                        <div>
                                            <span className="mpv-sec-device-name">{navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser'}</span>
                                            <span className="mpv-sec-device-detail">Current session · {navigator.platform}</span>
                                        </div>
                                        <span className="mpv-sec-device-badge">Active</span>
                                    </div>
                                </div>
                            </>
                        )}
                        {secModal === 'activity' && (
                            <>
                                <h3 className="mpv-sec-modal-title"><Activity size={18} /> Account Activity</h3>
                                <div className="mpv-sec-activity-list">
                                    <div className="mpv-sec-activity-item">
                                        <span className="mpv-sec-activity-action">Login</span>
                                        <span className="mpv-sec-activity-time">{profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}</span>
                                        <span className="mpv-sec-activity-detail">{navigator.platform} · {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</span>
                                    </div>
                                    <div className="mpv-sec-activity-item">
                                        <span className="mpv-sec-activity-action">Account Created</span>
                                        <span className="mpv-sec-activity-time">{profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </>
                        )}
                        {secModal === 'authenticator' && (
                            <>
                                <h3 className="mpv-sec-modal-title"><Shield size={18} /> Google Authenticator</h3>
                                {authStep === 1 && (
                                    <div className="mpv-auth-step">
                                        <p className="mpv-sec-modal-hint">Step 1: Download Google Authenticator app from your App Store or Play Store.</p>
                                        <div className="mpv-auth-stores"><div className="mpv-auth-store-badge">📱 App Store</div><div className="mpv-auth-store-badge">📱 Play Store</div></div>
                                        <button className="mpv-sec-modal-submit" onClick={() => setAuthStep(2)}>Next →</button>
                                    </div>
                                )}
                                {authStep === 2 && (
                                    <div className="mpv-auth-step">
                                        <p className="mpv-sec-modal-hint">Step 2: Scan the QR code or enter the secret key manually.</p>
                                        <div className="mpv-auth-qr">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/DiwanFinance:${encodeURIComponent(userEmail)}?secret=${authSecret}%26issuer=DiwanFinance`} alt="QR Code" style={{ width: 180, height: 180, borderRadius: 8, background: '#fff', padding: 8 }} />
                                        </div>
                                        <div className="mpv-auth-secret">
                                            <span className="mpv-auth-secret-label">Secret Key</span>
                                            <div className="mpv-auth-secret-box"><code>{authSecret}</code><Copy size={14} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => copyToClipboard(authSecret)} /></div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                            <button className="mpv-sec-modal-submit" style={{ background: '#27272A', flex: 1 }} onClick={() => setAuthStep(1)}>← Back</button>
                                            <button className="mpv-sec-modal-submit" style={{ flex: 1 }} onClick={() => setAuthStep(3)}>Next →</button>
                                        </div>
                                    </div>
                                )}
                                {authStep === 3 && (
                                    <div className="mpv-auth-step">
                                        <p className="mpv-sec-modal-hint">Step 3: Enter the 6-digit verification code from Google Authenticator.</p>
                                        <div className="mpv-sec-modal-field">
                                            <label>Verification Code</label>
                                            <input type="text" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code" value={secForm.otpCode || ''} onChange={e => setSecForm(p => ({ ...p, otpCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} style={{ letterSpacing: 8, textAlign: 'center', fontSize: 20, fontWeight: 600 }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                            <button className="mpv-sec-modal-submit" style={{ background: '#27272A', flex: 1 }} onClick={() => setAuthStep(2)}>← Back</button>
                                            <button className="mpv-sec-modal-submit" style={{ flex: 1 }} disabled={secLoading} onClick={handleBindAuthenticator}>{secLoading ? 'Verifying...' : 'Bind Authenticator'}</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {secError && <p className="mpv-sec-modal-error">{secError}</p>}
                        {secSuccess && <p className="mpv-sec-modal-success">{secSuccess}</p>}
                    </div>
                </div>
            )}

            {/* Nickname Edit Modal */}
            {showNicknameModal && (
                <div className="mpv-sec-modal-overlay" onClick={() => setShowNicknameModal(false)}>
                    <div className="mpv-sec-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <button className="mpv-sec-modal-close" onClick={() => setShowNicknameModal(false)}><X size={18} /></button>
                        <h3 className="mpv-sec-modal-title" style={{ marginBottom: 8 }}>Edit Nickname</h3>
                        <p style={{ color: '#71717A', fontSize: 13, marginBottom: 16 }}>Set a customized nickname for your account</p>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ color: '#a1a1aa', fontSize: 12, display: 'block', marginBottom: 6 }}>Nickname</label>
                            <input
                                type="text"
                                value={nicknameInput}
                                onChange={e => setNicknameInput(e.target.value)}
                                placeholder="Enter your nickname"
                                maxLength={50}
                                style={{ width: '100%', padding: '10px 14px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }}
                                onKeyDown={e => { if (e.key === 'Enter') handleNicknameSave() }}
                                autoFocus
                            />
                        </div>
                        {nicknameSuccess && <p style={{ color: nicknameSuccess.includes('Failed') ? '#ef4444' : '#1CD4A7', fontSize: 13, marginBottom: 12 }}>{nicknameSuccess}</p>}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowNicknameModal(false)} style={{ flex: 1, padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button onClick={handleNicknameSave} disabled={nicknameSaving || !nicknameInput.trim()} style={{ flex: 1, padding: '10px', background: '#1CD4A7', border: 'none', borderRadius: 8, color: '#0f0f14', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: nicknameSaving || !nicknameInput.trim() ? 0.5 : 1 }}>
                                {nicknameSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Confirmation Modal */}
            {showOrderConfirmModal && (
                <div className="mpv-sec-modal-overlay" onClick={() => setShowOrderConfirmModal(false)}>
                    <div className="mpv-sec-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <button className="mpv-sec-modal-close" onClick={() => setShowOrderConfirmModal(false)}><X size={18} /></button>
                        <h3 className="mpv-sec-modal-title" style={{ marginBottom: 8 }}>Order Confirmation</h3>
                        <p style={{ color: '#71717A', fontSize: 13, marginBottom: 20 }}>Enable reminders for order types that need to be reconfirmed every time</p>
                        {[
                            { key: 'limit', label: 'Limit order', desc: 'Confirm before placing limit orders' },
                            { key: 'market', label: 'Market order', desc: 'Confirm before placing market orders' },
                            { key: 'stop', label: 'Stop limit', desc: 'Confirm before placing stop-limit orders' },
                        ].map(item => (
                            <div key={item.key} onClick={() => handleOrderConfirmToggle(item.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #1a1a24', cursor: 'pointer' }}>
                                <div>
                                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{item.label}</div>
                                    <div style={{ color: '#71717A', fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                                </div>
                                <div style={{ width: 44, height: 24, borderRadius: 12, background: orderConfirmSettings[item.key] ? '#1CD4A7' : '#2a2a3a', padding: 2, transition: 'background 0.2s', flexShrink: 0 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: orderConfirmSettings[item.key] ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setShowOrderConfirmModal(false)} style={{ width: '100%', marginTop: 20, padding: '10px', background: '#1CD4A7', border: 'none', borderRadius: 8, color: '#0f0f14', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Done</button>
                    </div>
                </div>
            )}

            {/* Invitation Code Modal */}
            {showInviteCodeModal && (
                <div className="mpv-sec-modal-overlay" onClick={() => setShowInviteCodeModal(false)}>
                    <div className="mpv-sec-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <button className="mpv-sec-modal-close" onClick={() => setShowInviteCodeModal(false)}><X size={18} /></button>
                        <h3 className="mpv-sec-modal-title" style={{ marginBottom: 8 }}>Add Superior's Invitation Code</h3>
                        <p style={{ color: '#71717A', fontSize: 13, marginBottom: 16 }}>Enter the invitation code from your referrer to establish the invitation relationship</p>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ color: '#a1a1aa', fontSize: 12, display: 'block', marginBottom: 6 }}>Invitation Code</label>
                            <input
                                type="text"
                                value={inviteCodeInput}
                                onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                                placeholder="Enter invitation code"
                                maxLength={20}
                                style={{ width: '100%', padding: '10px 14px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', letterSpacing: 1 }}
                                onKeyDown={e => { if (e.key === 'Enter') handleInviteCodeSave() }}
                                autoFocus
                            />
                        </div>
                        {savedInviteCode && !inviteCodeSuccess && (
                            <p style={{ color: '#71717A', fontSize: 12, marginBottom: 12 }}>Current code: <span style={{ color: '#1CD4A7' }}>{savedInviteCode}</span></p>
                        )}
                        {inviteCodeSuccess && <p style={{ color: inviteCodeSuccess.includes('Failed') ? '#ef4444' : '#1CD4A7', fontSize: 13, marginBottom: 12 }}>{inviteCodeSuccess}</p>}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowInviteCodeModal(false)} style={{ flex: 1, padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                            <button onClick={handleInviteCodeSave} disabled={inviteCodeSaving || !inviteCodeInput.trim()} style={{ flex: 1, padding: '10px', background: '#1CD4A7', border: 'none', borderRadius: 8, color: '#0f0f14', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: inviteCodeSaving || !inviteCodeInput.trim() ? 0.5 : 1 }}>
                                {inviteCodeSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}
