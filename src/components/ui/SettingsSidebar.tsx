import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Plus } from 'lucide-react'
import './SettingsSidebar.css'

interface SettingsSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
    const [activeTab, setActiveTab] = useState<'orderbooks' | 'trades'>('orderbooks')
    const [tradeTab, setTradeTab] = useState<'spot' | 'grid'>('spot')
    const [buySellTab, setBuySellTab] = useState<'buy' | 'sell'>('buy')
    const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop'>('limit')

    // Mock orderbook data
    const orderbookData = [
        { price: '19967.98', amount: '0.10016', total: '1,999.99288' },
        { price: '19967.69', amount: '0.00100', total: '19.96769' },
        { price: '19967.66', amount: '0.00066', total: '13.17866' },
        { price: '19967.61', amount: '0.27769', total: '5,544.80562' },
        { price: '19967.60', amount: '0.01961', total: '391.56464' },
        { price: '19967.59', amount: '0.73579', total: '14,691.95305' },
        { price: '19967.58', amount: '0.09455', total: '1,887.93469' },
        { price: '19967.57', amount: '0.05009', total: '1,000.17558' },
        { price: '19967.56', amount: '0.10016', total: '1,999.95081' },
        { price: '19967.43', amount: '0.02000', total: '399.34860' },
        { price: '19967.42', amount: '0.16787', total: '3,351.93080' },
        { price: '19967.36', amount: '0.04000', total: '798.69440' },
        { price: '19967.11', amount: '0.00130', total: '25.95724' },
        { price: '19967.10', amount: '0.18559', total: '3,705.69409' },
        { price: '19966.99', amount: '0.00200', total: '39.93398' },
        { price: '19966.98', amount: '0.52856', total: '10,553.74695' },
        { price: '19966.56', amount: '0.00066', total: '13.17793' },
        { price: '19966.52', amount: '0.00250', total: '49.91630' },
    ]

    if (!isOpen) return null

    return createPortal(
        <div className="trading-panel-overlay" onClick={onClose}>
            <div className="trading-panel-container" onClick={(e) => e.stopPropagation()}>
                {/* Left: Orderbooks Panel */}
                <div className="tp-orderbook-panel">
                    <div className="tp-ob-header">
                        <div className="tp-ob-tabs">
                            <span 
                                className={`tp-ob-tab ${activeTab === 'orderbooks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('orderbooks')}
                            >
                                Orderbooks
                            </span>
                            <span 
                                className={`tp-ob-tab ${activeTab === 'trades' ? 'active' : ''}`}
                                onClick={() => setActiveTab('trades')}
                            >
                                Last trades
                            </span>
                        </div>
                        <div className="tp-ob-settings-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="tp-ob-controls">
                        <div className="tp-ob-view-btns">
                            <div className="tp-ob-view-btn both active">
                                <span></span><span></span><span></span>
                            </div>
                            <div className="tp-ob-view-btn bids">
                                <span></span><span></span><span></span>
                            </div>
                            <div className="tp-ob-view-btn asks">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div className="tp-ob-precision">
                            0.01 <ChevronDown size={12} />
                        </div>
                    </div>

                    <div className="tp-ob-columns">
                        <span>Price(USDT)</span>
                        <span>Amount(BTC)</span>
                        <span>Total</span>
                    </div>

                    <div className="tp-ob-list">
                        {orderbookData.map((order, i) => (
                            <div key={i} className={`tp-ob-row ${i >= 5 && i <= 6 ? 'highlight' : ''}`}>
                                <span className="tp-price">{order.price}</span>
                                <span className="tp-amount">{order.amount}</span>
                                <span className="tp-total">{order.total}</span>
                                {i >= 5 && i <= 6 && <div className="tp-ob-bg"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Trading Form Panel */}
                <div className="tp-trade-panel">
                    <div className="tp-trade-tabs">
                        <span 
                            className={`tp-trade-tab ${tradeTab === 'spot' ? 'active' : ''}`}
                            onClick={() => setTradeTab('spot')}
                        >
                            Spot
                        </span>
                        <span 
                            className={`tp-trade-tab ${tradeTab === 'grid' ? 'active' : ''}`}
                            onClick={() => setTradeTab('grid')}
                        >
                            Grid
                        </span>
                    </div>

                    <div className="tp-buy-sell-tabs">
                        <button 
                            className={`tp-bs-tab buy ${buySellTab === 'buy' ? 'active' : ''}`}
                            onClick={() => setBuySellTab('buy')}
                        >
                            Buy BTC
                        </button>
                        <button 
                            className={`tp-bs-tab sell ${buySellTab === 'sell' ? 'active' : ''}`}
                            onClick={() => setBuySellTab('sell')}
                        >
                            Sell BTC
                        </button>
                    </div>

                    <div className="tp-order-types">
                        <span 
                            className={`tp-order-type ${orderType === 'limit' ? 'active' : ''}`}
                            onClick={() => setOrderType('limit')}
                        >
                            Limit
                        </span>
                        <span 
                            className={`tp-order-type ${orderType === 'market' ? 'active' : ''}`}
                            onClick={() => setOrderType('market')}
                        >
                            Market
                        </span>
                        <span 
                            className={`tp-order-type ${orderType === 'stop' ? 'active' : ''}`}
                            onClick={() => setOrderType('stop')}
                        >
                            Stop limit
                        </span>
                    </div>

                    <div className="tp-avbl-row">
                        <span className="tp-avbl-label">Avbl</span>
                        <span className="tp-avbl-value">9,500.0564107 USDT</span>
                        <Plus size={14} className="tp-avbl-icon" />
                    </div>

                    <div className="tp-input-group">
                        <span className="tp-input-label">Price</span>
                        <input type="text" className="tp-input" defaultValue="USDT 19972.90" />
                    </div>

                    <div className="tp-input-group">
                        <span className="tp-input-label">Amount</span>
                        <input type="text" className="tp-input" placeholder="" />
                        <span className="tp-input-suffix">BTC</span>
                    </div>

                    <div className="tp-slider">
                        <div className="tp-slider-track">
                            <div className="tp-slider-thumb"></div>
                        </div>
                        <div className="tp-slider-dots">
                            <span className="tp-slider-dot active"></span>
                            <span className="tp-slider-dot"></span>
                            <span className="tp-slider-dot"></span>
                            <span className="tp-slider-dot"></span>
                            <span className="tp-slider-dot"></span>
                        </div>
                    </div>

                    <div className="tp-input-group">
                        <span className="tp-input-label">Total</span>
                        <input type="text" className="tp-input" placeholder="" />
                    </div>

                    <div className="tp-advanced-row">
                        <div className="tp-advanced-checkbox"></div>
                        <span className="tp-advanced-label">Advanced options</span>
                    </div>

                    <div className="tp-max-row">
                        <span className="tp-max-label">Max Buy</span>
                        <span className="tp-max-value">0 BTC</span>
                    </div>

                    <button className="tp-main-btn buy">Buy BTC</button>

                    <div className="tp-action-btns">
                        <button className="tp-action-btn">Deposit</button>
                        <button className="tp-action-btn">Transfer</button>
                        <button className="tp-action-btn">Withdraw</button>
                    </div>
                </div>

                {/* Close Button */}
                <button className="tp-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>
        </div>,
        document.body
    )
}
