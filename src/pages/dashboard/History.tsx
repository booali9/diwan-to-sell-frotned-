import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMyOpenTrades, getMyClosedTrades } from '../../services/tradeService'
import { getTransactions } from '../../services/walletService'
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
    createdAt: string
    displayType?: string
    sentFrom?: string
    destination?: string
    amountText?: string
}

function mapTrade(t: any): Trade {
    const pnl = t.status === 'open'
        ? (t.unrealizedPnL ?? 0)
        : (t.pnl ?? 0)
    const rawPct = t.status === 'open' && t.pnlPercentage != null
        ? t.pnlPercentage
        : (t.marginUsed > 0 ? (pnl / t.marginUsed) * 100 : 0)
    const asset = t.asset || t.symbol || 'Unknown'
    const typeLabel = (t.side === 'buy' || t.side === 'long') ? 'Long' : 'Short'
    const tradeMode = t.type === 'futures' ? 'Futures Trade' : 'Spot Trade'
    return {
        id: t._id,
        pair: `${asset.split('/')[0]}/USDT`,
        type: typeLabel,
        entryPrice: `$${Number(t.entryPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        pnl: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
        pnlPercent: `${rawPct >= 0 ? '+' : ''}${rawPct.toFixed(2)}%`,
        isProfit: pnl >= 0,
        tradeType: t.type || 'spot',
        asset,
        createdAt: t.createdAt || new Date().toISOString(),
        displayType: `${tradeMode} (${typeLabel})`,
        sentFrom: t.type === 'futures' ? 'Bicoin Futures Wallet' : 'Bicoin Spot Wallet',
        destination: 'Bicoin Spot Account',
        amountText: `${t.amount} ${asset.split('/')[0]}`,
    }
}

export default function History() {
    const navigate = useNavigate()
    const [activeHistoryTab, setActiveHistoryTab] = useState<'trade' | 'p2p' | 'transfer' | 'fiat'>('trade')
    const [mainTab, setMainTab] = useState<'spot' | 'futures'>('spot')
    const [currencyFilter, setCurrencyFilter] = useState('All Coins')
    const [typeFilter, setTypeFilter] = useState('All Types')
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [historyTrades, setHistoryTrades] = useState<Trade[]>([])
    const [openSpotTrades, setOpenSpotTrades] = useState<Trade[]>([])
    const [dbTransactions, setDbTransactions] = useState<any[]>([])
    const [selectedTx, setSelectedTx] = useState<any | null>(null)

    const CURRENCY_OPTIONS = ['All Coins', 'USDT', 'BTC', 'ETH', 'SOL', 'XRP', 'AVAX', 'DOGE', 'BNB', 'ADA', 'DOT', 'MATIC', 'LINK']
    const TYPE_OPTIONS = ['All Types', 'Long', 'Short']

    const simulatedP2P = [
        {
            _id: 'p2p-tx-01',
            displayType: 'P2P Buy',
            type: 'transfer',
            pair: 'USDT/KES',
            asset: 'USDT',
            amount: 120.00,
            amountText: '120.00 USDT',
            price: '131.50 KES',
            sentFrom: 'P2P Merchant: CryptoGuru99',
            destination: 'My Bicoin Funding Account',
            txHash: 'P2P-TX-984019284102-USDT',
            dateTime: '2026-05-19 14:32:11',
            status: 'completed',
            createdAt: '2026-05-19T09:32:11.000Z',
        },
        {
            _id: 'p2p-tx-02',
            displayType: 'P2P Sell',
            type: 'transfer',
            pair: 'USDT/KES',
            asset: 'USDT',
            amount: 85.00,
            amountText: '85.00 USDT',
            price: '131.20 KES',
            sentFrom: 'My Bicoin Funding Account',
            destination: 'P2P Buyer: KingArbitrage',
            txHash: 'P2P-TX-104928409214-USDT',
            dateTime: '2026-05-18 10:15:44',
            status: 'completed',
            createdAt: '2026-05-18T05:15:44.000Z',
        }
    ]

    const fetchTrades = async () => {
        try {
            const [open, closed, txs] = await Promise.all([
                getMyOpenTrades(),
                getMyClosedTrades(),
                getTransactions()
            ])
            setOpenSpotTrades((open || []).filter((t: any) => t.type === 'spot' && t.status === 'open').map(mapTrade))
            setHistoryTrades((closed || []).map(mapTrade))
            setDbTransactions(txs || [])
        } catch (err) {
            console.error('Error fetching trades & transactions:', err)
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
    const displayTrades = mainTab === 'spot' ? [...filteredOpenSpot, ...filteredHistory] : filteredHistory

    // Filter DB transactions for Internal Transfers tab
    const transfers = dbTransactions.filter(t => t.type === 'transfer').map(t => ({
        ...t,
        displayType: 'Internal Funding Transfer',
        sentFrom: 'My Funding Account',
        destination: t.walletAddress || 'Internal Bicoin Account',
        amountText: `${t.amount} ${t.asset}`,
        dateTime: new Date(t.createdAt).toLocaleString(),
        isProfit: false
    }))

    // Filter DB transactions for Fiat/Crypto Gateways (deposits & withdrawals)
    const gateways = dbTransactions.filter(t => t.type === 'deposit' || t.type === 'withdrawal').map(t => ({
        ...t,
        displayType: t.type === 'deposit' ? 'On-chain Deposit' : 'On-chain Withdrawal',
        sentFrom: t.type === 'deposit' ? 'External Blockchain Wallet' : 'My Bicoin Spot Wallet',
        destination: t.type === 'deposit' ? 'My Bicoin Wallet Address' : (t.walletAddress || 'External Wallet Address'),
        amountText: `${t.amount} ${t.asset}`,
        dateTime: new Date(t.createdAt).toLocaleString(),
        isProfit: t.type === 'deposit'
    }))

    return (
        <Layout activePage="futures" hideMobileNav={true}>
            {/* Styles for glassmorphism and enhancements */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-up {
                    from { transform: scale(0.96); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .glass-modal-overlay {
                    backdrop-filter: blur(12px) !important;
                }
                .glass-modal-content {
                    background: rgba(13, 13, 23, 0.8) !important;
                    backdrop-filter: blur(25px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7) !important;
                }
                .clickable-row {
                    cursor: pointer;
                    transition: background 0.15s ease;
                }
                .clickable-row:hover {
                    background: rgba(255, 255, 255, 0.04) !important;
                }
                .history-primary-tabs button {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .history-primary-tabs button:hover {
                    color: #1B9B8C !important;
                }
            `}</style>

            {/* Mobile View - Trade History Screen */}
            <div className="mobile-only">
                <div className="history-mobile-layout">
                    {/* Header */}
                    <div className="history-top-bar">
                        <button className="history-back-btn" onClick={() => navigate('/dashboard/assets')}>
                            <ArrowLeft size={20} />
                        </button>
                        <span className="history-top-title">History Center</span>
                    </div>

                    {/* Primary History Mobile Tabs */}
                    <div className="history-primary-tabs" style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '12px 16px 8px', borderBottom: '1px solid #1C1C2C', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
                        {[
                            { key: 'trade', label: 'Trade History' },
                            { key: 'p2p', label: 'P2P Orders' },
                            { key: 'transfer', label: 'Transfers' },
                            { key: 'fiat', label: 'Funding Gate' }
                        ].map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setActiveHistoryTab(t.key as any)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: activeHistoryTab === t.key ? '#1B9B8C' : '#71717A',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    paddingBottom: '8px',
                                    borderBottom: activeHistoryTab === t.key ? '2px solid #1B9B8C' : '2px solid transparent',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Render Sub Tabs (Spot/Futures) only if Trade History is active */}
                    {activeHistoryTab === 'trade' && (
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
                    )}

                    {/* Filter Row - Render only for Trade History */}
                    {activeHistoryTab === 'trade' && (
                        <div className="history-filter-row">
                            <div className="history-filters-left">
                                <div style={{ position: 'relative' }}>
                                    <button className="history-filter-btn" onClick={() => { setShowCurrencyDropdown(prev => !prev); setShowTypeDropdown(false) }}>
                                        <span>{currencyFilter}</span>
                                        <ChevronDown size={14} style={{ transform: showCurrencyDropdown ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                                    </button>
                                    {showCurrencyDropdown && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, background: '#111118', border: '1px solid #1C1C2C', borderRadius: 8, zIndex: 20, marginTop: 4, minWidth: 140, maxHeight: 220, overflowY: 'auto' }}>
                                            {CURRENCY_OPTIONS.map(opt => (
                                                <div key={opt} onClick={() => { setCurrencyFilter(opt); setShowCurrencyDropdown(false) }}
                                                    style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', background: currencyFilter === opt ? '#1C1C2C' : 'transparent', fontSize: 14 }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#1C1C2C')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = currencyFilter === opt ? '#1C1C2C' : 'transparent')}>
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
                                        <div style={{ position: 'absolute', top: '100%', left: 0, background: '#111118', border: '1px solid #1C1C2C', borderRadius: 8, zIndex: 20, marginTop: 4, minWidth: 130 }}>
                                            {TYPE_OPTIONS.map(opt => (
                                                <div key={opt} onClick={() => { setTypeFilter(opt); setShowTypeDropdown(false) }}
                                                    style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', background: typeFilter === opt ? '#1C1C2C' : 'transparent', fontSize: 14 }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = '#1C1C2C')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = typeFilter === opt ? '#1C1C2C' : 'transparent')}>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Lists */}
                    {activeHistoryTab === 'trade' && (
                        displayTrades.length === 0 ? (
                            <div className="history-empty-state">
                                <span className="history-empty-text">No trades found</span>
                            </div>
                        ) : (
                            <div className="history-trades-list">
                                {displayTrades.map((trade) => (
                                    <div key={trade.id} className="history-trade-card clickable-row" onClick={() => setSelectedTx(trade)}>
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
                        )
                    )}

                    {activeHistoryTab === 'p2p' && (
                        <div className="history-trades-list" style={{ padding: '16px' }}>
                            {simulatedP2P.map((tx) => (
                                <div key={tx._id} className="history-trade-card clickable-row" onClick={() => setSelectedTx(tx)} style={{ marginBottom: '12px' }}>
                                    <div className="trade-card-header">
                                        <div>
                                            <span className="trade-pair" style={{ display: 'block', fontSize: '15px' }}>{tx.pair}</span>
                                            <span className="trade-type" style={{ color: tx.displayType.includes('Buy') ? '#1B9B8C' : '#EF4444' }}>{tx.displayType}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="trade-pnl profit" style={{ display: 'block' }}>{tx.amountText}</span>
                                            <span className="trade-pnl-percent" style={{ color: '#71717A' }}>{tx.price}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#71717A' }}>
                                        <span>{tx.dateTime}</span>
                                        <span style={{ color: '#1B9B8C', textTransform: 'uppercase', fontWeight: 600 }}>{tx.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeHistoryTab === 'transfer' && (
                        transfers.length === 0 ? (
                            <div className="history-empty-state">
                                <span className="history-empty-text">No transfers found</span>
                            </div>
                        ) : (
                            <div className="history-trades-list" style={{ padding: '16px' }}>
                                {transfers.map((tx) => (
                                    <div key={tx._id} className="history-trade-card clickable-row" onClick={() => setSelectedTx(tx)} style={{ marginBottom: '12px' }}>
                                        <div className="trade-card-header">
                                            <div>
                                                <span className="trade-pair" style={{ display: 'block', fontSize: '15px' }}>{tx.asset}</span>
                                                <span className="trade-type" style={{ color: '#1B9B8C' }}>{tx.displayType}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className="trade-pnl loss" style={{ display: 'block', color: '#EF4444' }}>-{tx.amountText}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#71717A' }}>
                                            <span>{tx.dateTime}</span>
                                            <span style={{ color: '#1B9B8C', textTransform: 'uppercase', fontWeight: 600 }}>{tx.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {activeHistoryTab === 'fiat' && (
                        gateways.length === 0 ? (
                            <div className="history-empty-state">
                                <span className="history-empty-text">No deposits or withdrawals found</span>
                            </div>
                        ) : (
                            <div className="history-trades-list" style={{ padding: '16px' }}>
                                {gateways.map((tx) => (
                                    <div key={tx._id} className="history-trade-card clickable-row" onClick={() => setSelectedTx(tx)} style={{ marginBottom: '12px' }}>
                                        <div className="trade-card-header">
                                            <div>
                                                <span className="trade-pair" style={{ display: 'block', fontSize: '15px' }}>{tx.asset}</span>
                                                <span className="trade-type" style={{ color: tx.type === 'deposit' ? '#1B9B8C' : '#EF4444' }}>{tx.displayType}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className="trade-pnl" style={{ display: 'block', color: tx.type === 'deposit' ? '#1B9B8C' : '#EF4444' }}>
                                                    {tx.type === 'deposit' ? '+' : '-'}{tx.amountText}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#71717A' }}>
                                            <span>{tx.dateTime}</span>
                                            <span style={{ color: '#1B9B8C', textTransform: 'uppercase', fontWeight: 600 }}>{tx.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only">
                <div className="history-desktop-container" style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 className="history-desktop-title" style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>History Center</h1>
                    <p style={{ color: '#71717A', fontSize: '14px', marginBottom: '32px' }}>Review trades, P2P transactions, internal ledger transfers, and gateway movements</p>
                    
                    {/* Primary History Desktop Tabs */}
                    <div className="history-primary-tabs" style={{ display: 'flex', gap: '28px', marginBottom: '28px', borderBottom: '1px solid #1C1C2C', paddingBottom: '2px' }}>
                        {[
                            { key: 'trade', label: 'Trade History' },
                            { key: 'p2p', label: 'P2P Transactions' },
                            { key: 'transfer', label: 'Internal Ledger Transfers' },
                            { key: 'fiat', label: 'Fiat & Crypto Gateways' }
                        ].map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setActiveHistoryTab(t.key as any)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: activeHistoryTab === t.key ? '#1B9B8C' : '#71717A',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    paddingBottom: '14px',
                                    borderBottom: activeHistoryTab === t.key ? '2.5px solid #1B9B8C' : '2.5px solid transparent',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Trade History Sub Tabs */}
                    {activeHistoryTab === 'trade' && (
                        <div className="history-desktop-tabs" style={{ marginBottom: '24px' }}>
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
                    )}

                    {/* Conditionally Render Table Based on Active Tab */}
                    {activeHistoryTab === 'trade' && (
                        <div className="history-desktop-table" style={{ background: '#0c0c17', border: '1px solid #1C1C2C', borderRadius: '16px', padding: '16px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Pair</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Type</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Entry Price</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>PnL</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>PnL %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayTrades.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#71717A' }}>No trade records found</td>
                                        </tr>
                                    ) : (
                                        displayTrades.map((trade) => (
                                            <tr key={trade.id} className="clickable-row" onClick={() => setSelectedTx(trade)}>
                                                <td style={{ padding: '16px', color: '#fff', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{trade.pair}</td>
                                                <td style={{ padding: '16px', color: '#fff', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{trade.type}</td>
                                                <td style={{ padding: '16px', color: '#fff', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{trade.entryPrice}</td>
                                                <td style={{ padding: '16px', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }} className={trade.isProfit ? 'profit' : 'loss'}>{trade.pnl}</td>
                                                <td style={{ padding: '16px', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }} className={trade.isProfit ? 'profit' : 'loss'}>{trade.pnlPercent}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeHistoryTab === 'p2p' && (
                        <div className="history-desktop-table" style={{ background: '#0c0c17', border: '1px solid #1C1C2C', borderRadius: '16px', padding: '16px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Pair</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Type</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Quantity</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Price</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {simulatedP2P.map((tx) => (
                                        <tr key={tx._id} className="clickable-row" onClick={() => setSelectedTx(tx)}>
                                            <td style={{ padding: '16px', color: '#fff', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.pair}</td>
                                            <td style={{ padding: '16px', color: tx.displayType.includes('Buy') ? '#1B9B8C' : '#EF4444', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid #1C1C2C' }}>{tx.displayType}</td>
                                            <td style={{ padding: '16px', color: '#fff', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.amountText}</td>
                                            <td style={{ padding: '16px', color: '#E4E4E7', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.price}</td>
                                            <td style={{ padding: '16px', color: '#71717A', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.dateTime}</td>
                                            <td style={{ padding: '16px', borderBottom: '1px solid #1C1C2C' }}><span className="status-badge completed">Completed</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeHistoryTab === 'transfer' && (
                        <div className="history-desktop-table" style={{ background: '#0c0c17', border: '1px solid #1C1C2C', borderRadius: '16px', padding: '16px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Asset</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Type</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Amount</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Recipient / Address</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transfers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#71717A' }}>No internal transfer records found</td>
                                        </tr>
                                    ) : (
                                        transfers.map((tx) => (
                                            <tr key={tx._id} className="clickable-row" onClick={() => setSelectedTx(tx)}>
                                                <td style={{ padding: '16px', color: '#fff', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.asset}</td>
                                                <td style={{ padding: '16px', color: '#1B9B8C', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid #1C1C2C' }}>{tx.displayType}</td>
                                                <td style={{ padding: '16px', color: '#EF4444', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid #1C1C2C' }}>-{tx.amountText}</td>
                                                <td style={{ padding: '16px', color: '#E4E4E7', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.destination}</td>
                                                <td style={{ padding: '16px', color: '#71717A', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.dateTime}</td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid #1C1C2C' }}><span className={`status-badge ${tx.status}`}>{tx.status}</span></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeHistoryTab === 'fiat' && (
                        <div className="history-desktop-table" style={{ background: '#0c0c17', border: '1px solid #1C1C2C', borderRadius: '16px', padding: '16px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Asset</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Type</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Amount</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Destination Address</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Date</th>
                                        <th style={{ textAlign: 'left', padding: '16px', color: '#71717A', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #1C1C2C' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gateways.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#71717A' }}>No gateway transactions found</td>
                                        </tr>
                                    ) : (
                                        gateways.map((tx) => (
                                            <tr key={tx._id} className="clickable-row" onClick={() => setSelectedTx(tx)}>
                                                <td style={{ padding: '16px', color: '#fff', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.asset}</td>
                                                <td style={{ padding: '16px', color: tx.type === 'deposit' ? '#1B9B8C' : '#EF4444', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid #1C1C2C' }}>{tx.displayType}</td>
                                                <td style={{ padding: '16px', color: tx.type === 'deposit' ? '#1B9B8C' : '#EF4444', fontSize: '14px', fontWeight: 600, borderBottom: '1px solid #1C1C2C' }}>
                                                    {tx.type === 'deposit' ? '+' : '-'}{tx.amountText}
                                                </td>
                                                <td style={{ padding: '16px', color: '#E4E4E7', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }} title={tx.destination}>
                                                    {tx.destination.length > 30 ? `${tx.destination.substring(0, 20)}...${tx.destination.substring(tx.destination.length - 8)}` : tx.destination}
                                                </td>
                                                <td style={{ padding: '16px', color: '#71717A', fontSize: '14px', borderBottom: '1px solid #1C1C2C' }}>{tx.dateTime}</td>
                                                <td style={{ padding: '16px', borderBottom: '1px solid #1C1C2C' }}><span className={`status-badge ${tx.status}`}>{tx.status}</span></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Glassmorphic Details Modal */}
            {selectedTx && (
                <div className="glass-modal-overlay" onClick={() => setSelectedTx(null)} style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(3, 3, 6, 0.75)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <div className="glass-modal-content" onClick={(e) => e.stopPropagation()} style={{
                        background: 'rgba(12, 12, 22, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '90%',
                        maxWidth: '460px',
                        color: '#fff',
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
                        position: 'relative',
                        animation: 'scale-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}>
                        <button onClick={() => setSelectedTx(null)} style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'none',
                            border: 'none',
                            color: '#71717A',
                            fontSize: '22px',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                        }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#71717A'}>
                            &times;
                        </button>
                        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                            Transaction Details
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#71717A', fontSize: '13px' }}>Transaction Type</span>
                                <span style={{ fontWeight: 600, fontSize: '14px', textTransform: 'capitalize' }}>
                                    {selectedTx.displayType || selectedTx.type}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#71717A', fontSize: '13px' }}>Amount</span>
                                <span style={{ fontWeight: 700, fontSize: '15px', color: selectedTx.isProfit ? '#1B9B8C' : '#EF4444' }}>
                                    {selectedTx.isProfit ? '+' : '-'}{selectedTx.amountText || selectedTx.pnl || `${selectedTx.amount} ${selectedTx.asset || 'USDT'}`}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ color: '#71717A', fontSize: '13px' }}>Sent From</span>
                                <span style={{ fontWeight: 500, fontSize: '13px', color: '#E4E4E7', wordBreak: 'break-all', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
                                    {selectedTx.sentFrom || 'My Bicoin Wallet'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ color: '#71717A', fontSize: '13px' }}>Destination</span>
                                <span style={{ fontWeight: 500, fontSize: '13px', color: '#E4E4E7', wordBreak: 'break-all', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
                                    {selectedTx.destination || selectedTx.walletAddress || 'External Address'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ color: '#71717A', fontSize: '13px' }}>TxID / Hash</span>
                                <span style={{ fontWeight: 500, fontSize: '12px', color: '#A1A1AA', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
                                    {selectedTx.txHash || selectedTx.id || selectedTx._id || 'N/A'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#71717A', fontSize: '13px' }}>Date & Time</span>
                                <span style={{ fontWeight: 500, fontSize: '13px', color: '#E4E4E7' }}>
                                    {selectedTx.dateTime || new Date(selectedTx.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#71717A', fontSize: '13px' }}>Status</span>
                                <span className={`status-badge ${selectedTx.status || 'completed'}`} style={{ fontSize: '11px', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                    {selectedTx.status || 'Completed'}
                                </span>
                            </div>
                        </div>

                        <button onClick={() => setSelectedTx(null)} style={{
                            width: '100%',
                            background: '#1B9B8C',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '28px',
                            transition: 'all 0.2s',
                        }} onMouseEnter={(e) => e.currentTarget.style.background = '#148376'} onMouseLeave={(e) => e.currentTarget.style.background = '#1B9B8C'}>
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </Layout>
    )
}
