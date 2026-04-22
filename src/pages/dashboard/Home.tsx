"use client"
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, TrendingUp, Repeat, Wallet, Target, Grid3X3, GraduationCap, Megaphone, ChevronDown, X, ShieldCheck } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { useAuth } from '../../context/AuthContext'
import { getDetailedMarketData } from '../../services/tradeService'
import '../../styles/dashboard.css'
import '../../styles/landing.css'


const mobileQuickActions: { icon: React.ElementType; label: string; path?: string; action?: () => void }[] = [
    { icon: Target, label: 'Task center', path: '/dashboard/campaign' },
    { icon: Wallet, label: 'Deposit', path: '/dashboard/deposit' },
    { icon: TrendingUp, label: 'Market', path: '/dashboard/market?view=list&tab=spot' },
    { icon: Target, label: 'Earn', path: '/dashboard/earn' },
    { icon: Repeat, label: 'Futures', path: '/dashboard/futures' },
    { icon: Grid3X3, label: 'Grid', path: '/dashboard/spot-grid' },
    { icon: GraduationCap, label: 'Academy', path: '/dashboard/academy' },
    { icon: Megaphone, label: 'Campaign', path: '/dashboard/campaign' },
]

const homeCoinLogos: Record<string, string> = {
    BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
}

const homeSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'AVAX/USDT', 'DOGE/USDT', 'BNB/USDT', 'ADA/USDT']

export default function Home() {
    const navigate = useNavigate()
    const { isLoggedIn, user } = useAuth()

    const [mobileCryptoData, setMobileCryptoData] = useState([
        { symbol: 'BTC', name: '/USDT', logo: homeCoinLogos.BTC, price: '—', change: '—', positive: true, volume: '—' },
        { symbol: 'ETH', name: '/USDT', logo: homeCoinLogos.ETH, price: '—', change: '—', positive: true, volume: '—' },
        { symbol: 'XRP', name: '/USDT', logo: homeCoinLogos.XRP, price: '—', change: '—', positive: true, volume: '—' },
        { symbol: 'SOL', name: '/USDT', logo: homeCoinLogos.SOL, price: '—', change: '—', positive: true, volume: '—' },
        { symbol: 'AVAX', name: '/USDT', logo: homeCoinLogos.AVAX, price: '—', change: '—', positive: true, volume: '—' },
        { symbol: 'DOGE', name: '/USDT', logo: homeCoinLogos.DOGE, price: '—', change: '—', positive: true, volume: '—' },
        { symbol: 'BNB', name: '/USDT', logo: homeCoinLogos.BNB, price: '—', change: '—', positive: true, volume: '—' },
        { symbol: 'ADA', name: '/USDT', logo: homeCoinLogos.ADA, price: '—', change: '—', positive: true, volume: '—' },
    ])

    useEffect(() => {
        let ws: WebSocket | null = null;
        let retryTimeout: any;
        let fallbackPollInterval: any;
        let isWsConnected = false;

        const formatVol = (n: number) => {
            if (!n) return '—';
            if (n > 1e9) return `$${(n / 1e9).toFixed(2)}B`;
            if (n > 1e6) return `$${(n / 1e6).toFixed(2)}M`;
            return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        };

        const applyMarketSnapshot = (snapshot: Record<string, any>) => {
            setMobileCryptoData(prev => {
                let hasChanges = false;
                const next = prev.map(item => {
                    const key = `${item.symbol}/USDT`;
                    const data = snapshot[key];
                    if (!data || typeof data.price !== 'number' || data.price <= 0) return item;

                    const p = data.price;
                    const changePct = typeof data.change24h === 'number' ? data.change24h : 0;
                    const vol = typeof data.volume24h === 'number' ? data.volume24h : 0;

                    const updated = {
                        ...item,
                        price: `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
                        positive: changePct >= 0,
                        volume: formatVol(vol),
                    };

                    if (
                        updated.price !== item.price ||
                        updated.change !== item.change ||
                        updated.volume !== item.volume ||
                        updated.positive !== item.positive
                    ) {
                        hasChanges = true;
                    }

                    return updated;
                });
                return hasChanges ? next : prev;
            });
        };

        const fetchFallbackPrices = async () => {
            try {
                const snapshot = await getDetailedMarketData(homeSymbols);
                applyMarketSnapshot(snapshot);
            } catch {
                // Ignore fallback errors and keep current UI values.
            }
        };

        const connectWS = () => {
            try {
                ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
                ws.onopen = () => { isWsConnected = true; };
                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (Array.isArray(data)) {
                            setMobileCryptoData(prev => {
                                let hasChanges = false;
                                const next = prev.map(item => {
                                    const wsSym = item.symbol + 'USDT';
                                    const ticker = data.find((t: any) => t.s === wsSym);
                                    if (ticker) {
                                        hasChanges = true;
                                        const p = parseFloat(ticker.c);
                                        const changePct = parseFloat(ticker.P);
                                        const vol = parseFloat(ticker.q);

                                        return {
                                            ...item,
                                            price: `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                            change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
                                            positive: changePct >= 0,
                                            volume: formatVol(vol),
                                        };
                                    }
                                    return item;
                                });
                                return hasChanges ? next : prev;
                            });
                        }
                    } catch (e) { /* ignore */ }
                };
                ws.onerror = () => { isWsConnected = false; if (ws) ws.close(); };
                ws.onclose = () => { isWsConnected = false; retryTimeout = setTimeout(connectWS, 5000); };
            } catch (err) {
                isWsConnected = false;
                retryTimeout = setTimeout(connectWS, 5000);
            }
        };

        fetchFallbackPrices();
        fallbackPollInterval = setInterval(() => {
            if (!isWsConnected) fetchFallbackPrices();
        }, 12000);

        connectWS();
        return () => {
            clearTimeout(retryTimeout);
            clearInterval(fallbackPollInterval);
            if (ws) {
                ws.onclose = null;
                ws.onerror = null;
                ws.close();
            }
        };
    }, []);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <Layout activePage="home" hideFooter={false}>
            <div className="mobile-home-view">
                <div className="mobile-header-bar">
                    <div className="mobile-header-left">
                        <img src="/logo.png" alt="Diwanfinance" className="mobile-header-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }} />
                    </div>
                    <div className="mobile-header-right">
                        <div className="mobile-header-icon">
                            <Search size={22} />
                        </div>
                        {isLoggedIn && (
                            <div className="mobile-header-profile" onClick={() => navigate('/dashboard/profile')}>
                                <div className="mobile-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                                <ChevronDown size={14} className="mobile-avatar-chevron" />
                            </div>
                        )}
                        <div className="mobile-header-icon" onClick={() => setMobileMenuOpen(true)}>
                            <Menu size={22} />
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`mobile-menu-overlay-v2 ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    <div className={`mobile-menu-drawer-v2 ${mobileMenuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-drawer-header">
                            <img src="/logo.png" alt="Logo" className="mobile-drawer-logo" />
                            <div className="mobile-drawer-close" onClick={() => setMobileMenuOpen(false)}>
                                <X size={24} />
                            </div>
                        </div>

                        <div className="mobile-drawer-content">
                            {isLoggedIn ? (
                                <div className="mobile-drawer-user">
                                    <div className="drawer-user-info">
                                        <div className="drawer-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                                        <div className="drawer-user-details">
                                            <span className="drawer-username">{user?.name || 'User'}</span>
                                            <span className="drawer-email">{user?.email || ''}</span>
                                        </div>
                                    </div>
                                    <div className="drawer-verified-badge">
                                        <ShieldCheck size={14} />
                                        <span>Verified</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mobile-drawer-guest">
                                    <h3>Welcome to Diwanfinance</h3>
                                    <p>Sign in to start trading</p>
                                    <div className="drawer-auth-btns">
                                        <button className="drawer-signin-btn" onClick={() => navigate('/signin')}>Sign In</button>
                                        <button className="drawer-signup-btn" onClick={() => navigate('/signup')}>Create Account</button>
                                    </div>
                                </div>
                            )}

                            <div className="drawer-divider"></div>

                            <nav className="drawer-nav">
                                <div className="drawer-nav-section">Navigation</div>
                                <div className="drawer-nav-item" onClick={() => { navigate('/dashboard/market'); setMobileMenuOpen(false); }}>
                                    <TrendingUp size={20} />
                                    <span>Market</span>
                                </div>
                                <div className="drawer-nav-item" onClick={() => { navigate('/dashboard/trade'); setMobileMenuOpen(false); }}>
                                    <Repeat size={20} />
                                    <span>Trade</span>
                                </div>
                                <div className="drawer-nav-item" onClick={() => { navigate('/dashboard/futures'); setMobileMenuOpen(false); }}>
                                    <Grid3X3 size={20} />
                                    <span>Futures</span>
                                </div>
                                <div className="drawer-nav-item" onClick={() => { navigate('/dashboard/deposit'); setMobileMenuOpen(false); }}>
                                    <Wallet size={20} />
                                    <span>Deposit Crypto</span>
                                </div>
                                <div className="drawer-nav-item" onClick={() => { navigate('/dashboard/withdraw'); setMobileMenuOpen(false); }}>
                                    <Wallet size={20} />
                                    <span>Withdraw Crypto</span>
                                </div>
                                <div className="drawer-nav-item" onClick={() => { navigate('/dashboard/assets'); setMobileMenuOpen(false); }}>
                                    <Target size={20} />
                                    <span>Assets</span>
                                </div>
                                <div className="drawer-nav-item" onClick={() => { navigate('/dashboard/campaign'); setMobileMenuOpen(false); }}>
                                    <Megaphone size={20} />
                                    <span>Campaign</span>
                                </div>
                                <div className="drawer-nav-item" onClick={() => { navigate('/dashboard/academy'); setMobileMenuOpen(false); }}>
                                    <GraduationCap size={20} />
                                    <span>Academy</span>
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="mobile-promo-banner" style={{ padding: 0, overflow: 'hidden' }}>
                    <img src="/mobile.jpeg" alt="Promo Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>

                <div className="mobile-quick-actions">
                    <div className="mobile-quick-actions-grid">
                        {mobileQuickActions.map((action, index) => (
                            <div
                                key={index}
                                className="mobile-quick-action"
                                onClick={() => action.action ? action.action() : action.path && navigate(action.path)}
                            >
                                <div className="mobile-quick-action-icon">
                                    <action.icon size={24} />
                                </div>
                                <span className="mobile-quick-action-label">{action.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mobile-crypto-section">
                    <div className="mobile-crypto-list">
                        {mobileCryptoData.map((coin, index) => (
                            <div
                                key={index}
                                className="mobile-crypto-item"
                                onClick={() => navigate(`/dashboard/trade?pair=${coin.symbol}/USDT`)}
                            >
                                <div className="mobile-crypto-info">
                                    <img src={coin.logo} alt={coin.symbol} className="mobile-crypto-logo" />
                                    <div className="mobile-crypto-details">
                                        <span className="mobile-crypto-symbol">{coin.symbol}</span>
                                        <span className="mobile-crypto-name">{coin.name}</span>
                                    </div>
                                </div>
                                <div className="mobile-crypto-price-section">
                                    <span className="mobile-crypto-price">{coin.price}</span>
                                    <span className={`mobile-crypto-change ${coin.positive ? 'positive' : 'negative'}`}>
                                        {coin.change}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="desktop-only landing-container">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1 className="hero-title">
                                Start Your Crypto<br />
                                Journey With<br />
                                <span className="hero-highlight-gradient">Confidence</span>
                            </h1>
                            <p className="hero-description">
                                Experience the next generation of digital asset trading.
                                Deep liquidity, advanced security, and seamless performance
                                for professional traders.
                            </p>
                            <div className="hero-cta-group">
                                <button className="hero-cta" onClick={() => navigate('/signup')}>Get started</button>
                            </div>
                        </div>
                        <div className="hero-right">
                            <img src="/11.png" alt="Trading Visual" className="hero-main-img" />
                        </div>
                    </div>
                </section>

                {/* Market Section - Moved to 2nd */}
                <section className="market-section-landing">
                    <div className="market-header-landing">
                        <h2 className="section-title">Explore Live Market Opportunities</h2>
                        <p className="section-subtitle">View real-time prices, market movements, and trading volume across popular crypto pairs, and access spot trading directly from the market list.</p>
                    </div>
                    <div className="market-table-container">
                        <table className="market-table-landing">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Market</th>
                                    <th>Last Price</th>
                                    <th>Change</th>
                                    <th>24H Volume</th>
                                    <th>Trade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mobileCryptoData.map((coin, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <div className="market-coin-info">
                                                <img src={coin.logo} alt={coin.symbol} className="market-coin-logo" />
                                                <span className="market-coin-symbol">{coin.symbol}</span>
                                                <span className="market-coin-pair">{coin.name}</span>
                                            </div>
                                        </td>
                                        <td>{coin.price}</td>
                                        <td className={coin.positive ? 'positive' : 'negative'}>{coin.change}</td>
                                        <td>{coin.volume}</td>
                                        <td>
                                            <button className="trade-btn" onClick={() => navigate(`/dashboard/trade?pair=${coin.symbol}/USDT`)}>Trade</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="view-more-market" onClick={() => navigate('/dashboard/market')}>
                            View More Assets <TrendingUp size={16} />
                        </div>
                    </div>
                </section>

                {/* More Ways Section - 3rd */}
                <section className="more-ways-section-v2">
                    <div className="section-header-centered">
                        <h2 className="section-title">More Ways To Access Crypto Markets</h2>
                        <p className="section-subtitle">
                            Explore additional options to buy, manage, and move your assets within your <br />
                            DiwanFinance account using secure and user-friendly tools.
                        </p>
                    </div>
                    <div className="ways-grid-v2">
                        <div className="way-card-v2">
                            <div className="way-visual-v2">
                                <img src="/7.png" alt="Purchases" />
                            </div>
                            <h3 className="way-title-v2">Simple Crypto Purchases</h3>
                            <p className="way-desc-v2">Buy crypto easily using supported payment methods, with a straightforward process</p>
                        </div>
                        <div className="way-card-v2">
                            <div className="way-visual-v2">
                                <img src="/8.png" alt="Partners" />
                            </div>
                            <h3 className="way-title-v2">Trusted Payment Partners</h3>
                            <p className="way-desc-v2">Complete crypto purchases through verified third-party providers, ensuring secure transactions</p>
                        </div>
                        <div className="way-card-v2">
                            <div className="way-visual-v2">
                                <img src="/9.png" alt="Wallet" />
                            </div>
                            <h3 className="way-title-v2">Direct Wallet Credit</h3>
                            <p className="way-desc-v2">Purchased crypto is credited directly to your DiwanFinance wallet</p>
                        </div>
                    </div>
                </section>

                {/* Features Section - Built for Reliable Trading */}
                <section className="features-section">
                    <div className="section-header-centered">
                        <h2 className="section-title">Built For A Reliable Trading Experience</h2>
                        <p className="section-subtitle">
                            Access essential tools, secure infrastructure, and platform features designed to <br />
                            support efficient trading and asset management on DiwanFinance.
                        </p>
                    </div>
                    <div className="features-grid-v2">
                        <div className="feature-card-v2">
                            <div className="feature-icon-v2"><ShieldCheck size={24} /></div>
                            <h3 className="feature-title-v2">Maximum Security</h3>
                            <p className="feature-desc-v2">Your assets are protected with cutting-edge security protocols.</p>
                        </div>
                        <div className="feature-card-v2">
                            <div className="feature-icon-v2"><TrendingUp size={24} /></div>
                            <h3 className="feature-title-v2">Instant Transactions</h3>
                            <p className="feature-desc-v2">Execute your transactions in real-time, without delays.</p>
                        </div>
                        <div className="feature-card-v2">
                            <div className="feature-icon-v2"><TrendingUp size={24} /></div>
                            <h3 className="feature-title-v2">Optimized Fees</h3>
                            <p className="feature-desc-v2">Benefit from some of the lowest fees on the market.</p>
                        </div>
                        <div className="feature-card-v2">
                            <div className="feature-icon-v2"><Repeat size={24} /></div>
                            <h3 className="feature-title-v2">Seamless Trading Tools</h3>
                            <p className="feature-desc-v2">Use integrated trading tools built to support spot and futures</p>
                        </div>
                        <div className="feature-card-v2">
                            <div className="feature-icon-v2"><TrendingUp size={24} /></div>
                            <h3 className="feature-title-v2">Affiliate Program</h3>
                            <p className="feature-desc-v2">Benefit from some of the lowest fees on the market.</p>
                        </div>
                    </div>
                </section>


                {/* Confidence Section - 5th */}
                <section className="confidence-section">
                    <div className="confidence-content">
                        <div className="confidence-text">
                            <h1 className="confidence-title">Trade And Manage Crypto With Confidence</h1>
                            <p className="confidence-subtitle">
                                Use a secure and reliable platform to access crypto markets,
                                manage balances, and perform transactions across devices.
                            </p>
                        </div>
                        <div className="confidence-visual">
                            <img src="/10.png" alt="Trade Confidence" className="confidence-main-img" />
                        </div>
                    </div>
                </section>

                {/* CTA Banner Section */}
                <section className="cta-banner-section">
                    <div className="cta-banner-card">
                        <div className="cta-banner-content">
                            <h2 className="cta-title">Start Trading On DiwanFinance</h2>
                            <p className="cta-subtitle">
                                Create an account to access live markets, manage your assets, and <br />
                                trade across supported products within a secure platform environment.
                            </p>
                            <button className="cta-main-btn" onClick={() => navigate('/dashboard/deposit')}>Deposit crypto</button>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    )
}


