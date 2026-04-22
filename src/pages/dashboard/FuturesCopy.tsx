import { Search, ChevronDown, User, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import Layout from '../../components/Layout/Layout'
import '../../styles/dashboard.css'
import '../../styles/futures-copy.css'

interface Trader {
    id: string
    email: string
    avatar?: string
    followers: string
    roi: string
    pnl: string
    winRate: string
    activeCopytraders: number
    holdingSize: string
}

interface TradeHistory {
    id: string
    pair: string
    type: 'Long' | 'Short'
    price: string
    pnl: string
    pnlPercent: string
    isProfit: boolean
}

const traders: Trader[] = [
    { id: '1', email: 'nosleeping@outlook.com', followers: '8/500', roi: '0.00%', pnl: '$0.00', winRate: '0.00', activeCopytraders: 116, holdingSize: '0.00' },
    { id: '2', email: 'nosleeping@outlook.com', followers: '8/500', roi: '0.00%', pnl: '$0.00', winRate: '0.00', activeCopytraders: 116, holdingSize: '0.00' },
    { id: '3', email: 'nosleeping@outlook.com', followers: '8/500', roi: '0.00%', pnl: '$0.00', winRate: '0.00', activeCopytraders: 116, holdingSize: '0.00' },
    { id: '4', email: 'nosleeping@outlook.com', followers: '8/500', roi: '0.00%', pnl: '$0.00', winRate: '0.00', activeCopytraders: 116, holdingSize: '0.00' },
    { id: '5', email: 'nosleeping@outlook.com', followers: '8/500', roi: '0.00%', pnl: '$0.00', winRate: '0.00', activeCopytraders: 116, holdingSize: '0.00' },
    { id: '6', email: 'nosleeping@outlook.com', followers: '8/500', roi: '0.00%', pnl: '$0.00', winRate: '0.00', activeCopytraders: 116, holdingSize: '0.00' },
]

const sampleTradeHistory: TradeHistory[] = [
    { id: '1', pair: 'BTC/USDT', type: 'Long', price: '$85,0756', pnl: '+4567.89 USDT', pnlPercent: '+55%', isProfit: true },
    { id: '2', pair: 'BTC/USDT', type: 'Long', price: '$85,0756', pnl: '-467.89 USDT', pnlPercent: '-19%', isProfit: false },
]

export default function FuturesCopy() {
    const [activeFilter, setActiveFilter] = useState<'roi' | 'pnl' | 'winrate' | 'copytraders'>('roi')
    const [showHistory, setShowHistory] = useState(false)
    const [, setSelectedTrader] = useState<Trader | null>(null)
    const [historyMainTab, setHistoryMainTab] = useState<'spot' | 'futures'>('futures')
    const [historySubTab, setHistorySubTab] = useState<'open' | 'history'>('open')

    const handleTraderCardClick = (trader: Trader) => {
        setSelectedTrader(trader)
        setShowHistory(true)
    }

    return (
        <Layout activePage="futures" hideMobileNav={true} hideFooterMobile={true}>
            {/* Mobile View */}
            <div className="mobile-only">
                {showHistory ? (
                    <div className="fcm-history-view">
                        {/* History Header */}
                        <div className="fcm-top-bar">
                            <button className="fcm-back-btn" onClick={() => setShowHistory(false)}>
                                <ArrowLeft size={20} />
                            </button>
                            <span className="fcm-top-title">History</span>
                        </div>

                        {/* Main Tabs - Spot / Futures */}
                        <div className="fcm-history-main-tabs">
                            <button 
                                className={`fcm-history-main-tab ${historyMainTab === 'spot' ? 'active' : ''}`}
                                onClick={() => setHistoryMainTab('spot')}
                            >
                                Spot
                            </button>
                            <button 
                                className={`fcm-history-main-tab ${historyMainTab === 'futures' ? 'active' : ''}`}
                                onClick={() => setHistoryMainTab('futures')}
                            >
                                Futures
                            </button>
                        </div>

                        {/* Sub Tabs - Open orders / History */}
                        <div className="fcm-history-sub-tabs">
                            <button 
                                className={`fcm-history-sub-tab ${historySubTab === 'open' ? 'active' : ''}`}
                                onClick={() => setHistorySubTab('open')}
                            >
                                Open orders
                            </button>
                            <button 
                                className={`fcm-history-sub-tab ${historySubTab === 'history' ? 'active' : ''}`}
                                onClick={() => setHistorySubTab('history')}
                            >
                                History
                            </button>
                        </div>

                        {/* Trade Items */}
                        <div className="fcm-history-list">
                            {sampleTradeHistory.map((trade) => (
                                <div key={trade.id} className="fcm-history-trade-item">
                                    <div className="fcm-trade-row">
                                        <div className="fcm-trade-left">
                                            <div className="fcm-trade-pair-type">
                                                <span className="fcm-trade-pair">{trade.pair}</span>
                                                <span className="fcm-trade-type">{trade.type}</span>
                                            </div>
                                            <span className="fcm-trade-price">{trade.price}</span>
                                        </div>
                                        <div className="fcm-trade-right">
                                            <span className={`fcm-trade-pnl ${trade.isProfit ? 'profit' : 'loss'}`}>{trade.pnl}</span>
                                            <span className={`fcm-trade-percent ${trade.isProfit ? 'profit' : 'loss'}`}>{trade.pnlPercent}</span>
                                        </div>
                                    </div>
                                    {historySubTab === 'open' && (
                                        <button className="fcm-close-trade-btn">Close trade</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="futures-copy-mobile-layout">
                    {/* Back Header */}
                    <div className="fcm-top-bar">
                        <button className="fcm-back-btn" onClick={() => window.history.back()}>
                            <ArrowLeft size={20} />
                        </button>
                        <span className="fcm-top-title">Copy trader</span>
                    </div>

                    <div className="fcm-scroll-content">
                        {/* Page Title Section */}
                        <div className="fcm-hero-section">
                            <h1 className="fcm-page-title">Futures copy</h1>
                            <p className="fcm-page-subtitle">View the real trading of experts</p>
                            <button className="fcm-open-contract-btn">Open contract</button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="fcm-tabs-container">
                            <div className="fcm-tabs-wrapper">
                                <button className={`fcm-tab ${activeFilter === 'roi' ? 'active' : ''}`} onClick={() => setActiveFilter('roi')}>ROI</button>
                                <button className={`fcm-tab ${activeFilter === 'pnl' ? 'active' : ''}`} onClick={() => setActiveFilter('pnl')}>PnL</button>
                                <button className={`fcm-tab ${activeFilter === 'winrate' ? 'active' : ''}`} onClick={() => setActiveFilter('winrate')}>Win rate</button>
                                <button className={`fcm-tab ${activeFilter === 'copytraders' ? 'active' : ''}`} onClick={() => setActiveFilter('copytraders')}>Number of copy traders</button>
                            </div>
                        </div>

                        {/* Trader Cards */}
                        <div className="fcm-traders-list">
                            {traders.map((trader) => (
                                <div key={trader.id} className="fcm-trader-card-v2" onClick={() => handleTraderCardClick(trader)}>
                                    <div className="card-header-v2">
                                        <div className="trader-avatar-v2">
                                            <img src="/avatar.png" alt="Avatar" />
                                        </div>
                                        <div className="trader-basic-info">
                                            <div className="trader-email">{trader.email}</div>
                                            <div className="trader-followers-count">
                                                <div className="followers-icon">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                    </svg>
                                                </div>
                                                <span>{trader.followers}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-pnl-section">
                                        <div className="label-text">Lead trader 7D PnL</div>
                                        <div className="roi-value">{trader.roi}</div>
                                        <div className="pnl-amount">{trader.pnl}</div>
                                    </div>

                                    <div className="card-stats-row">
                                        <div className="stat-col">
                                            <div className="label-text">Winning Rate</div>
                                            <div className="stat-val">${trader.winRate}</div>
                                        </div>
                                        <div className="stat-col text-right">
                                            <div className="label-text">Already settled</div>
                                            <div className="stat-val">{trader.activeCopytraders}</div>
                                        </div>
                                    </div>

                                    <div className="card-position-row">
                                        <div className="position-info">
                                            <div className="label-text">Current Holding Position Size</div>
                                            <div className="stat-val">${trader.holdingSize}</div>
                                        </div>
                                        <div className="position-info-icon">
                                            <div className="info-circle-diamond">
                                                <div className="diamond-inner"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="card-copy-btn">Copy Now</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                )}
            </div>

            <div className="desktop-only">
                {/* Hero Section */}
                <div className="futures-hero-v3">
                    <div className="hero-content-v3">
                        <div className="hero-text-v3">
                            <h1 className="hero-title-v3">Futures copy</h1>
                            <p className="hero-subtitle-v3">View the real trading of experts</p>
                            <button className="open-contract-btn-v3">Open contract</button>
                        </div>
                    </div>
                </div>

                {/* Trader Section */}
                <div className="trader-section-v3">
                    <h2 className="section-title-v3">Trader</h2>

                    <div className="trader-controls-v3">
                        <div className="trader-tabs-v3">
                            <button
                                className={`trader-tab-v3 ${activeFilter === 'roi' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('roi')}
                            >
                                ROI
                            </button>
                            <button
                                className={`trader-tab-v3 ${activeFilter === 'pnl' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('pnl')}
                            >
                                PnL
                            </button>
                            <button
                                className={`trader-tab-v3 ${activeFilter === 'winrate' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('winrate')}
                            >
                                Win rate
                            </button>
                            <button
                                className={`trader-tab-v3 ${activeFilter === 'copytraders' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('copytraders')}
                            >
                                Number of copy traders
                            </button>
                            <button className="trader-tab-v3">Current holding position size</button>
                        </div>

                        <div className="filter-group-v3">
                            <div className="trader-search-v3">
                                <Search size={18} className="search-icon-v3" />
                                <input type="text" placeholder="Search for currency pairs" className="search-input-v3" />
                            </div>
                            <div className="time-select-v3">
                                <span>7 days</span>
                                <ChevronDown size={16} className="chevron-icon-v3" />
                            </div>
                        </div>
                    </div>

                    <div className="trader-grid-v3">
                        {traders.map((trader) => (
                            <div key={trader.id} className="trader-card-v3">
                                <div className="card-header-v3">
                                    <div className="trader-avatar-v3">
                                        <div className="avatar-circle-v3">
                                            <User size={22} />
                                        </div>
                                    </div>
                                    <div className="trader-details-v3">
                                        <div className="trader-email-v3">{trader.email}</div>
                                        <div className="trader-stats-v3">
                                            <User size={12} />
                                            <span>{trader.followers}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body-v3">
                                    <div className="stat-group-v3">
                                        <div className="stat-label-v3">LEAD TRADER 7D PNL</div>
                                        <div className="stat-value-main-v3">{trader.roi}</div>
                                        <div className="stat-sub-v3">{trader.pnl}</div>
                                    </div>

                                    <div className="stat-grid-v2">
                                        <div className="stat-item-inner">
                                            <div className="stat-label-v3">WINNING RATE</div>
                                            <div className="stat-value-v3">${trader.winRate}</div>
                                        </div>
                                        <div className="stat-item-inner text-right">
                                            <div className="stat-label-v3">ALREADY SETTLED</div>
                                            <div className="stat-value-v3">{trader.activeCopytraders}</div>
                                        </div>
                                    </div>

                                    <div className="holding-info-v3">
                                        <div className="holding-details">
                                            <div className="stat-label-v3">Current Holding Position Size</div>
                                            <div className="stat-value-v3">${trader.holdingSize}</div>
                                        </div>
                                        <div className="holding-icon-wrapper">
                                            <div className="diamond-icon-v3">
                                                <div className="diamond-v3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button className="copy-btn-v3">Copy Now</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    )
}
