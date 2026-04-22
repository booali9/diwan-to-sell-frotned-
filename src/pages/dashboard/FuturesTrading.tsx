import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import type { IChartApi } from 'lightweight-charts'
import { MoreHorizontal, ChevronDown, Settings, Maximize2, BarChart3 } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { openTrade, getMyOpenTrades, closeTrade } from '../../services/tradeService'
import { getBalance, getFuturesBalance, setFuturesBalance as saveFuturesBalance } from '../../services/walletService'
import { useToast } from '../../context/ToastContext'
import '../../styles/dashboard.css'
import '../../styles/trade.css'
import '../../styles/spot-trade.css'

const PAIR_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT']
const COIN_NAMES: Record<string, string> = { BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB', XRP: 'Ripple', DOGE: 'Dogecoin', ADA: 'Cardano', AVAX: 'Avalanche' }
const toBinanceSymbol = (pair: string) => pair.replace('/', '')
const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50, 75, 100, 125]

export default function FuturesTrading() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const mobileChartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const mobileChartRef = useRef<IChartApi | null>(null)

    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
    const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop'>('limit')
    const [chartTab, setChartTab] = useState<'chart' | 'info'>('chart')
    const [obTab, setObTab] = useState<'orderbooks' | 'trades'>('orderbooks')
    const [tradeType, setTradeType] = useState<'spot' | 'grid'>('spot')
    const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
    const [ordersTab, setOrdersTab] = useState<'open' | 'history'>('open')
    const [showPairSelector, setShowPairSelector] = useState(false)
    const [pairSearch, setPairSearch] = useState('')
    const [showLeverageModal, setShowLeverageModal] = useState(false)

    const [livePrices, setLivePrices] = useState<Record<string, number>>({})
    const [marketData, setMarketData] = useState<Record<string, any>>({})
    const [selectedPair, setSelectedPair] = useState(
        () => localStorage.getItem('dw_futurestrading_pair') || 'BTC/USDT'
    )
    const [tradeAmount, setTradeAmount] = useState('')
    const [tradePrice, setTradePrice] = useState('')
    const [tradeTotal, setTradeTotal] = useState('')
    const [leverage, setLeverage] = useState(10)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [futuresBalance, setFuturesBalance] = useState(() => getFuturesBalance())
    const [openTradesList, setOpenTradesList] = useState<any[]>([])
    const [ohlcData, setOhlcData] = useState({ open: 0, high: 0, low: 0, close: 0, change: 0 })

    const currentPrice = livePrices[selectedPair] || 0
    const selectedCoin = selectedPair.split('/')[0]
    const pairChangeData = marketData[selectedPair] || {}
    const change24h = pairChangeData.change24h || 0
    const volume24h = pairChangeData.volume || 0
    const high24h = pairChangeData.high24h || ohlcData.high
    const low24h = pairChangeData.low24h || ohlcData.low

    const handleNumericInput = (value: string, setter: (v: string) => void) => {
        const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '')
        const parts = cleaned.split('.')
        if (parts.length > 2) return
        setter(cleaned)
    }

    useEffect(() => {
        const amt = parseFloat(tradeAmount) || 0
        const price = orderType === 'market' ? currentPrice : (parseFloat(tradePrice) || 0)
        if (amt > 0 && price > 0) setTradeTotal((amt * price).toFixed(2))
        else setTradeTotal('')
    }, [tradeAmount, tradePrice, currentPrice, orderType])

    useEffect(() => {
        if (currentPrice > 0 && orderType !== 'market') setTradePrice(currentPrice.toFixed(2))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPair, currentPrice > 0 ? Math.floor(currentPrice) : 0])

    useEffect(() => {
        const fetchUserBalance = async () => {
            try {
                const balRes = await getBalance().catch(() => ({ balance: 0 }))
                if (typeof (balRes as any).futuresBalance === 'number') {
                    setFuturesBalance((balRes as any).futuresBalance)
                    saveFuturesBalance((balRes as any).futuresBalance)
                } else {
                    setFuturesBalance(getFuturesBalance())
                }
            } catch (e) { console.warn('Balance fetch failed:', e) }
        }

        fetchUserBalance()
        const interval = setInterval(fetchUserBalance, 10000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        let ws: WebSocket | null = null;
        let retryTimeout: any;

        const connectWS = () => {
            try {
                ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (Array.isArray(data)) {
                            let pricesChanged = false;
                            const newPrices: Record<string, number> = {};
                            const newMarketData: Record<string, any> = {};

                            data.forEach((ticker: any) => {
                                if (ticker.s.endsWith('USDT')) {
                                    const val = parseFloat(ticker.c);
                                    const cleanPair = ticker.s.replace('USDT', '/USDT');
                                    newPrices[ticker.s] = val;
                                    newPrices[cleanPair] = val;
                                    pricesChanged = true;

                                    newMarketData[cleanPair] = {
                                        price: val,
                                        change24h: parseFloat(ticker.P),
                                        high: parseFloat(ticker.h),
                                        low: parseFloat(ticker.l),
                                        volume24h: parseFloat(ticker.q)
                                    };
                                }
                            });

                            if (pricesChanged) {
                                setLivePrices(prev => ({ ...prev, ...newPrices }));
                                setMarketData(prev => ({ ...prev, ...newMarketData }));
                            }
                        }
                    } catch (e) { /* ignore */ }
                };
                ws.onerror = () => { if (ws) ws.close(); };
                ws.onclose = () => { retryTimeout = setTimeout(connectWS, 5000); };
            } catch (err) {
                retryTimeout = setTimeout(connectWS, 5000);
            }
        };

        connectWS();
        return () => {
            clearTimeout(retryTimeout);
            if (ws) {
                ws.onclose = null;
                ws.onerror = null;
                ws.close();
            }
        };
    }, []);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const trades = await getMyOpenTrades()
                setOpenTradesList((trades || []).filter((t: any) => t.type === 'futures'))
            } catch { /* ignore */ }
        }
        fetchTrades()
        const interval = setInterval(fetchTrades, 15000)
        return () => clearInterval(interval)
    }, [])

    const askOrders = currentPrice > 0 ? Array.from({ length: 18 }, (_, i) => {
        const offset = (i + 1) * (currentPrice * 0.0001 * (1 + Math.random()))
        const p = parseFloat((currentPrice + offset).toFixed(2))
        const amt = parseFloat((Math.random() * 0.5 + 0.001).toFixed(5))
        return { price: p, amount: amt, total: parseFloat((p * amt).toFixed(5)) }
    }).sort((a, b) => a.price - b.price) : []

    const bidOrders = currentPrice > 0 ? Array.from({ length: 18 }, (_, i) => {
        const offset = (i + 1) * (currentPrice * 0.0001 * (1 + Math.random()))
        const p = parseFloat((currentPrice - offset).toFixed(2))
        const amt = parseFloat((Math.random() * 0.5 + 0.001).toFixed(5))
        return { price: p, amount: amt, total: parseFloat((p * amt).toFixed(5)) }
    }).sort((a, b) => b.price - a.price) : []

    const handleFuturesTrade = async (side: 'long' | 'short') => {
        const amt = Number(tradeAmount)
        if (!tradeAmount || isNaN(amt) || amt <= 0) { toast('Please enter a valid amount', 'warning'); return }

        const entryPrice = orderType === 'market' ? currentPrice : (parseFloat(tradePrice) || currentPrice)
        const notional = amt * (entryPrice || 1)
        const requiredMargin = notional / leverage
        if (requiredMargin > futuresBalance) {
            toast(`Insufficient futures balance. Margin required: $${requiredMargin.toFixed(2)}, Available: $${futuresBalance.toFixed(2)}. Transfer from Spot first.`, 'error')
            return
        }

        if (orderType === 'limit') {
            const limitPriceVal = parseFloat(tradePrice)
            if (!tradePrice || isNaN(limitPriceVal) || limitPriceVal <= 0) {
                toast('Please enter a valid limit price', 'warning'); return
            }
        }

        setIsSubmitting(true)
        try {
            const payload: Parameters<typeof openTrade>[0] = {
                asset: selectedCoin,
                type: 'futures',
                side,
                amount: amt,
                leverage,
                orderType: orderType === 'market' ? 'market' : 'limit',
            }
            if (orderType !== 'market') {
                payload.limitPrice = parseFloat(tradePrice)
            }
            await openTrade(payload)
            toast(orderType === 'limit' ? 'Limit order placed!' : `${side === 'long' ? 'Long' : 'Short'} position opened!`, 'success')
            setTradeAmount(''); setTradeTotal('')
            const [balRes, trades] = await Promise.all([getBalance(), getMyOpenTrades()])
            if (typeof (balRes as any).futuresBalance === 'number') {
                setFuturesBalance((balRes as any).futuresBalance)
                saveFuturesBalance((balRes as any).futuresBalance)
            }
            setOpenTradesList((trades || []).filter((t: any) => t.type === 'futures'))
        } catch (e: any) { toast(e.message || 'Trade failed', 'error') }
        finally { setIsSubmitting(false) }
    }

    const handleCloseTrade = async (tradeId: string) => {
        try {
            const trade = openTradesList.find((t: any) => t._id === tradeId)
            const isPending = trade?.status === 'pending'
            const closeRes = await closeTrade(tradeId)
            const closedTrade = closeRes?.trade
            const margin = closedTrade?.marginUsed ?? trade?.marginUsed ?? 0
            const pnl = isPending ? 0 : (closedTrade?.pnl ?? 0)
            const returnAmt = Math.max(0, margin + pnl)
            if (returnAmt > 0) {
                const newFutBal = parseFloat((getFuturesBalance() + returnAmt).toFixed(2))
                saveFuturesBalance(newFutBal)
            }
            toast(isPending ? 'Order cancelled' : 'Position closed successfully', 'success')
            const [balRes, trades] = await Promise.all([getBalance(), getMyOpenTrades()])
            if (typeof (balRes as any).futuresBalance === 'number') {
                setFuturesBalance((balRes as any).futuresBalance)
                saveFuturesBalance((balRes as any).futuresBalance)
            }
            setOpenTradesList((trades || []).filter((t: any) => t.type === 'futures'))
        } catch (e: any) { toast(e.message || 'Failed to close position', 'error') }
    }

    const handleSelectPair = (pair: string) => {
        localStorage.setItem('dw_futurestrading_pair', pair); setSelectedPair(pair); setShowPairSelector(false); setPairSearch(''); setTradeAmount(''); setTradeTotal('')
    }

    const formatPrice = (price: number) => {
        if (price === 0) return '\u2014'
        if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        if (price >= 1) return price.toFixed(4)
        return price.toFixed(6)
    }

    const timeframeMap: Record<string, string> = { '1s': '1s', '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w' }
    const timeframes = ['1s', '15m', '1H', '4H', '1D', '1W']

    const renderChart = useCallback(async (container: HTMLDivElement, existingChart: React.MutableRefObject<IChartApi | null>, isMobile = false) => {
        if (existingChart.current) { existingChart.current.remove(); existingChart.current = null }
        const binanceSymbol = toBinanceSymbol(selectedPair)
        const interval = timeframeMap[selectedTimeframe] || '1d'
        let candleData: any[] = [], volumeData: any[] = []
        try {
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=180`)
            const klines = await res.json()
            if (Array.isArray(klines)) {
                for (const k of klines) {
                    const time = interval.includes('s') || interval.includes('m') || interval.includes('h')
                        ? Math.floor(k[0] / 1000) : new Date(k[0]).toISOString().split('T')[0]
                    const open = parseFloat(k[1]), high = parseFloat(k[2]), low = parseFloat(k[3]), close = parseFloat(k[4]), volume = parseFloat(k[5])
                    candleData.push({ time, open, high, low, close })
                    volumeData.push({ time, value: volume, color: close >= open ? '#10b981' : '#ef4444' })
                }
                if (candleData.length > 0) {
                    const last = candleData[candleData.length - 1], prev = candleData.length > 1 ? candleData[candleData.length - 2] : last
                    setOhlcData({ open: last.open, high: last.high, low: last.low, close: last.close, change: prev.close > 0 ? ((last.close - prev.close) / prev.close * 100) : 0 })
                }
            }
        } catch {
            let lastClose = currentPrice || 65000
            const startDate = new Date(); startDate.setDate(startDate.getDate() - 180)
            for (let i = 0; i < 180; i++) {
                const date = new Date(startDate); date.setDate(startDate.getDate() + i)
                const open = lastClose, chg = (Math.random() - 0.48) * lastClose * 0.02, close = open + chg
                const high = Math.max(open, close) + Math.random() * lastClose * 0.005
                const low = Math.min(open, close) - Math.random() * lastClose * 0.005
                candleData.push({ time: date.toISOString().split('T')[0], open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) })
                volumeData.push({ time: date.toISOString().split('T')[0], value: Math.random() * 50000, color: close >= open ? '#10b981' : '#ef4444' })
                lastClose = close
            }
        }
        const chart = createChart(container, {
            width: container.clientWidth, height: isMobile ? 280 : container.clientHeight || 400,
            layout: { background: { type: ColorType.Solid, color: '#06060a' }, textColor: '#71717A' },
            grid: { vertLines: { color: '#1a1a24' }, horzLines: { color: '#1a1a24' } },
            autoSize: !isMobile, timeScale: { borderColor: '#1a1a24', timeVisible: true },
            rightPriceScale: { borderColor: '#1a1a24' }, crosshair: { mode: 1 },
        })
        const cs = chart.addSeries(CandlestickSeries, { upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444' })
        cs.setData(candleData as any)
        if (volumeData.length > 0) {
            const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume' })
            vs.setData(volumeData as any)
            chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
        }
        chart.timeScale().fitContent()
        existingChart.current = chart
        const handleResize = () => { if (container && existingChart.current) existingChart.current.applyOptions({ width: container.clientWidth }) }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize);
            if (existingChart.current) {
                existingChart.current.remove();
                existingChart.current = null;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPair, selectedTimeframe, currentPrice])

    useEffect(() => {
        if (!chartContainerRef.current) return
        let cleanup: (() => void) | undefined
        renderChart(chartContainerRef.current, chartRef, false).then(fn => { cleanup = fn })
        return () => { cleanup?.() }
    }, [renderChart])

    useEffect(() => {
        if (!mobileChartContainerRef.current) return
        let cleanup: (() => void) | undefined
        renderChart(mobileChartContainerRef.current, mobileChartRef, true).then(fn => { cleanup = fn })
        return () => { cleanup?.() }
    }, [renderChart])

    const futuresTrades = openTradesList.filter(t => t.status === 'open' || !t.status)

    return (
        <Layout activePage="futures" hideFooter={true}>
            {/* Pair Selector Modal */}
            {showPairSelector && (
                <div className="tm-overlay-v3" onClick={() => setShowPairSelector(false)} style={{ zIndex: 1000 }}>
                    <div className="tm-overlay-content-v3" onClick={e => e.stopPropagation()} style={{ maxHeight: '70vh', overflow: 'auto' }}>
                        <div className="tm-overlay-header-v3">
                            <span className="tm-overlay-title">Select Pair</span>
                            <button className="tm-close-overlay" onClick={() => setShowPairSelector(false)}>\u2715</button>
                        </div>
                        <div style={{ padding: '8px 16px' }}>
                            <input type="text" placeholder="Search..." value={pairSearch} onChange={e => setPairSearch(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }} />
                        </div>
                        <div className="tm-overlay-list-v3">
                            {PAIR_SYMBOLS.filter(p => p.toLowerCase().includes(pairSearch.toLowerCase()) || (COIN_NAMES[p.split('/')[0]] || '').toLowerCase().includes(pairSearch.toLowerCase())).map(pair => {
                                const coin = pair.split('/')[0], price = livePrices[pair] || 0, md = marketData[pair] || {}
                                return (
                                    <div key={pair} className="tm-overlay-item-v3" onClick={() => handleSelectPair(pair)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                        <div><span style={{ fontWeight: 600 }}>{coin}</span><span style={{ color: '#71717A', marginLeft: 4, fontSize: 12 }}>/USDT</span>
                                            <div style={{ fontSize: 11, color: '#71717A' }}>{COIN_NAMES[coin]}</div></div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#fff', fontSize: 13 }}>{formatPrice(price)}</div>
                                            <div style={{ fontSize: 11, color: (md.change24h || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                                                {md.change24h ? `${md.change24h >= 0 ? '+' : ''}${md.change24h.toFixed(2)}%` : '\u2014'}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Leverage Modal */}
            {showLeverageModal && (
                <div className="tm-overlay-v3" onClick={() => setShowLeverageModal(false)} style={{ zIndex: 1000 }}>
                    <div className="tm-overlay-content-v3" onClick={e => e.stopPropagation()} style={{ maxHeight: '50vh', overflow: 'auto' }}>
                        <div className="tm-overlay-header-v3">
                            <span className="tm-overlay-title">Select Leverage</span>
                            <button className="tm-close-overlay" onClick={() => setShowLeverageModal(false)}>\u2715</button>
                        </div>
        <div className="tm-overlay-list-v3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 12 }}>
                            {LEVERAGE_OPTIONS.map(lev => (
                                <button key={lev}
                                    onClick={() => { setLeverage(lev); setShowLeverageModal(false) }}
                                    style={{ padding: '10px 0', borderRadius: 8, border: leverage === lev ? '2px solid #10b981' : '1px solid #2a2a3a', background: leverage === lev ? '#10b98122' : '#1a1a24', color: leverage === lev ? '#10b981' : '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                                >{lev}x</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile View */}
            <div className="mobile-only">
                <div className="spot-mobile-container">
                    <div className="spot-mobile-top-tabs">
                        <span className="spot-mobile-tab active">Futures</span>
                        <span className="spot-mobile-tab" onClick={() => navigate('/dashboard/trade')}>Spot</span>
                    </div>
                    <div className="spot-mobile-pair-row">
                        <div className="spot-mobile-pair-left" onClick={() => setShowPairSelector(true)} style={{ cursor: 'pointer' }}>
                            <span className="spot-mobile-pair-name">{selectedPair}</span>
                            <ChevronDown size={12} />
                            <span className={`spot-mobile-change ${change24h >= 0 ? 'positive' : 'negative'}`}>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%</span>
                        </div>
                        <div className="spot-mobile-pair-icons" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                                onClick={e => { e.stopPropagation(); setShowLeverageModal(true) }}
                                style={{ cursor: 'pointer', background: '#1a1a24', padding: '6px 12px', borderRadius: 6, fontSize: 13, color: '#f59e0b', border: '1px solid #f59e0b33', fontWeight: 700, minHeight: 36, minWidth: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >{leverage}x</button>
                            <MoreHorizontal size={18} />
                        </div>
                    </div>
                    <div className="spot-mobile-price">${formatPrice(currentPrice)}</div>

                    {/* Chart */}
                    <div style={{ padding: '0 8px' }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                            {timeframes.map(tf => (
                                <span key={tf} onClick={() => setSelectedTimeframe(tf)} style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: 4, fontSize: 11, background: selectedTimeframe === tf ? '#1a1a24' : 'transparent', color: selectedTimeframe === tf ? '#fff' : '#71717A' }}>{tf}</span>
                            ))}
                        </div>
                        <div ref={mobileChartContainerRef} style={{ width: '100%', height: 280 }} />
                    </div>

                    {/* Orderbook */}
                    <div className="spot-mobile-orderbook">
                        <div className="spot-mobile-ob-header">
                            <span>Price (USDT)</span>
                            <span>Size ({selectedCoin})</span>
                            <span>Price (USDT)</span>
                            <span>Size ({selectedCoin})</span>
                        </div>
                        <div className="spot-mobile-ob-body">
                            <div className="spot-mobile-ob-col bids">
                                {bidOrders.slice(0, 10).map((order, i) => (
                                    <div key={i} className="spot-mobile-ob-row">
                                        <span className="price bid">{formatPrice(order.price)}</span>
                                        <span className="size">{order.amount.toFixed(5)}</span>
                                        <div className="depth-bar bid" style={{ width: `${Math.min(order.total / (bidOrders[0]?.total || 1) * 80, 100)}%` }}></div>
                                    </div>
                                ))}
                            </div>
                            <div className="spot-mobile-ob-col asks">
                                {askOrders.slice(0, 10).map((order, i) => (
                                    <div key={i} className="spot-mobile-ob-row">
                                        <span className="price ask">{formatPrice(order.price)}</span>
                                        <span className="size">{order.amount.toFixed(5)}</span>
                                        <div className="depth-bar ask" style={{ width: `${Math.min(order.total / (askOrders[0]?.total || 1) * 80, 100)}%` }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Trade Form */}
                    <div className="spot-mobile-bs-toggle">
                        <button className={`spot-mobile-bs-btn ${activeTab === 'buy' ? 'active buy' : ''}`} onClick={() => setActiveTab('buy')}>Long</button>
                        <button className={`spot-mobile-bs-btn ${activeTab === 'sell' ? 'active sell' : ''}`} onClick={() => setActiveTab('sell')}>Short</button>
                    </div>
                    <div className="spot-mobile-avbl"><span>Available</span><span>{futuresBalance.toFixed(2)} USDT</span></div>
                    <div className="spot-mobile-order-type">
                        <span className={`${orderType === 'limit' ? 'text-white' : 'text-zinc-500'}`} style={{ cursor: 'pointer', marginRight: 12 }} onClick={() => setOrderType('limit')}>Limit</span>
                        <span className={`${orderType === 'market' ? 'text-white' : 'text-zinc-500'}`} style={{ cursor: 'pointer' }} onClick={() => setOrderType('market')}>Market</span>
                    </div>
                    {orderType !== 'market' && (
                        <div className="spot-mobile-input-row">
                            <button className="spot-mobile-input-btn" onClick={() => { const p = parseFloat(tradePrice) || 0; if (p > 0) setTradePrice((p - 1).toFixed(2)) }}>\u2212</button>
                            <div className="spot-mobile-input-field">
                                <input type="text" inputMode="decimal" value={tradePrice} onChange={e => handleNumericInput(e.target.value, setTradePrice)} placeholder="Price" style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center', outline: 'none', fontSize: 14 }} />
                            </div>
                            <button className="spot-mobile-input-btn" onClick={() => { const p = parseFloat(tradePrice) || 0; setTradePrice((p + 1).toFixed(2)) }}>+</button>
                        </div>
                    )}
                    <div className="spot-mobile-input-row">
                        <button className="spot-mobile-input-btn" onClick={() => { const a = parseFloat(tradeAmount) || 0; if (a > 0) setTradeAmount((a - 0.001).toFixed(6)) }}>\u2212</button>
                        <div className="spot-mobile-input-field">
                            <input type="text" inputMode="decimal" value={tradeAmount} onChange={e => handleNumericInput(e.target.value, setTradeAmount)} placeholder={`Amount (${selectedCoin})`} style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', textAlign: 'center', outline: 'none', fontSize: 14 }} />
                        </div>
                        <button className="spot-mobile-input-btn" onClick={() => { const a = parseFloat(tradeAmount) || 0; setTradeAmount((a + 0.001).toFixed(6)) }}>+</button>
                    </div>
                    <div className="spot-mobile-slider">
                        <div className="spot-mobile-slider-track"><div className="spot-mobile-slider-dots">
                            {[0, 25, 50, 75, 100].map(pct => (<div key={pct} className="slider-dot" onClick={() => { if (currentPrice > 0 && futuresBalance > 0) { const orderValue = (futuresBalance * pct) / 100; setTradeAmount((orderValue / currentPrice).toFixed(6)) } }} style={{ cursor: 'pointer' }}></div>))}
                        </div></div>
                    </div>
                    {tradeTotal && (<div className="spot-mobile-info-row"><span className="spot-mobile-info-label">Total</span><span className="spot-mobile-info-value">{tradeTotal} USDT</span></div>)}
                    <div className="spot-mobile-info-row"><span className="spot-mobile-info-label">Leverage</span><button onClick={e => { e.stopPropagation(); setShowLeverageModal(true) }} style={{ cursor: 'pointer', color: '#f59e0b', background: '#1a1a24', border: '1px solid #f59e0b33', borderRadius: 6, padding: '6px 16px', fontSize: 14, fontWeight: 700, minHeight: 36 }}>{leverage}x</button></div>
                    <button className={`spot-mobile-main-btn ${activeTab}`} onClick={() => handleFuturesTrade(activeTab === 'buy' ? 'long' : 'short')} disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : (activeTab === 'buy' ? `Open Long ${selectedCoin}` : `Open Short ${selectedCoin}`)}
                    </button>
                    <div className="spot-mobile-bottom-tabs">
                        <span className={`spot-mobile-bottom-tab ${ordersTab === 'open' ? 'active' : ''}`} onClick={() => setOrdersTab('open')}>Positions ({futuresTrades.filter(t => t.status === 'open').length})</span>
                        <span className={`spot-mobile-bottom-tab ${ordersTab === 'history' ? 'active' : ''}`} onClick={() => setOrdersTab('history')}>Open Orders ({futuresTrades.filter(t => t.status === 'pending').length})</span>
                    </div>
                    {ordersTab === 'open' && futuresTrades.length > 0 && (
                        <div style={{ padding: '8px 12px' }}>
                            {futuresTrades.filter(t => t.status !== 'pending').map(trade => {
                                const isLong = trade.side === 'buy' || trade.side === 'long'
                                const livePnl = trade.unrealizedPnL ?? trade.pnl ?? 0
                                const pnlPct = trade.pnlPercentage ?? (trade.marginUsed > 0 ? (livePnl / trade.marginUsed) * 100 : 0)
                                const pnlPos = livePnl >= 0
                                return (
                                <div key={trade._id} style={{ background: '#0f0f17', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid #1e1e2e' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{trade.asset.split('/')[0]}/USDT</span>
                                        <span style={{ color: isLong ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700 }}>{isLong ? 'LONG' : 'SHORT'} {trade.leverage || leverage}x</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#71717a', marginBottom: 4 }}>
                                        <span>Entry: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>${formatPrice(trade.entryPrice)}</span></span>
                                        {trade.currentPrice && (
                                            <span>Mark: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>${formatPrice(trade.currentPrice)}</span></span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, color: '#71717a' }}>PnL</span>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: pnlPos ? '#10b981' : '#ef4444' }}>{pnlPos ? '+' : ''}${livePnl.toFixed(2)}</span>
                                            <span style={{ fontSize: 11, color: pnlPos ? '#10b981' : '#ef4444', fontWeight: 600 }}>({pnlPos ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleCloseTrade(trade._id)} style={{ width: '100%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                                </div>
                                )
                            })}
                        </div>
                    )}
                    {ordersTab === 'open' && futuresTrades.filter(t => t.status !== 'pending').length === 0 && (
                        <div className="spot-mobile-empty"><div className="spot-mobile-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="2" stroke="#27272a" strokeWidth="2" /><path d="M8 18h32" stroke="#27272a" strokeWidth="2" /></svg>
                        </div><span className="spot-mobile-empty-text">No open positions</span></div>
                    )}
                    {ordersTab === 'history' && (
                        <div style={{ padding: '8px 12px' }}>
                            {futuresTrades.filter(t => t.status === 'pending').length === 0 ? (
                                <div className="spot-mobile-empty"><div className="spot-mobile-empty-icon">
                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="2" stroke="#27272a" strokeWidth="2" /><path d="M8 18h32" stroke="#27272a" strokeWidth="2" /></svg>
                                </div><span className="spot-mobile-empty-text">No open orders</span></div>
                            ) : futuresTrades.filter(t => t.status === 'pending').map(trade => {
                                const isLong = trade.side === 'buy' || trade.side === 'long'
                                return (
                                    <div key={trade._id} style={{ background: '#0f0f17', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid #2a2a1e' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{trade.asset.split('/')[0]}/USDT</span>
                                                <span style={{ background: '#f59e0b22', color: '#f59e0b', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>LIMIT</span>
                                            </div>
                                            <span style={{ color: isLong ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700 }}>{isLong ? 'LONG' : 'SHORT'} {trade.leverage || leverage}x</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#71717a', marginBottom: 8 }}>
                                            <span>Limit: <span style={{ color: '#f59e0b', fontWeight: 600 }}>${formatPrice(trade.limitPrice || trade.entryPrice)}</span></span>
                                            <span>Margin: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>${trade.marginUsed?.toFixed(2)}</span></span>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#71717a', marginBottom: 8 }}>Waiting for price to reach ${formatPrice(trade.limitPrice || trade.entryPrice)}</div>
                                        <button onClick={() => handleCloseTrade(trade._id)} style={{ width: '100%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only">
                <div className="spot-terminal">
                    <div className="spot-symbol-bar">
                        <div className="spot-pair-info" onClick={() => setShowPairSelector(true)} style={{ cursor: 'pointer' }}>
                            <div className="spot-coin-icon">{selectedCoin === 'BTC' ? '\u20bf' : selectedCoin.charAt(0)}</div>
                            <div className="spot-pair-name">
                                <div className="spot-pair-title">{selectedCoin} <span className="suffix">/USDT</span> <ChevronDown size={14} className="text-zinc-500 ml-1" /></div>
                                <span className="spot-pair-sub">{COIN_NAMES[selectedCoin]} Futures</span>
                            </div>
                        </div>
                        <div className="spot-price-section">
                            <span className="spot-main-price">${formatPrice(currentPrice)}</span>
                            <span className={`spot-price-usd ${change24h >= 0 ? 'positive' : 'negative'}`}>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%</span>
                        </div>
                        <div className="spot-stats-row">
                            <div className="spot-stat"><span className="spot-stat-label">24h Change</span><span className={`spot-stat-value ${change24h >= 0 ? 'positive' : 'negative'}`}>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%</span></div>
                            <div className="spot-stat"><span className="spot-stat-label">24h High</span><span className="spot-stat-value">${formatPrice(high24h)}</span></div>
                            <div className="spot-stat"><span className="spot-stat-label">24h Low</span><span className="spot-stat-value">${formatPrice(low24h)}</span></div>
                            <div className="spot-stat"><span className="spot-stat-label">24h Vol ({selectedCoin})</span><span className="spot-stat-value">{volume24h > 0 ? (volume24h > 1e6 ? `${(volume24h / 1e6).toFixed(2)}M` : volume24h.toLocaleString()) : '\u2014'}</span></div>
                            <div className="spot-stat"><span className="spot-stat-label">Leverage</span><span className="spot-stat-value" onClick={() => setShowLeverageModal(true)} style={{ cursor: 'pointer', color: '#f59e0b' }}>{leverage}x</span></div>
                        </div>
                        <button className="spot-settings-btn"><Settings size={18} /></button>
                    </div>
                    <div className="spot-main-grid">
                        <div className="spot-chart-panel">
                            <div className="spot-chart-header">
                                <div className="spot-chart-tabs">
                                    <span className={`spot-chart-tab ${chartTab === 'chart' ? 'active' : ''}`} onClick={() => setChartTab('chart')}>Chart</span>
                                    <span className={`spot-chart-tab ${chartTab === 'info' ? 'active' : ''}`} onClick={() => setChartTab('info')}>Info</span>
                                </div>
                                <div className="spot-timeframes">
                                    {timeframes.map(tf => (<span key={tf} className={`spot-tf-item ${selectedTimeframe === tf ? 'highlight' : ''}`} onClick={() => setSelectedTimeframe(tf)} style={{ cursor: 'pointer' }}>{tf}</span>))}
                                    <span className="spot-tf-divider"></span>
                                    <BarChart3 size={14} className="text-zinc-500 cursor-pointer" />
                                    <Maximize2 size={14} className="text-zinc-500 cursor-pointer" />
                                </div>
                                <div className="spot-view-tabs">
                                    <span className="spot-view-tab active">Original</span>
                                    <span className="spot-view-tab" onClick={() => navigate('/dashboard/advance-trade')} style={{ cursor: 'pointer' }}>Trading View</span>
                                    <span className="spot-view-tab">Depth</span>
                                </div>
                            </div>
                            <div className="spot-chart-container">
                                <div className="spot-chart-info">
                                    <div className="ohlc">
                                        <span>{new Date().toLocaleDateString()}</span>
                                        <span>Open: <span className={ohlcData.change >= 0 ? 'green' : 'red'}>{formatPrice(ohlcData.open)}</span></span>
                                        <span>High: <span className={ohlcData.change >= 0 ? 'green' : 'red'}>{formatPrice(ohlcData.high)}</span></span>
                                        <span>Low: <span className={ohlcData.change >= 0 ? 'green' : 'red'}>{formatPrice(ohlcData.low)}</span></span>
                                        <span>Close: <span className={ohlcData.change >= 0 ? 'green' : 'red'}>{formatPrice(ohlcData.close)}</span></span>
                                        <span>CHANGE: <span className={ohlcData.change >= 0 ? 'green' : 'red'}>{ohlcData.change.toFixed(2)}%</span></span>
                                    </div>
                                </div>
                                <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
                            </div>
                        </div>
                        <div className="spot-orderbook-panel">
                            <div className="spot-ob-header">
                                <div className="spot-ob-tabs">
                                    <span className={`spot-ob-tab ${obTab === 'orderbooks' ? 'active' : ''}`} onClick={() => setObTab('orderbooks')}>Orderbooks</span>
                                    <span className={`spot-ob-tab ${obTab === 'trades' ? 'active' : ''}`} onClick={() => setObTab('trades')}>Last trades</span>
                                </div>
                            </div>
                            <div className="spot-ob-controls">
                                <div className="spot-ob-view-btns"><div className="spot-ob-view-btn both"></div><div className="spot-ob-view-btn bids"></div><div className="spot-ob-view-btn asks"></div></div>
                                <div className="spot-ob-precision">0.01 <ChevronDown size={10} /></div>
                            </div>
                            <div className="spot-ob-columns"><span>Price(USDT)</span><span>Amount({selectedCoin})</span><span>Total</span></div>
                            <div className="spot-ob-list">
                                {askOrders.slice(0, 18).reverse().map((order, i) => (
                                    <div key={i} className="spot-ob-row">
                                        <span className="price ask">{formatPrice(order.price)}</span>
                                        <span className="amount">{order.amount.toFixed(5)}</span>
                                        <span className="total">{order.total.toFixed(2)}</span>
                                        <div className="depth-bg ask" style={{ width: `${Math.min(order.total / (askOrders[0]?.total || 1) * 60, 100)}%` }}></div>
                                    </div>
                                ))}
                            </div>
                            <div className="spot-ob-spread">
                                <span className="spot-ob-spread-price">{formatPrice(currentPrice)}</span>
                            </div>
                        </div>
                        <div className="spot-trade-panel">
                            <div className="spot-trade-type-tabs">
                                <span className={`spot-trade-type-tab ${tradeType === 'spot' ? 'active' : ''}`} onClick={() => setTradeType('spot')}>Futures</span>
                                <span className={`spot-trade-type-tab ${tradeType === 'grid' ? 'active' : ''}`} onClick={() => setTradeType('grid')}>Grid</span>
                            </div>
                            <div className="spot-trade-form">
                                <div className="spot-buy-sell-tabs">
                                    <div className={`spot-bs-tab buy ${activeTab === 'buy' ? 'active' : ''}`} onClick={() => setActiveTab('buy')}>Long {selectedCoin}</div>
                                    <div className={`spot-bs-tab sell ${activeTab === 'sell' ? 'active' : ''}`} onClick={() => setActiveTab('sell')}>Short {selectedCoin}</div>
                                </div>
                                <div className="spot-order-types">
                                    <span className={`spot-order-type ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>Limit</span>
                                    <span className={`spot-order-type ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>Market</span>
                                    <span className={`spot-order-type ${orderType === 'stop' ? 'active' : ''}`} onClick={() => setOrderType('stop')}>Stop limit</span>
                                </div>
                                <div className="spot-balance-row">
                                    <span className="spot-balance-text">Avbl <span>{futuresBalance.toFixed(2)} USDT</span></span>
                                    <div className="spot-balance-icon" onClick={() => navigate('/dashboard/deposit')} style={{ cursor: 'pointer' }}>+</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: '#71717A' }}>
                                    <span>Leverage</span>
                                    <span onClick={() => setShowLeverageModal(true)} style={{ cursor: 'pointer', color: '#f59e0b' }}>{leverage}x</span>
                                </div>
                                {orderType !== 'market' && (
                                    <div className="spot-input-group">
                                        <div className="spot-input-wrapper">
                                            <span className="spot-input-label">Price</span>
                                            <input type="text" inputMode="decimal" className="spot-input-field" value={tradePrice} onChange={e => handleNumericInput(e.target.value, setTradePrice)} placeholder="0.00" />
                                            <span className="spot-input-unit">USDT</span>
                                        </div>
                                    </div>
                                )}
                                <div className="spot-input-group">
                                    <div className="spot-input-wrapper">
                                        <span className="spot-input-label">Amount</span>
                                        <input type="text" inputMode="decimal" className="spot-input-field" value={tradeAmount} onChange={e => handleNumericInput(e.target.value, setTradeAmount)} placeholder="0.00" />
                                        <span className="spot-input-unit">{selectedCoin}</span>
                                    </div>
                                </div>
                                <div className="spot-slider-container"><div className="spot-slider"><div className="spot-slider-track"><div className="spot-slider-dots">
                                    {[0, 25, 50, 75, 100].map(pct => (<div key={pct} className="spot-slider-dot" onClick={() => { if (currentPrice > 0 && futuresBalance > 0) { const orderValue = (futuresBalance * pct) / 100; setTradeAmount((orderValue / currentPrice).toFixed(6)) } }} style={{ cursor: 'pointer' }} title={`${pct}%`}></div>))}
                                </div></div></div></div>
                                <div className="spot-input-group">
                                    <div className="spot-input-wrapper">
                                        <span className="spot-input-label">Total</span>
                                        <input type="text" inputMode="decimal" className="spot-input-field" value={tradeTotal} readOnly placeholder="0.00" />
                                        <span className="spot-input-unit">USDT</span>
                                    </div>
                                </div>
                                <button className={`spot-main-btn ${activeTab}`} onClick={() => handleFuturesTrade(activeTab === 'buy' ? 'long' : 'short')} disabled={isSubmitting}>
                                    {isSubmitting ? 'Processing...' : (activeTab === 'buy' ? `Open Long ${selectedCoin}` : `Open Short ${selectedCoin}`)}
                                </button>
                                <div className="spot-bottom-actions">
                                    <button className="spot-action-btn" onClick={() => navigate('/dashboard/deposit')}>Deposit</button>
                                    <button className="spot-action-btn" onClick={() => navigate('/dashboard/withdraw')}>Withdraw</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="spot-orders-panel">
                        <div className="spot-orders-header">
                            <div className="spot-orders-tabs">
                                <span className={`spot-orders-tab ${ordersTab === 'open' ? 'active' : ''}`} onClick={() => setOrdersTab('open')}>Positions ({futuresTrades.filter(t => t.status === 'open').length})</span>
                                <span className={`spot-orders-tab ${ordersTab === 'history' ? 'active' : ''}`} onClick={() => setOrdersTab('history')}>Open Orders ({futuresTrades.filter(t => t.status === 'pending').length})</span>
                            </div>
                        </div>
                        {ordersTab === 'open' && futuresTrades.filter(t => t.status !== 'pending').length > 0 && (
                        <div style={{ padding: '8px 16px' }}>
                            <table style={{ width: '100%', fontSize: 12, color: '#a1a1aa' }}>
                                <thead><tr style={{ borderBottom: '1px solid #1a1a24' }}>
                                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Pair</th>
                                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Side</th>
                                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Amount</th>
                                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Leverage</th>
                                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Entry</th>
                                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>P&amp;L</th>
                                    <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Action</th>
                                </tr></thead>
                                <tbody>{futuresTrades.filter(t => t.status !== 'pending').map(trade => {
                                    const isLong = trade.side === 'buy' || trade.side === 'long'
                                    const livePnl = trade.unrealizedPnL ?? trade.pnl ?? 0
                                    const pnlPct = trade.pnlPercentage ?? (trade.marginUsed > 0 ? (livePnl / trade.marginUsed) * 100 : 0)
                                    const pnlPos = livePnl >= 0
                                    return (
                                    <tr key={trade._id} style={{ borderBottom: '1px solid #0f0f14' }}>
                                        <td style={{ padding: '6px 0', color: '#fff' }}>{trade.asset.split('/')[0]}/USDT</td>
                                        <td style={{ padding: '6px 0', color: isLong ? '#10b981' : '#ef4444' }}>{isLong ? 'LONG' : 'SHORT'}</td>
                                        <td style={{ textAlign: 'right', padding: '6px 0' }}>{trade.amount}</td>
                                        <td style={{ textAlign: 'right', padding: '6px 0', color: '#f59e0b' }}>{trade.leverage || leverage}x</td>
                                        <td style={{ textAlign: 'right', padding: '6px 0' }}>${formatPrice(trade.entryPrice)}</td>
                                        <td style={{ textAlign: 'right', padding: '6px 0', color: pnlPos ? '#10b981' : '#ef4444' }}>
                                            {pnlPos ? '+' : ''}${livePnl.toFixed(2)} ({pnlPos ? '+' : ''}{pnlPct.toFixed(1)}%)
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                            <button onClick={() => handleCloseTrade(trade._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Close</button>
                                        </td>
                                    </tr>
                                    )
                                })}</tbody>
                            </table>
                        </div>
                    )}
                        {ordersTab === 'open' && futuresTrades.filter(t => t.status !== 'pending').length === 0 && (
                            <div className="spot-orders-empty"><div className="spot-empty-icon">
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="#27272a" strokeWidth="2" /><path d="M16 20h16M16 28h10" stroke="#27272a" strokeWidth="2" strokeLinecap="round" /></svg>
                            </div></div>
                        )}
                        {ordersTab === 'history' && (
                            <div style={{ padding: '8px 16px' }}>
                                {futuresTrades.filter(t => t.status === 'pending').length === 0 ? (
                                    <div className="spot-orders-empty"><div className="spot-empty-icon">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="#27272a" strokeWidth="2" /><path d="M16 20h16M16 28h10" stroke="#27272a" strokeWidth="2" strokeLinecap="round" /></svg>
                                    </div></div>
                                ) : (
                                    <table style={{ width: '100%', fontSize: 12, color: '#a1a1aa' }}>
                                        <thead><tr style={{ borderBottom: '1px solid #1a1a24' }}>
                                            <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Pair</th>
                                            <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Type</th>
                                            <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Side</th>
                                            <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Amount</th>
                                            <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Limit Price</th>
                                            <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Status</th>
                                            <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Action</th>
                                        </tr></thead>
                                        <tbody>{futuresTrades.filter(t => t.status === 'pending').map(trade => {
                                            const isLong = trade.side === 'buy' || trade.side === 'long'
                                            return (
                                            <tr key={trade._id} style={{ borderBottom: '1px solid #0f0f14' }}>
                                                <td style={{ padding: '6px 0', color: '#fff' }}>{trade.asset.split('/')[0]}/USDT</td>
                                                <td style={{ padding: '6px 0' }}><span style={{ background: '#f59e0b22', color: '#f59e0b', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>LIMIT</span></td>
                                                <td style={{ padding: '6px 0', color: isLong ? '#10b981' : '#ef4444' }}>{isLong ? 'LONG' : 'SHORT'}</td>
                                                <td style={{ textAlign: 'right', padding: '6px 0' }}>{trade.amount}</td>
                                                <td style={{ textAlign: 'right', padding: '6px 0', color: '#f59e0b' }}>${formatPrice(trade.limitPrice || trade.entryPrice)}</td>
                                                <td style={{ textAlign: 'right', padding: '6px 0', color: '#a1a1aa' }}>Waiting</td>
                                                <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                                    <button onClick={() => handleCloseTrade(trade._id)} style={{ background: '#3f3f46', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                                                </td>
                                            </tr>
                                            )
                                        })}</tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}

