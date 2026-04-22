import { useState } from 'react'
import { ArrowLeft, Filter, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import '../../styles/bot-order.css'

export default function BotOrder() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'open' | 'order-history' | 'trade-history'>('open')
    const [gridType, setGridType] = useState<'spot' | 'futures'>('spot')
    const [showFilterPopup, setShowFilterPopup] = useState(false)
    const [selectedContract, setSelectedContract] = useState('All contract')

    const handleReset = () => {
        setSelectedContract('All contract')
    }

    const handleConfirm = () => {
        setShowFilterPopup(false)
    }

    return (
        <div className="bot-order-container">
            {/* Header */}
            <div className="bot-order-header">
                <button className="bot-order-back-btn" onClick={() => navigate('/dashboard/assets')}>
                    <ArrowLeft size={20} />
                </button>
                <span className="bot-order-title">Bot Order</span>
            </div>

            {/* Main Tabs */}
            <div className="bot-order-main-tabs">
                <button 
                    className={`bot-order-main-tab ${activeTab === 'open' ? 'active' : ''}`}
                    onClick={() => setActiveTab('open')}
                >
                    Open Order
                </button>
                <button 
                    className={`bot-order-main-tab ${activeTab === 'order-history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('order-history')}
                >
                    Order history
                </button>
                <button 
                    className={`bot-order-main-tab ${activeTab === 'trade-history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trade-history')}
                >
                    Trade history
                </button>
                <div className={`bot-order-tab-indicator ${activeTab}`}></div>
            </div>

            {/* Grid Type Filters */}
            <div className="bot-order-grid-filters">
                <div className="bot-order-grid-pills">
                    <button 
                        className={`bot-order-grid-pill ${gridType === 'spot' ? 'active' : ''}`}
                        onClick={() => setGridType('spot')}
                    >
                        Spot Grid
                    </button>
                    <button 
                        className={`bot-order-grid-pill ${gridType === 'futures' ? 'active' : ''}`}
                        onClick={() => setGridType('futures')}
                    >
                        Futures Grid
                    </button>
                </div>
                <button className="bot-order-filter-btn" onClick={() => setShowFilterPopup(true)}>
                    <Filter size={18} />
                </button>
            </div>

            {/* Empty State */}
            <div className="bot-order-empty-state">
                <div className="bot-order-empty-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <rect x="12" y="16" width="28" height="20" rx="2" stroke="#555" strokeWidth="2" fill="#333"/>
                        <rect x="16" y="20" width="12" height="8" rx="1" fill="#555"/>
                        <circle cx="44" cy="40" r="12" stroke="#555" strokeWidth="2" fill="none"/>
                        <path d="M52 48L58 54" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="44" cy="40" r="4" fill="#555"/>
                    </svg>
                </div>
                <span className="bot-order-empty-text">No data</span>
            </div>

            {/* Filter Bottom Popup */}
            {showFilterPopup && (
                <>
                    <div className="bot-order-overlay" onClick={() => setShowFilterPopup(false)}></div>
                    <div className="bot-order-filter-popup">
                        <div className="filter-popup-header">
                            <span className="filter-popup-title">Filter</span>
                            <button className="filter-popup-close" onClick={() => setShowFilterPopup(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="filter-popup-content">
                            <div className="filter-form-group">
                                <label className="filter-label">Contract</label>
                                <div className="filter-select">
                                    <span>{selectedContract}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 9l6 6 6-6"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="filter-popup-actions">
                            <button className="filter-reset-btn" onClick={handleReset}>Reset</button>
                            <button className="filter-confirm-btn" onClick={handleConfirm}>Confirm</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
