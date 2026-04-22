import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries, BarSeries, AreaSeries, BaselineSeries } from 'lightweight-charts'
import type { IChartApi } from 'lightweight-charts'
import { ArrowLeft, MoreHorizontal, ChevronDown, Settings, Maximize2, BarChart3, Search, Star, Info, List } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import SettingsSidebar from '../../components/ui/SettingsSidebar'
import { openTrade, getMyOpenTrades, closeTrade, getMarketPrices, getDetailedMarketData } from '../../services/tradeService'
import { getBalance, getCachedBalance, setCachedBalance, addSpotHolding, deductSpotHolding, getSpotHolding, syncSpotHoldingsFromBackend } from '../../services/walletService'
import { useToast } from '../../context/ToastContext'
import '../../styles/dashboard.css'
import '../../styles/trade.css'
import '../../styles/spot-trade.css'

const PAIR_SYMBOLS = [
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT',
    'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'LINK/USDT',
    'LTC/USDT', 'NEAR/USDT', 'APT/USDT', 'ATOM/USDT', 'UNI/USDT',
    'TRX/USDT', 'TON/USDT', 'SHIB/USDT', 'BCH/USDT', 'ICP/USDT',
    'FIL/USDT', 'HBAR/USDT', 'VET/USDT', 'OP/USDT', 'ARB/USDT',
    'MKR/USDT', 'AAVE/USDT', 'GRT/USDT', 'STX/USDT', 'INJ/USDT',
    'IMX/USDT', 'ALGO/USDT', 'ETC/USDT', 'EGLD/USDT', 'SAND/USDT',
    'MANA/USDT', 'AXS/USDT', 'THETA/USDT', 'FTM/USDT', 'RUNE/USDT',
    'KAS/USDT', 'SUI/USDT', 'SEI/USDT', 'TIA/USDT', 'JUP/USDT',
    'WIF/USDT', 'BONK/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'NOT/USDT',
    'RENDER/USDT', 'FET/USDT', 'AGIX/USDT', 'OCEAN/USDT', 'WLD/USDT',
    'CFX/USDT', 'ROSE/USDT', 'ZIL/USDT', 'ONE/USDT', 'HOT/USDT',
    'ENJ/USDT', 'CHZ/USDT', 'GALA/USDT', 'GMT/USDT', 'MAGIC/USDT',
    'BLUR/USDT', 'DYDX/USDT', 'SNX/USDT', 'LRC/USDT', 'BAT/USDT',
    'ZRX/USDT', 'COMP/USDT', 'YFI/USDT', 'CRV/USDT', 'CVX/USDT',
]

const COIN_NAMES: Record<string, string> = {
    BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'BNB', XRP: 'Ripple',
    DOGE: 'Dogecoin', ADA: 'Cardano', AVAX: 'Avalanche', DOT: 'Polkadot',
    LINK: 'Chainlink', LTC: 'Litecoin', NEAR: 'NEAR Protocol', APT: 'Aptos',
    ATOM: 'Cosmos', UNI: 'Uniswap', TRX: 'TRON', TON: 'Toncoin',
    SHIB: 'Shiba Inu', BCH: 'Bitcoin Cash', ICP: 'Internet Computer',
    FIL: 'Filecoin', HBAR: 'Hedera', VET: 'VeChain', OP: 'Optimism',
    ARB: 'Arbitrum', MKR: 'Maker', AAVE: 'Aave', GRT: 'The Graph',
    STX: 'Stacks', INJ: 'Injective', IMX: 'Immutable', ALGO: 'Algorand',
    ETC: 'Ethereum Classic', EGLD: 'MultiversX', SAND: 'The Sandbox',
    MANA: 'Decentraland', AXS: 'Axie Infinity', THETA: 'Theta Network',
    FTM: 'Fantom', RUNE: 'THORChain', KAS: 'Kaspa', SUI: 'Sui',
    SEI: 'Sei', TIA: 'Celestia', JUP: 'Jupiter', WIF: 'dogwifhat',
    BONK: 'Bonk', PEPE: 'Pepe', FLOKI: 'Floki', NOT: 'Notcoin',
    RENDER: 'Render', FET: 'Fetch.ai', AGIX: 'SingularityNET',
    OCEAN: 'Ocean Protocol', WLD: 'Worldcoin', CFX: 'Conflux',
    ROSE: 'Oasis Network', ZIL: 'Zilliqa', ONE: 'Harmony', HOT: 'Holo',
    ENJ: 'Enjin Coin', CHZ: 'Chiliz', GALA: 'Gala', GMT: 'STEPN',
    MAGIC: 'Magic', BLUR: 'Blur', DYDX: 'dYdX', SNX: 'Synthetix',
    LRC: 'Loopring', BAT: 'Basic Attention Token', ZRX: '0x Protocol',
    COMP: 'Compound', YFI: 'yearn.finance', CRV: 'Curve DAO', CVX: 'Convex Finance',
}

const toBinanceSymbol = (pair: string) => pair.replace('/', '')

// Crypto coin logos from spothq/cryptocurrency-icons (32px color PNGs)
// ── Logo helpers ────────────────────────────────────────────────────────────
// jsDelivr mirrors spothq/cryptocurrency-icons with proper CDN caching
const coinLogo = (symbol: string) =>
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${symbol.toLowerCase()}.png`
// CoinGecko thumb is used as second-chance fallback
const coinLogoFallback = (symbol: string) =>
    `https://assets.coingecko.com/coins/images/1/thumb/${symbol.toLowerCase()}.png`
// Twelve Data stock logos (no-auth, CORS-friendly)
const stockLogo = (symbol: string) => `https://logo.twelvedata.com/${symbol.toLowerCase()}`

export const STOCK_PAIRS = [
    { symbol: 'AAPL', name: 'Apple Inc.', yahooSymbol: 'AAPL' },
    { symbol: 'MSFT', name: 'Microsoft', yahooSymbol: 'MSFT' },
    { symbol: 'NVDA', name: 'NVIDIA', yahooSymbol: 'NVDA' },
    { symbol: 'GOOGL', name: 'Alphabet', yahooSymbol: 'GOOGL' },
    { symbol: 'AMZN', name: 'Amazon', yahooSymbol: 'AMZN' },
    { symbol: 'TSLA', name: 'Tesla', yahooSymbol: 'TSLA' },
    { symbol: 'META', name: 'Meta', yahooSymbol: 'META' },
    { symbol: 'NFLX', name: 'Netflix', yahooSymbol: 'NFLX' },
    { symbol: 'JPM', name: 'JPMorgan', yahooSymbol: 'JPM' },
    { symbol: 'V', name: 'Visa', yahooSymbol: 'V' },
    { symbol: 'WMT', name: 'Walmart', yahooSymbol: 'WMT' },
    { symbol: 'DIS', name: 'Disney', yahooSymbol: 'DIS' },
    { symbol: 'AMD', name: 'AMD', yahooSymbol: 'AMD' },
    { symbol: 'INTC', name: 'Intel', yahooSymbol: 'INTC' },
    { symbol: 'COIN', name: 'Coinbase', yahooSymbol: 'COIN' },
    { symbol: 'PYPL', name: 'PayPal', yahooSymbol: 'PYPL' },
    { symbol: 'UBER', name: 'Uber', yahooSymbol: 'UBER' },
    { symbol: 'ORCL', name: 'Oracle', yahooSymbol: 'ORCL' },
    { symbol: 'CRM', name: 'Salesforce', yahooSymbol: 'CRM' },
    { symbol: 'BABA', name: 'Alibaba', yahooSymbol: 'BABA' },
    { symbol: 'GS', name: 'Goldman Sachs', yahooSymbol: 'GS' },
    { symbol: 'MS', name: 'Morgan Stanley', yahooSymbol: 'MS' },
    { symbol: 'BAC', name: 'Bank of America', yahooSymbol: 'BAC' },
    { symbol: 'XOM', name: 'ExxonMobil', yahooSymbol: 'XOM' },
    { symbol: 'CVX', name: 'Chevron', yahooSymbol: 'CVX' },
    { symbol: 'NKE', name: 'Nike', yahooSymbol: 'NKE' },
    { symbol: 'KO', name: 'Coca-Cola', yahooSymbol: 'KO' },
    { symbol: 'PEP', name: 'PepsiCo', yahooSymbol: 'PEP' },
    { symbol: 'MCD', name: "McDonald's", yahooSymbol: 'MCD' },
    { symbol: 'SBUX', name: 'Starbucks', yahooSymbol: 'SBUX' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', yahooSymbol: 'JNJ' },
    { symbol: 'PG', name: 'Procter & Gamble', yahooSymbol: 'PG' },
    { symbol: 'BA', name: 'Boeing', yahooSymbol: 'BA' },
    { symbol: 'TSM', name: 'TSMC', yahooSymbol: 'TSM' },
    { symbol: 'ASML', name: 'ASML Holding', yahooSymbol: 'ASML' },
    { symbol: 'SHOP', name: 'Shopify', yahooSymbol: 'SHOP' },
    { symbol: 'ABNB', name: 'Airbnb', yahooSymbol: 'ABNB' },
    { symbol: 'PLTR', name: 'Palantir', yahooSymbol: 'PLTR' },
    { symbol: 'SNOW', name: 'Snowflake', yahooSymbol: 'SNOW' },
    { symbol: 'SPOT', name: 'Spotify', yahooSymbol: 'SPOT' },
    { symbol: 'SQ', name: 'Block Inc.', yahooSymbol: 'SQ' },
    { symbol: 'HOOD', name: 'Robinhood', yahooSymbol: 'HOOD' },
    { symbol: 'MSTR', name: 'MicroStrategy', yahooSymbol: 'MSTR' },
    { symbol: 'ARM', name: 'Arm Holdings', yahooSymbol: 'ARM' },
    { symbol: 'AVGO', name: 'Broadcom', yahooSymbol: 'AVGO' },
    { symbol: 'QCOM', name: 'Qualcomm', yahooSymbol: 'QCOM' },
    { symbol: 'MU', name: 'Micron Tech', yahooSymbol: 'MU' },
    { symbol: 'ADBE', name: 'Adobe', yahooSymbol: 'ADBE' },
    { symbol: 'NOW', name: 'ServiceNow', yahooSymbol: 'NOW' },
    { symbol: 'RBLX', name: 'Roblox', yahooSymbol: 'RBLX' },
    { symbol: 'ARAMCO', name: 'Saudi Aramco', yahooSymbol: '2222.SR' },
    { symbol: 'RTX', name: 'RTX Corporation', yahooSymbol: 'RTX' },
    { symbol: 'BRK-B', name: 'Berkshire Hathaway', yahooSymbol: 'BRK-B' },
    { symbol: 'LLY', name: 'Eli Lilly', yahooSymbol: 'LLY' },
    { symbol: 'UNH', name: 'UnitedHealth', yahooSymbol: 'UNH' },
    { symbol: 'HD', name: 'Home Depot', yahooSymbol: 'HD' },
    { symbol: 'COST', name: 'Costco', yahooSymbol: 'COST' },
    { symbol: 'ABBV', name: 'AbbVie', yahooSymbol: 'ABBV' },
    { symbol: 'MRK', name: 'Merck & Co.', yahooSymbol: 'MRK' },
    { symbol: 'TMO', name: 'Thermo Fisher', yahooSymbol: 'TMO' },
    { symbol: 'CSCO', name: 'Cisco', yahooSymbol: 'CSCO' },
    { symbol: 'TMUS', name: 'T-Mobile US', yahooSymbol: 'TMUS' },
    { symbol: 'TXN', name: 'Texas Instruments', yahooSymbol: 'TXN' },
    { symbol: 'NVO', name: 'Novo Nordisk', yahooSymbol: 'NVO' },
    { symbol: 'TM', name: 'Toyota', yahooSymbol: 'TM' },
    { symbol: 'SAP', name: 'SAP SE', yahooSymbol: 'SAP' },
    { symbol: 'SONY', name: 'Sony Group', yahooSymbol: 'SONY' },
    { symbol: 'BHP', name: 'BHP Group', yahooSymbol: 'BHP' },
    { symbol: 'LMT', name: 'Lockheed Martin', yahooSymbol: 'LMT' },
    { symbol: 'CAT', name: 'Caterpillar', yahooSymbol: 'CAT' },
]

export const COMMODITY_PAIRS = [
    { symbol: 'GOLD', name: 'Gold', yahooSymbol: 'GC=F', color: '#F5C518', emoji: '🥇' },
    { symbol: 'SILVER', name: 'Silver', yahooSymbol: 'SI=F', color: '#C0C0C0', emoji: '🥈' },
    { symbol: 'OIL', name: 'Crude Oil', yahooSymbol: 'CL=F', color: '#1a1a2e', emoji: '🛢️' },
    { symbol: 'NATGAS', name: 'Natural Gas', yahooSymbol: 'NG=F', color: '#4299e1', emoji: '🔥' },
    { symbol: 'WHEAT', name: 'Wheat', yahooSymbol: 'ZW=F', color: '#d97706', emoji: '🌾' },
    { symbol: 'CORN', name: 'Corn', yahooSymbol: 'ZC=F', color: '#eab308', emoji: '🌽' },
    { symbol: 'COPPER', name: 'Copper', yahooSymbol: 'HG=F', color: '#b45309', emoji: '🔶' },
    { symbol: 'PLAT', name: 'Platinum', yahooSymbol: 'PL=F', color: '#94a3b8', emoji: '💎' },
    { symbol: 'COFFEE', name: 'Coffee', yahooSymbol: 'KC=F', color: '#78350f', emoji: '☕' },
    { symbol: 'SUGAR', name: 'Sugar', yahooSymbol: 'SB=F', color: '#fce7f3', emoji: '🍬' },
]

// Baseline prices used for mock chart when Yahoo Finance is unavailable
const NON_CRYPTO_BASE: Record<string, number> = {
    AAPL: 227, MSFT: 405, NVDA: 875, GOOGL: 178, AMZN: 220, TSLA: 245, META: 560,
    NFLX: 910, JPM: 220, V: 295, WMT: 98, DIS: 112, AMD: 178, INTC: 20, COIN: 195,
    PYPL: 82, UBER: 75, ORCL: 165, CRM: 310, BABA: 82,
    GS: 490, MS: 95, BAC: 38, XOM: 112, CVX: 155, NKE: 92, KO: 62, PEP: 172,
    MCD: 295, SBUX: 90, JNJ: 150, PG: 165, BA: 175, TSM: 145, ASML: 790,
    SHOP: 65, ABNB: 145, PLTR: 22, SNOW: 150, SPOT: 295, SQ: 70, HOOD: 18,
    MSTR: 1600, ARM: 120, AVGO: 1400, QCOM: 160, MU: 85, ADBE: 460, NOW: 820, RBLX: 40,
    '2222.SR': 30, RTX: 90, 'BRK-B': 400, LLY: 780, UNH: 520, HD: 360, COST: 750,
    ABBV: 170, MRK: 125, TMO: 580, CSCO: 50, TMUS: 165, TXN: 175, NVO: 125,
    TM: 240, SAP: 190, SONY: 95, BHP: 60, LMT: 450, CAT: 330,
    'GC=F': 2050, 'SI=F': 23, 'CL=F': 78, 'NG=F': 2.8, 'ZW=F': 560,
    'ZC=F': 420, 'HG=F': 3.85, 'PL=F': 980, 'KC=F': 190, 'SB=F': 22,
}

// Safe logo component — uses React state for fallback, no DOM manipulation
const SYMBOL_COLORS: Record<string, string> = {
    A:'#e74c3c',B:'#3498db',C:'#2ecc71',D:'#9b59b6',E:'#f39c12',
    F:'#1abc9c',G:'#e67e22',H:'#34495e',I:'#e91e63',J:'#00bcd4',
    K:'#8bc34a',L:'#ff5722',M:'#607d8b',N:'#9c27b0',O:'#ff9800',
    P:'#03a9f4',Q:'#4caf50',R:'#f44336',S:'#2196f3',T:'#673ab7',
    U:'#009688',V:'#ffc107',W:'#795548',X:'#cddc39',Y:'#ff4081',Z:'#00bfa5',
}
// AssetIcon: tries src, then src2, then shows a coloured letter — all via React state, no DOM mutation
function AssetIcon({ src, src2, label, size = 18, radius = '50%', bgOverride }: {
    src?: string; src2?: string; label: string; size?: number; radius?: string | number; bgOverride?: string
}) {
    const [attempt, setAttempt] = useState<0 | 1 | 2>(0) // 0=try src, 1=try src2, 2=letter
    const letter = (label || '?').charAt(0).toUpperCase()
    const bg = bgOverride || SYMBOL_COLORS[letter] || '#4a4a6a'
    const activeSrc = attempt === 0 ? src : attempt === 1 ? src2 : undefined
    const handleError = () => {
        if (attempt === 0 && src2) setAttempt(1)
        else setAttempt(2)
    }
    if (!activeSrc) {
        return (
            <span style={{ width: size, height: size, borderRadius: radius, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.48, fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: -0.5 }}>
                {letter}
            </span>
        )
    }
    return (
        <span style={{ width: size, height: size, borderRadius: radius, background: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <img src={activeSrc} alt={label} style={{ width: size, height: size, objectFit: 'contain' }} onError={handleError} />
        </span>
    )
}

export default function Trade() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { toast } = useToast()
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const mobileChartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const mobileChartRef = useRef<IChartApi | null>(null)
    const candleSeriesRef = useRef<any>(null)
    const mobileCandleSeriesRef = useRef<any>(null)
    const volumeSeriesRef = useRef<any>(null)
    const mobileVolumeSeriesRef = useRef<any>(null)

    const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop'>('limit')
    const [chartTab, setChartTab] = useState<'chart' | 'info'>('chart')
    const [obTab, setObTab] = useState<'orderbooks' | 'trades'>('orderbooks')
    const [tradeType, setTradeType] = useState<'spot' | 'grid'>('spot')
    const [pairsTab, setPairsTab] = useState<'usdt' | 'grid'>('usdt')
    const [mobileObTab, setMobileObTab] = useState<'orderbook' | 'trades'>('trades')
    const [showOptionsOverlay, setShowOptionsOverlay] = useState(false)
    const [showLineOverlay, setShowLineOverlay] = useState(false)
    const [lineType, setLineType] = useState('Candles')
    const [optionType, setOptionType] = useState('Quick order')
    const [showSettingsSidebar, setShowSettingsSidebar] = useState(false)
    const [showPairSelector, setShowPairSelector] = useState(false)
    const [showMobilePairDropdown, setShowMobilePairDropdown] = useState(false)
    const [pairSearch, setPairSearch] = useState('')
    const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
    const [ordersTab, setOrdersTab] = useState<'open' | 'history'>('open')

    const [livePrices, setLivePrices] = useState<Record<string, number>>({})
    const [marketData, setMarketData] = useState<Record<string, any>>({})
    const [userBalance, setUserBalance] = useState<number>(() => getCachedBalance())
    const [selectedPair, setSelectedPair] = useState(() => {
        const pairParam = searchParams.get('pair')
        if (pairParam && PAIR_SYMBOLS.includes(pairParam)) return pairParam
        return localStorage.getItem('dw_spot_pair') || 'BTC/USDT'
    })
    const [tradeAmount, setTradeAmount] = useState('')
    const [tradePrice, setTradePrice] = useState('')
    const [tradeTotal, setTradeTotal] = useState('')
    const [submittingSide, setSubmittingSide] = useState<'buy' | 'sell' | null>(null)
    const [openTradesList, setOpenTradesList] = useState<any[]>([])
    const [ohlcData, setOhlcData] = useState<{ open: number; high: number; low: number; close: number; change: number }>({ open: 0, high: 0, low: 0, close: 0, change: 0 })
    const [askOrders, setAskOrders] = useState<{ price: number; amount: number; total: number }[]>([])
    const [bidOrders, setBidOrders] = useState<{ price: number; amount: number; total: number }[]>([])
    const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 768)

    // ── Market category tabs: Crypto / Stocks / Commodities ──────────────────
    const [marketCategory, setMarketCategory] = useState<'crypto' | 'stocks' | 'commodities'>(
        () => (localStorage.getItem('dw_spot_category') as 'crypto' | 'stocks' | 'commodities') || 'crypto'
    )
    const [activeYahooSymbol, setActiveYahooSymbol] = useState(
        () => localStorage.getItem('dw_spot_yahoo_symbol') || ''
    )
    const [activeNonCryptoName, setActiveNonCryptoName] = useState(
        () => localStorage.getItem('dw_spot_noncrypto_name') || ''
    )
    const [activeNonCryptoSymbol, setActiveNonCryptoSymbol] = useState(
        () => localStorage.getItem('dw_spot_noncrypto_symbol') || ''
    )
    const [nonCryptoPrices, setNonCryptoPrices] = useState<Record<string, { price: number; change: number; high: number; low: number; volume: number }>>({})
    const [ticker24h, setTicker24h] = useState<{ high: number; low: number; volume: number; quoteVolume: number; change: number } | null>(null)
    const [fundingRate, setFundingRate] = useState<number>(-0.0070)

    const activePriceData = marketCategory !== 'crypto' && activeYahooSymbol ? (nonCryptoPrices[activeYahooSymbol] || null) : null
    const currentPrice = activePriceData
        ? activePriceData.price
        : (livePrices[toBinanceSymbol(selectedPair)] || marketData[selectedPair]?.price || 0)
    const selectedCoin = marketCategory === 'crypto' ? selectedPair.split('/')[0] : activeNonCryptoName
    const currentPriceRef = useRef(currentPrice)
    const marketDataRef = useRef<Record<string, any>>(marketData)
    useEffect(() => { currentPriceRef.current = currentPrice }, [currentPrice])
    useEffect(() => { marketDataRef.current = marketData }, [marketData])

    const handleNumericInput = (value: string, setter: (v: string) => void) => {
        const normalized = value.replace(',', '.')
        const cleaned = normalized.replace(/[^0-9.]/g, '')
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
        if (currentPrice > 0 && orderType !== 'market') {
            const formatted = currentPrice >= 1 ? currentPrice.toFixed(2) : currentPrice.toPrecision(4)
            setTradePrice(formatted)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPair, currentPrice > 0 ? Math.round(currentPrice * 100000) : 0])

    useEffect(() => {
        const fetchUserBalance = async () => {
            try {
                const balRes = await getBalance().catch(() => ({ balance: 0 }))
                const fetchedBal = balRes.balance ?? 0
                setUserBalance(fetchedBal)
                if (fetchedBal > 0) setCachedBalance(fetchedBal)
            } catch (e) { console.warn('Balance fetch failed:', e) }
        }
        
        fetchUserBalance()
        
        const interval = setInterval(fetchUserBalance, 10000)
        return () => clearInterval(interval)
    }, [])

    // Real-time market prices via Binance WebSocket, with backend polling fallback.
    useEffect(() => {
        let ws: WebSocket | null = null;
        let retryTimeout: any;
        let fallbackPollInterval: any;
        let isWsConnected = false;

        const mergeMarketSnapshot = (snapshot: Record<string, any>) => {
            setLivePrices(prev => {
                const next = { ...prev };
                let changed = false;

                for (const pair of PAIR_SYMBOLS) {
                    const data = snapshot[pair];
                    const price = Number(data?.price);
                    if (!(price > 0)) continue;

                    const binanceKey = toBinanceSymbol(pair);
                    if (next[binanceKey] !== price) {
                        next[binanceKey] = price;
                        changed = true;
                    }
                    if (next[pair] !== price) {
                        next[pair] = price;
                        changed = true;
                    }
                }

                return changed ? next : prev;
            });

            setMarketData(prev => {
                const next = { ...prev };
                let changed = false;

                for (const pair of PAIR_SYMBOLS) {
                    const data = snapshot[pair];
                    const price = Number(data?.price);
                    if (!(price > 0)) continue;

                    const existing = next[pair] || {};
                    const merged = {
                        ...existing,
                        price,
                        change24h: typeof data?.change24h === 'number' ? data.change24h : (existing.change24h || 0),
                        volume24h: typeof data?.volume24h === 'number' ? data.volume24h : (existing.volume24h || 0),
                        marketCap: typeof data?.marketCap === 'number' ? data.marketCap : (existing.marketCap || 0),
                    };

                    if (
                        existing.price !== merged.price ||
                        existing.change24h !== merged.change24h ||
                        existing.volume24h !== merged.volume24h ||
                        existing.marketCap !== merged.marketCap
                    ) {
                        next[pair] = merged;
                        changed = true;
                    }
                }

                return changed ? next : prev;
            });
        };

        const fetchFallbackMarketData = async () => {
            try {
                const snapshot = await getDetailedMarketData(PAIR_SYMBOLS);
                mergeMarketSnapshot(snapshot);
            } catch {
                // Keep current UI values on transient network failures.
            }
        };

        const connectWS = () => {
            try {
                ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
                ws.onopen = () => { isWsConnected = true; };
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
                                        high24h: parseFloat(ticker.h),
                                        low24h: parseFloat(ticker.l),
                                        high: parseFloat(ticker.h),
                                        low: parseFloat(ticker.l),
                                        volume24h: parseFloat(ticker.v),
                                        quoteVolume24h: parseFloat(ticker.q)
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
                ws.onerror = () => { isWsConnected = false; if (ws) ws.close(); };
                ws.onclose = () => { isWsConnected = false; retryTimeout = setTimeout(connectWS, 5000); };
            } catch (err) {
                isWsConnected = false;
                retryTimeout = setTimeout(connectWS, 5000);
            }
        };

        fetchFallbackMarketData();
        fallbackPollInterval = setInterval(() => {
            if (!isWsConnected) fetchFallbackMarketData();
        }, 12000);

        connectWS();
        return () => {
            clearTimeout(retryTimeout);
            clearInterval(fallbackPollInterval);
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
                // Sync localStorage holdings with backend open spot trades so that
                // admin-opened trades appear in the user's portfolio and sell validation works.
                syncSpotHoldingsFromBackend(trades || [])
                setOpenTradesList((trades || []).filter((t: any) => !t.type || t.type === 'spot'))
            } catch { /* ignore */ }
        }
        fetchTrades()
        const interval = setInterval(fetchTrades, 15000)
        return () => clearInterval(interval)
    }, [])

    // ── Binance 24h ticker — real high/low/volume/change ────────────────────
    useEffect(() => {
        if (marketCategory !== 'crypto') return
        const symbol = toBinanceSymbol(selectedPair)
        const applyFallback = (price: number) => {
            const selectedData = marketDataRef.current[selectedPair] || {}
            const volume = typeof selectedData.volume24h === 'number' ? selectedData.volume24h : 0
            const quoteVolume = typeof selectedData.quoteVolume24h === 'number' ? selectedData.quoteVolume24h : volume * price
            const change = typeof selectedData.change24h === 'number' ? selectedData.change24h : 0
            const high = (typeof selectedData.high24h === 'number' ? selectedData.high24h : selectedData.high) || (price > 0 ? price * 1.018 : 0)
            const low = (typeof selectedData.low24h === 'number' ? selectedData.low24h : selectedData.low) || (price > 0 ? price * 0.983 : 0)

            setTicker24h({ high, low, volume, quoteVolume, change })
            setFundingRate(0)
        }
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
            .then(r => r.json())
            .then((d: any) => {
                if (d.highPrice) {
                    setTicker24h({
                        high: parseFloat(d.highPrice),
                        low: parseFloat(d.lowPrice),
                        volume: parseFloat(d.volume),
                        quoteVolume: parseFloat(d.quoteVolume),
                        change: parseFloat(d.priceChangePercent)
                    })
                    setFundingRate(+(Math.random() * 0.08 - 0.04).toFixed(4))
                } else { applyFallback(currentPriceRef.current || 65000) }
            })
            .catch(() => applyFallback(currentPriceRef.current || 65000))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPair, marketCategory])

    useEffect(() => {
        if (currentPrice <= 0) return
        const p = currentPrice
        const asks = Array.from({ length: 18 }, (_, i) => {
            const offset = (i + 1) * (p * 0.0001 * (1 + Math.random()))
            const price = parseFloat((p + offset).toFixed(2))
            const amount = parseFloat((Math.random() * 0.5 + 0.001).toFixed(5))
            return { price, amount, total: parseFloat((price * amount).toFixed(5)) }
        }).sort((a, b) => a.price - b.price)
        const bids = Array.from({ length: 18 }, (_, i) => {
            const offset = (i + 1) * (p * 0.0001 * (1 + Math.random()))
            const price = parseFloat((p - offset).toFixed(2))
            const amount = parseFloat((Math.random() * 0.5 + 0.001).toFixed(5))
            return { price, amount, total: parseFloat((price * amount).toFixed(5)) }
        }).sort((a, b) => b.price - a.price)
        setAskOrders(asks)
        setBidOrders(bids)
    }, [currentPrice, selectedPair])

    const handleTrade = async (side: 'buy' | 'sell') => {
        const coinAmt = Number(tradeAmount)  // tradeAmount is in coin units (e.g. BTC)
        if (!tradeAmount || isNaN(coinAmt) || coinAmt <= 0) { toast('Please enter a valid amount', 'warning'); return }
        if (currentPrice <= 0) { toast('Waiting for price data...', 'warning'); return }
        const entryPrice = orderType === 'market' ? currentPrice : (parseFloat(tradePrice) || currentPrice)
        const usdtCost = parseFloat((coinAmt * entryPrice).toFixed(2))
        // Determine holding key before balance check (needed for sell validation)
        const holdingKey = marketCategory !== 'crypto' && activeNonCryptoSymbol ? activeNonCryptoSymbol : selectedCoin
        // Balance check: buys require sufficient USDT; sells require sufficient coin holdings
        if (side === 'buy') {
            if (usdtCost > userBalance) { toast('Insufficient balance', 'warning'); return }
        } else {
            const coinHolding = getSpotHolding(holdingKey)
            if (coinAmt > coinHolding + 1e-8) { toast(`Insufficient ${selectedCoin} balance`, 'warning'); return }
        }
        setSubmittingSide(side)
        try {
            // Use the ticker symbol (not display name) for stocks/commodities so the backend
            // price service can fetch the closing price by ticker (e.g. "AAPL" not "Apple Inc.")
            const tradeAsset = holdingKey
            await openTrade({ asset: tradeAsset, type: 'spot', side, amount: parseFloat(coinAmt.toFixed(8)), price: entryPrice, entryPrice })
            // Update displayed balance and track coin holding
            // Note: do NOT call applyLocalBalanceChange for spot trades — the backend updates
            // user.balance directly, so applying it here would cause double-counting on re-fetch.
            const usdtDelta = side === 'buy' ? -usdtCost : usdtCost
            const newBal = parseFloat((userBalance + usdtDelta).toFixed(2))
            setUserBalance(newBal)
            setCachedBalance(newBal)
            if (side === 'buy') addSpotHolding(holdingKey, coinAmt, usdtCost)
            else deductSpotHolding(holdingKey, coinAmt)
            toast(`${side === 'buy' ? 'Buy' : 'Sell'} order placed!`, 'success')
            setTradeAmount(''); setTradeTotal('')
            // Refresh from backend to sync the confirmed server balance
            try {
                const [balRes, trades] = await Promise.all([getBalance(), getMyOpenTrades()])
                if (balRes.balance > 0) setUserBalance(balRes.balance)
                setOpenTradesList((trades || []).filter((t: any) => !t.type || t.type === 'spot'))
            } catch { /* keep local state */ }
        } catch (e: any) { toast(e.message || 'Trade failed', 'error') }
        finally { setSubmittingSide(null) }
    }

    const handleCloseTrade = async (tradeId: string) => {
        try {
            const trade = openTradesList.find(t => t._id === tradeId)
            if (tradeId.startsWith('local_')) {
                // For local (offline) spot trades: return what the coins are worth at current price.
                // Do NOT add trade.pnl separately — it would double-count the position value.
                const tradeValue = trade ? parseFloat((trade.amount * (currentPrice || trade.entryPrice)).toFixed(2)) : 0
                setOpenTradesList(prev => prev.filter(t => t._id !== tradeId))
                setUserBalance(prev => parseFloat((prev + tradeValue).toFixed(2)))
            } else {
                await closeTrade(tradeId)
                // Backend handles all balance updates for spot trades on close;
                // do NOT apply applyLocalBalanceChange here to avoid double-counting.
                const [balRes, trades] = await Promise.all([getBalance(), getMyOpenTrades()])
                setUserBalance(balRes.balance)
                setOpenTradesList((trades || []).filter((t: any) => !t.type || t.type === 'spot'))
            }
            toast('Trade closed successfully', 'success')
        } catch (e: any) { toast(e.message || 'Failed to close trade', 'error') }
    }

    const handleSelectPair = (pair: string) => {
        localStorage.setItem('dw_spot_pair', pair); setSelectedPair(pair); setShowPairSelector(false); setPairSearch(''); setTradeAmount(''); setTradeTotal('')
    }

    const filteredPairs = PAIR_SYMBOLS.filter(p =>
        p.toLowerCase().includes(pairSearch.toLowerCase()) ||
        (COIN_NAMES[p.split('/')[0]] || '').toLowerCase().includes(pairSearch.toLowerCase())
    )

    const tradingPairs = PAIR_SYMBOLS.map(pair => {
        const coin = pair.split('/')[0]
        const wsPrice = livePrices[toBinanceSymbol(pair)] || 0
        const data = marketData[pair] || {}
        const price = wsPrice > 0 ? wsPrice : (data.price || 0)
        const change = data.change24h || 0
        return {
            symbol: coin, name: COIN_NAMES[coin] || coin, pair: 'USDT', fullPair: pair, price,
            priceStr: price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Loading',
            change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            positive: change >= 0,
        }
    })

    const timeframeMap: Record<string, string> = { '1s': '1s', '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w' }

    const renderChart = useCallback(async (container: HTMLDivElement, existingChart: React.MutableRefObject<IChartApi | null>, isMobile = false) => {
        if (existingChart.current) {
            existingChart.current.remove(); existingChart.current = null
            if (isMobile) { mobileCandleSeriesRef.current = null; mobileVolumeSeriesRef.current = null }
            else { candleSeriesRef.current = null; volumeSeriesRef.current = null }
        }
        let cancelled = false
        const binanceSymbol = toBinanceSymbol(selectedPair)
        const interval = timeframeMap[selectedTimeframe] || '1d'
        let candleData: any[] = [], volumeData: any[] = []
        const isYahooAsset = marketCategory !== 'crypto' && !!activeYahooSymbol

        if (isYahooAsset) {
            // ── Mock OHLC for stocks & commodities (Yahoo Finance is CORS-blocked) ───
            const yahooTfMap: Record<string, { yi: string }> = {
                '1s': { yi: '1m' }, '15m': { yi: '15m' },
                '1H': { yi: '60m' }, '4H': { yi: '1d' },
                '1D': { yi: '1d' }, '1W': { yi: '1wk' },
            }
            const { yi: yInterval } = yahooTfMap[selectedTimeframe] || { yi: '1d' }
            const seedPrice = nonCryptoPrices[activeYahooSymbol]?.price || NON_CRYPTO_BASE[activeYahooSymbol] || 100
            const isIntraM = yInterval.includes('m') || yInterval === '60m'
            if (cancelled) return
            let last = seedPrice
                const msMap: Record<string, number> = { '1m': 60000, '15m': 900000, '60m': 3600000, '1d': 86400000, '1wk': 604800000 }
                const stepMs = msMap[yInterval] || 86400000
                const now = Date.now()
                for (let i = 0; i < 180; i++) {
                    const ts = now - (180 - i) * stepMs
                    const time: any = isIntraM ? Math.floor(ts / 1000) : new Date(ts).toISOString().split('T')[0]
                    const v = last * 0.012
                    const open = last
                    const close = +(open + (Math.random() - 0.48) * v).toFixed(4)
                    const high = +(Math.max(open, close) + Math.random() * v * 0.35).toFixed(4)
                    const low = +(Math.min(open, close) - Math.random() * v * 0.35).toFixed(4)
                    candleData.push({ time, open, high, low, close })
                    volumeData.push({ time, value: Math.floor(Math.random() * 8000000 + 200000), color: close >= open ? '#10b981' : '#ef4444' })
                    last = close
                }
            if (cancelled) return
            if (candleData.length > 0) {
                const last = candleData[candleData.length - 1], prev = candleData.length > 1 ? candleData[candleData.length - 2] : last
                setOhlcData({ open: last.open, high: last.high, low: last.low, close: last.close, change: prev.close > 0 ? ((last.close - prev.close) / prev.close * 100) : 0 })
            }
        } else {
        // ── Binance klines (crypto) ────────────────────────────────────────────
        try {
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=180`)
            if (cancelled) return
            const klines = await res.json()
            if (Array.isArray(klines) && klines.length > 0) {
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
            } else {
                throw new Error('Invalid klines response')
            }
        } catch {
            if (cancelled) return
            // Generate realistic fallback data matching the selected timeframe
            let lastClose = currentPriceRef.current || 65000
            const isIntraday = interval.includes('s') || interval.includes('m') || interval.includes('h')
            const count = 180
            const now = Date.now()
            let intervalMs = 86400000 // 1 day
            if (interval === '1s') intervalMs = 1000
            else if (interval === '15m') intervalMs = 900000
            else if (interval === '1h') intervalMs = 3600000
            else if (interval === '4h') intervalMs = 14400000
            else if (interval === '1w') intervalMs = 604800000

            for (let i = 0; i < count; i++) {
                const timestamp = now - (count - i) * intervalMs
                const time: any = isIntraday ? Math.floor(timestamp / 1000) : new Date(timestamp).toISOString().split('T')[0]
                const volatility = lastClose * 0.015
                const chg = (Math.random() - 0.48) * volatility
                const open = lastClose
                const close = open + chg
                const high = Math.max(open, close) + Math.random() * volatility * 0.4
                const low = Math.min(open, close) - Math.random() * volatility * 0.4
                candleData.push({ time, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) })
                volumeData.push({ time, value: Math.random() * 50000 + 5000, color: close >= open ? '#10b981' : '#ef4444' })
                lastClose = close
            }
            if (candleData.length > 0) {
                const last = candleData[candleData.length - 1], prev = candleData.length > 1 ? candleData[candleData.length - 2] : last
                setOhlcData({ open: last.open, high: last.high, low: last.low, close: last.close, change: prev.close > 0 ? ((last.close - prev.close) / prev.close * 100) : 0 })
            }
        }
        } // end crypto block
        if (cancelled) return
        // Deduplicate candle data by timestamp (prevents lightweight-charts assertion errors)
        const seen = new Set<any>()
        candleData = candleData.filter(c => { if (seen.has(c.time)) return false; seen.add(c.time); return true })
        volumeData = volumeData.filter((_: any, i: number) => seen.has(candleData[i]?.time) || i < candleData.length)
        let chart: any
        try {
            chart = createChart(container, {
                width: container.clientWidth, height: isMobile ? 280 : container.clientHeight || 400,
                layout: { background: { type: ColorType.Solid, color: '#06060a' }, textColor: '#71717A' },
                grid: { vertLines: { color: '#1a1a24' }, horzLines: { color: '#1a1a24' } },
                autoSize: !isMobile, timeScale: { borderColor: '#1a1a24', timeVisible: true },
                rightPriceScale: { borderColor: '#1a1a24' }, crosshair: { mode: 1 },
            })
        } catch (err) {
            console.error('[Chart] createChart failed:', err)
            return
        }

        // Create series based on lineType selection
        let cs: any
        const lineData = candleData.map((c: any) => ({ time: c.time, value: c.close }))

        try {
        if (lineType === 'Bars') {
            cs = chart.addSeries(BarSeries, { upColor: '#10b981', downColor: '#ef4444' })
            cs.setData(candleData as any)
        } else if (lineType === 'Area') {
            cs = chart.addSeries(AreaSeries, {
                lineColor: '#2962FF', topColor: 'rgba(41, 98, 255, 0.4)', bottomColor: 'rgba(41, 98, 255, 0.0)',
                lineWidth: 2,
            })
            cs.setData(lineData as any)
        } else if (lineType === 'Heiken Aishi') {
            // Compute Heiken Ashi candles from OHLC data
            const haCandles: any[] = []
            for (let i = 0; i < candleData.length; i++) {
                const c = candleData[i]
                const prevHa = i > 0 ? haCandles[i - 1] : c
                const haClose = (c.open + c.high + c.low + c.close) / 4
                const haOpen = (prevHa.open + prevHa.close) / 2
                const haHigh = Math.max(c.high, haOpen, haClose)
                const haLow = Math.min(c.low, haOpen, haClose)
                haCandles.push({ time: c.time, open: +haOpen.toFixed(2), high: +haHigh.toFixed(2), low: +haLow.toFixed(2), close: +haClose.toFixed(2) })
            }
            cs = chart.addSeries(CandlestickSeries, { upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444' })
            cs.setData(haCandles as any)
        } else if (lineType === 'Baseline') {
            const avgPrice = lineData.length > 0 ? lineData.reduce((s: number, d: any) => s + d.value, 0) / lineData.length : 0
            cs = chart.addSeries(BaselineSeries, {
                baseValue: { type: 'price', price: avgPrice },
                topLineColor: '#10b981', topFillColor1: 'rgba(16, 185, 129, 0.2)', topFillColor2: 'rgba(16, 185, 129, 0.0)',
                bottomLineColor: '#ef4444', bottomFillColor1: 'rgba(239, 68, 68, 0.0)', bottomFillColor2: 'rgba(239, 68, 68, 0.2)',
                lineWidth: 2,
            })
            cs.setData(lineData as any)
        } else if (lineType === 'High low') {
            cs = chart.addSeries(LineSeries, { color: '#22d3ee', lineWidth: 2 })
            cs.setData(lineData as any)
            // Add high and low markers as additional line series
            const highLine = chart.addSeries(LineSeries, { color: '#10b981', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
            highLine.setData(candleData.map((c: any) => ({ time: c.time, value: c.high })) as any)
            const lowLine = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false })
            lowLine.setData(candleData.map((c: any) => ({ time: c.time, value: c.low })) as any)
        } else if (lineType === 'Column') {
            cs = chart.addSeries(HistogramSeries, {
                color: '#2962FF',
            })
            cs.setData(candleData.map((c: any) => ({ time: c.time, value: c.close, color: c.close >= c.open ? '#10b981' : '#ef4444' })) as any)
        } else {
            // Default: Candles
            cs = chart.addSeries(CandlestickSeries, { upColor: '#10b981', downColor: '#ef4444', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444' })
            cs.setData(candleData as any)
        }
        } catch (seriesErr) {
            console.error('[Chart] series error:', seriesErr)
            try { chart.remove() } catch {}
            return
        }
        if (isMobile) { mobileCandleSeriesRef.current = cs } else { candleSeriesRef.current = cs }
        if (volumeData.length > 0) {
            const vs = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'volume' }, 0)
            vs.setData(volumeData as any)
            chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
            if (isMobile) { mobileVolumeSeriesRef.current = vs } else { volumeSeriesRef.current = vs }
        }
        chart.timeScale().fitContent()
        if (cancelled) { chart.remove(); return }
        existingChart.current = chart
        const handleResize = () => { if (container && existingChart.current) existingChart.current.applyOptions({ width: container.clientWidth }) }
        window.addEventListener('resize', handleResize)
        return () => {
            cancelled = true
            window.removeEventListener('resize', handleResize)
            if (existingChart.current) { existingChart.current.remove(); existingChart.current = null }
            if (isMobile) { mobileCandleSeriesRef.current = null; mobileVolumeSeriesRef.current = null }
            else { candleSeriesRef.current = null; volumeSeriesRef.current = null }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPair, selectedTimeframe, lineType, marketCategory, activeYahooSymbol])

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth <= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (isMobileView || !chartContainerRef.current) return
        let cleanup: (() => void) | undefined
        let active = true
        renderChart(chartContainerRef.current, chartRef, false).then(fn => {
            if (active) cleanup = fn
            else fn?.() // effect torn down before async resolved — destroy chart immediately
        }).catch((err: any) => console.warn('[Chart] render error (desktop):', err))
        return () => { active = false; cleanup?.() }
    }, [renderChart, isMobileView])

    useEffect(() => {
        if (!isMobileView || !mobileChartContainerRef.current) return
        let cleanup: (() => void) | undefined
        let active = true
        renderChart(mobileChartContainerRef.current, mobileChartRef, true).then(fn => {
            if (active) cleanup = fn
            else fn?.() // effect torn down before async resolved — destroy chart immediately
        }).catch(err => console.warn('[Chart] render error (mobile):', err))
        return () => { active = false; cleanup?.() }
    }, [renderChart, isMobileView])

    // Live WebSocket candle updates from Binance (crypto only)
    useEffect(() => {
        if (marketCategory !== 'crypto') return
        const binanceSymbol = toBinanceSymbol(selectedPair).toLowerCase()
        const interval = timeframeMap[selectedTimeframe] || '1d'
        const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_${interval}`
        let ws: WebSocket | null = null
        const usesOHLC = lineType === 'Candles' || lineType === 'Bars' || lineType === 'Heiken Aishi'
        try {
            ws = new WebSocket(wsUrl)
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data)
                    if (msg.k) {
                        const k = msg.k
                        const isIntraday = interval.includes('s') || interval.includes('m') || interval.includes('h')
                        const time = isIntraday ? Math.floor(k.t / 1000) : new Date(k.t).toISOString().split('T')[0]
                        const candle = { time, open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c) }
                        const vol = { time, value: parseFloat(k.v), color: candle.close >= candle.open ? '#10b981' : '#ef4444' }

                        const safeUpdate = (ref: React.MutableRefObject<any>, data: any) => {
                            if (!ref.current) return
                            try { ref.current.update(data) } catch { ref.current = null }
                        }
                        if (usesOHLC) {
                            safeUpdate(candleSeriesRef, candle)
                            safeUpdate(mobileCandleSeriesRef, candle)
                        } else if (lineType === 'Column') {
                            const colUpdate = { time, value: candle.close, color: candle.close >= candle.open ? '#10b981' : '#ef4444' }
                            safeUpdate(candleSeriesRef, colUpdate)
                            safeUpdate(mobileCandleSeriesRef, colUpdate)
                        } else {
                            const lineUpdate = { time, value: candle.close }
                            safeUpdate(candleSeriesRef, lineUpdate)
                            safeUpdate(mobileCandleSeriesRef, lineUpdate)
                        }
                        safeUpdate(volumeSeriesRef, vol)
                        safeUpdate(mobileVolumeSeriesRef, vol)
                        setOhlcData({ open: candle.open, high: candle.high, low: candle.low, close: candle.close, change: candle.open > 0 ? ((candle.close - candle.open) / candle.open * 100) : 0 })
                    }
                } catch { /* ignore parse errors */ }
            }
        } catch { /* WebSocket connection failed, chart stays static */ }
        return () => { if (ws) { ws.close(); ws = null } }
    }, [selectedPair, selectedTimeframe, lineType, marketCategory, activeYahooSymbol])

    useEffect(() => {
        if (marketCategory === 'crypto') return
          const items = marketCategory === 'stocks' ? STOCK_PAIRS : COMMODITY_PAIRS
          let active = true

          const fetchPrices = async () => {
              const symbols = items.map(i => `${i.symbol}/USDT`)
              try {
                  const res = await getMarketPrices(symbols)
                  if (!active) return
                  
                  setNonCryptoPrices(prev => {
                      const next = { ...prev }
                      let changed = false
                      for (const item of items) {
                          const px = res[`${item.symbol}/USDT`] || res[`${item.symbol}USDT`] || res[item.symbol]
                          if (px > 0) {
                              const oldPrice = prev[item.yahooSymbol]?.price || NON_CRYPTO_BASE[item.yahooSymbol] || 100
                              const change = oldPrice ? ((px - oldPrice) / oldPrice) * 100 : 0
                              next[item.yahooSymbol] = {
                                  price: px,
                                  change: change !== 0 ? change : (prev[item.yahooSymbol]?.change || 0),
                                  high: Math.max(px, prev[item.yahooSymbol]?.high || px),
                                  low: prev[item.yahooSymbol]?.low ? Math.min(px, prev[item.yahooSymbol].low) : px,
                                  volume: prev[item.yahooSymbol]?.volume || Math.floor(Math.random() * 5e7)
                              }
                              changed = true
                          } else if (!prev[item.yahooSymbol]) {
                              const seed = NON_CRYPTO_BASE[item.yahooSymbol] || 100
                              next[item.yahooSymbol] = { price: seed, change: 0, high: seed, low: seed, volume: 0 }
                              changed = true
                          }
                      }
                      return changed ? next : prev
                  })
              } catch {
                  if (!active) return
                  setNonCryptoPrices(prev => {
                       const next = { ...prev }
                       let changed = false
                       for (const item of items) {
                           if (!prev[item.yahooSymbol]) {
                               const seed = NON_CRYPTO_BASE[item.yahooSymbol] || 100
                               next[item.yahooSymbol] = { price: seed, change: 0, high: seed, low: seed, volume: 0 }
                               changed = true
                           }
                       }
                       return changed ? next : prev
                  })
              }
          }
          
          fetchPrices()
          const interval = setInterval(fetchPrices, 4000)
          return () => { active = false; clearInterval(interval) }
    }, [marketCategory])

    const formatPrice = (price: number) => {
        if (price === 0) return '0.00'
        if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        if (price >= 1) return price.toFixed(4)
        return price.toFixed(6)
    }

    const pairChangeData = marketData[selectedPair] || {}
    const _p = currentPrice || currentPriceRef.current || 0
    const change24h = activePriceData ? activePriceData.change : (ticker24h ? ticker24h.change : (pairChangeData.change24h || 0))
    const volume24h = activePriceData
        ? activePriceData.volume
        : (ticker24h ? ticker24h.volume : (pairChangeData.volume24h || pairChangeData.volume || (_p > 0 ? +(_p * 0.18 + Math.random() * _p * 0.05).toFixed(0) : 0)))
    const high24h = activePriceData
        ? activePriceData.high
        : (ticker24h ? ticker24h.high : (pairChangeData.high24h || pairChangeData.high || ohlcData.high || (_p > 0 ? +(_p * 1.018).toFixed(2) : 0)))
    const low24h = activePriceData
        ? activePriceData.low
        : (ticker24h ? ticker24h.low : (pairChangeData.low24h || pairChangeData.low || ohlcData.low || (_p > 0 ? +(_p * 0.983).toFixed(2) : 0)))
    const quoteVol24h = ticker24h ? ticker24h.quoteVolume : (pairChangeData.quoteVolume24h || (volume24h * _p))
    const timeframes = ['1s', '15m', '1H', '4H', '1D', '1W']

    return (
        <Layout activePage="trade" hideFooter={false} hideFooterMobile={true} hideMobileNav={false} hideMobileHeader={true}>
            {showPairSelector && (
                <div className="tm-overlay-v3" onClick={() => setShowPairSelector(false)} style={{ zIndex: 1000 }}>
                    <div className="tm-overlay-content-v3" onClick={e => e.stopPropagation()} style={{ maxHeight: '70vh', overflow: 'auto' }}>
                        <div className="tm-overlay-header-v3">
                            <span className="tm-overlay-title">Select Pair</span>
                            <button className="tm-close-overlay" onClick={() => setShowPairSelector(false)}>{"\u2715"}</button>
                        </div>
                        <div style={{ padding: '8px 16px' }}>
                            <input type="text" placeholder="Search..." value={pairSearch} onChange={e => setPairSearch(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }} />
                        </div>
                        <div className="tm-overlay-list-v3">
                            {filteredPairs.map(pair => {
                                const coin = pair.split('/')[0], md = marketData[pair] || {}
                                const price = livePrices[toBinanceSymbol(pair)] || md.price || 0
                                return (
                                    <div key={pair} className="tm-overlay-item-v3" onClick={() => handleSelectPair(pair)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                        <div>
                                            <span style={{ fontWeight: 600 }}>{coin}</span>
                                            <span style={{ color: '#71717A', marginLeft: 4, fontSize: 12 }}>/USDT</span>
                                            <div style={{ fontSize: 11, color: '#71717A' }}>{COIN_NAMES[coin]}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#fff', fontSize: 13 }}>{formatPrice(price)}</div>
                                            <div style={{ fontSize: 11, color: (md.change24h || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                                                {md.change24h ? `${md.change24h >= 0 ? '+' : ''}${md.change24h.toFixed(2)}%` : 'Live'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="mobile-only">
                <div className="trade-mobile-layout-v3">
                    <div className="tm-header-v3" style={{ position: 'relative' }}>
                        <div className="tm-header-left">
                            <ArrowLeft size={22} className="tm-back-icon" onClick={() => navigate('/dashboard/home')} />
                            <div className="tm-pair-box" onClick={() => setShowMobilePairDropdown(v => !v)} style={{ cursor: 'pointer' }}>
                                <span className="tm-pair-name">{marketCategory === 'crypto' ? selectedPair : activeNonCryptoName || selectedPair}</span>
                                <ChevronDown size={16} className="tm-pair-arrow" style={{ transition: 'transform 0.2s', transform: showMobilePairDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                            </div>
                        </div>
                        <div className="tm-header-right">
                            <List size={22} className="tm-list-icon" onClick={() => navigate('/dashboard/advance-trade')} />
                            <MoreHorizontal size={22} className="tm-more-icon" onClick={() => setShowSettingsSidebar(true)} />
                        </div>
                        {showMobilePairDropdown && (
                            <div className="tm-pair-dropdown">
                                {/* Search bar */}
                                <div className="tm-pair-dropdown-search">
                                    <Search size={14} className="tm-pair-dropdown-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search for currency pairs"
                                        className="tm-pair-dropdown-input"
                                        value={pairSearch}
                                        onChange={e => setPairSearch(e.target.value)}
                                        autoFocus
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                {/* Category tabs: Crypto / Stocks / Commodities */}
                                <div className="tm-pair-dropdown-cats" onClick={e => e.stopPropagation()}>
                                    {(['crypto', 'stocks', 'commodities'] as const).map(cat => (
                                        <button
                                            key={cat}
                                            className={`tm-pair-dropdown-cat-btn ${marketCategory === cat ? 'active' : ''}`}
                                            onClick={() => {
                                                setPairSearch('')
                                                localStorage.setItem('dw_spot_category', cat)
                                                setMarketCategory(cat)
                                                if (cat !== 'crypto') {
                                                    const first = cat === 'stocks' ? STOCK_PAIRS[0] : COMMODITY_PAIRS[0]
                                                    localStorage.setItem('dw_spot_yahoo_symbol', first.yahooSymbol)
                                                    localStorage.setItem('dw_spot_noncrypto_name', first.name)
                                                    localStorage.setItem('dw_spot_noncrypto_symbol', first.symbol)
                                                    setActiveYahooSymbol(first.yahooSymbol)
                                                    setActiveNonCryptoName(first.name)
                                                    setActiveNonCryptoSymbol(first.symbol)
                                                }
                                            }}
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                {/* Column headers */}
                                <div className="tm-pair-dropdown-header">
                                    <span>Name</span>
                                    <span>Price</span>
                                    <span style={{ textAlign: 'right' }}>24h Change</span>
                                </div>
                                {/* Lists */}
                                <div className="tm-pair-dropdown-list">
                                    {/* ── Crypto ── */}
                                    {marketCategory === 'crypto' && tradingPairs
                                        .filter(p => !pairSearch || p.symbol.toLowerCase().includes(pairSearch.toLowerCase()) || p.name.toLowerCase().includes(pairSearch.toLowerCase()))
                                        .map((pair, i) => (
                                            <div
                                                key={i}
                                                className={`tm-pair-dropdown-item ${pair.fullPair === selectedPair ? 'active' : ''}`}
                                                onClick={() => { handleSelectPair(pair.fullPair); setShowMobilePairDropdown(false); setPairSearch('') }}
                                            >
                                                <div className="tm-pair-dropdown-name">
                                                    <AssetIcon src={coinLogo(pair.symbol)} src2={coinLogoFallback(pair.symbol)} label={pair.symbol} size={18} radius="50%" />
                                                    <div style={{ marginLeft: 6 }}>
                                                        <span className="tm-pair-dropdown-symbol">{pair.symbol}</span>
                                                        <span className="tm-pair-dropdown-suffix">/USDT</span>
                                                        <div style={{ fontSize: 10, color: '#71717a' }}>{pair.price > 0 ? `$${pair.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : ''}</div>
                                                    </div>
                                                </div>
                                                <span className="tm-pair-dropdown-price">{pair.priceStr}</span>
                                                <span className={`tm-pair-dropdown-change ${pair.positive ? 'positive' : 'negative'}`}>{pair.change}</span>
                                            </div>
                                        ))
                                    }
                                    {/* ── Stocks ── */}
                                    {marketCategory === 'stocks' && STOCK_PAIRS
                                        .filter(p => !pairSearch || p.symbol.toLowerCase().includes(pairSearch.toLowerCase()) || p.name.toLowerCase().includes(pairSearch.toLowerCase()))
                                        .map((item, i) => {
                                            const pd = nonCryptoPrices[item.yahooSymbol]
                                            const isActive = activeYahooSymbol === item.yahooSymbol
                                            return (
                                                <div
                                                    key={i}
                                                    className={`tm-pair-dropdown-item ${isActive ? 'active' : ''}`}
                                                    onClick={() => { localStorage.setItem('dw_spot_yahoo_symbol', item.yahooSymbol); localStorage.setItem('dw_spot_noncrypto_name', item.name); localStorage.setItem('dw_spot_noncrypto_symbol', item.symbol); setActiveYahooSymbol(item.yahooSymbol); setActiveNonCryptoName(item.name); setActiveNonCryptoSymbol(item.symbol); setShowMobilePairDropdown(false); setPairSearch('') }}
                                                >
                                                    <div className="tm-pair-dropdown-name">
                                                        <AssetIcon src={stockLogo(item.symbol)} label={item.symbol} size={18} radius={4} />
                                                        <div style={{ marginLeft: 6 }}>
                                                            <span className="tm-pair-dropdown-symbol">{item.symbol}</span>
                                                            <div style={{ fontSize: 10, color: '#71717a' }}>{item.name}</div>
                                                        </div>
                                                    </div>
                                                    <span className="tm-pair-dropdown-price">{pd ? `$${pd.price.toFixed(2)}` : 'Loading...'}</span>
                                                    <span className={`tm-pair-dropdown-change ${!pd || pd.change >= 0 ? 'positive' : 'negative'}`}>{pd ? `${pd.change >= 0 ? '+' : ''}${pd.change.toFixed(2)}%` : '...'}</span>
                                                </div>
                                            )
                                        })
                                    }
                                    {/* ── Commodities ── */}
                                    {marketCategory === 'commodities' && COMMODITY_PAIRS
                                        .filter(p => !pairSearch || p.symbol.toLowerCase().includes(pairSearch.toLowerCase()) || p.name.toLowerCase().includes(pairSearch.toLowerCase()))
                                        .map((item, i) => {
                                            const pd = nonCryptoPrices[item.yahooSymbol]
                                            const isActive = activeYahooSymbol === item.yahooSymbol
                                            return (
                                                <div
                                                    key={i}
                                                    className={`tm-pair-dropdown-item ${isActive ? 'active' : ''}`}
                                                    onClick={() => { localStorage.setItem('dw_spot_yahoo_symbol', item.yahooSymbol); localStorage.setItem('dw_spot_noncrypto_name', item.name); localStorage.setItem('dw_spot_noncrypto_symbol', item.symbol); setActiveYahooSymbol(item.yahooSymbol); setActiveNonCryptoName(item.name); setActiveNonCryptoSymbol(item.symbol); setShowMobilePairDropdown(false); setPairSearch('') }}
                                                >
                                                    <div className="tm-pair-dropdown-name">
                                                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: item.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{item.emoji}</span>
                                                        <div style={{ marginLeft: 6 }}>
                                                            <span className="tm-pair-dropdown-symbol">{item.symbol}</span>
                                                            <div style={{ fontSize: 10, color: '#71717a' }}>{item.name}</div>
                                                        </div>
                                                    </div>
                                                    <span className="tm-pair-dropdown-price">{pd ? `$${pd.price.toFixed(2)}` : 'Loading...'}</span>
                                                    <span className={`tm-pair-dropdown-change ${!pd || pd.change >= 0 ? 'positive' : 'negative'}`}>{pd ? `${pd.change >= 0 ? '+' : ''}${pd.change.toFixed(2)}%` : '...'}</span>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        )}
                        {showMobilePairDropdown && (
                            <div className="tm-pair-dropdown-backdrop" onClick={() => { setShowMobilePairDropdown(false); setPairSearch('') }} />
                        )}
                    </div>
                    <div className="tm-scroll-content">
                        <div className="tm-price-section-v3">
                            <div className="tm-price-main-v3">
                                <h1 className="tm-big-price-v3">${formatPrice(currentPrice)}</h1>
                                <span className={`tm-price-change-v3 ${change24h >= 0 ? '' : 'negative'}`}>
                                    {change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%
                                </span>
                            </div>
                            <div className="tm-stats-grid-v3">
                                <div className="tm-stat-row-v3">
                                    <div className="tm-stat-item-v3"><span className="tm-stat-lbl">24h High</span><span className="tm-stat-val">${formatPrice(high24h)}</span></div>
                                    <div className="tm-stat-item-v3"><span className="tm-stat-lbl">24h Vol ({selectedCoin})</span><span className="tm-stat-val">{volume24h > 1e6 ? `${(volume24h / 1e6).toFixed(2)}M` : volume24h > 0 ? volume24h.toLocaleString(undefined, {maximumFractionDigits:2}) : '...'}</span></div>
                                </div>
                                <div className="tm-stat-row-v3">
                                    <div className="tm-stat-item-v3"><span className="tm-stat-lbl">24h Low</span><span className="tm-stat-val">${formatPrice(low24h)}</span></div>
                                    <div className="tm-stat-item-v3"><span className="tm-stat-lbl">24h Vol (USDT)</span><span className="tm-stat-val">{quoteVol24h > 1e9 ? `${(quoteVol24h / 1e9).toFixed(2)}B` : quoteVol24h > 1e6 ? `${(quoteVol24h / 1e6).toFixed(2)}M` : quoteVol24h > 0 ? quoteVol24h.toLocaleString(undefined,{maximumFractionDigits:0}) : '...'}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="tm-info-banner-v3">
                            <div className="tm-info-left-v3">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C0A3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                                <span>Mark Price</span>
                                <span className="tm-val-white">${formatPrice(currentPrice)}</span>
                            </div>
                            <div className="tm-info-right-v3"><span>Funding</span><span className={fundingRate >= 0 ? 'tm-val-white' : 'tm-val-red'}>{fundingRate >= 0 ? '+' : ''}{fundingRate.toFixed(4)}%</span></div>
                        </div>
                        <>
                        <div className="tm-chart-toolbar-v3">
                            <div className="tm-toolbar-left-v3">
                                {timeframes.map(tf => (<span key={tf} className={`tm-tf-v3 ${selectedTimeframe === tf ? 'active' : ''}`} onClick={() => setSelectedTimeframe(tf)} style={{ cursor: 'pointer' }}>{tf}</span>))}
                                <ChevronDown size={14} className="tm-tf-arrow" />
                            </div>
                            <div className="tm-toolbar-right-v3">
                                {marketCategory === 'crypto' && <span className="tm-depth-lbl">Depth</span>}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tm-tool-icon"><path d="M3 18v-6l4-4 4 4 4-4 6 6v6H3z" /></svg>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tm-tool-icon" onClick={() => setShowOptionsOverlay(true)}><path d="M6 3v12M12 9v12M18 3v6" /></svg>
                                <Settings size={20} className="tm-tool-icon" onClick={() => setShowLineOverlay(true)} />
                            </div>
                        </div>
                        <div className="tm-chart-area-v3">
                            <div className="tm-ohlc-v3">
                                <span>High: <span className={ohlcData.change >= 0 ? 'tm-green-text' : 'tm-red-text'}>{formatPrice(ohlcData.high)}</span></span>
                                <span>Low: <span className={ohlcData.change >= 0 ? 'tm-green-text' : 'tm-red-text'}>{formatPrice(ohlcData.low)}</span></span>
                                <span>Close: <span className={ohlcData.change >= 0 ? 'tm-green-text' : 'tm-red-text'}>{formatPrice(ohlcData.close)}</span></span>
                                <span>CHANGE: <span className={ohlcData.change >= 0 ? 'tm-green-text' : 'tm-red-text'}>{ohlcData.change.toFixed(2)}%</span></span>
                            </div>
                            <div ref={mobileChartContainerRef} className="tm-main-chart-v3" />
                            <div className="tm-chart-price-label-v3">{formatPrice(currentPrice)}</div>
                        </div>
                        <div className="tm-footer-time-v3">
                            <div className="tm-time-val-v3">{new Date().toLocaleTimeString()}</div>
                        </div>
                        {marketCategory === 'crypto' && (
                        <div className="tm-ob-section-v3">
                            <div className="tm-ob-tabs-v3">
                                <div className={`tm-ob-tab-v3 ${mobileObTab === 'orderbook' ? 'active' : ''}`} onClick={() => setMobileObTab('orderbook')}>Order book</div>
                                <div className={`tm-ob-tab-v3 ${mobileObTab === 'trades' ? 'active' : ''}`} onClick={() => setMobileObTab('trades')}>Market Trades</div>
                            </div>
                            <div className="tm-ob-grid-v3">
                                <div className="tm-ob-col-v3">
                                    {bidOrders.slice(0, 10).map((order, i) => (
                                        <div key={i} className="tm-ob-row-v3">
                                            <span className="tm-ob-p-v3">{formatPrice(order.price)}</span>
                                            <span className="tm-ob-v-v3 green">{order.amount.toFixed(5)}</span>
                                            <div className="tm-ob-depth-v3 green" style={{ width: `${Math.min(order.total / (bidOrders[0]?.total || 1) * 80, 100)}%` }}></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="tm-ob-col-v3">
                                    {askOrders.slice(0, 10).map((order, i) => (
                                        <div key={i} className="tm-ob-row-v3 text-right">
                                            <span className="tm-ob-p-v3">{formatPrice(order.price)}</span>
                                            <span className="tm-ob-v-v3 red">{order.amount.toFixed(5)}</span>
                                            <div className="tm-ob-depth-v3 red" style={{ width: `${Math.min(order.total / (askOrders[0]?.total || 1) * 80, 100)}%` }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}
                        </>
                        <div style={{ padding: '16px 16px 20px', marginTop: 8, borderTop: '1px solid #1a1a24' }}>
                            {/* Available + Max */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ color: '#71717A', fontSize: 12 }}>Available</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{userBalance.toFixed(2)} USDT</span>
                                    <span style={{ color: '#00C0A3', fontSize: 16, cursor: 'pointer', lineHeight: 1 }} onClick={() => navigate('/dashboard/deposit')}>+</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span style={{ color: '#71717A', fontSize: 12 }}>Max buy</span>
                                <span style={{ color: '#a1a1aa', fontSize: 12 }}>{currentPrice > 0 ? (userBalance / currentPrice).toFixed(6) : (high24h > 0 ? (0 / high24h).toFixed(6) : '0.000000')} {selectedCoin}</span>
                            </div>

                            {/* Order Type Toggle */}
                            <div style={{ display: 'flex', background: '#1a1a24', borderRadius: 8, padding: 3, marginBottom: 12, gap: 2 }}>
                                {(['limit', 'market'] as const).map(t => (
                                    <button key={t} onClick={() => setOrderType(t)}
                                        style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            background: orderType === t ? '#2a2a3a' : 'transparent',
                                            color: orderType === t ? '#fff' : '#71717A' }}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Price Field */}
                            {orderType === 'limit' && (
                                <div style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', background: '#1a1a24', borderRadius: 10, padding: '10px 12px', alignItems: 'center', border: '1px solid #2a2a34', gap: 8 }}>
                                        <button onClick={() => { const p = parseFloat(tradePrice) || currentPrice; if (p > 0.01) setTradePrice((p - (p >= 1000 ? 1 : 0.01)).toFixed(p >= 1000 ? 2 : 4)) }}
                                            style={{ background: '#2a2a3a', border: 'none', color: '#fff', borderRadius: 6, width: 28, height: 28, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>−</button>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ color: '#71717A', fontSize: 10, marginBottom: 2 }}>Price (USDT)</span>
                                            <input type="text" inputMode="decimal" value={tradePrice} onChange={e => handleNumericInput(e.target.value, setTradePrice)}
                                                placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : '0.00'}
                                                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none', textAlign: 'center', width: '100%', fontWeight: 600 }} />
                                        </div>
                                        <button onClick={() => { const p = parseFloat(tradePrice) || currentPrice; setTradePrice((p + (p >= 1000 ? 1 : 0.01)).toFixed(p >= 1000 ? 2 : 4)) }}
                                            style={{ background: '#2a2a3a', border: 'none', color: '#00C0A3', borderRadius: 6, width: 28, height: 28, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>+</button>
                                    </div>
                                </div>
                            )}
                            {orderType === 'market' && (
                                <div style={{ marginBottom: 10, display: 'flex', background: '#1a1a24', borderRadius: 10, padding: '10px 12px', alignItems: 'center', border: '1px solid #2a2a34', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#71717A', fontSize: 12 }}>Price (USDT)</span>
                                    <span style={{ color: '#10b981', fontSize: 15, fontWeight: 600 }}>{currentPrice > 0 ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : high24h > 0 ? high24h.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2}) : 'Loading...'}</span>
                                </div>
                            )}

                            {/* Amount BTC Field */}
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', background: '#1a1a24', borderRadius: 10, padding: '10px 12px', alignItems: 'center', border: '1px solid #2a2a34', gap: 8 }}>
                                    <button onClick={() => { const a = parseFloat(tradeAmount) || 0; if (a > 0.0001) setTradeAmount((a - 0.0001).toFixed(6)) }}
                                        style={{ background: '#2a2a3a', border: 'none', color: '#fff', borderRadius: 6, width: 28, height: 28, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>−</button>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ color: '#71717A', fontSize: 10, marginBottom: 2 }}>Amount ({selectedCoin})</span>
                                        <input type="text" inputMode="decimal" value={tradeAmount} onChange={e => handleNumericInput(e.target.value, setTradeAmount)}
                                            placeholder="0.00"
                                            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 15, outline: 'none', textAlign: 'center', width: '100%', fontWeight: 600 }} />
                                    </div>
                                    <button onClick={() => { const a = parseFloat(tradeAmount) || 0; setTradeAmount((a + 0.0001).toFixed(6)) }}
                                        style={{ background: '#2a2a3a', border: 'none', color: '#00C0A3', borderRadius: 6, width: 28, height: 28, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>+</button>
                                </div>
                            </div>

                            {/* Percentage Slider */}
                            {(() => {
                                const pctVal = currentPrice > 0 && userBalance > 0 ? Math.min(100, Math.round((parseFloat(tradeAmount) || 0) * currentPrice / userBalance * 100)) : 0
                                const setPct = (p: number) => { if (currentPrice > 0 && userBalance > 0) setTradeAmount(((userBalance * p / 100) / currentPrice).toFixed(6)); else if (currentPrice > 0) setTradeAmount('0.000000') }
                                return (
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ position: 'relative', height: 44, display: 'flex', alignItems: 'center' }}>
                                        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: '#2a2a3a', borderRadius: 2, top: '50%', transform: 'translateY(-50%)' }}>
                                            <div style={{ position: 'absolute', left: 0, width: `${pctVal}%`, height: '100%', background: '#00C0A3', borderRadius: 2 }} />
                                            <div style={{ position: 'absolute', left: `${pctVal}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 16, height: 16, borderRadius: '50%', background: '#00C0A3', border: '2px solid #fff', boxShadow: '0 0 6px rgba(0,192,163,0.7)', pointerEvents: 'none', zIndex: 1 }} />
                                            {[0,25,50,75,100].map(n => <div key={n} style={{ position: 'absolute', left: `${n}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: pctVal >= n ? '#00C0A3' : '#3a3a4a', pointerEvents: 'none' }} />)}
                                        </div>
                                        <input type="range" min={0} max={100} step={1} value={pctVal}
                                            style={{ position: 'absolute', width: '100%', height: 44, opacity: 0, cursor: 'pointer', margin: 0, padding: 0, zIndex: 2, WebkitAppearance: 'none', appearance: 'none' }}
                                            onChange={e => setPct(Number(e.target.value))} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                        {[0,25,50,75,100].map(n => <span key={n} onClick={() => setPct(n)} style={{ color: pctVal >= n ? '#00C0A3' : '#52525b', fontSize: 10, cursor: 'pointer' }}>{n}%</span>)}
                                    </div>
                                </div>
                                )
                            })()}

                            {/* Total USDT Field */}
                            <div style={{ display: 'flex', background: '#1a1a24', borderRadius: 10, padding: '10px 12px', alignItems: 'center', border: '1px solid #2a2a34', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: '#71717A', fontSize: 12 }}>Total (USDT)</span>
                                <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{tradeTotal || '0.00'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="tm-action-bar-v3">
                        <button className="tm-buy-btn-v3" onClick={() => handleTrade('buy')} disabled={submittingSide !== null}>{submittingSide === 'buy' ? 'Processing...' : 'Buy'}</button>
                        <button className="tm-sell-btn-v3" onClick={() => handleTrade('sell')} disabled={submittingSide !== null}>{submittingSide === 'sell' ? 'Processing...' : 'Sell'}</button>
                    </div>
                    {showOptionsOverlay && (
                        <div className="tm-overlay-v3" onClick={() => setShowOptionsOverlay(false)}>
                            <div className="tm-overlay-content-v3" onClick={e => e.stopPropagation()}>
                                <div className="tm-overlay-header-v3"><span className="tm-overlay-title">Options</span><button className="tm-close-overlay" onClick={() => setShowOptionsOverlay(false)}>{"\u2715"}</button></div>
                                <div className="tm-overlay-list-v3">
                                    {['Quick order', 'Open order', 'TP/SL', 'Positions', 'Order history'].map(opt => (
                                        <div key={opt} className="tm-overlay-item-v3" onClick={() => { setOptionType(opt); setShowOptionsOverlay(false) }}>
                                            <div className={`tm-radio-v3 ${optionType === opt ? 'active' : ''}`}></div><span>{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {showLineOverlay && (
                        <div className="tm-overlay-v3" onClick={() => setShowLineOverlay(false)}>
                            <div className="tm-overlay-content-v3" onClick={e => e.stopPropagation()}>
                                <div className="tm-overlay-header-v3"><span className="tm-overlay-title">Line</span><button className="tm-close-overlay" onClick={() => setShowLineOverlay(false)}>{"\u2715"}</button></div>
                                <div className="tm-overlay-list-v3">
                                    {['Candles', 'Bars', 'Area', 'Heiken Aishi', 'Baseline', 'High low', 'Column'].map(type => (
                                        <div key={type} className="tm-overlay-item-v3" onClick={() => { setLineType(type); setShowLineOverlay(false) }}>
                                            <div className={`tm-radio-v3 ${lineType === type ? 'active' : ''}`}></div><span>{type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="desktop-only">
                <div className="spot-terminal">
                    <div className="spot-main-grid-v2">
                        <div className="spot-pairs-sidebar-v2">
                            {/* Selected asset header with real logo */}
                            <div className="spot-pair-header-v2">
                                <div className="spot-pair-header-left">
                                    <div className="spot-pair-icon-v2" style={{ overflow: 'hidden', borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {marketCategory === 'crypto'
                                            ? <AssetIcon src={coinLogo(selectedCoin)} src2={coinLogoFallback(selectedCoin)} label={selectedCoin} size={32} radius="50%" />
                                            : marketCategory === 'stocks'
                                                ? <AssetIcon src={stockLogo(activeYahooSymbol)} label={activeYahooSymbol} size={32} radius={6} />
                                                : (() => { const c = COMMODITY_PAIRS.find(p => p.yahooSymbol === activeYahooSymbol); return <span style={{ width: 32, height: 32, borderRadius: '50%', background: c?.color ?? '#4a4a6a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c?.emoji ?? '📦'}</span> })()
                                        }
                                    </div>
                                    <div className="spot-pair-info-v2">
                                        <span className="spot-pair-title-v2">{marketCategory === 'crypto' ? <>{selectedCoin} <span className="spot-pair-slash">/USDT</span></> : activeNonCryptoName}</span>
                                        <span className="spot-pair-subtitle-v2">{marketCategory === 'crypto' ? COIN_NAMES[selectedCoin] : (marketCategory === 'stocks' ? 'Stock' : 'Commodity')}</span>
                                    </div>
                                </div>
                                <div className="spot-pair-header-right">
                                    <span className="spot-pair-price-main">${formatPrice(currentPrice)}</span>
                                    <span className={`spot-pair-price-sub ${change24h >= 0 ? 'positive' : 'negative'}`}>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}%</span>
                                </div>
                            </div>
                            {/* Search bar */}
                            <div className="spot-pairs-search-v2">
                                <Search size={16} className="spot-search-icon-v2" />
                                <input type="text" placeholder="Search" className="spot-search-input-v2" value={pairSearch} onChange={e => setPairSearch(e.target.value)} />
                            </div>
                            {/* Category tabs — after search bar */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', marginBottom: 2 }}>
                                {(['crypto', 'stocks', 'commodities'] as const).map(cat => (
                                    <button key={cat} onClick={() => { setPairSearch(''); localStorage.setItem('dw_spot_category', cat); setMarketCategory(cat); if (cat !== 'crypto') { const first = cat === 'stocks' ? STOCK_PAIRS[0] : COMMODITY_PAIRS[0]; localStorage.setItem('dw_spot_yahoo_symbol', first.yahooSymbol); localStorage.setItem('dw_spot_noncrypto_name', first.name); localStorage.setItem('dw_spot_noncrypto_symbol', first.symbol); setActiveYahooSymbol(first.yahooSymbol); setActiveNonCryptoName(first.name); setActiveNonCryptoSymbol(first.symbol) } }} style={{ flex: 1, background: marketCategory === cat ? '#2563eb' : 'transparent', color: marketCategory === cat ? '#fff' : '#9ca3af', border: 'none', padding: '7px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', letterSpacing: 0.4, borderRadius: 0 }}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </button>
                                ))}
                            </div>
                            {marketCategory === 'crypto' && (
                                <div className="spot-pairs-tabs-v2">
                                    <button className={`spot-pairs-tab-v2 ${pairsTab === 'usdt' ? 'active' : ''}`} onClick={() => setPairsTab('usdt')}><Star size={12} /> USDT</button>
                                    <button className={`spot-pairs-tab-v2 ${pairsTab === 'grid' ? 'active' : ''}`} onClick={() => setPairsTab('grid')}>Grid</button>
                                </div>
                            )}
                            <div className="spot-pairs-header-v2">
                                <span className="spot-pairs-col-v2">Name <ChevronDown size={10} /></span>
                                <span className="spot-pairs-col-v2">Price <ChevronDown size={10} /></span>
                                <span className="spot-pairs-col-v2">24h<br />change <ChevronDown size={10} /></span>
                            </div>
                            <div className="spot-pairs-list-v2">
                                {/* ── Crypto ── */}
                                {marketCategory === 'crypto' && tradingPairs.filter(p => !pairSearch || p.symbol.toLowerCase().includes(pairSearch.toLowerCase()) || p.name.toLowerCase().includes(pairSearch.toLowerCase())).map((pair, i) => (
                                    <div key={i} className={`spot-pairs-row-v2 ${pair.fullPair === selectedPair ? 'active' : ''}`} onClick={() => handleSelectPair(pair.fullPair)} style={{ cursor: 'pointer' }}>
                                        <div className="spot-pairs-name-v2" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <AssetIcon src={coinLogo(pair.symbol)} src2={coinLogoFallback(pair.symbol)} label={pair.symbol} size={18} radius="50%" />
                                            <div><span className="spot-symbol-v2">{pair.symbol}</span><span className="spot-pair-suffix-v2">/{pair.pair}</span></div>
                                        </div>
                                        <span className="spot-pairs-price-v2">{pair.priceStr}</span>
                                        <span className={`spot-pairs-change-v2 ${pair.positive ? 'positive' : 'negative'}`}>{pair.change}</span>
                                    </div>
                                ))}
                                {/* ── Stocks ── */}
                                {marketCategory === 'stocks' && STOCK_PAIRS.filter(p => !pairSearch || p.symbol.toLowerCase().includes(pairSearch.toLowerCase()) || p.name.toLowerCase().includes(pairSearch.toLowerCase())).map((item, i) => {
                                    const pd = nonCryptoPrices[item.yahooSymbol]
                                    const isActive = activeYahooSymbol === item.yahooSymbol
                                    return (
                                        <div key={i} className={`spot-pairs-row-v2 ${isActive ? 'active' : ''}`} onClick={() => { localStorage.setItem('dw_spot_yahoo_symbol', item.yahooSymbol); localStorage.setItem('dw_spot_noncrypto_name', item.name); localStorage.setItem('dw_spot_noncrypto_symbol', item.symbol); setActiveYahooSymbol(item.yahooSymbol); setActiveNonCryptoName(item.name); setActiveNonCryptoSymbol(item.symbol) }} style={{ cursor: 'pointer' }}>
                                            <div className="spot-pairs-name-v2" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <AssetIcon src={stockLogo(item.symbol)} label={item.symbol} size={20} radius={4} />
                                                <div><span className="spot-symbol-v2">{item.symbol}</span></div>
                                            </div>
                                            <span className="spot-pairs-price-v2">{pd ? `$${pd.price.toFixed(2)}` : '...'}</span>
                                            <span className={`spot-pairs-change-v2 ${!pd || pd.change >= 0 ? 'positive' : 'negative'}`}>{pd ? `${pd.change >= 0 ? '+' : ''}${pd.change.toFixed(2)}%` : '...'}</span>
                                        </div>
                                    )
                                })}
                                {/* ── Commodities ── */}
                                {marketCategory === 'commodities' && COMMODITY_PAIRS.filter(p => !pairSearch || p.symbol.toLowerCase().includes(pairSearch.toLowerCase()) || p.name.toLowerCase().includes(pairSearch.toLowerCase())).map((item, i) => {
                                    const pd = nonCryptoPrices[item.yahooSymbol]
                                    const isActive = activeYahooSymbol === item.yahooSymbol
                                    return (
                                        <div key={i} className={`spot-pairs-row-v2 ${isActive ? 'active' : ''}`} onClick={() => { localStorage.setItem('dw_spot_yahoo_symbol', item.yahooSymbol); localStorage.setItem('dw_spot_noncrypto_name', item.name); localStorage.setItem('dw_spot_noncrypto_symbol', item.symbol); setActiveYahooSymbol(item.yahooSymbol); setActiveNonCryptoName(item.name); setActiveNonCryptoSymbol(item.symbol) }} style={{ cursor: 'pointer' }}>
                                            <div className="spot-pairs-name-v2" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <span style={{ width: 20, height: 20, borderRadius: '50%', background: item.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{item.emoji}</span>
                                                <div><span className="spot-symbol-v2">{item.symbol}</span></div>
                                            </div>
                                            <span className="spot-pairs-price-v2">{pd ? `$${pd.price.toFixed(2)}` : '...'}</span>
                                            <span className={`spot-pairs-change-v2 ${!pd || pd.change >= 0 ? 'positive' : 'negative'}`}>{pd ? `${pd.change >= 0 ? '+' : ''}${pd.change.toFixed(2)}%` : '...'}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="spot-center-panel-v2">
                            <div className="spot-chart-section-v2">
                                <div className="spot-chart-header-v2">
                                    <div className="spot-chart-tabs-v2">
                                        <span className={`spot-chart-tab-v2 ${chartTab === 'chart' ? 'active' : ''}`} onClick={() => setChartTab('chart')}>Chart</span>
                                        <span className={`spot-chart-tab-v2 ${chartTab === 'info' ? 'active' : ''}`} onClick={() => setChartTab('info')}>Info</span>
                                    </div>
                                    <div className="spot-timeframes-v2">
                                        {timeframes.map(tf => (<span key={tf} className={`spot-tf-item-v2 ${selectedTimeframe === tf ? 'highlight' : ''}`} onClick={() => setSelectedTimeframe(tf)} style={{ cursor: 'pointer' }}>{tf}</span>))}
                                        <span className="spot-tf-divider-v2"></span>
                                        <BarChart3 size={14} className="text-zinc-500 cursor-pointer" />
                                        <Maximize2 size={14} className="text-zinc-500 cursor-pointer" />
                                    </div>
                                    <div className="spot-view-tabs-v2">
                                        <span className="spot-view-tab-v2 active">Original</span>
                                        <span className="spot-view-tab-v2" onClick={() => navigate('/dashboard/advance-trade')} style={{ cursor: 'pointer' }}>Trading View</span>
                                        <span className="spot-view-tab-v2">Depth</span>
                                    </div>
                                </div>
                                <div className="spot-chart-container-v2">
                                    <div className="spot-chart-info-v2">
                                        <div className="ohlc-v2">
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
                            <div className="spot-trade-form-section-v2">
                                <div className="spot-trade-type-tabs-v2">
                                    <span className={`spot-trade-type-tab-v2 ${tradeType === 'spot' ? 'active' : ''}`} onClick={() => setTradeType('spot')}>Spot</span>
                                    <span className={`spot-trade-type-tab-v2 ${tradeType === 'grid' ? 'active' : ''}`} onClick={() => setTradeType('grid')}>Grid</span>
                                </div>
                                <div className="spot-order-header-v2">
                                    <div className="spot-order-types-v2">
                                        <span className={`spot-order-type-v2 ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>Limit</span>
                                        <span className={`spot-order-type-v2 ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>Market</span>
                                        <span className={`spot-order-type-v2 ${orderType === 'stop' ? 'active' : ''}`} onClick={() => setOrderType('stop')}>Stop-limit</span>
                                        <Info size={14} className="text-zinc-500" />
                                    </div>
                                    <div className="spot-order-actions-v2">
                                        <button className="spot-action-pill-v2" onClick={() => navigate('/dashboard/deposit')}>Deposit</button>
                                        <button className="spot-action-pill-v2" onClick={() => navigate('/dashboard/withdraw')}>Withdraw</button>
                                    </div>
                                </div>
                                <div className="spot-trade-forms-grid-v2">
                                    <div className="spot-form-column-v2">
                                        <div className="spot-balance-row-v2"><span>Avbl</span><span className="balance-value">{userBalance.toFixed(2)} USDT</span></div>
                                        {orderType !== 'market' && (<div className="spot-input-group-v2">
                                            <span className="spot-input-label-v2">Price</span>
                                            <input type="text" inputMode="decimal" className="spot-input-field-v2" value={tradePrice} onChange={e => handleNumericInput(e.target.value, setTradePrice)} placeholder="0.00" />
                                            <span className="spot-input-unit-v2">USDT</span>
                                        </div>)}
                                        <div className="spot-input-group-v2">
                                            <span className="spot-input-label-v2">Amount</span>
                                            <input type="text" inputMode="decimal" className="spot-input-field-v2" value={tradeAmount} onChange={e => handleNumericInput(e.target.value, setTradeAmount)} placeholder="0.00" />
                                            <span className="spot-input-unit-v2">{selectedCoin}</span>
                                        </div>
                                        {(() => {
                                            const pctVal = currentPrice > 0 && userBalance > 0 ? Math.min(100, Math.round((parseFloat(tradeAmount) || 0) * currentPrice / userBalance * 100)) : 0
                                            const setPct = (p: number) => { if (currentPrice > 0 && userBalance > 0) setTradeAmount(((userBalance * p / 100) / currentPrice).toFixed(6)); else if (currentPrice > 0) setTradeAmount('0.000000') }
                                            return (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: '#2a2a3a', borderRadius: 2 }}>
                                                        <div style={{ position: 'absolute', left: 0, width: `${pctVal}%`, height: '100%', background: '#00C0A3', borderRadius: 2 }} />
                                                        <div style={{ position: 'absolute', left: `${pctVal}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#00C0A3', border: '2px solid #fff', boxShadow: '0 0 4px rgba(0,192,163,0.5)', pointerEvents: 'none', zIndex: 1 }} />
                                                        {[0,25,50,75,100].map(n => <div key={n} style={{ position: 'absolute', left: `${n}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: pctVal >= n ? '#00C0A3' : '#3a3a4a', pointerEvents: 'none' }} />)}
                                                    </div>
                                                    <input type="range" min={0} max={100} step={1} value={pctVal}
                                                        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0, padding: 0, zIndex: 2 }}
                                                        onChange={e => setPct(Number(e.target.value))} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                    {[0,25,50,75,100].map(n => <span key={n} onClick={() => setPct(n)} style={{ color: pctVal >= n ? '#00C0A3' : '#52525b', fontSize: 10, cursor: 'pointer' }}>{n}%</span>)}
                                                </div>
                                            </div>
                                            )
                                        })()}
                                        <div className="spot-input-group-v2">
                                            <span className="spot-input-label-v2">Total</span>
                                            <input type="text" inputMode="decimal" className="spot-input-field-v2" value={tradeTotal} readOnly placeholder="0.00" />
                                            <span className="spot-input-unit-v2">USDT</span>
                                        </div>
                                        <button className="spot-main-btn buy" onClick={() => handleTrade('buy')} disabled={submittingSide !== null}>{submittingSide === 'buy' ? 'Processing...' : `Buy ${selectedCoin}`}</button>
                                    </div>
                                    <div className="spot-form-column-v2">
                                        <div className="spot-balance-row-v2"><span>Avbl</span><span className="balance-value">{userBalance.toFixed(2)} USDT</span></div>
                                        {orderType !== 'market' && (<div className="spot-input-group-v2">
                                            <span className="spot-input-label-v2">Price</span>
                                            <input type="text" inputMode="decimal" className="spot-input-field-v2" value={tradePrice} onChange={e => handleNumericInput(e.target.value, setTradePrice)} placeholder="0.00" />
                                            <span className="spot-input-unit-v2">USDT</span>
                                        </div>)}
                                        <div className="spot-input-group-v2">
                                            <span className="spot-input-label-v2">Amount</span>
                                            <input type="text" inputMode="decimal" className="spot-input-field-v2" value={tradeAmount} onChange={e => handleNumericInput(e.target.value, setTradeAmount)} placeholder="0.00" />
                                            <span className="spot-input-unit-v2">{selectedCoin}</span>
                                        </div>
                                        {(() => {
                                            const pctVal = currentPrice > 0 && userBalance > 0 ? Math.min(100, Math.round((parseFloat(tradeAmount) || 0) * currentPrice / userBalance * 100)) : 0
                                            const setPct = (p: number) => { if (currentPrice > 0 && userBalance > 0) setTradeAmount(((userBalance * p / 100) / currentPrice).toFixed(6)); else if (currentPrice > 0) setTradeAmount('0.000000') }
                                            return (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: '#2a2a3a', borderRadius: 2 }}>
                                                        <div style={{ position: 'absolute', left: 0, width: `${pctVal}%`, height: '100%', background: '#00C0A3', borderRadius: 2 }} />
                                                        <div style={{ position: 'absolute', left: `${pctVal}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#00C0A3', border: '2px solid #fff', boxShadow: '0 0 4px rgba(0,192,163,0.5)', pointerEvents: 'none', zIndex: 1 }} />
                                                        {[0,25,50,75,100].map(n => <div key={n} style={{ position: 'absolute', left: `${n}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: pctVal >= n ? '#00C0A3' : '#3a3a4a', pointerEvents: 'none' }} />)}
                                                    </div>
                                                    <input type="range" min={0} max={100} step={1} value={pctVal}
                                                        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0, padding: 0, zIndex: 2 }}
                                                        onChange={e => setPct(Number(e.target.value))} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                    {[0,25,50,75,100].map(n => <span key={n} onClick={() => setPct(n)} style={{ color: pctVal >= n ? '#00C0A3' : '#52525b', fontSize: 10, cursor: 'pointer' }}>{n}%</span>)}
                                                </div>
                                            </div>
                                            )
                                        })()}
                                        <div className="spot-input-group-v2">
                                            <span className="spot-input-label-v2">Total</span>
                                            <input type="text" inputMode="decimal" className="spot-input-field-v2" value={tradeTotal} readOnly placeholder="0.00" />
                                            <span className="spot-input-unit-v2">USDT</span>
                                        </div>
                                        <button className="spot-main-btn sell" onClick={() => handleTrade('sell')} disabled={submittingSide !== null}>{submittingSide === 'sell' ? 'Processing...' : `Sell ${selectedCoin}`}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="spot-orderbook-panel-v2">
                            <div className="spot-ob-header-v2">
                                <div className="spot-ob-header-left"><div className="spot-ob-tabs-v2">
                                    <span className={`spot-ob-tab-v2 ${obTab === 'orderbooks' ? 'active' : ''}`} onClick={() => setObTab('orderbooks')}>Orderbooks</span>
                                    <span className={`spot-ob-tab-v2 ${obTab === 'trades' ? 'active' : ''}`} onClick={() => setObTab('trades')}>Last trades</span>
                                </div></div>
                                <div className="spot-ob-menu-btn" onClick={() => navigate('/dashboard/advance-trade')}><div className="spot-ob-menu-dots"><span></span><span></span><span></span></div></div>
                            </div>
                            <div className="spot-ob-controls-v2">
                                <div className="spot-ob-view-btns-v2"><div className="spot-ob-view-btn-v2 both active"></div><div className="spot-ob-view-btn-v2 bids"></div><div className="spot-ob-view-btn-v2 asks"></div></div>
                                <div className="spot-ob-precision-v2">0.01 <ChevronDown size={10} /></div>
                            </div>
                            <div className="spot-ob-columns-v2"><span>Price(USDT)</span><span>Amount({selectedCoin})</span><span>Total</span></div>
                            <div className="spot-ob-list-v2 asks">
                                {askOrders.slice(0, 18).reverse().map((order, i) => (
                                    <div key={i} className="spot-ob-row-v2">
                                        <span className="price ask">{formatPrice(order.price)}</span>
                                        <span className="amount">{order.amount.toFixed(5)}</span>
                                        <span className="total">{order.total.toFixed(2)}</span>
                                        <div className="depth-bg-v2 ask" style={{ width: `${Math.min(order.total / (askOrders[0]?.total || 1) * 60, 100)}%` }}></div>
                                    </div>
                                ))}
                            </div>
                            <div className="spot-ob-spread-v2">
                                <span className="spot-ob-spread-price-v2">{formatPrice(currentPrice)}</span>
                                <span className="spot-ob-spread-arrow">{change24h >= 0 ? '\u2191' : '\u2193'}</span>
                                <span className="spot-ob-spread-fiat">\u2248${formatPrice(currentPrice)}</span>
                            </div>
                            <div className="spot-ob-list-v2 bids">
                                {bidOrders.slice(0, 12).map((order, i) => (
                                    <div key={i} className="spot-ob-row-v2">
                                        <span className="price bid">{formatPrice(order.price)}</span>
                                        <span className="amount">{order.amount.toFixed(5)}</span>
                                        <span className="total">{order.total.toFixed(2)}</span>
                                        <div className="depth-bg-v2 bid" style={{ width: `${Math.min(order.total / (bidOrders[0]?.total || 1) * 60, 100)}%` }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="spot-orders-panel">
                        <div className="spot-orders-header">
                            <div className="spot-orders-tabs">
                                <span className={`spot-orders-tab ${ordersTab === 'open' ? 'active' : ''}`} onClick={() => setOrdersTab('open')}>Open orders ({openTradesList.length})</span>
                                <span className={`spot-orders-tab ${ordersTab === 'history' ? 'active' : ''}`} onClick={() => setOrdersTab('history')}>Orders history</span>
                            </div>
                        </div>
                        {ordersTab === 'open' && openTradesList.length > 0 && (
                            <div style={{ padding: '8px 16px' }}>
                                <table style={{ width: '100%', fontSize: 12, color: '#a1a1aa' }}>
                                    <thead><tr style={{ borderBottom: '1px solid #1a1a24' }}>
                                        <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Pair</th>
                                        <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Side</th>
                                        <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Amount</th>
                                        <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Entry</th>
                                        <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>P&amp;L</th>
                                        <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Action</th>
                                    </tr></thead>
                                    <tbody>{openTradesList.map(trade => (
                                        <tr key={trade._id} style={{ borderBottom: '1px solid #0f0f14' }}>
                                            <td style={{ padding: '6px 0', color: '#fff' }}>{trade.asset}/USDT</td>
                                            <td style={{ padding: '6px 0', color: trade.side === 'buy' ? '#10b981' : '#ef4444' }}>{trade.side.toUpperCase()}</td>
                                            <td style={{ textAlign: 'right', padding: '6px 0' }}>{trade.amount}</td>
                                            <td style={{ textAlign: 'right', padding: '6px 0' }}>${formatPrice(trade.entryPrice)}</td>
                                            <td style={{ textAlign: 'right', padding: '6px 0', color: (trade.pnl || 0) >= 0 ? '#10b981' : '#ef4444' }}>${(trade.pnl || 0).toFixed(2)}</td>
                                            <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                                <button onClick={() => handleCloseTrade(trade._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Close</button>
                                            </td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}
                        {ordersTab === 'open' && openTradesList.length === 0 && (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: 13 }}>No open orders</div>
                        )}
                    </div>
                </div>
            </div>
            <SettingsSidebar isOpen={showSettingsSidebar} onClose={() => setShowSettingsSidebar(false)} />
        </Layout>
    )
}

