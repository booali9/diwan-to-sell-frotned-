import { useState } from 'react'
import { ArrowLeft, ChevronDown, MoreHorizontal, X, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import '../../styles/spot-grid.css'

interface Strategy {
    id: string
    name: string
    backtestAPR: string
    profitPerGrid: string
    priceRange: string
    numberOfGrids: number
}

export default function SpotGrid() {
    const navigate = useNavigate()
    const [gridType, setGridType] = useState<'spot' | 'futures'>('spot')
    const [showGridDropdown, setShowGridDropdown] = useState(false)
    const [activeTab, setActiveTab] = useState<'ai' | 'popular' | 'manual'>('ai')
    const [futuresTab, setFuturesTab] = useState<'ai' | 'manual'>('ai')
    const [positionMode, setPositionMode] = useState<'neutral' | 'long' | 'short'>('neutral')
    const [futuresTimeRange, setFuturesTimeRange] = useState<'7D' | '30D' | '180D' | 'custom'>('7D')
    const [selectedPair, setSelectedPair] = useState(
        () => localStorage.getItem('dw_spotgrid_pair') || 'BTC/USDT'
    )
    const [showFuturesPairModal, setShowFuturesPairModal] = useState(false)
    const FUTURES_PAIRS_SG = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT']
    const [popularFilter, setPopularFilter] = useState<'highest-return' | 'highest-profit' | 'most-used'>('highest-return')
    
    // Manual tab state
    const [lowerPrice, setLowerPrice] = useState('')
    const [upperPrice, setUpperPrice] = useState('')
    const [numberOfGrids] = useState('2-170')
    const [investmentAmount, setInvestmentAmount] = useState('50.00')
    const [investmentCurrency] = useState('USDT')
    const [advancedOpen, setAdvancedOpen] = useState(true)
    const [futuresAdvancedOpen, setFuturesAdvancedOpen] = useState(true)
    const [selectedOption, setSelectedOption] = useState<'trailing' | 'tpsl' | 'sell-all'>('sell-all')
    const [showFeaturesPopup, setShowFeaturesPopup] = useState(false)

    const currentPrice = '$89,067578'

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
            name: 'Mid-term sideways-30D',
            backtestAPR: '+251.467%',
            profitPerGrid: '0.13%-0.20%',
            priceRange: '$88,200.84~$88,967',
            numberOfGrids: 6
        },
        {
            id: '3',
            name: 'Long-term moderately conservative-90D',
            backtestAPR: '+251.467%',
            profitPerGrid: '0.13%-0.20%',
            priceRange: '$88,200.84~$88,967',
            numberOfGrids: 6
        }
    ]

    const handleCreate = (strategyId?: string) => {
        // Handle create strategy
        console.log('Creating strategy:', strategyId)
    }

    const handleGridTypeChange = (type: 'spot' | 'futures') => {
        setGridType(type)
        setShowGridDropdown(false)
    }

    return (
        <div className="spot-grid-container">
            {/* Header */}
            <div className="spot-grid-header">
                <button className="spot-grid-back-btn" onClick={() => navigate('/dashboard/assets')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="spot-grid-title-wrapper" onClick={() => setShowGridDropdown(!showGridDropdown)}>
                    <span className="spot-grid-title">{gridType === 'spot' ? 'Spot Grid' : 'Futures Grid'}</span>
                    <ChevronDown size={16} />
                </div>
            </div>

            {/* Grid Type Dropdown */}
            {showGridDropdown && (
                <div className="grid-type-dropdown-overlay" onClick={() => setShowGridDropdown(false)}>
                    <div className="grid-type-dropdown" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={`grid-type-option ${gridType === 'spot' ? 'active' : ''}`}
                            onClick={() => handleGridTypeChange('spot')}
                        >
                            Spot Grid
                        </button>
                        <button 
                            className={`grid-type-option ${gridType === 'futures' ? 'active' : ''}`}
                            onClick={() => handleGridTypeChange('futures')}
                        >
                            Futures Grid
                        </button>
                    </div>
                </div>
            )}

            {/* SPOT GRID CONTENT */}
            {gridType === 'spot' && (
            <>
            {/* Tabs */}
            <div className="spot-grid-tabs">
                <button 
                    className={`spot-grid-tab ${activeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ai')}
                >
                    AI
                </button>
                <button 
                    className={`spot-grid-tab ${activeTab === 'popular' ? 'active' : ''}`}
                    onClick={() => setActiveTab('popular')}
                >
                    Popular
                </button>
                <button 
                    className={`spot-grid-tab ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    Manual
                </button>
                <div className={`spot-grid-tab-indicator ${activeTab}`}></div>
            </div>

            {/* Pair Selector */}
            <div className="spot-grid-pair-section">
                <div className="spot-grid-pair-selector">
                    <span className="pair-name">{selectedPair}</span>
                    <ChevronDown size={14} />
                </div>
                <div className="spot-grid-pair-actions">
                    <span className="current-price">{currentPrice}</span>
                    <button className="pair-action-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20V10M18 20V4M6 20v-4" />
                        </svg>
                    </button>
                    <button className="pair-action-btn" onClick={() => setShowFeaturesPopup(true)}>
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* AI Tab Content */}
            {activeTab === 'ai' && (
                <div className="spot-grid-ai-content">
                    {aiStrategies.map((strategy) => (
                        <div key={strategy.id} className="strategy-card">
                            <h3 className="strategy-name">{strategy.name}</h3>
                            
                            <div className="strategy-stats">
                                <div className="strategy-stat">
                                    <span className="stat-label">Backtested APR</span>
                                    <span className="stat-value apr">{strategy.backtestAPR}</span>
                                </div>
                                <div className="strategy-stat right">
                                    <span className="stat-label">Profit per grid</span>
                                    <span className="stat-sublabel">(Deducted fees)</span>
                                    <span className="stat-value">{strategy.profitPerGrid}</span>
                                </div>
                            </div>

                            <div className="strategy-details">
                                <div className="strategy-detail">
                                    <span className="detail-label">Price rage (USDT)</span>
                                    <span className="detail-value">{strategy.priceRange}</span>
                                </div>
                                <div className="strategy-detail right">
                                    <span className="detail-label">Number of grids</span>
                                    <span className="detail-value">{strategy.numberOfGrids}</span>
                                </div>
                            </div>

                            <button className="strategy-create-btn" onClick={() => handleCreate(strategy.id)}>
                                Create
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Popular Tab Content */}
            {activeTab === 'popular' && (
                <div className="spot-grid-popular-content">
                    <div className="popular-filters">
                        <button 
                            className={`popular-filter-btn ${popularFilter === 'highest-return' ? 'active' : ''}`}
                            onClick={() => setPopularFilter('highest-return')}
                        >
                            Highest Return Rate
                        </button>
                        <button 
                            className={`popular-filter-btn ${popularFilter === 'highest-profit' ? 'active' : ''}`}
                            onClick={() => setPopularFilter('highest-profit')}
                        >
                            Highest profit
                        </button>
                        <button 
                            className={`popular-filter-btn ${popularFilter === 'most-used' ? 'active' : ''}`}
                            onClick={() => setPopularFilter('most-used')}
                        >
                            Most used
                        </button>
                    </div>

                    <div className="no-data-container">
                        <div className="no-data-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="12" y="16" width="28" height="20" rx="2" stroke="#555" strokeWidth="2" fill="#333"/>
                                <rect x="16" y="20" width="12" height="8" rx="1" fill="#555"/>
                                <circle cx="44" cy="40" r="12" stroke="#555" strokeWidth="2" fill="none"/>
                                <path d="M52 48L58 54" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="44" cy="40" r="4" fill="#555"/>
                            </svg>
                        </div>
                        <span className="no-data-text">No data</span>
                        <button className="strategy-plaza-btn">Strategy Plaza</button>
                    </div>
                </div>
            )}

            {/* Manual Tab Content */}
            {activeTab === 'manual' && (
                <div className="spot-grid-manual-content">
                    <div className="manual-form">
                        <div className="form-row two-columns">
                            <div className="form-group">
                                <label className="form-label">Price range</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    placeholder="Lower"
                                    value={lowerPrice}
                                    onChange={(e) => setLowerPrice(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price range</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    placeholder="Upper"
                                    value={upperPrice}
                                    onChange={(e) => setUpperPrice(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">The number of grids</label>
                            <div className="form-select">
                                <span>{numberOfGrids}</span>
                                <ChevronDown size={16} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Investment amount</label>
                            <div className="investment-row">
                                <div className="investment-input-wrapper">
                                    <input 
                                        type="text" 
                                        className="form-input investment-input"
                                        value={investmentAmount}
                                        onChange={(e) => setInvestmentAmount(e.target.value)}
                                    />
                                    <div className="investment-currency-label">USDT</div>
                                </div>
                                <div className="currency-selector">
                                    <span>{investmentCurrency}</span>
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="investment-slider">
                            <div className="slider-track">
                                <div className="slider-point active"></div>
                                <div className="slider-line"></div>
                                <div className="slider-point"></div>
                                <div className="slider-line"></div>
                                <div className="slider-point"></div>
                                <div className="slider-line"></div>
                                <div className="slider-point"></div>
                                <div className="slider-line"></div>
                                <div className="slider-point"></div>
                            </div>
                        </div>

                        <div className="available-balance">
                            <span>Avbl 9,500.0564107 USDT</span>
                            <button className="add-funds-btn">+</button>
                        </div>

                        <div className="advanced-options">
                            <button 
                                className="advanced-header"
                                onClick={() => setAdvancedOpen(!advancedOpen)}
                            >
                                <span>Advanced options</span>
                                <ChevronDown size={16} className={advancedOpen ? 'rotated' : ''} />
                            </button>

                            {advancedOpen && (
                                <div className="advanced-content">
                                    <label className="radio-option">
                                        <input 
                                            type="radio" 
                                            name="advanced-option"
                                            checked={selectedOption === 'trailing'}
                                            onChange={() => setSelectedOption('trailing')}
                                        />
                                        <span className="radio-circle"></span>
                                        <span className="radio-label">Trailing settings</span>
                                    </label>
                                    <label className="radio-option">
                                        <input 
                                            type="radio" 
                                            name="advanced-option"
                                            checked={selectedOption === 'tpsl'}
                                            onChange={() => setSelectedOption('tpsl')}
                                        />
                                        <span className="radio-circle"></span>
                                        <span className="radio-label">TP and SL</span>
                                    </label>
                                    <label className="radio-option">
                                        <input 
                                            type="radio" 
                                            name="advanced-option"
                                            checked={selectedOption === 'sell-all'}
                                            onChange={() => setSelectedOption('sell-all')}
                                        />
                                        <span className="radio-circle"></span>
                                        <span className="radio-label">Sell all base coins on stops</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <button className="create-strategy-btn" onClick={() => handleCreate()}>
                            Create
                        </button>
                    </div>
                </div>
            )}
            </>
            )}

            {/* FUTURES GRID CONTENT */}
            {gridType === 'futures' && (
            <>
            {/* Pair Selector */}
            <div className="spot-grid-pair-section">
                <div className="spot-grid-pair-selector" onClick={() => setShowFuturesPairModal(true)} style={{ cursor: 'pointer' }}>
                    <span className="pair-name">{selectedPair}</span>
                    <ChevronDown size={14} />
                </div>
                <div className="spot-grid-pair-actions">
                    <span className="current-price">{currentPrice}</span>
                    <button className="pair-action-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 20V10M18 20V4M6 20v-4" />
                        </svg>
                    </button>
                    <button className="pair-action-btn" onClick={() => setShowFeaturesPopup(true)}>
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* Futures Tabs */}
            <div className="futures-tabs">
                <button 
                    className={`futures-tab ${futuresTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setFuturesTab('ai')}
                >
                    AI
                </button>
                <button 
                    className={`futures-tab ${futuresTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setFuturesTab('manual')}
                >
                    Manual
                </button>
                <div className={`futures-tab-indicator ${futuresTab}`}></div>
            </div>

            {/* Position Mode Tabs */}
            <div className="position-mode-tabs">
                <button 
                    className={`position-mode-tab ${positionMode === 'neutral' ? 'active' : ''}`}
                    onClick={() => setPositionMode('neutral')}
                >
                    Neutral
                </button>
                <button 
                    className={`position-mode-tab ${positionMode === 'long' ? 'active' : ''}`}
                    onClick={() => setPositionMode('long')}
                >
                    Long
                </button>
                <button 
                    className={`position-mode-tab ${positionMode === 'short' ? 'active' : ''}`}
                    onClick={() => setPositionMode('short')}
                >
                    Short
                </button>
            </div>

            {/* Futures AI Tab Content */}
            {futuresTab === 'ai' && (
                <div className="futures-ai-content">
                    <div className="futures-section">
                        <h3 className="futures-section-title">Parameter</h3>
                        <div className="futures-param-row">
                            <span className="futures-param-label">Time range</span>
                            <div className="futures-time-tabs">
                                <button 
                                    className={`futures-time-tab ${futuresTimeRange === '7D' ? 'active' : ''}`}
                                    onClick={() => setFuturesTimeRange('7D')}
                                >
                                    7D
                                </button>
                                <button 
                                    className={`futures-time-tab ${futuresTimeRange === '30D' ? 'active' : ''}`}
                                    onClick={() => setFuturesTimeRange('30D')}
                                >
                                    30D
                                </button>
                                <button 
                                    className={`futures-time-tab ${futuresTimeRange === '180D' ? 'active' : ''}`}
                                    onClick={() => setFuturesTimeRange('180D')}
                                >
                                    180D
                                </button>
                                <button 
                                    className={`futures-time-tab custom ${futuresTimeRange === 'custom' ? 'active' : ''}`}
                                    onClick={() => setFuturesTimeRange('custom')}
                                >
                                    Custom time
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="futures-no-data">
                        <div className="futures-no-data-icon">
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                <rect x="18" y="16" width="36" height="44" rx="4" stroke="#3A3A44" strokeWidth="2" fill="none"/>
                                <rect x="24" y="24" width="16" height="12" rx="2" stroke="#3A3A44" strokeWidth="2" fill="none"/>
                                <line x1="24" y1="44" x2="48" y2="44" stroke="#3A3A44" strokeWidth="2"/>
                                <line x1="24" y1="52" x2="40" y2="52" stroke="#3A3A44" strokeWidth="2"/>
                                <circle cx="54" cy="54" r="12" stroke="#3A3A44" strokeWidth="2" fill="#0A0A10"/>
                                <line x1="62" y1="62" x2="68" y2="68" stroke="#3A3A44" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="58" cy="20" r="4" fill="#00C0A3"/>
                            </svg>
                        </div>
                        <span className="futures-no-data-text">There are currently no recommended grid parameters.</span>
                        <button className="futures-manual-btn" onClick={() => setFuturesTab('manual')}>Manually set the grid parameters</button>
                    </div>

                    {/* Information Section */}
                    <div className="futures-info-section">
                        <h3 className="futures-info-title">Information</h3>
                        <div className="futures-info-row">
                            <span className="futures-info-label">Symbol</span>
                            <span className="futures-info-value">BTC/USDT</span>
                        </div>
                        <div className="futures-info-row">
                            <span className="futures-info-label">Expiry date</span>
                            <span className="futures-info-value">Perpetual</span>
                        </div>
                        <div className="futures-info-row">
                            <span className="futures-info-label">Tick Root</span>
                            <span className="futures-info-value">BTCUSDT Index</span>
                        </div>
                        <div className="futures-info-row">
                            <span className="futures-info-label">Margin Coin</span>
                            <span className="futures-info-value">USDT</span>
                        </div>
                        <div className="futures-info-row">
                            <span className="futures-info-label">Contract size</span>
                            <span className="futures-info-value">0.001btc</span>
                        </div>
                        <div className="futures-info-row">
                            <span className="futures-info-label">Tick</span>
                            <span className="futures-info-value">0.1 USDT</span>
                        </div>
                        <div className="futures-info-row">
                            <span className="futures-info-label">Maintenance Margin</span>
                            <span className="futures-info-value">0.40%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Futures Manual Tab Content */}
            {futuresTab === 'manual' && (
                <div className="futures-manual-content">
                    <div className="manual-form">
                        <div className="form-row two-columns">
                            <div className="form-group">
                                <label className="form-label">Price range</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    placeholder="Lower"
                                    value={lowerPrice}
                                    onChange={(e) => setLowerPrice(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price range</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    placeholder="Upper"
                                    value={upperPrice}
                                    onChange={(e) => setUpperPrice(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">The number of grids</label>
                            <div className="form-select">
                                <span>{numberOfGrids}</span>
                                <ChevronDown size={16} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Investment amount</label>
                            <div className="investment-row">
                                <div className="investment-input-wrapper">
                                    <input 
                                        type="text" 
                                        className="form-input investment-input"
                                        value={investmentAmount}
                                        onChange={(e) => setInvestmentAmount(e.target.value)}
                                    />
                                    <div className="investment-currency-label">USDT</div>
                                </div>
                                <div className="currency-selector">
                                    <span>{investmentCurrency}</span>
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="investment-slider">
                            <div className="slider-track">
                                <div className="slider-point active"></div>
                                <div className="slider-line"></div>
                                <div className="slider-point"></div>
                                <div className="slider-line"></div>
                                <div className="slider-point"></div>
                                <div className="slider-line"></div>
                                <div className="slider-point"></div>
                                <div className="slider-line"></div>
                                <div className="slider-point"></div>
                            </div>
                        </div>

                        <div className="available-balance">
                            <span>Avbl 9,500.0564107 USDT</span>
                            <button className="add-funds-btn">+</button>
                        </div>

                        {/* Futures Manual Stats */}
                        <div className="futures-manual-stats">
                            <div className="futures-manual-stat">
                                <span className="futures-manual-stat-label">Amount per grid</span>
                                <span className="futures-manual-stat-value">0 BTC</span>
                            </div>
                            <div className="futures-manual-stat">
                                <span className="futures-manual-stat-label">Total</span>
                                <span className="futures-manual-stat-value">0.000 USDT</span>
                            </div>
                            <div className="futures-manual-stat">
                                <span className="futures-manual-stat-label">Est. Liquidation price (Long)</span>
                                <span className="futures-manual-stat-value">--</span>
                            </div>
                            <div className="futures-manual-stat">
                                <span className="futures-manual-stat-label">Est. Liquidation price (Short)</span>
                                <span className="futures-manual-stat-value">--</span>
                            </div>
                        </div>

                        {/* Position Settings */}
                        <div className="futures-position-settings">
                            <div className="futures-position-row">
                                <span className="futures-position-label">Position mode</span>
                                <span className="futures-position-value">Netting Mode</span>
                            </div>
                            <div className="futures-position-row">
                                <span className="futures-position-label">Position Type</span>
                                <span className="futures-position-value">Isolation</span>
                            </div>
                        </div>

                        {/* Advanced Settings */}
                        <div className="advanced-options">
                            <button 
                                className="advanced-header"
                                onClick={() => setFuturesAdvancedOpen(!futuresAdvancedOpen)}
                            >
                                <span>Advanced settings</span>
                                <ChevronDown size={16} className={futuresAdvancedOpen ? 'rotated' : ''} />
                            </button>

                            {futuresAdvancedOpen && (
                                <div className="advanced-content">
                                    <label className="radio-option">
                                        <input type="radio" name="futures-advanced" defaultChecked />
                                        <span className="radio-circle"></span>
                                        <span className="radio-label">Start trigger</span>
                                    </label>
                                    <label className="radio-option">
                                        <input type="radio" name="futures-advanced" />
                                        <span className="radio-circle"></span>
                                        <span className="radio-label">Stop trigger</span>
                                    </label>
                                    <label className="radio-option">
                                        <input type="radio" name="futures-advanced" />
                                        <span className="radio-circle"></span>
                                        <span className="radio-label">Close all once bot stop</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Information Section */}
                        <div className="futures-info-section">
                            <h3 className="futures-info-title">Information</h3>
                            <div className="futures-info-row">
                                <span className="futures-info-label">Symbol</span>
                                <span className="futures-info-value">BTC/USDT</span>
                            </div>
                            <div className="futures-info-row">
                                <span className="futures-info-label">Expiry date</span>
                                <span className="futures-info-value">Perpetual</span>
                            </div>
                            <div className="futures-info-row">
                                <span className="futures-info-label">Tick Root</span>
                                <span className="futures-info-value">BTCUSDT Index</span>
                            </div>
                            <div className="futures-info-row">
                                <span className="futures-info-label">Margin Coin</span>
                                <span className="futures-info-value">USDT</span>
                            </div>
                            <div className="futures-info-row">
                                <span className="futures-info-label">Contract size</span>
                                <span className="futures-info-value">0.001btc</span>
                            </div>
                            <div className="futures-info-row">
                                <span className="futures-info-label">Tick</span>
                                <span className="futures-info-value">0.1 USDT</span>
                            </div>
                            <div className="futures-info-row">
                                <span className="futures-info-label">Maintenance Margin</span>
                                <span className="futures-info-value">0.40%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </>
            )}

            {/* Features Popup */}
            {showFeaturesPopup && (
                <div className="spot-grid-features-overlay" onClick={() => setShowFeaturesPopup(false)}>
                    <div className="spot-grid-features-popup" onClick={(e) => e.stopPropagation()}>
                        <div className="spot-grid-features-header">
                            <span className="spot-grid-features-title">Features</span>
                            <button className="spot-grid-features-close" onClick={() => setShowFeaturesPopup(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="spot-grid-features-grid">
                            <button className="spot-grid-features-item" onClick={() => { setShowFeaturesPopup(false); }}>
                                <div className="spot-grid-features-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                                <span>Transfer</span>
                            </button>
                            <button className="spot-grid-features-item" onClick={() => { setShowFeaturesPopup(false); navigate('/dashboard/deposit'); }}>
                                <div className="spot-grid-features-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 5v14M5 12l7-7 7 7" />
                                    </svg>
                                </div>
                                <span>Deposit</span>
                            </button>
                            <button className="spot-grid-features-item" onClick={() => { setShowFeaturesPopup(false); navigate('/dashboard/bot-order'); }}>
                                <div className="spot-grid-features-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M9 9h6M9 12h6M9 15h4" />
                                    </svg>
                                </div>
                                <span>Bot Order</span>
                            </button>
                            <button className="spot-grid-features-item" onClick={() => { setShowFeaturesPopup(false); navigate('/dashboard/strategy-plaza'); }}>
                                <div className="spot-grid-features-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <span>Strategy Plaza</span>
                            </button>
                        </div>
                        <button className="spot-grid-add-favorite-btn">
                            <Star size={16} fill="#FFD700" color="#FFD700" />
                            <span>Add to favorite</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="spot-grid-bottom-nav">
                <button className="bottom-nav-item" onClick={() => navigate('/dashboard/strategy-plaza')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>Strategy Plaza</span>
                </button>
                <button className="bottom-nav-item active">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                    <span>Strategy Trading</span>
                </button>
                <button className="bottom-nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>My Strategy</span>
                </button>
                <button className="bottom-nav-item" onClick={() => navigate('/dashboard/pnl-analysis')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span>PnL Analysis</span>
                </button>
            </div>

            {/* Futures Pair Selector Modal */}
            {showFuturesPairModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'flex-end' }}
                    onClick={() => setShowFuturesPairModal(false)}>
                    <div style={{ width: '100%', background: '#111118', borderRadius: '16px 16px 0 0', padding: '20px 16px 40px' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Select Pair</span>
                            <button onClick={() => setShowFuturesPairModal(false)} style={{ background: 'none', border: 'none', color: '#71717A', fontSize: 20, cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {FUTURES_PAIRS_SG.map(pair => (
                                <div key={pair} onClick={() => { localStorage.setItem('dw_spotgrid_pair', pair); setSelectedPair(pair); setShowFuturesPairModal(false) }}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a24', cursor: 'pointer' }}>
                                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{pair}</span>
                                    {selectedPair === pair && (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#00C0A3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ color: '#000', fontSize: 11 }}>✓</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
