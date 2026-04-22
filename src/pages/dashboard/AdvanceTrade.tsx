import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts'
import type { IChartApi } from 'lightweight-charts'
import { ChevronDown, LayoutGrid, PlusCircle, Lock, CreditCard, ArrowDownToLine, ArrowLeftRight, X } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import '../../styles/advance-trade.css'
import { getBalance, applyLocalBalanceChange } from '../../services/walletService'
import { openTrade, getMyOpenTrades, closeTrade, getDetailedMarketData } from '../../services/tradeService'
import { useToast } from '../../context/ToastContext'

interface AdvanceTradeProps {
    isEmbedded?: boolean
}

export default function AdvanceTrade({ isEmbedded = false }: AdvanceTradeProps) {
    const navigate = useNavigate()
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const volumeChartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const volumeChartRef = useRef<IChartApi | null>(null)

    // Mobile chart refs
    const mobileChartRef = useRef<HTMLDivElement>(null)
    const mobileVolumeRef = useRef<HTMLDivElement>(null)
    const mobileChartInstance = useRef<IChartApi | null>(null)
    const mobileVolumeInstance = useRef<IChartApi | null>(null)

    const [obTab, setObTab] = useState<'orderbooks' | 'trades'>('orderbooks')
    const [obViewMode, setObViewMode] = useState<'both' | 'bids' | 'asks'>('both')
    const [tradeTab, setTradeTab] = useState<'spot' | 'grid' | 'futures'>('spot')
    const [buySellTab, setBuySellTab] = useState<'buy' | 'sell'>('buy')
    const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop'>('limit')
    const [ordersTab, setOrdersTab] = useState<'open' | 'history' | 'trade' | 'iceberg' | 'funds'>('open')
    const [mobileTab, setMobileTab] = useState<'spot' | 'robot' | 'p2p'>('spot')
    const [mobileBuySell, setMobileBuySell] = useState<'buy' | 'sell'>('buy')

    // Live Data State
    const [userBalance, setUserBalance] = useState<number>(0)
    const [openTrades, setOpenTrades] = useState<any[]>([])
    const [tradeAmount, setTradeAmount] = useState<string>('')
    const [tradePrice, setTradePrice] = useState<string>('0')
    const [tradeTotal, setTradeTotal] = useState<string>('')
    const [leverage, _setLeverage] = useState<number>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    // Live orderbook generated from current price
    const [currentPrice, setCurrentPrice] = useState(0)
    const [askOrders, setAskOrders] = useState<{ price: number; amount: number; total: number }[]>([])
    const [bidOrders, setBidOrders] = useState<{ price: number; amount: number; total: number }[]>([])
    const [change24h, setChange24h] = useState<number>(0)

    // Robot Mock Data
    const [robotBots, setRobotBots] = useState([
        { id: 1, name: 'BTC Grid Bot', status: 'Running', pnl: '+12.45 XRP', runtime: '12d 4h', profit: '+5.2%' },
        { id: 2, name: 'ETH DCA Bot', status: 'Paused', pnl: '-2.10 USDT', runtime: '5d 1h', profit: '-0.8%' },
        { id: 3, name: 'SOL Arbitrage', status: 'Running', pnl: '+45.20 USDT', runtime: '2d 18h', profit: '+12.5%' },
    ])

    // Bot creation state
    const [showCreateBotModal, setShowCreateBotModal] = useState(false)
    const [newBotName, setNewBotName] = useState('')
    const [newBotPair, setNewBotPair] = useState('BTC/USDT')
    const [newBotStrategy, setNewBotStrategy] = useState('Grid')
    const [newBotInvestment, setNewBotInvestment] = useState('')

    const handleCreateBot = () => {
        if (!newBotName.trim()) { toast('Please enter a bot name', 'warning'); return }
        const invest = parseFloat(newBotInvestment)
        if (!invest || invest <= 0) { toast('Please enter a valid investment amount', 'warning'); return }
        if (invest > userBalance) { toast('Insufficient balance', 'error'); return }
        const newBot = {
            id: Date.now(),
            name: newBotName,
            status: 'Running',
            pnl: '+0.00 USDT',
            runtime: '0d 0h',
            profit: '+0.0%'
        }
        setRobotBots(prev => [...prev, newBot])
        applyLocalBalanceChange(-invest)
        localBalAdjRef.current = parseFloat((localBalAdjRef.current - invest).toFixed(2))
        setUserBalance(prev => parseFloat((prev - invest).toFixed(2)))
        setShowCreateBotModal(false)
        setNewBotName('')
        setNewBotInvestment('')
        toast(`Bot "${newBot.name}" created successfully! $${invest} invested.`, 'success')
    }

    // P2P state
    const [p2pActiveTab, setP2pActiveTab] = useState<'buy' | 'sell'>('buy')

    const handleP2PAction = (offer: any) => {
        const minLimit = parseFloat((offer.limit.split('-')[0] || '0').trim().replace(/[^0-9.]/g, ''))
        const amount = minLimit > 0 ? minLimit : 100
        if (amount > userBalance) { toast('Insufficient balance', 'error'); return }
        setUserBalance(prev => parseFloat((prev - amount).toFixed(2)))
        applyLocalBalanceChange(-amount)
        localBalAdjRef.current = parseFloat((localBalAdjRef.current - amount).toFixed(2))
        toast(`${p2pActiveTab === 'buy' ? 'Buy' : 'Sell'} order placed with ${offer.name}. $${amount} deducted.`, 'success')
    }

    // P2P Offers — generated from live BTC market price (20 offers, unlimited supply)
    const p2pOffers = useMemo(() => {
        const basePrice = currentPrice > 0 ? currentPrice : 65000
        const traderNames = ['FastCrypto','SafeTrader','QuickCash','BullTrader','CryptoKing','MoonHodler','BitWave','ZenTrade','CryptoHub','SwiftEx','GlobalBit','TrustPay','CoinFlow','BitBridge','NovaTrade','CryptoNest','ArcEx','PeakCoin','ClearBit','SkyTrade']
        const paymentMethods = [['Bank','Wise'],['PayPal','Revolut'],['Zelle'],['SEPA','Wire'],['Cash App'],['Venmo','Zelle'],['Bank Transfer'],['MoneyGram'],['Wise','SEPA'],['USDC']]
        return Array.from({ length: 20 }, (_, i) => {
            // 2 Buy for every 1 Sell
            const isBuy = (i % 3) !== 2
            // Slight price variation ±0.2% around live price; buyers pay slightly less, sellers ask slightly more
            const spread = basePrice * 0.002
            const priceVariation = (Math.random() - 0.5) * basePrice * 0.004
            const offerPrice = parseFloat((basePrice + priceVariation + (isBuy ? -spread : spread)).toFixed(2))
            const minLimits = [50, 100, 200, 500]
            const maxMultipliers = [10, 20, 30, 50]
            const minLimit = minLimits[i % 4]
            const maxLimit = minLimit * maxMultipliers[i % 4]
            const availAmt = parseFloat((0.1 + Math.random() * 2).toFixed(4))
            return {
                id: i + 1,
                name: traderNames[i % traderNames.length],
                price: offerPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                available: `${availAmt} BTC`,
                limit: `${minLimit} - ${maxLimit} USDT`,
                payments: paymentMethods[i % paymentMethods.length],
                type: isBuy ? 'Buy' : 'Sell',
            }
        })
    }, [currentPrice])
    // Fetch live price and build orderbook
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const data = await getDetailedMarketData(['BTC/USDT'])
                const info = data['BTC/USDT'] || {}
                const p = info.price || 0
                const change = info.change24h || 0

                if (p > 0) {
                    setCurrentPrice(p)
                    setChange24h(change)
                    setTradePrice(p.toFixed(2))
                    // Generate realistic orderbook from live price
                    const asks = Array.from({ length: 18 }, (_, i) => {
                        const offset = (i + 1) * (p * 0.0001 * (1 + Math.random()))
                        const price = parseFloat((p + offset).toFixed(2))
                        const amount = parseFloat((Math.random() * 0.5 + 0.001).toFixed(5))
                        return { price, amount, total: parseFloat((price * amount).toFixed(5)) }
                    }).sort((a, b) => b.price - a.price)
                    const bids = Array.from({ length: 18 }, (_, i) => {
                        const offset = (i + 1) * (p * 0.0001 * (1 + Math.random()))
                        const price = parseFloat((p - offset).toFixed(2))
                        const amount = parseFloat((Math.random() * 0.5 + 0.001).toFixed(5))
                        return { price, amount, total: parseFloat((price * amount).toFixed(5)) }
                    }).sort((a, b) => b.price - a.price)
                    setAskOrders(asks)
                    setBidOrders(bids)
                }
            } catch { /* ignore */ }
        }
        fetchPrice()
        const interval = setInterval(fetchPrice, 10000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!chartContainerRef.current || !volumeChartContainerRef.current) return

        // Small delay to ensure DOM is ready and has dimensions
        const initCharts = async () => {
            if (!chartContainerRef.current || !volumeChartContainerRef.current) return

            // Fetch real OHLCV data from Binance
            const data: any[] = []
            const volumeDataStore: any[] = []

            try {
                const res = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=180')
                const klines = await res.json()
                for (const k of klines) {
                    const time = new Date(k[0]).toISOString().split('T')[0]
                    const open = parseFloat(k[1])
                    const high = parseFloat(k[2])
                    const low = parseFloat(k[3])
                    const close = parseFloat(k[4])
                    const volume = parseFloat(k[5])
                    data.push({ time, open, high, low, close })
                    volumeDataStore.push({ time, value: volume, color: close >= open ? '#10b981' : '#ef4444' })
                }
            } catch {
                // Fallback: generate from current price if Binance fails
                let lastClose = currentPrice || 65000
                const startDate = new Date()
                startDate.setDate(startDate.getDate() - 180)
                for (let i = 0; i < 180; i++) {
                    const date = new Date(startDate)
                    date.setDate(startDate.getDate() + i)
                    const open = lastClose
                    const change = (Math.random() - 0.48) * lastClose * 0.02
                    const close = open + change
                    const high = Math.max(open, close) + Math.random() * lastClose * 0.005
                    const low = Math.min(open, close) - Math.random() * lastClose * 0.005
                    const time = date.toISOString().split('T')[0]
                    data.push({ time, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) })
                    volumeDataStore.push({ time, value: Math.random() * 400000 + 100000, color: close >= open ? '#10b981' : '#ef4444' })
                    lastClose = close
                }
            }

            const containerWidth = chartContainerRef.current.clientWidth || 800

            // Main price chart - calculate height to fill available space
            const chartHeight = chartContainerRef.current.clientHeight || 400
            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: '#0a0a0f' },
                    textColor: '#71717A',
                },
                grid: {
                    vertLines: { color: '#1a1a24' },
                    horzLines: { color: '#1a1a24' },
                },
                width: containerWidth,
                height: chartHeight,
                timeScale: {
                    borderColor: '#1a1a24',
                    timeVisible: true,
                    secondsVisible: false,
                    visible: false,
                },
                rightPriceScale: {
                    borderColor: '#1a1a24',
                    scaleMargins: {
                        top: 0.05,
                        bottom: 0.05,
                    },
                },
                crosshair: {
                    mode: 1,
                },
            })

            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#10b981',
                downColor: '#ef4444',
                borderVisible: false,
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
            })

            // MA Lines
            const ma7Series = chart.addSeries(LineSeries, {
                color: '#eab308',
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: false,
            })

            const ma25Series = chart.addSeries(LineSeries, {
                color: '#a855f7',
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: false,
            })

            const ma99Series = chart.addSeries(LineSeries, {
                color: '#06b6d4',
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: false,
            })

            // Calculate MA values
            const calculateMA = (period: number) => {
                const maData: any[] = []
                for (let i = period - 1; i < data.length; i++) {
                    let sum = 0
                    for (let j = 0; j < period; j++) {
                        sum += data[i - j].close
                    }
                    maData.push({
                        time: data[i].time,
                        value: parseFloat((sum / period).toFixed(2)),
                    })
                }
                return maData
            }

            candlestickSeries.setData(data)
            ma7Series.setData(calculateMA(7))
            ma25Series.setData(calculateMA(25))
            ma99Series.setData(calculateMA(99))

            // Fit content
            chart.timeScale().fitContent()

            chartRef.current = chart

            // Volume chart - create immediately after main chart
            const volumeChartWidth = volumeChartContainerRef.current!.clientWidth || containerWidth
            console.log('Creating volume chart with width:', volumeChartWidth, 'Data points:', volumeDataStore.length)

            const volumeChart = createChart(volumeChartContainerRef.current!, {
                layout: {
                    background: { type: ColorType.Solid, color: '#0a0a0f' },
                    textColor: '#71717A',
                },
                grid: {
                    vertLines: { color: '#1a1a24' },
                    horzLines: { color: '#1a1a24' },
                },
                width: volumeChartWidth,
                height: 120,
                timeScale: {
                    borderColor: '#1a1a24',
                    timeVisible: true,
                    secondsVisible: false,
                    visible: true,
                },
                rightPriceScale: {
                    borderColor: '#1a1a24',
                    scaleMargins: { top: 0.1, bottom: 0 },
                },
            })

            const volumeSeries = volumeChart.addSeries(HistogramSeries, {
                priceFormat: { type: 'volume' },
                priceLineVisible: false,
                lastValueVisible: false,
            })

            // Set volume data with colors
            console.log('Setting volume data:', volumeDataStore.slice(0, 3))
            volumeSeries.setData(volumeDataStore)

            // Fit content to show all data
            volumeChart.timeScale().fitContent()

            // Sync time scales
            chart.timeScale().subscribeVisibleTimeRangeChange(() => {
                const range = chart.timeScale().getVisibleRange()
                if (range && volumeChartRef.current) {
                    volumeChartRef.current.timeScale().setVisibleRange(range)
                }
            })
            volumeChart.timeScale().subscribeVisibleTimeRangeChange(() => {
                const range = volumeChart.timeScale().getVisibleRange()
                if (range && chartRef.current) {
                    chartRef.current.timeScale().setVisibleRange(range)
                }
            })

            volumeChartRef.current = volumeChart

            // Handle resize for both charts
            const handleResize = () => {
                if (chartContainerRef.current && chartRef.current) {
                    chartRef.current.applyOptions({
                        width: chartContainerRef.current.clientWidth,
                        height: chartContainerRef.current.clientHeight || 400
                    })
                }
                if (volumeChartContainerRef.current && volumeChartRef.current) {
                    volumeChartRef.current.applyOptions({
                        width: volumeChartContainerRef.current.clientWidth
                    })
                }
            }
            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
            }
        }

        // Call initCharts with a delay to ensure DOM has proper dimensions
        const timer = setTimeout(initCharts, 200)

        return () => {
            clearTimeout(timer)
            if (chartRef.current) {
                chartRef.current.remove()
                chartRef.current = null
            }
            if (volumeChartRef.current) {
                volumeChartRef.current.remove()
                volumeChartRef.current = null
            }
        }
    }, [])

    const localBalAdjRef = useRef(0) // legacy — kept for compatibility; service-level applyLocalBalanceChange is the real store

    const fetchUserData = async () => {
        try {
            const [balanceData, tradesData] = await Promise.all([
                getBalance(),
                getMyOpenTrades()
            ]);
            // getBalance() already includes localStorage adjustments via walletService
            setUserBalance(balanceData.balance);
            setOpenTrades(tradesData);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchMarketData = async () => {
        try {
            const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
            if (response.ok) {
                const data = await response.json();
                const price = parseFloat(data.price).toFixed(2);
                if (!tradePrice || tradePrice === '0') {
                    setTradePrice(price);
                }
            }
        } catch (error) {
            console.error('Error fetching market price:', error);
        }
    };

    useEffect(() => {
        fetchUserData();
        fetchMarketData();
        // Polling for updates every 10 seconds
        const interval = setInterval(() => {
            fetchUserData();
            fetchMarketData();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const filterNumeric = (val: string) => val.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

    // Sync helpers
    const handleAmountChange = (val: string) => {
        const cleaned = filterNumeric(val);
        setTradeAmount(cleaned);
        const p = parseFloat(tradePrice);
        const a = parseFloat(cleaned);
        if (!isNaN(p) && !isNaN(a)) {
            setTradeTotal((p * a).toFixed(2));
        } else {
            setTradeTotal('');
        }
    };

    const handleTotalChange = (val: string) => {
        const cleaned = filterNumeric(val);
        setTradeTotal(cleaned);
        const p = parseFloat(tradePrice);
        const t = parseFloat(cleaned);
        if (!isNaN(p) && !isNaN(t) && p > 0) {
            setTradeAmount((t / p).toFixed(8));
        } else {
            setTradeAmount('');
        }
    };

    const handlePriceChange = (val: string) => {
        const cleaned = filterNumeric(val);
        setTradePrice(cleaned);
        const p = parseFloat(cleaned);
        const a = parseFloat(tradeAmount);
        if (!isNaN(p) && !isNaN(a)) {
            setTradeTotal((p * a).toFixed(2));
        }
    };

    const handleOpenTrade = async () => {
        if (!tradeAmount || isNaN(Number(tradeAmount)) || Number(tradeAmount) <= 0) {
            toast('Please enter a valid amount', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const side = buySellTab === 'buy' ? 'buy' : 'sell';
            await openTrade({
                asset: 'BTC/USDT',
                type: tradeTab,
                side,
                amount: Number(tradeAmount),
                leverage: tradeTab === 'futures' ? leverage : 1
            });
            toast('Trade opened successfully', 'success');
            setTradeAmount('');
            setTradeTotal('');
            fetchUserData();
        } catch (error: any) {
            toast(error.message || 'Failed to open trade', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseTrade = async (id: string) => {
        try {
            await closeTrade(id);
            toast('Trade closed successfully', 'success');
            fetchUserData();
        } catch (error: any) {
            toast(error.message || 'Failed to close trade', 'error');
        }
    };

    // Mobile chart initialization
    useEffect(() => {
        const initMobileCharts = () => {
            if (!mobileChartRef.current || !mobileVolumeRef.current) return

            const containerWidth = mobileChartRef.current.clientWidth || 350
            const mobileVolumeData: any[] = []

            // Mobile candlestick chart
            const mobileChart = createChart(mobileChartRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: '#0a0a0f' },
                    textColor: '#71717A',
                },
                grid: {
                    vertLines: { color: '#1a1a24' },
                    horzLines: { color: '#1a1a24' },
                },
                width: containerWidth,
                height: 280,
                timeScale: {
                    borderColor: '#1a1a24',
                    timeVisible: true,
                    secondsVisible: false,
                    visible: false,
                },
                rightPriceScale: {
                    borderColor: '#1a1a24',
                },
            })

            const mobileCandleSeries = mobileChart.addSeries(CandlestickSeries, {
                upColor: '#10b981',
                downColor: '#ef4444',
                borderUpColor: '#10b981',
                borderDownColor: '#ef4444',
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
            })

            // Generate mobile chart data
            const mobileData: any[] = []
            let lastClose = 16000
            const startDate = new Date('2022-12-01')

            for (let i = 0; i < 150; i++) {
                const date = new Date(startDate)
                date.setDate(startDate.getDate() + i)

                const open = lastClose
                let change = (Math.random() - 0.5) * 300
                if (i < 40) change = (Math.random() - 0.3) * 200
                else if (i < 100) change = (Math.random() - 0.2) * 500
                else if (i < 130) change = (Math.random() - 0.5) * 400
                else change = (Math.random() - 0.6) * 400

                const close = Math.max(15000, Math.min(26000, open + change))
                const high = Math.max(open, close) + Math.random() * 200
                const low = Math.min(open, close) - Math.random() * 200
                const time = date.toISOString().split('T')[0]

                mobileData.push({ time, open: parseFloat(open.toFixed(2)), high: parseFloat(high.toFixed(2)), low: parseFloat(low.toFixed(2)), close: parseFloat(close.toFixed(2)) })
                mobileVolumeData.push({ time, value: Math.random() * 400000 + 100000, color: close >= open ? '#10b981' : '#ef4444' })

                lastClose = close
            }

            mobileCandleSeries.setData(mobileData)

            // Add MA lines
            const ma7 = mobileChart.addSeries(LineSeries, { color: '#22d3ee', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
            const ma25 = mobileChart.addSeries(LineSeries, { color: '#eab308', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
            const ma99 = mobileChart.addSeries(LineSeries, { color: '#a855f7', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

            const calcMA = (period: number) => {
                const result: any[] = []
                for (let i = period - 1; i < mobileData.length; i++) {
                    let sum = 0
                    for (let j = 0; j < period; j++) sum += mobileData[i - j].close
                    result.push({ time: mobileData[i].time, value: sum / period })
                }
                return result
            }

            ma7.setData(calcMA(7))
            ma25.setData(calcMA(25))
            ma99.setData(calcMA(99))
            mobileChart.timeScale().fitContent()
            mobileChartInstance.current = mobileChart

            // Mobile volume chart
            const mobileVolume = createChart(mobileVolumeRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: '#0a0a0f' },
                    textColor: '#71717A',
                },
                grid: {
                    vertLines: { color: '#1a1a24' },
                    horzLines: { color: '#1a1a24' },
                },
                width: containerWidth,
                height: 100,
                timeScale: {
                    borderColor: '#1a1a24',
                    timeVisible: true,
                    secondsVisible: false,
                    visible: true,
                },
                rightPriceScale: {
                    borderColor: '#1a1a24',
                    scaleMargins: { top: 0.1, bottom: 0 },
                },
            })

            const mobileVolumeSeries = mobileVolume.addSeries(HistogramSeries, {
                priceFormat: { type: 'volume' },
                priceLineVisible: false,
                lastValueVisible: false,
            })
            mobileVolumeSeries.setData(mobileVolumeData)
            mobileVolume.timeScale().fitContent()

            // Sync time scales
            mobileChart.timeScale().subscribeVisibleTimeRangeChange(() => {
                const range = mobileChart.timeScale().getVisibleRange()
                if (range) mobileVolume.timeScale().setVisibleRange(range)
            })
            mobileVolume.timeScale().subscribeVisibleTimeRangeChange(() => {
                const range = mobileVolume.timeScale().getVisibleRange()
                if (range) mobileChart.timeScale().setVisibleRange(range)
            })

            mobileVolumeInstance.current = mobileVolume
        }

        const timer = setTimeout(initMobileCharts, 300)

        return () => {
            clearTimeout(timer)
            if (mobileChartInstance.current) {
                mobileChartInstance.current.remove()
                mobileChartInstance.current = null
            }
            if (mobileVolumeInstance.current) {
                mobileVolumeInstance.current.remove()
                mobileVolumeInstance.current = null
            }
        }
    }, [])

    const content = (
        <>
            <div className="at-container">
                {/* Top Info Bar */}
                <div className="at-top-bar">
                    <div className="at-pair-info">
                        <div className="at-pair-icon">
                            <span>₿</span>
                        </div>
                        <div className="at-pair-details">
                            <span className="at-pair-name">BTC <span className="at-pair-slash">/USDT</span></span>
                            <span className="at-pair-sub">Bitcoin</span>
                        </div>
                        <span className={`at-pair-price ${change24h >= 0 ? 'green' : 'red'}`}>${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="at-pair-usd">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="at-stats">
                        <div className="at-stat">
                            <span className="at-stat-label">24h Change</span>
                            <span className={`at-stat-value ${change24h >= 0 ? 'green' : 'red'}`}>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%</span>
                        </div>
                        <div className="at-stat">
                            <span className="at-stat-label">24h High</span>
                            <span className="at-stat-value">$88,200.84</span>
                        </div>
                        <div className="at-stat">
                            <span className="at-stat-label">24h Low</span>
                            <span className="at-stat-value">$88,200.84</span>
                        </div>
                        <div className="at-stat">
                            <span className="at-stat-label">24h Vol (BTC)</span>
                            <span className="at-stat-value">100.78K</span>
                        </div>
                        <div className="at-stat">
                            <span className="at-stat-label">24h Vol (USDT)</span>
                            <span className="at-stat-value">100B</span>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="at-main-grid">
                    {/* Left: Chart Section */}
                    <div className="at-chart-section">
                        {/* OHLC Info Row */}
                        <div className="at-chart-info">
                            <div className="at-ohlc">
                                <span className="at-date-dot">●</span>
                                <span className="at-date">2023/03/10</span>
                                <span>Open: <span className="at-val-green">20362.21</span></span>
                                <span>High: <span className="at-val-green">20367.78</span></span>
                                <span>Low: <span className="at-val-green">19549.09</span></span>
                                <span>Close: <span className={change24h >= 0 ? 'at-val-green' : 'at-val-red'}>{currentPrice.toFixed(2)}</span></span>
                                <span>CHANGE: <span className={change24h >= 0 ? 'at-val-green' : 'at-val-red'}>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%</span></span>
                                <span>AMPLITUDE: <span className="at-val-red">4.02%</span></span>
                            </div>
                            <div className="at-chart-icons">
                                <span className="chart-icon">◎</span>
                                <span className="chart-icon">⊕</span>
                                <span className="chart-icon">✕</span>
                            </div>
                        </div>

                        {/* MA Indicators Row */}
                        <div className="at-ma-info">
                            <span className="ma-yellow"><span className="ma-dot">●</span> MA(7): <span className="ma-val">21631.17</span></span>
                            <span className="ma-purple">MA(25): <span className="ma-val">23133.19</span></span>
                            <span className="ma-cyan">MA(99): <span className="ma-val">20290.29</span></span>
                            <div className="ma-icons">
                                <span className="ma-icon">◎</span>
                                <span className="ma-icon">⊕</span>
                                <span className="ma-icon">✕</span>
                            </div>
                        </div>

                        {/* Main Chart Container with Price Label */}
                        <div className="at-chart-wrapper">
                            <div className="at-chart-container" ref={chartContainerRef}></div>
                            <div className="at-price-label">
                                <span className="price-value">19965.74</span>
                            </div>
                        </div>

                        {/* Volume Section */}
                        <div className="at-volume-section">
                            <div className="at-volume-header">
                                <span className="vol-arrow">▼</span>
                                <span className="vol-label">Vol(BTC): <span className="vol-value">503.753K</span></span>
                                <span className="vol-label">Vol(USDT) <span className="vol-value">10.05B</span></span>
                                <div className="vol-icons">
                                    <span className="vol-icon">◎</span>
                                    <span className="vol-icon">⊕</span>
                                    <span className="vol-icon">✕</span>
                                </div>
                            </div>
                            <div className="at-volume-chart" ref={volumeChartContainerRef} style={{ width: '100%', height: '120px' }}></div>
                        </div>
                    </div>

                    {/* Middle: Orderbook */}
                    <div className="at-orderbook-section">
                        <div className="at-ob-header">
                            <div className="at-ob-tabs">
                                <span className={`at-ob-tab ${obTab === 'orderbooks' ? 'active' : ''}`} onClick={() => setObTab('orderbooks')}>Orderbooks</span>
                                <span className={`at-ob-tab ${obTab === 'trades' ? 'active' : ''}`} onClick={() => setObTab('trades')}>Last trades</span>
                            </div>
                            <div className="at-ob-settings">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="4" y1="21" x2="4" y2="14"></line>
                                    <line x1="4" y1="10" x2="4" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12" y2="3"></line>
                                    <line x1="20" y1="21" x2="20" y2="16"></line>
                                    <line x1="20" y1="12" x2="20" y2="3"></line>
                                    <line x1="1" y1="14" x2="7" y2="14"></line>
                                    <line x1="9" y1="8" x2="15" y2="8"></line>
                                    <line x1="17" y1="16" x2="23" y2="16"></line>
                                </svg>
                            </div>
                        </div>

                        <div className="at-ob-controls">
                            <div className="at-ob-view-btns">
                                <div className={`at-ob-view-btn both ${obViewMode === 'both' ? 'active' : ''}`} onClick={() => setObViewMode('both')}>
                                    <span></span><span></span><span></span>
                                </div>
                                <div className={`at-ob-view-btn bids ${obViewMode === 'bids' ? 'active' : ''}`} onClick={() => setObViewMode('bids')}>
                                    <span></span><span></span><span></span>
                                </div>
                                <div className={`at-ob-view-btn asks ${obViewMode === 'asks' ? 'active' : ''}`} onClick={() => setObViewMode('asks')}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                            <div className="at-ob-precision">
                                0.01 <ChevronDown size={10} /> <span className="at-ob-more">⋮</span>
                            </div>
                        </div>

                        <div className="at-ob-columns">
                            <span>Price(USDT)</span>
                            <span>Amount(BTC)</span>
                            <span>Total</span>
                        </div>

                        <div className="at-ob-list asks">
                            {askOrders.slice(0, 10).map((order, i) => (
                                <div key={i} className={`at-ob-row ${i >= 5 && i <= 6 ? 'highlight' : ''}`}>
                                    <span className="at-ob-price ask">{order.price.toFixed(2)}</span>
                                    <span className="at-ob-amount">{order.amount.toFixed(5)}</span>
                                    <span className="at-ob-total">{order.total.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                                    {i >= 5 && i <= 6 && <div className="at-ob-bg ask"></div>}
                                </div>
                            ))}
                        </div>

                        <div className="at-ob-spread">
                            <span className="at-spread-price green">{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="at-spread-arrow">↓</span>
                        </div>

                        <div className="at-ob-list bids">
                            {bidOrders.slice(0, 10).map((order, i) => (
                                <div key={i} className={`at-ob-row ${i === 6 ? 'highlight-bid' : ''}`}>
                                    <span className="at-ob-price bid">{order.price.toFixed(2)}</span>
                                    <span className="at-ob-amount">{order.amount.toFixed(5)}</span>
                                    <span className="at-ob-total">{order.total.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                                    {i === 6 && <div className="at-ob-bg bid"></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Trade Form */}
                    <div className="at-trade-section">
                        <div className="at-trade-tabs">
                            <span className={`at-trade-tab ${tradeTab === 'spot' ? 'active' : ''}`} onClick={() => setTradeTab('spot')}>Spot</span>
                            <span className={`at-trade-tab ${tradeTab === 'grid' ? 'active' : ''}`} onClick={() => setTradeTab('grid')}>Grid</span>
                        </div>

                        <div className="at-bs-tabs">
                            <button className={`at-bs-tab buy ${buySellTab === 'buy' ? 'active' : ''}`} onClick={() => setBuySellTab('buy')}>Buy BTC</button>
                            <button className={`at-bs-tab sell ${buySellTab === 'sell' ? 'active' : ''}`} onClick={() => setBuySellTab('sell')}>Sell BTC</button>
                        </div>

                        <div className="at-order-types">
                            <span className={`at-order-type ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>Limit</span>
                            <span className={`at-order-type ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>Market</span>
                            <span className={`at-order-type ${orderType === 'stop' ? 'active' : ''}`} onClick={() => setOrderType('stop')}>Stop limit</span>
                        </div>

                        <div className="at-avbl-row">
                            <span className="at-avbl-label">Avbl</span>
                            <span className="at-avbl-value">{userBalance.toLocaleString()} USDT</span>
                            <span className="at-avbl-icon">●</span>
                        </div>

                        <div className="at-input-group">
                            <span className="at-input-label">Price</span>
                            <input
                                type="text"
                                className="at-input"
                                value={tradePrice}
                                onChange={(e) => handlePriceChange(e.target.value)}
                            />
                            <span className="at-input-suffix">USDT</span>
                        </div>

                        <div className="at-input-group">
                            <span className="at-input-label">Amount</span>
                            <input
                                type="text"
                                className="at-input"
                                value={tradeAmount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder="0.00"
                            />
                            <span className="at-input-suffix">BTC</span>
                        </div>

                        <div className="at-slider">
                            <div className="at-slider-track">
                                <div className="at-slider-thumb"></div>
                            </div>
                            <div className="at-slider-dots">
                                <span className="at-slider-dot active"></span>
                                <span className="at-slider-dot"></span>
                                <span className="at-slider-dot"></span>
                                <span className="at-slider-dot"></span>
                                <span className="at-slider-dot"></span>
                            </div>
                        </div>

                        <div className="at-input-group">
                            <span className="at-input-label">Total</span>
                            <input
                                type="text"
                                className="at-input"
                                value={tradeTotal}
                                onChange={(e) => handleTotalChange(e.target.value)}
                                placeholder="0.00"
                            />
                            <span className="at-input-suffix">USDT</span>
                        </div>

                        <div className="at-advanced-row">
                            <div className="at-checkbox"></div>
                            <span>Advanced options</span>
                        </div>

                        <div className="at-max-row">
                            <span className="at-max-label">Max {buySellTab === 'buy' ? 'Buy' : 'Sell'}</span>
                            <span className="at-max-value">
                                {parseFloat(tradePrice) > 0
                                    ? (userBalance / parseFloat(tradePrice)).toFixed(8)
                                    : '0.00000000'} BTC
                            </span>
                        </div>

                        <button
                            className={`at-main-btn ${buySellTab} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleOpenTrade}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : (buySellTab === 'buy' ? 'Buy BTC' : 'Sell BTC')}
                        </button>

                        <div className="at-action-btns">
                            <button className="at-action-btn" onClick={() => navigate('/dashboard/deposit')}>Deposit</button>
                            <button className="at-action-btn" onClick={() => navigate('/dashboard/deposit')}>Transfer</button>
                            <button className="at-action-btn" onClick={() => navigate('/dashboard/withdraw')}>Withdraw</button>
                        </div>
                    </div>
                </div>

                {/* Bottom: Orders Section */}
                <div className="at-orders-section">
                    <div className="at-orders-header">
                        <div className="at-orders-tabs-bar">
                            <span className={`at-orders-tab ${ordersTab === 'open' ? 'active' : ''}`} onClick={() => setOrdersTab('open')}>Open orders ({openTrades.length})</span>
                            <span className={`at-orders-tab ${ordersTab === 'history' ? 'active' : ''}`} onClick={() => setOrdersTab('history')}>Orders history</span>
                            <span className={`at-orders-tab ${ordersTab === 'trade' ? 'active' : ''}`} onClick={() => setOrdersTab('trade')}>Trade history</span>
                            <span className={`at-orders-tab ${ordersTab === 'iceberg' ? 'active' : ''}`} onClick={() => setOrdersTab('iceberg')}>Iceberg</span>
                            <span className={`at-orders-tab ${ordersTab === 'funds' ? 'active' : ''}`} onClick={() => setOrdersTab('funds')}>Funds</span>
                        </div>
                        <div className="at-orders-right">
                            <div className="at-hide-pairs">
                                <div className="at-checkbox-circle"></div>
                                <span>Hide other pairs</span>
                            </div>
                        </div>
                    </div>

                    <div className="at-orders-table">
                        <div className="at-orders-columns">
                            <span>Date</span>
                            <span>Pair</span>
                            <span className="at-col-dropdown">Type <ChevronDown size={10} /></span>
                            <span>Side</span>
                            <span>Entry Price</span>
                            <span>Amount</span>
                            <span>Margin</span>
                            <span>P&L</span>
                            <span>Status</span>
                            <button className="at-cancel-all-btn">Action</button>
                        </div>
                        <div className="at-orders-list-content">
                            {openTrades.length === 0 ? (
                                <div className="at-orders-empty">
                                    <div className="at-empty-icon">
                                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                            <rect x="8" y="4" width="32" height="40" rx="4" fill="#1e40af" />
                                            <rect x="8" y="4" width="32" height="40" rx="4" stroke="#3b82f6" strokeWidth="2" />
                                            <path d="M28 4V12C28 13.1046 28.8954 14 30 14H38" stroke="#3b82f6" strokeWidth="2" />
                                            <circle cx="24" cy="26" r="8" fill="#0a0a0f" stroke="#3b82f6" strokeWidth="2" />
                                            <path d="M21 26L23 28L27 24" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <rect x="14" y="36" width="20" height="2" rx="1" fill="#3b82f6" />
                                        </svg>
                                    </div>
                                    <p className="at-empty-text">No open orders</p>
                                </div>
                            ) : (
                                openTrades.map((trade) => (
                                    <div key={trade._id} className="at-trade-row">
                                        <span>{new Date(trade.createdAt).toLocaleDateString()}</span>
                                        <span>{trade.asset}</span>
                                        <span className="capitalize">{trade.type}</span>
                                        <span className={`capitalize ${trade.side === 'buy' || trade.side === 'long' ? 'green' : 'red'}`}>
                                            {trade.side}
                                        </span>
                                        <span>${trade.entryPrice.toLocaleString()}</span>
                                        <span>{trade.amount}</span>
                                        <span>${trade.marginUsed.toFixed(2)}</span>
                                        <span className={trade.pnl >= 0 ? 'green' : 'red'}>
                                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                        </span>
                                        <span className="capitalize">{trade.status}</span>
                                        <button
                                            className="at-close-btn"
                                            onClick={() => handleCloseTrade(trade._id)}
                                        >
                                            <X size={14} /> Close
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout - Exact Clone */}
            <div className="at-mobile-container">
                {/* Mobile Header Tabs */}
                <div className="atm-header-tabs">
                    <span className={`atm-header-tab ${mobileTab === 'spot' ? 'active' : ''}`} onClick={() => { setMobileTab('spot'); setTradeTab('spot'); }}>Spot</span>
                    <span className={`atm-header-tab ${mobileTab === 'robot' ? 'active' : ''}`} onClick={() => setMobileTab('robot')}>Robot</span>
                    <span className={`atm-header-tab ${mobileTab === 'p2p' ? 'active' : ''}`} onClick={() => setMobileTab('p2p')}>P2P</span>
                </div>

                {/* Mobile Pair Selector Row */}
                <div className="atm-pair-row">
                    <div className="atm-pair-selector">
                        <span className="atm-pair-name">BTCUSDT</span>
                        <ChevronDown size={14} className="atm-pair-chevron" />
                        <span className={`atm-pair-badge ${change24h >= 0 ? 'green' : 'red'}`}>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%</span>
                    </div>
                </div>

                {/* Main Content Area - Conditional based on Mobile Tab */}
                {mobileTab === 'spot' && (
                    <div className="atm-main-grid">
                        {/* Left Column - Orderbook */}
                        <div className="atm-orderbook-col">
                            {/* Orderbook Header */}
                            <div className="atm-ob-col-header">
                                <span>Price (USDT)</span>
                                <span>Size (BTC)</span>
                            </div>

                            {/* Ask Orders (Red) */}
                            <div className="atm-ob-asks">
                                {askOrders.slice(0, 10).map((order, i) => (
                                    <div key={i} className="atm-ob-row-item">
                                        <span className="atm-price red">{order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <span className="atm-size">{order.amount.toFixed(5)}</span>
                                        <div className="atm-depth-bar red" style={{ width: `${40 + Math.random() * 40}%` }}></div>
                                    </div>
                                ))}
                            </div>

                            {/* Current Price Display */}
                            <div className="atm-price-center">
                                <span className="atm-big-price">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                <span className="atm-mark-price">Mark price {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* Bid Orders (Green) */}
                            <div className="atm-ob-bids">
                                {bidOrders.slice(0, 10).map((order, i) => (
                                    <div key={i} className="atm-ob-row-item">
                                        <span className="atm-price green">{order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <span className="atm-size">{order.amount.toFixed(5)}</span>
                                        <div className="atm-depth-bar green" style={{ width: `${40 + Math.random() * 40}%` }}></div>
                                    </div>
                                ))}
                            </div>

                            {/* Precision Selector */}
                            <div className="atm-precision-row">
                                <span className="atm-precision-value">0.013</span>
                                <ChevronDown size={12} className="atm-precision-chevron" />
                                <LayoutGrid size={18} className="atm-grid-icon" />
                            </div>
                        </div>

                        {/* Right Column - Trade Form */}
                        <div className="atm-trade-col">
                            {/* Buy/Sell Toggle */}
                            <div className="atm-bs-toggle">
                                <button className={`atm-bs-btn buy ${mobileBuySell === 'buy' ? 'active' : ''}`} onClick={() => { setMobileBuySell('buy'); setBuySellTab('buy'); }}>Buy</button>
                                <button className={`atm-bs-btn sell ${mobileBuySell === 'sell' ? 'active' : ''}`} onClick={() => { setMobileBuySell('sell'); setBuySellTab('sell'); }}>Sell</button>
                            </div>

                            {/* Order Type Selector */}
                            <div className="atm-order-type-selector">
                                <span className="atm-ot-bullet">●</span>
                                <span className="atm-ot-text">Limit order</span>
                                <ChevronDown size={14} className="atm-ot-chevron" />
                            </div>

                            {/* Price Input */}
                            <div className="atm-input-row">
                                <button className="atm-input-btn">−</button>
                                <div className="atm-input-center">
                                    <span className="atm-input-label">Price</span>
                                    <input
                                        type="text"
                                        className="atm-input-field"
                                        value={tradePrice}
                                        onChange={(e) => handlePriceChange(e.target.value)}
                                    />
                                </div>
                                <button className="atm-input-btn" onClick={() => handlePriceChange((parseFloat(tradePrice) + 1).toString())}>+</button>
                            </div>

                            {/* Amount Input */}
                            <div className="atm-input-row">
                                <button className="atm-input-btn">−</button>
                                <div className="atm-input-center">
                                    <span className="atm-input-label">Amount BTC</span>
                                    <input
                                        type="text"
                                        className="atm-input-field"
                                        value={tradeAmount}
                                        onChange={(e) => handleAmountChange(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <button className="atm-input-btn" onClick={() => handleAmountChange((parseFloat(tradeAmount || '0') + 0.001).toFixed(3))}>+</button>
                            </div>

                            {/* Slider */}
                            <div className="atm-slider-container">
                                <div className="atm-slider-track-v2">
                                    <div className="atm-slider-thumb-v2"></div>
                                </div>
                                <div className="atm-slider-diamonds">
                                    <span className="atm-diamond"></span>
                                    <span className="atm-diamond"></span>
                                    <span className="atm-diamond"></span>
                                    <span className="atm-diamond"></span>
                                    <span className="atm-diamond"></span>
                                </div>
                            </div>

                            {/* Total Input */}
                            <div className="atm-total-row">
                                <span className="atm-total-label">Total (USDT)</span>
                                <input
                                    type="text"
                                    className="atm-total-input"
                                    value={tradeTotal}
                                    onChange={(e) => handleTotalChange(e.target.value)}
                                />
                            </div>

                            {/* Available & Max Buy */}
                            <div className="atm-info-rows">
                                <div className="atm-info-row">
                                    <span className="atm-info-label">Available</span>
                                    <span className="atm-info-value">{userBalance.toLocaleString()} USDT <PlusCircle size={14} className="atm-plus-icon" /></span>
                                </div>
                                <div className="atm-info-row">
                                    <span className="atm-info-label">Max {mobileBuySell === 'buy' ? 'buy' : 'sell'}</span>
                                    <span className="atm-info-value">
                                        {parseFloat(tradePrice) > 0
                                            ? (userBalance / parseFloat(tradePrice)).toFixed(8)
                                            : '0.00000000'} BTC
                                    </span>
                                </div>
                            </div>

                            {/* Buy BTC Button */}
                            <button
                                className={`atm-main-buy-btn ${mobileBuySell} ${isSubmitting ? 'opacity-50' : ''}`}
                                onClick={handleOpenTrade}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processing...' : (mobileBuySell === 'buy' ? 'Buy BTC' : 'Sell BTC')}
                            </button>
                        </div>
                    </div>
                )}

                {mobileTab === 'robot' && (
                    <div className="atm-robot-content" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>Trading Bots</h2>
                            <button onClick={() => setShowCreateBotModal(true)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>+ Create Bot</button>
                        </div>
                        <div className="atm-bots-list">
                            {robotBots.map(bot => (
                                <div key={bot.id} style={{ background: '#1a1a24', borderRadius: '8px', padding: '16px', marginBottom: '12px', border: '1px solid #2a2a34' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{bot.name}</span>
                                        <span style={{ color: bot.status === 'Running' ? '#10b981' : '#71717a', fontSize: '12px' }}>{bot.status}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <div>
                                            <div style={{ color: '#71717a', marginBottom: '4px' }}>Runtime</div>
                                            <div style={{ color: '#fff' }}>{bot.runtime}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#71717a', marginBottom: '4px' }}>Total Profit</div>
                                            <div style={{ color: bot.profit.startsWith('+') ? '#10b981' : '#ef4444' }}>{bot.profit}</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#71717a' }}>
                                        PnL: <span style={{ color: bot.pnl.startsWith('+') ? '#10b981' : '#ef4444' }}>{bot.pnl}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Create Bot Modal */}
                        {showCreateBotModal && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowCreateBotModal(false)}>
                            <div style={{ background: '#111118', borderRadius: '16px 16px 0 0', paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: 'calc(70px + 32px)', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>Create Bot</h3>
                                        <button onClick={() => setShowCreateBotModal(false)} style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ color: '#71717a', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Bot Name</label>
                                        <input value={newBotName} onChange={e => setNewBotName(e.target.value)} placeholder="e.g. My BTC Bot" style={{ width: '100%', background: '#1a1a24', border: '1px solid #2a2a34', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ color: '#71717a', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Pair</label>
                                        <select value={newBotPair} onChange={e => setNewBotPair(e.target.value)} style={{ width: '100%', background: '#1a1a24', border: '1px solid #2a2a34', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}>
                                            {['BTC/USDT','ETH/USDT','SOL/USDT','BNB/USDT','XRP/USDT'].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ color: '#71717a', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Strategy</label>
                                        <select value={newBotStrategy} onChange={e => setNewBotStrategy(e.target.value)} style={{ width: '100%', background: '#1a1a24', border: '1px solid #2a2a34', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}>
                                            {['Grid','DCA','Arbitrage','MACD'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ color: '#71717a', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Investment Amount (USDT) — Available: {userBalance.toFixed(2)}</label>
                                        <input type="number" value={newBotInvestment} onChange={e => setNewBotInvestment(e.target.value)} placeholder="e.g. 100" style={{ width: '100%', background: '#1a1a24', border: '1px solid #2a2a34', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                    <button onClick={handleCreateBot} style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Start Bot Simulation</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mobileTab === 'p2p' && (
                    <div className="atm-p2p-content" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#1a1a24', borderRadius: '100px', padding: '4px' }}>
                            <button onClick={() => setP2pActiveTab('buy')} style={{ flex: 1, background: p2pActiveTab === 'buy' ? '#10b981' : 'transparent', color: p2pActiveTab === 'buy' ? '#fff' : '#71717a', border: 'none', padding: '8px 20px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Buy</button>
                            <button onClick={() => setP2pActiveTab('sell')} style={{ flex: 1, background: p2pActiveTab === 'sell' ? '#ef4444' : 'transparent', color: p2pActiveTab === 'sell' ? '#fff' : '#71717a', border: 'none', padding: '8px 20px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Sell</button>
                        </div>
                        <div className="atm-p2p-list">
                            {p2pOffers.filter(o => p2pActiveTab === 'buy' ? o.type === 'Buy' : o.type === 'Sell').concat(p2pActiveTab === 'buy' ? [] : p2pOffers.filter(o => o.type === 'Buy')).map(offer => (
                                <div key={offer.id} style={{ background: '#1a1a24', borderRadius: '8px', padding: '16px', marginBottom: '12px', border: '1px solid #2a2a34' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>{offer.name[0]}</div>
                                            <span style={{ color: '#fff', fontWeight: 600 }}>{offer.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {offer.payments.map(p => (
                                                <span key={p} style={{ fontSize: '10px', color: '#71717a', background: '#0a0a0f', padding: '2px 6px', borderRadius: '2px' }}>{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Price</div>
                                            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>{offer.price} <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 400 }}>USDT</span></div>
                                            <div style={{ fontSize: '12px', color: '#71717a', marginTop: '8px' }}>Available: {offer.available}</div>
                                            <div style={{ fontSize: '12px', color: '#71717a' }}>Limit: {offer.limit}</div>
                                        </div>
                                        <button onClick={() => handleP2PAction(offer)} style={{ background: p2pActiveTab === 'buy' ? '#10b981' : '#ef4444', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{p2pActiveTab === 'buy' ? 'Buy' : 'Sell'}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {/* Open Orders Section */}
                <div className="atm-orders-section">
                    <div className="atm-orders-tabs-row">
                        <div className="atm-orders-tabs">
                            <span className="atm-orders-tab active">Open Orders (0)</span>
                            <span className="atm-orders-tab">Funds</span>
                            <span className="atm-orders-tab">Iceberg</span>
                        </div>
                        <Lock size={16} className="atm-orders-menu-icon" />
                    </div>

                    {/* Hide Other Pairs Toggle */}
                    <div className="atm-toggle-row">
                        <div className="atm-toggle active">
                            <div className="atm-toggle-knob"></div>
                        </div>
                        <span className="atm-toggle-label">Hide other pairs</span>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="atm-quick-actions">
                    <div className="atm-quick-action" onClick={() => navigate('/dashboard/buy')}>
                        <div className="atm-qa-icon-wrapper">
                            <CreditCard size={20} className="atm-qa-icon" />
                        </div>
                        <span className="atm-qa-label">Express</span>
                    </div>
                    <div className="atm-quick-action" onClick={() => navigate('/dashboard/deposit')}>
                        <div className="atm-qa-icon-wrapper">
                            <ArrowDownToLine size={20} className="atm-qa-icon" />
                        </div>
                        <span className="atm-qa-label">Deposit</span>
                    </div>
                    <div className="atm-quick-action" onClick={() => navigate('/dashboard/transfer')}>
                        <div className="atm-qa-icon-wrapper">
                            <ArrowLeftRight size={20} className="atm-qa-icon" />
                        </div>
                        <span className="atm-qa-label">Transfer</span>
                    </div>
                </div>
            </div>
        </>
    )

    // If embedded (used within Futures page), return content without Layout wrapper
    if (isEmbedded) {
        return content
    }

    // Standalone page with Layout wrapper
    return (
        <Layout activePage="trade" hideFooter={true} hideHeader={true}>
            {content}
        </Layout>
    )
}
