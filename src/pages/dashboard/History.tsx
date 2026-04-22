import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMyOpenTrades, getMyClosedTrades } from '../../services/tradeService'
import Layout from '../../components/Layout/Layout'
import '../../styles/history.css'

interface Trade {
    id: string
    pair: string
    type: 'Long' | 'Short'
    entryPrice: string
    pnl: string
    pnlPercent: string
    isProfit: boolean
    tradeType: string
    asset: string
}

function mapTrade(t: any): Trade {
    // Open trades carry unrealizedPnL from the backend; closed/liquidated carry pnl
    const pnl = t.status === 'open'
        ? (t.unrealizedPnL ?? 0)
        : (t.pnl ?? 0)
    const rawPct = t.status === 'open' && t.pnlPercentage != null
        ? t.pnlPercentage
        : (t.marginUsed > 0 ? (pnl / t.marginUsed) * 100 : 0)
    const asset = t.asset || t.symbol || 'Unknown'
    return {
        id: t._id,
        pair: `${asset.split('/')[0]}/USDT`,
        type: (t.side === 'buy' || t.side === 'long') ? 'Long' : 'Short',
        entryPrice: `$${Number(t.entryPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        pnl: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
        pnlPercent: `${rawPct >= 0 ? '+' : ''}${rawPct.toFixed(2)}%`,
        isProfit: pnl >= 0,
        tradeType: t.type || 'spot',
        asset,
    }
}

export default function History() {
    const navigate = useNavigate()
    const [mainTab, setMainTab] = useState<'spot' | 'futures'>('spot')
    const [currencyFilter, setCurrencyFilter] = useState('All Coins')
    const [typeFilter, setTypeFilter] = useState('All Types')
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [historyTrades, setHistoryTrades] = useState<Trade[]>([])
    const [openSpotTrades, setOpenSpotTrades] = useState<Trade[]>([])

    const CURRENCY_OPTIONS = ['All Coins', 'USDT', 'BTC', 'ETH', 'SOL', 'XRP', 'AVAX', 'DOGE', 'BNB', 'ADA', 'DOT', 'MATIC', 'LINK']
    const TYPE_OPTIONS = ['All Types', 'Long', 'Short']

    const fetchTrades = async () => {
        try {
            const [open, closed] = await Promise.all([getMyOpenTrades(), getMyClosedTrades()])
            // Active spot holdings — coins currently being held (type=spot, status=open)
            setOpenSpotTrades((open || []).filter((t: any) => t.type === 'spot' && t.status === 'open').map(mapTrade))
            // Closed + liquidated trades for both tabs
            setHistoryTrades((closed || []).map(mapTrade))
        } catch (err) {
            console.error('Error fetching trades:', err)
        }
    }

    useEffect(() => { fetchTrades() }, [])

    // Spot tab: active holdings first, then closed spot trades
    // Futures tab: closed/liquidated futures only
    const filteredHistory = historyTrades.filter(t => {
        const matchesTab = mainTab === 'spot' ? t.tradeType === 'spot' : t.tradeType === 'futures'
        const matchesCurrency = currencyFilter === 'All Coins' || t.asset === currencyFilter
        const matchesType = typeFilter === 'All Types' || t.type === typeFilter
        return matchesTab && matchesCurrency && matchesType
    })
    const filteredOpenSpot = openSpotTrades.filter(t => {
        const matchesCurrency = currencyFilter === 'All Coins' || t.asset === currencyFilter
        const matchesType = typeFilter === 'All Types' || t.type === typeFilter
        return matchesCurrency && matchesType
    })
    const displayRows = mainTab === 'spot' ? [...filteredOpenSpot, ...filteredHistory] : filteredHistory

    return (
        <Layout activePage="futures" hideMobileNav={true}>
            {/* Mobile View - Trade History Screen */}
            <div className="mobile-only">
                <div className="history-mobile-layout">
                    {/* Header */}
                    <div className="history-top-bar">
                        <button className="history-back-btn" onClick={() => navigate('/dashboard/assets')}>
                            <ArrowLeft size={20} />
                        </button>
                        <span className="history-top-title">History</span>
                    </div>

                    {/* Main Tabs - Spot Grid/Futures Grid */}
                    <div className="history-main-tabs">
                        <button 
                            className={`history-main-tab ${mainTab === 'spot' ? 'active' : ''}`}
                            onClick={() => setMainTab('spot')}
                        >
                            Spot
                        </button>
                        <button 
                            className={`history-main-tab ${mainTab === 'futures' ? 'active' : ''}`}
                            onClick={() => setMainTab('futures')}
                        >
                            Futures
                        </button>
                    </div>

                    {/* Filter Row */}
                    <div className="history-filter-row">
                        <div className="history-filters-left">
                            <div style={{ position: 'relative' }}>
                                <button className="history-filter-btn" onClick={() => { setShowCurrencyDropdown(prev => !prev); setShowTypeDropdown(false) }}>
                                    <span>{currencyFilter}</span>
                                    <ChevronDown size={14} style={{ transform: showCurrencyDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                                </button>
                                {showCurrencyDropdown && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8, zIndex: 20, marginTop: 4, minWidth: 140, maxHeight: 220, overflowY: 'auto' }}>
                                        {CURRENCY_OPTIONS.map(opt => (
                                            <div key={opt} onClick={() => { setCurrencyFilter(opt); setShowCurrencyDropdown(false) }}
                                                style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', background: currencyFilter === opt ? '#2a2a3e' : 'transparent', fontSize: 14 }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#2a2a3e')}
                                                onMouseLeave={e => (e.currentTarget.style.background = currencyFilter === opt ? '#2a2a3e' : 'transparent')}>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <button className="history-filter-btn" onClick={() => { setShowTypeDropdown(prev => !prev); setShowCurrencyDropdown(false) }}>
                                    <span>{typeFilter}</span>
                                    <ChevronDown size={14} style={{ transform: showTypeDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                                </button>
                                {showTypeDropdown && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8, zIndex: 20, marginTop: 4, minWidth: 130 }}>
                                        {TYPE_OPTIONS.map(opt => (
                                            <div key={opt} onClick={() => { setTypeFilter(opt); setShowTypeDropdown(false) }}
                                                style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', background: typeFilter === opt ? '#2a2a3e' : 'transparent', fontSize: 14 }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#2a2a3e')}
                                                onMouseLeave={e => (e.currentTarget.style.background = typeFilter === opt ? '#2a2a3e' : 'transparent')}>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Trade History List (mobile) */}
                    {displayRows.length === 0 ? (
                        <div className="history-empty-state">
                            <div className="history-empty-icon">
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <rect x="12" y="16" width="28" height="20" rx="2" stroke="#555" strokeWidth="2" fill="#333"/>
                                    <rect x="16" y="20" width="12" height="8" rx="1" fill="#555"/>
                                    <circle cx="44" cy="40" r="12" stroke="#555" strokeWidth="2" fill="none"/>
                                    <path d="M52 48L58 54" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                                    <circle cx="44" cy="40" r="4" fill="#555"/>
                                </svg>
                            </div>
                            <span className="history-empty-text">No data</span>
                        </div>
                    ) : (
                        <div className="history-trades-list">
                            {displayRows.map((trade) => (
                                <div key={trade.id} className="history-trade-card">
                                    <div className="trade-card-header">
                                        <div className="trade-pair-info">
                                            <span className="trade-pair">{trade.pair}</span>
                                            <span className="trade-type">{trade.type}</span>
                                        </div>
                                        <div className="trade-pnl-info">
                                            <span className={`trade-pnl ${trade.isProfit ? 'profit' : 'loss'}`}>{trade.pnl}</span>
                                            <span className={`trade-pnl-percent ${trade.isProfit ? 'profit' : 'loss'}`}>{trade.pnlPercent}</span>
                                        </div>
                                    </div>
                                    <div className="trade-entry-price">{trade.entryPrice}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only">
                <div className="history-desktop-container">
                    <h1 className="history-desktop-title">Trading History</h1>
                    
                    {/* Main Tabs */}
                    <div className="history-desktop-tabs">
                        <button 
                            className={`history-desktop-tab ${mainTab === 'spot' ? 'active' : ''}`}
                            onClick={() => setMainTab('spot')}
                        >
                            Spot
                        </button>
                        <button 
                            className={`history-desktop-tab ${mainTab === 'futures' ? 'active' : ''}`}
                            onClick={() => setMainTab('futures')}
                        >
                            Futures
                        </button>
                    </div>

                    {/* Sub Tabs — removed: History page only shows closed trades, not open orders */}

                    {/* Trade Table */}
                    <div className="history-desktop-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Pair</th>
                                    <th>Type</th>
                                    <th>Entry Price</th>
                                    <th>PnL</th>
                                    <th>PnL %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayRows.map((trade) => (
                                    <tr key={trade.id}>
                                        <td>{trade.pair}</td>
                                        <td>{trade.type}</td>
                                        <td>{trade.entryPrice}</td>
                                        <td className={trade.isProfit ? 'profit' : 'loss'}>{trade.pnl}</td>
                                        <td className={trade.isProfit ? 'profit' : 'loss'}>{trade.pnlPercent}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
