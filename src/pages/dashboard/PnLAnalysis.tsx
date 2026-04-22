import { useState } from 'react'
import { ArrowLeft, ChevronDown, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import '../../styles/pnl-analysis.css'

export default function PnLAnalysis() {
    const navigate = useNavigate()
    const [selectedPeriod, setSelectedPeriod] = useState<'7D' | '1M' | '3M' | 'custom'>('7D')

    return (
        <div className="pnl-analysis-container">
            {/* Header */}
            <div className="pnl-header">
                <button className="pnl-back-btn" onClick={() => navigate('/dashboard/assets')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="pnl-title-wrapper">
                    <span className="pnl-title">Spot Grid</span>
                    <ChevronDown size={16} />
                </div>
            </div>

            {/* Total Balance Section */}
            <div className="pnl-balance-section">
                <div className="pnl-balance-header">
                    <span className="pnl-balance-label">Total Balance</span>
                    <Eye size={14} className="pnl-eye-icon" />
                </div>
                <div className="pnl-balance-amount">
                    <span className="pnl-balance-value">0.000000 BTC</span>
                    <div className="pnl-balance-dropdown">
                        <ChevronDown size={14} />
                    </div>
                </div>
                <div className="pnl-balance-usd">≈$0.00</div>
            </div>

            {/* Period Tabs */}
            <div className="pnl-period-tabs">
                <button 
                    className={`pnl-period-tab ${selectedPeriod === '7D' ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod('7D')}
                >
                    7D
                </button>
                <button 
                    className={`pnl-period-tab ${selectedPeriod === '1M' ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod('1M')}
                >
                    1M
                </button>
                <button 
                    className={`pnl-period-tab ${selectedPeriod === '3M' ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod('3M')}
                >
                    3M
                </button>
                <button 
                    className={`pnl-period-tab custom ${selectedPeriod === 'custom' ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod('custom')}
                >
                    Custom time
                </button>
            </div>

            {/* PNL Stats Row */}
            <div className="pnl-stats-row">
                <div className="pnl-stat-item">
                    <span className="pnl-stat-label">Total PNL</span>
                    <span className="pnl-stat-value">0.000000 BTC</span>
                    <span className="pnl-stat-usd">≈$0.00</span>
                </div>
                <div className="pnl-stat-item right">
                    <span className="pnl-stat-label">PnL</span>
                    <span className="pnl-stat-value">0.000000 BTC</span>
                    <span className="pnl-stat-usd">≈$0.00</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="pnl-content">
                {/* Cumulative PNL */}
                <div className="pnl-section">
                    <h3 className="pnl-section-title">Cumulative PNL</h3>
                    <div className="pnl-no-data">
                        <div className="pnl-no-data-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="12" y="16" width="28" height="20" rx="2" stroke="#555" strokeWidth="2" fill="#333"/>
                                <rect x="16" y="20" width="12" height="8" rx="1" fill="#555"/>
                                <line x1="16" y1="32" x2="36" y2="32" stroke="#555" strokeWidth="2"/>
                                <circle cx="44" cy="40" r="12" stroke="#555" strokeWidth="2" fill="none"/>
                                <path d="M52 48L58 54" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="44" cy="40" r="4" fill="#555"/>
                            </svg>
                        </div>
                        <span className="pnl-no-data-text">No data</span>
                    </div>
                </div>

                {/* Daily PNL */}
                <div className="pnl-section">
                    <h3 className="pnl-section-title">Daily PNL</h3>
                    <div className="pnl-no-data">
                        <div className="pnl-no-data-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="12" y="16" width="28" height="20" rx="2" stroke="#555" strokeWidth="2" fill="#333"/>
                                <rect x="16" y="20" width="12" height="8" rx="1" fill="#555"/>
                                <line x1="16" y1="32" x2="36" y2="32" stroke="#555" strokeWidth="2"/>
                                <circle cx="44" cy="40" r="12" stroke="#555" strokeWidth="2" fill="none"/>
                                <path d="M52 48L58 54" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="44" cy="40" r="4" fill="#555"/>
                            </svg>
                        </div>
                        <span className="pnl-no-data-text">No data</span>
                    </div>
                </div>

                {/* Asset Distribution */}
                <div className="pnl-section">
                    <h3 className="pnl-section-title">Asset Distribution</h3>
                    <div className="pnl-no-data">
                        <div className="pnl-no-data-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="12" y="16" width="28" height="20" rx="2" stroke="#555" strokeWidth="2" fill="#333"/>
                                <rect x="16" y="20" width="12" height="8" rx="1" fill="#555"/>
                                <line x1="16" y1="32" x2="36" y2="32" stroke="#555" strokeWidth="2"/>
                                <circle cx="44" cy="40" r="12" stroke="#555" strokeWidth="2" fill="none"/>
                                <path d="M52 48L58 54" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="44" cy="40" r="4" fill="#555"/>
                            </svg>
                        </div>
                        <span className="pnl-no-data-text">No data</span>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="pnl-bottom-nav">
                <button className="pnl-nav-item" onClick={() => navigate('/dashboard/strategy-plaza')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>Strategy Plaza</span>
                </button>
                <button className="pnl-nav-item" onClick={() => navigate('/dashboard/spot-grid')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                    <span>Strategy Trading</span>
                </button>
                <button className="pnl-nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>My Strategy</span>
                </button>
                <button className="pnl-nav-item active">
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
