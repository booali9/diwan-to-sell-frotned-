import { useState } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import '../../styles/strategy-plaza.css'

interface Strategy {
    id: string
    name: string
    backtestAPR: string
    profitPerGrid: string
    priceRange: string
    numberOfGrids: number
}

export default function StrategyPlaza() {
    const navigate = useNavigate()
    const [mainTab, setMainTab] = useState<'spot' | 'futures'>('spot')
    const [subTab, setSubTab] = useState<'plaza' | 'aibot'>('plaza')

    const aiStrategies: Strategy[] = [
        {
            id: '1',
            name: 'Short-term flunctuation-7D',
            backtestAPR: '+251.467%',
            profitPerGrid: '0.13%-0.20%',
            priceRange: '$88,200.84~$88,967',
            numberOfGrids: 6
        },
        {
            id: '2',
            name: 'Short-term flunctuation-7D',
            backtestAPR: '+251.467%',
            profitPerGrid: '0.13%-0.20%',
            priceRange: '$88,200.84~$88,967',
            numberOfGrids: 6
        }
    ]

    const handleCreate = (strategyId?: string) => {
        console.log('Creating strategy:', strategyId)
        navigate('/dashboard/spot-grid')
    }

    return (
        <div className="strategy-plaza-container">
            {/* Header */}
            <div className="sp-header">
                <button className="sp-back-btn" onClick={() => navigate('/dashboard/assets')}>
                    <ArrowLeft size={20} />
                </button>
                <span className="sp-title">Strategy Plaza</span>
            </div>

            {/* Strategy Trading Section */}
            <div className="sp-trading-section">
                <h2 className="sp-trading-title">Strategy Trading</h2>
                <p className="sp-trading-desc">Trade cryptocurrencies like a professional using automated tools;</p>
                
                <div className="sp-stats-row">
                    <div className="sp-stat">
                        <span className="sp-stat-value">10</span>
                        <span className="sp-stat-label">Running Strategies</span>
                    </div>
                    <div className="sp-stat right">
                        <span className="sp-stat-value">$2,126.42</span>
                        <span className="sp-stat-label">Total Assets</span>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="sp-main-tabs">
                <button 
                    className={`sp-main-tab ${mainTab === 'spot' ? 'active' : ''}`}
                    onClick={() => setMainTab('spot')}
                >
                    Spot Grid
                </button>
                <button 
                    className={`sp-main-tab ${mainTab === 'futures' ? 'active' : ''}`}
                    onClick={() => setMainTab('futures')}
                >
                    Futures Grid
                </button>
                <div className={`sp-main-tab-indicator ${mainTab}`}></div>
            </div>

            {/* Spot Grid Content */}
            {mainTab === 'spot' && (
                <div className="sp-spot-content">
                    {/* Sub Tabs */}
                    <div className="sp-sub-tabs">
                        <button 
                            className={`sp-sub-tab ${subTab === 'plaza' ? 'active' : ''}`}
                            onClick={() => setSubTab('plaza')}
                        >
                            Strategy Plaza
                        </button>
                        <button 
                            className={`sp-sub-tab ${subTab === 'aibot' ? 'active' : ''}`}
                            onClick={() => setSubTab('aibot')}
                        >
                            AI Bot
                        </button>
                    </div>

                    {/* Strategy Plaza Sub-tab */}
                    {subTab === 'plaza' && (
                        <div className="sp-plaza-content">
                            <div className="sp-filters">
                                <button className="sp-filter-btn">
                                    <span>Highest Return Rate</span>
                                    <ChevronDown size={14} />
                                </button>
                                <button className="sp-filter-btn">
                                    <span>All Market</span>
                                    <ChevronDown size={14} />
                                </button>
                                <button className="sp-filter-btn">
                                    <span>All running Time</span>
                                    <ChevronDown size={14} />
                                </button>
                            </div>

                            <div className="sp-no-data">
                                <div className="sp-no-data-icon">
                                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                        <rect x="12" y="16" width="28" height="20" rx="2" stroke="#555" strokeWidth="2" fill="#333"/>
                                        <rect x="16" y="20" width="12" height="8" rx="1" fill="#555"/>
                                        <line x1="16" y1="32" x2="36" y2="32" stroke="#555" strokeWidth="2"/>
                                        <circle cx="44" cy="40" r="12" stroke="#555" strokeWidth="2" fill="none"/>
                                        <path d="M52 48L58 54" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                                        <circle cx="44" cy="40" r="4" fill="#555"/>
                                    </svg>
                                </div>
                                <span className="sp-no-data-text">No data</span>
                                <button className="sp-create-strategy-btn" onClick={() => handleCreate()}>
                                    Create strategy
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI Bot Sub-tab */}
                    {subTab === 'aibot' && (
                        <div className="sp-aibot-content">
                            <div className="sp-filters">
                                <button className="sp-filter-btn">
                                    <span>All market</span>
                                    <ChevronDown size={14} />
                                </button>
                                <button className="sp-filter-btn">
                                    <span>Total return range</span>
                                    <ChevronDown size={14} />
                                </button>
                            </div>

                            <div className="sp-strategies-list">
                                {aiStrategies.map((strategy) => (
                                    <div key={strategy.id} className="sp-strategy-card">
                                        <h3 className="sp-strategy-name">{strategy.name}</h3>
                                        
                                        <div className="sp-strategy-stats">
                                            <div className="sp-strategy-stat">
                                                <span className="sp-stat-label">Backtested APR</span>
                                                <span className="sp-stat-value apr">{strategy.backtestAPR}</span>
                                            </div>
                                            <div className="sp-strategy-stat right">
                                                <span className="sp-stat-label">Profit per grid</span>
                                                <span className="sp-stat-sublabel">(Deducted fees)</span>
                                                <span className="sp-stat-value">{strategy.profitPerGrid}</span>
                                            </div>
                                        </div>

                                        <div className="sp-strategy-details">
                                            <div className="sp-strategy-detail">
                                                <span className="sp-detail-label">Price rage (USDT)</span>
                                                <span className="sp-detail-value">{strategy.priceRange}</span>
                                            </div>
                                            <div className="sp-strategy-detail right">
                                                <span className="sp-detail-label">Number of grids</span>
                                                <span className="sp-detail-value">{strategy.numberOfGrids}</span>
                                            </div>
                                        </div>

                                        <button className="sp-card-create-btn" onClick={() => handleCreate(strategy.id)}>
                                            Create
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Futures Grid Content */}
            {mainTab === 'futures' && (
                <div className="sp-futures-content">
                    <div className="sp-no-data">
                        <div className="sp-no-data-icon futures">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="8" y="20" width="48" height="28" rx="2" stroke="#555" strokeWidth="2" fill="none"/>
                                <path d="M16 36L24 28L32 32L40 24L48 28" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M44 24L48 24L48 28" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20 12L32 8L44 12" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <span className="sp-no-data-text">No data</span>
                        <button className="sp-create-strategy-btn" onClick={() => handleCreate()}>
                            Create contract strategy
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="sp-bottom-nav">
                <button className="sp-nav-item active">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>Strategy Plaza</span>
                </button>
                <button className="sp-nav-item" onClick={() => navigate('/dashboard/spot-grid')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                    <span>Strategy Trading</span>
                </button>
                <button className="sp-nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>My Strategy</span>
                </button>
                <button className="sp-nav-item" onClick={() => navigate('/dashboard/pnl-analysis')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span>PnL Analysis</span>
                </button>
            </div>
        </div>
    )
}
