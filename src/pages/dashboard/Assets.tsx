"use client"
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Eye, EyeOff, ChevronDown, Search, ArrowLeft, X, Filter, MoreHorizontal, Star } from 'lucide-react'
import { getBalance, getCachedBalance, setCachedBalance, getSpotHoldings, getSpotTimestamps, getFuturesBalance, getSpotCostBasis, getLastKnownPrices, saveLastKnownPrices, getLocalBalanceAdjustment, resetLocalBalanceAdjustment, syncSpotHoldingsFromBackend } from '../../services/walletService'
import { getMarketPrices, getMyClosedTrades, getMyOpenTrades } from '../../services/tradeService'
import { STOCK_PAIRS, COMMODITY_PAIRS } from './Trade'
import Layout from '../../components/Layout/Layout'
import '../../styles/dashboard.css'
import '../../styles/assets.css'

const CG = 'https://assets.coingecko.com/coins/images'
const SPOT_COINS = [
    { symbol: 'BTC',   name: 'Bitcoin',           icon: '₿', color: '#f7931a', logoUrl: `${CG}/1/small/bitcoin.png` },
    { symbol: 'ETH',   name: 'Ethereum',           icon: 'Ξ', color: '#627eea', logoUrl: `${CG}/279/small/ethereum.png` },
    { symbol: 'BNB',   name: 'BNB',                icon: 'B', color: '#f3ba2f', logoUrl: `${CG}/825/small/bnb-icon2_2x.png` },
    { symbol: 'SOL',   name: 'Solana',             icon: 'S', color: '#9945ff', logoUrl: `${CG}/4128/small/solana.png` },
    { symbol: 'XRP',   name: 'Ripple',             icon: 'X', color: '#346aa9', logoUrl: `${CG}/44/small/xrp-symbol-white-128.png` },
    { symbol: 'DOGE',  name: 'Dogecoin',           icon: 'Ð', color: '#c2a633', logoUrl: `${CG}/5/small/dogecoin.png` },
    { symbol: 'ADA',   name: 'Cardano',            icon: 'A', color: '#0033ad', logoUrl: `${CG}/975/small/cardano.png` },
    { symbol: 'AVAX',  name: 'Avalanche',          icon: 'A', color: '#e84142', logoUrl: `${CG}/12559/small/Avalanche_Circle_RedWhite_Trans.png` },
    { symbol: 'DOT',   name: 'Polkadot',           icon: 'D', color: '#e6007a', logoUrl: `${CG}/12171/small/polkadot.png` },
    { symbol: 'MATIC', name: 'Polygon',            icon: 'M', color: '#8247e5', logoUrl: `${CG}/4713/small/matic-token-icon.png` },
    { symbol: 'LINK',  name: 'Chainlink',          icon: 'L', color: '#2a5ada', logoUrl: `${CG}/877/small/chainlink-new-logo.png` },
    { symbol: 'UNI',   name: 'Uniswap',            icon: 'U', color: '#ff007a', logoUrl: `${CG}/12504/small/uniswap-uni.png` },
    { symbol: 'SHIB',  name: 'Shiba Inu',          icon: 'S', color: '#ffa409', logoUrl: `${CG}/11939/small/shiba.png` },
    { symbol: 'LTC',   name: 'Litecoin',           icon: 'Ł', color: '#bfbbbb', logoUrl: `${CG}/2/small/litecoin.png` },
    { symbol: 'ATOM',  name: 'Cosmos',             icon: 'A', color: '#2e3148', logoUrl: `${CG}/1481/small/cosmos_hub.png` },
    { symbol: 'ETC',   name: 'Ethereum Classic',   icon: 'E', color: '#328332', logoUrl: `${CG}/453/small/ethereum-classic-logo.png` },
    { symbol: 'XLM',   name: 'Stellar',            icon: 'X', color: '#08b5e5', logoUrl: `${CG}/100/small/Stellar_symbol_black_RGB.png` },
    { symbol: 'NEAR',  name: 'NEAR Protocol',      icon: 'N', color: '#00c1de', logoUrl: `${CG}/10365/small/near.jpg` },
    { symbol: 'FIL',   name: 'Filecoin',           icon: 'F', color: '#0090ff', logoUrl: `${CG}/12817/small/filecoin.png` },
    { symbol: 'APT',   name: 'Aptos',              icon: 'A', color: '#4cd6a5', logoUrl: `${CG}/26455/small/aptos_round.png` },
    { symbol: 'ARB',   name: 'Arbitrum',           icon: 'A', color: '#28a0f0', logoUrl: `${CG}/16547/small/photo_2023-03-29_21.47.00.jpeg` },
    { symbol: 'OP',    name: 'Optimism',           icon: 'O', color: '#ff0420', logoUrl: `${CG}/25244/small/Optimism.png` },
    { symbol: 'SUI',   name: 'Sui',                icon: 'S', color: '#4da2ff', logoUrl: `${CG}/26375/small/sui_asset.jpeg` },
    { symbol: 'SEI',   name: 'Sei',                icon: 'S', color: '#9b1c2e', logoUrl: `${CG}/28205/small/Sei_Logo_-_Transparent.png` },
    { symbol: 'TIA',   name: 'Celestia',           icon: 'T', color: '#7b2bf9', logoUrl: `${CG}/31967/small/tia.jpg` },
    { symbol: 'INJ',   name: 'Injective',          icon: 'I', color: '#00f2fe', logoUrl: `${CG}/12882/small/Secondary_Symbol.png` },
    { symbol: 'FET',   name: 'Fetch.ai',           icon: 'F', color: '#1c1c3d', logoUrl: `${CG}/5681/small/Fetch.jpg` },
    { symbol: 'RNDR',  name: 'Render',             icon: 'R', color: '#e41968', logoUrl: `${CG}/11636/small/rndr.png` },
    { symbol: 'GRT',   name: 'The Graph',          icon: 'G', color: '#6747ed', logoUrl: `${CG}/13397/small/Graph_Token.png` },
    { symbol: 'IMX',   name: 'Immutable',          icon: 'I', color: '#00bfff', logoUrl: `${CG}/17233/small/immutableX-symbol-BLK-RGB.png` },
    { symbol: 'STX',   name: 'Stacks',             icon: 'S', color: '#5546ff', logoUrl: `${CG}/2069/small/Stacks_logo_full.png` },
    { symbol: 'ALGO',  name: 'Algorand',           icon: 'A', color: '#000000', logoUrl: `${CG}/4380/small/download.png` },
    { symbol: 'SAND',  name: 'The Sandbox',        icon: 'S', color: '#04adef', logoUrl: `${CG}/12129/small/sandbox_logo.jpg` },
    { symbol: 'MANA',  name: 'Decentraland',       icon: 'M', color: '#ff2d55', logoUrl: `${CG}/878/small/decentraland-mana.png` },
    { symbol: 'AXS',   name: 'Axie Infinity',      icon: 'A', color: '#0055d5', logoUrl: `${CG}/13029/small/axie_infinity_logo.png` },
    { symbol: 'GALA',  name: 'Gala',               icon: 'G', color: '#00d4ff', logoUrl: `${CG}/12493/small/GALA-COINGECKO.png` },
    { symbol: 'ENJ',   name: 'Enjin Coin',         icon: 'E', color: '#624dbf', logoUrl: `${CG}/1102/small/enjin-coin-logo.png` },
    { symbol: 'CHZ',   name: 'Chiliz',             icon: 'C', color: '#cd0124', logoUrl: `${CG}/8834/small/CHZ_Token_updated.png` },
    { symbol: 'CRV',   name: 'Curve DAO',          icon: 'C', color: '#f0e416', logoUrl: `${CG}/12124/small/Curve.png` },
    { symbol: 'AAVE',  name: 'Aave',               icon: 'A', color: '#b6509e', logoUrl: `${CG}/12645/small/AAVE.png` },
    { symbol: 'MKR',   name: 'Maker',              icon: 'M', color: '#1aab9b', logoUrl: `${CG}/1364/small/Mark_Maker.png` },
    { symbol: 'COMP',  name: 'Compound',           icon: 'C', color: '#00d395', logoUrl: `${CG}/10775/small/COMP.png` },
    { symbol: 'SNX',   name: 'Synthetix',          icon: 'S', color: '#00d1ff', logoUrl: `${CG}/3406/small/SNX.png` },
    { symbol: 'LDO',   name: 'Lido DAO',           icon: 'L', color: '#00a3ff', logoUrl: `${CG}/13573/small/Lido_DAO.png` },
    { symbol: 'RPL',   name: 'Rocket Pool',        icon: 'R', color: '#e37523', logoUrl: `${CG}/2090/small/rocket_pool_%28RPL%29.png` },
    { symbol: 'PENDLE',name: 'Pendle',             icon: 'P', color: '#0a6e5c', logoUrl: `${CG}/15069/small/Pendle_Logo_Normal-03.png` },
    { symbol: 'GMX',   name: 'GMX',                icon: 'G', color: '#3c33f5', logoUrl: `${CG}/18323/small/arbit.png` },
    { symbol: 'DYDX',  name: 'dYdX',              icon: 'D', color: '#6966ff', logoUrl: `${CG}/17500/small/hjnIm9bV.jpg` },
    { symbol: 'PEPE',  name: 'Pepe',               icon: 'P', color: '#009933', logoUrl: `${CG}/29850/small/pepe-token.jpeg` },
    { symbol: 'WIF',   name: 'dogwifhat',          icon: 'W', color: '#a0522d', logoUrl: `${CG}/33566/small/dogwifhat.jpg` },
    { symbol: 'BONK',  name: 'Bonk',               icon: 'B', color: '#f39c12', logoUrl: `${CG}/28600/small/bonk.jpg` },
    { symbol: 'FLOKI', name: 'Floki',              icon: 'F', color: '#d4a017', logoUrl: `${CG}/16746/small/PNG_image.png` },
    { symbol: 'ORDI',  name: 'ORDI',               icon: 'O', color: '#f7931a', logoUrl: `${CG}/30162/small/ordi.jpg` },
    { symbol: 'RUNE',  name: 'THORChain',          icon: 'R', color: '#33ff99', logoUrl: `${CG}/6595/small/Rune200x200.png` },
    { symbol: 'TRX',   name: 'TRON',               icon: 'T', color: '#ff0013', logoUrl: `${CG}/1094/small/tron-logo.png` },
    { symbol: 'VET',   name: 'VeChain',            icon: 'V', color: '#15bdff', logoUrl: `${CG}/1167/small/VET_Token_Icon.png` },
    { symbol: 'HBAR',  name: 'Hedera',             icon: 'H', color: '#000000', logoUrl: `${CG}/3688/small/hbar.png` },
    { symbol: 'ICP',   name: 'Internet Computer',  icon: 'I', color: '#29abe2', logoUrl: `${CG}/14495/small/Internet_Computer_logo.png` },
    { symbol: 'FTM',   name: 'Fantom',             icon: 'F', color: '#1969ff', logoUrl: `${CG}/4001/small/Fantom_round.png` },
    { symbol: 'EGLD',  name: 'MultiversX',         icon: 'E', color: '#23f7dd', logoUrl: `${CG}/12335/small/egld-token-logo.png` },
    { symbol: 'THETA', name: 'Theta Network',      icon: 'T', color: '#2ab8e6', logoUrl: `${CG}/2538/small/theta-token-logo.png` },
    { symbol: 'QNT',   name: 'Quant',              icon: 'Q', color: '#000000', logoUrl: `${CG}/3370/small/5ZOu7brX_400x400.jpg` },
    { symbol: 'KAS',   name: 'Kaspa',              icon: 'K', color: '#49eacb', logoUrl: `${CG}/25751/small/kaspa-icon-exchanges.png` },
    { symbol: 'TON',   name: 'Toncoin',            icon: 'T', color: '#0098ea', logoUrl: `${CG}/17980/small/ton_symbol.png` },
    { symbol: 'WOO',   name: 'WOO',                icon: 'W', color: '#1a1a2e', logoUrl: `${CG}/12921/small/w2UiemF__400x400.jpg` },
    { symbol: 'CAKE',  name: 'PancakeSwap',        icon: 'C', color: '#d1884f', logoUrl: `${CG}/12632/small/pancakeswap-cake-logo_%281%29.png` },
    { symbol: 'SUSHI', name: 'SushiSwap',          icon: 'S', color: '#d65aff', logoUrl: `${CG}/12271/small/512x512_Logo_no_chop.png` },
    { symbol: '1INCH', name: '1inch',              icon: '1', color: '#94a6c3', logoUrl: `${CG}/13469/small/1inch-token.png` },
    { symbol: 'ZRX',   name: '0x Protocol',        icon: 'Z', color: '#302c2c', logoUrl: `${CG}/863/small/0x.png` },
    { symbol: 'CELO',  name: 'Celo',               icon: 'C', color: '#35d07f', logoUrl: `${CG}/11090/small/InjXBNx9_400x400.jpg` },
    { symbol: 'MEME',  name: 'Memecoin',           icon: 'M', color: '#ff6b35', logoUrl: `${CG}/31870/small/memecoin.png` },
    { symbol: 'TWT',   name: 'Trust Wallet',       icon: 'T', color: '#3375bb', logoUrl: `${CG}/11085/small/Trust.png` },
    { symbol: 'JOE',   name: 'Trader Joe',         icon: 'J', color: '#e44444', logoUrl: `${CG}/17569/small/traderjoe.png` },
    { symbol: 'BAL',   name: 'Balancer',           icon: 'B', color: '#1e1e1e', logoUrl: `${CG}/11683/small/Balancer.png` },
    { symbol: 'LQTY',  name: 'Liquity',            icon: 'L', color: '#2eb6ea', logoUrl: `${CG}/14665/small/200-lqty-icon.png` },
    { symbol: 'FXS',   name: 'Frax Share',         icon: 'F', color: '#000000', logoUrl: `${CG}/13423/small/frax_share.png` },
]

// Helper to render a coin logo – shows real image with fallback to colored letter
const CoinLogo = ({ coin, size = 36 }: { coin: { symbol: string; icon: string; color: string; logoUrl?: string }; size?: number }) => {
    const [imgError, setImgError] = useState(false)
    if (coin.logoUrl && !imgError) {
        return (
            <img
                src={coin.logoUrl}
                alt={coin.symbol}
                width={size}
                height={size}
                style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                onError={() => setImgError(true)}
            />
        )
    }
    return (
        <div style={{ background: coin.color, borderRadius: '50%', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: size * 0.45, flexShrink: 0 }}>
            {coin.icon}
        </div>
    )
}

const TAB_PARAM_MAP: Record<string, string> = {
    'Assets Overview': 'overview',
    'Spot account': 'spot',
    'Futures account': 'futures',
    'Bot account': 'bot',
    'P2P account': 'p2p',
}
const PARAM_TAB_MAP: Record<string, string> = Object.fromEntries(
    Object.entries(TAB_PARAM_MAP).map(([k, v]) => [v, k])
)

export default function Assets() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [mobileAction] = useState<'deposit' | 'transfer' | 'withdraw'>('deposit')
    const [activeTab, setActiveTabRaw] = useState(() => {
        const param = searchParams.get('tab')
        return (param && PARAM_TAB_MAP[param]) || 'Assets Overview'
    })
    const setActiveTab = (tab: string) => {
        setActiveTabRaw(tab)
        setSearchParams({ tab: TAB_PARAM_MAP[tab] || 'overview' }, { replace: true })
    }
    const [showPnlAnalysis, setShowPnlAnalysis] = useState(false)
    const [selectedPnlPeriod, setSelectedPnlPeriod] = useState('Today\'s PNL')
    const [selectedTimeFilter, setSelectedTimeFilter] = useState('Last 7 days')
    const [showHistoryPage, setShowHistoryPage] = useState(false)
    const [showFilterPopup, setShowFilterPopup] = useState(false)
    const [selectedFilterPeriod, setSelectedFilterPeriod] = useState('1 Day')
    const [historyAsset, _setHistoryAsset] = useState('USDT')
    const [historyType, _setHistoryType] = useState('All Types')
    const [filterStartDate, _setFilterStartDate] = useState('2025-12-19')
    const [filterEndDate, _setFilterEndDate] = useState('2025-12-19')
    const [selectedYear, setSelectedYear] = useState(2025)
    const [selectedMonth, setSelectedMonth] = useState(12)
    const [selectedDay, setSelectedDay] = useState(19)
    const [showFeaturesPopup, setShowFeaturesPopup] = useState(false)
    const [balance, setBalance] = useState(() => getCachedBalance())
    const [futuresBalance, setFuturesBalance] = useState(() => getFuturesBalance())
    const [spotHoldings, setSpotHoldings] = useState<Record<string, number>>(() => getSpotHoldings())
    const [spotTimestamps, setSpotTimestamps] = useState<Record<string, number>>(() => getSpotTimestamps())
    const [marketPrices, setMarketPrices] = useState<Record<string, number>>(() => getLastKnownPrices())
    const [costBasis, setCostBasis] = useState<Record<string, number>>(() => getSpotCostBasis())
    const [botGridTab, setBotGridTab] = useState<'spot' | 'futures'>('spot')
    const [botDataFilter, setBotDataFilter] = useState<'running' | 'assets'>('running')
    const [activeSpotCategory, setActiveSpotCategory] = useState<'crypto' | 'stock' | 'commodities'>('crypto')

    // Functional state for highlighted features
    const [balanceHidden, setBalanceHidden] = useState(false)
    const [hideSmallAssets, setHideSmallAssets] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearchInput, setShowSearchInput] = useState(false)
    const [pnlPeriod, setPnlPeriod] = useState<'Today' | '7 Days' | '30 Days' | 'All Time'>('Today')
    const [showPnlPeriodDropdown, setShowPnlPeriodDropdown] = useState(false)
    const [closedTrades, setClosedTrades] = useState<any[]>([])
    const [openTrades, setOpenTrades] = useState<any[]>([])
    // Tracks whether the first open-trades API response has arrived.
    // Used to prevent a flash of artificially low portfolio value during initial load.
    const [openTradesLoaded, setOpenTradesLoaded] = useState(false)

    const PNL_PERIODS: Array<{ key: 'Today' | '7 Days' | '30 Days' | 'All Time', label: string }> = [
        { key: 'Today', label: 'Today' },
        { key: '7 Days', label: '7 Days' },
        { key: '30 Days', label: '30 Days' },
        { key: 'All Time', label: 'All Time' },
    ]

    const maskedValue = '****'

    const USDT_COIN = { symbol: 'USDT', name: 'Tether USD', icon: '$', color: '#26a17b', logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' }

    const filteredCoins = SPOT_COINS.filter(coin => {
        const matchesSearch = !searchQuery || coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || coin.name.toLowerCase().includes(searchQuery.toLowerCase())
        const coinHeld = spotHoldings[coin.symbol] || 0
        const livePrice = marketPrices[coin.symbol + 'USDT'] || 0
        const coinUsdVal = livePrice > 0 ? coinHeld * livePrice : (costBasis[coin.symbol] || 0)
        const matchesHide = !hideSmallAssets || coinUsdVal >= 1 || coin.symbol === 'USDT'
        return matchesSearch && matchesHide
    })

    // Build a lookup for stocks & commodities so they get proper names and logos
    const stockLookup = new Map(STOCK_PAIRS.map(s => [s.symbol, { symbol: s.symbol, name: s.name, icon: s.symbol[0], color: '#4a90e2', logoUrl: `https://logo.twelvedata.com/${s.symbol.toLowerCase()}` }]))
    const commodityLookup = new Map(COMMODITY_PAIRS.map(c => [c.symbol, { symbol: c.symbol, name: c.name, icon: c.emoji || c.symbol[0], color: c.color || '#888888', logoUrl: undefined as string | undefined }]))

    // Also include any coins from spotHoldings that aren't in SPOT_COINS (dynamically bought coins, stocks, commodities)
    const knownSymbols = new Set(SPOT_COINS.map(c => c.symbol))
    const extraCoins = Object.keys(spotHoldings)
        .filter(sym => sym !== 'USDT' && !knownSymbols.has(sym) && spotHoldings[sym] > 0)
        .map(sym => {
            if (stockLookup.has(sym)) return stockLookup.get(sym)!
            if (commodityLookup.has(sym)) return commodityLookup.get(sym)!
            return { symbol: sym, name: sym, icon: sym[0], color: '#888888', logoUrl: undefined as string | undefined }
        })
        .filter(coin => {
            const matchesSearch = !searchQuery || coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || coin.name.toLowerCase().includes(searchQuery.toLowerCase())
            const coinHeld = spotHoldings[coin.symbol] || 0
            const livePrice = marketPrices[coin.symbol + 'USDT'] || 0
            const coinUsdVal = livePrice > 0 ? coinHeld * livePrice : (costBasis[coin.symbol] || 0)
            const matchesHide = !hideSmallAssets || coinUsdVal >= 1
            return matchesSearch && matchesHide
        })
    const showUsdt = activeSpotCategory === 'crypto' && (!searchQuery || 'usdt'.includes(searchQuery.toLowerCase()) || 'tether'.includes(searchQuery.toLowerCase()))

    const allFilteredCoins = [...filteredCoins, ...extraCoins.filter(c => !stockLookup.has(c.symbol) && !commodityLookup.has(c.symbol))].sort((a, b) => {
        const aHeld = spotHoldings[a.symbol] || 0
        const bHeld = spotHoldings[b.symbol] || 0
        if (aHeld > 0 && bHeld === 0) return -1
        if (aHeld === 0 && bHeld > 0) return 1
        if (aHeld > 0 && bHeld > 0) return (spotTimestamps[b.symbol] || 0) - (spotTimestamps[a.symbol] || 0)
        return 0
    })

    // Category-specific sorted lists for the Spot account view
    const stockFilteredCoins = STOCK_PAIRS
        .filter(s => {
            const matchesSearch = !searchQuery || s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())
            const held = spotHoldings[s.symbol] || 0
            const livePrice = marketPrices[s.symbol + 'USDT'] || 0
            const coinUsdVal = livePrice > 0 ? held * livePrice : (costBasis[s.symbol] || 0)
            const matchesHide = !hideSmallAssets || coinUsdVal >= 1 || held > 0
            return matchesSearch && matchesHide
        })
        .map(s => ({ symbol: s.symbol, name: s.name, icon: s.symbol[0], color: '#4a90e2', logoUrl: `https://logo.twelvedata.com/${s.symbol.toLowerCase()}` }))
        .sort((a, b) => {
            const aHeld = spotHoldings[a.symbol] || 0
            const bHeld = spotHoldings[b.symbol] || 0
            if (aHeld > 0 && bHeld === 0) return -1
            if (aHeld === 0 && bHeld > 0) return 1
            if (aHeld > 0 && bHeld > 0) return (spotTimestamps[b.symbol] || 0) - (spotTimestamps[a.symbol] || 0)
            return 0
        })

    const commodityFilteredCoins = COMMODITY_PAIRS
        .filter(c => {
            const matchesSearch = !searchQuery || c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || c.name.toLowerCase().includes(searchQuery.toLowerCase())
            const held = spotHoldings[c.symbol] || 0
            const livePrice = marketPrices[c.symbol + 'USDT'] || 0
            const coinUsdVal = livePrice > 0 ? held * livePrice : (costBasis[c.symbol] || 0)
            const matchesHide = !hideSmallAssets || coinUsdVal >= 1 || held > 0
            return matchesSearch && matchesHide
        })
        .map(c => ({ symbol: c.symbol, name: c.name, icon: (c as any).emoji || c.symbol[0], color: (c as any).color || '#888888', logoUrl: undefined as string | undefined }))
        .sort((a, b) => {
            const aHeld = spotHoldings[a.symbol] || 0
            const bHeld = spotHoldings[b.symbol] || 0
            if (aHeld > 0 && bHeld === 0) return -1
            if (aHeld === 0 && bHeld > 0) return 1
            if (aHeld > 0 && bHeld > 0) return (spotTimestamps[b.symbol] || 0) - (spotTimestamps[a.symbol] || 0)
            return 0
        })

    const toggleBalanceVisibility = () => setBalanceHidden(prev => !prev)

    useEffect(() => {
        const fetchData = async () => {
            let openTradesData: any[] = []
            try {
                const [balData, priceData] = await Promise.all([
                    getBalance(),
                    getMarketPrices(SPOT_COINS.map(c => c.symbol + 'USDT'))
                ])

                // Reconciliation: if no money in futures (local balance AND no locked margin),
                // any remaining local_adj is stale from a previous transfer/trade cycle that
                // was not properly counteracted (e.g. trade closed via a different page).
                // Reset it so the backend balance is trusted as-is.
                try {
                    const [closed, open] = await Promise.all([getMyClosedTrades(), getMyOpenTrades()])
                    openTradesData = open
                    setClosedTrades(closed)
                    setOpenTrades(open)
                    setOpenTradesLoaded(true)
                    // Reconcile localStorage spot holdings with backend open trades.
                    // This ensures coins from admin-opened trades are visible to the user.
                    syncSpotHoldingsFromBackend(open)
                } catch { /* ignore */ }

                const currentFutBal = getFuturesBalance()
                const hasOpenFutures = openTradesData.some(
                    (t: any) => t.type === 'futures' && (t.status === 'open' || t.status === 'pending' || !t.status)
                )
                const localAdj = getLocalBalanceAdjustment()
                if (currentFutBal <= 0 && !hasOpenFutures && localAdj !== 0) {
                    resetLocalBalanceAdjustment()
                    // Re-read balance without the stale adjustment
                    const freshBal = await getBalance()
                    setBalance(freshBal.balance)
                    setCachedBalance(freshBal.balance)
                } else {
                    setBalance(balData.balance)
                    // Only persist to cache if the fetched value is >= the current cache.
                    // This prevents overwriting a valid lower cache (e.g. after a
                    // Spot→Futures transfer) with a stale higher backend value.
                    if (balData.balance >= getCachedBalance() || getCachedBalance() <= 0) {
                        setCachedBalance(balData.balance)
                    }
                }

                setFuturesBalance(getFuturesBalance())
                setMarketPrices(priceData)
                // Persist prices so USD values show even when offline/API-down
                if (Object.keys(priceData).length > 0) saveLastKnownPrices(priceData)
                setSpotHoldings(getSpotHoldings())
                setSpotTimestamps(getSpotTimestamps())
                setCostBasis(getSpotCostBasis())
            } catch (error) {
                console.error('Error fetching data:', error)
            }
        }
        fetchData()
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [])

    // Close dropdowns on outside click
    useEffect(() => {
        if (!showPnlPeriodDropdown) return
        const handler = () => {
            setShowPnlPeriodDropdown(false)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [showPnlPeriodDropdown])


    // Compute USD value of all non-USDT spot holdings
    const spotHoldingsUsdValue = Object.entries(spotHoldings).reduce((sum, [sym, held]) => {
        if (!held || held <= 0) return sum
        const livePrice = marketPrices[sym + 'USDT'] || 0
        if (livePrice > 0) return sum + held * livePrice
        // Fall back to cost basis if no live price
        const cost = costBasis[sym] || 0
        return sum + cost
    }, 0)

    // Total spot account value = USDT balance + value of all non-USDT holdings
    const spotTotalUsd = balance + spotHoldingsUsdValue

    // Futures equity = available balance + margin locked in open positions + unrealized PnL
    // This ensures the overview total never drops when a trade is opened — margin stays visible.
    //
    // Before the first openTrades API response arrives (openTradesLoaded=false), we estimate
    // lockedFuturesMargin as (total transferred to futures) − (current futures available balance).
    // This prevents a flash of artificially low portfolio value when navigating here immediately
    // after opening a trade.
    const lockedFuturesMarginFromAPI = openTrades
        .filter(t => t.type === 'futures' && (t.status === 'open' || t.status === 'pending' || !t.status))
        .reduce((sum, t) => sum + (Number(t.marginUsed) || 0), 0)
    // getLocalBalanceAdjustment() is negative when funds were transferred to futures.
    // |localAdj| − currentFuturesAvailable = margin currently locked in open trades.
    const estimatedLockedMargin = Math.max(0, -getLocalBalanceAdjustment() - futuresBalance)
    const lockedFuturesMargin = openTradesLoaded ? lockedFuturesMarginFromAPI : estimatedLockedMargin
    const futuresUnrealizedPnL = openTrades
        .filter(t => t.type === 'futures' && (t.status === 'open' || !t.status))
        .reduce((sum, t) => sum + (Number(t.unrealizedPnL) || 0), 0)
    const futuresEquity = futuresBalance + lockedFuturesMargin + futuresUnrealizedPnL

    // Grand total across all accounts
    const totalValuation = spotTotalUsd + futuresEquity

    const formatValuation = () => {
        return { amount: totalValuation.toFixed(2) + ' USDT', usd: '≈$' + totalValuation.toFixed(2) }
    }

    // Returns formatted ≈$X.XX
    // Priority: 1) live price × held  2) last known price × held  3) cost basis paid  4) $0.00
    const coinUsdLabel = (symbol: string): string => {
        const held = spotHoldings[symbol] || 0
        // For coins with zero balance, always show $0.00
        if (held === 0) return '≈$0.00'
        const livePrice = marketPrices[symbol + 'USDT'] || 0
        if (livePrice > 0) return '≈$' + (held * livePrice).toFixed(2)
        // Cost basis — how much USDT was actually paid
        const cost = costBasis[symbol] || 0
        if (cost > 0) return '≈$' + cost.toFixed(2)
        return '≈$0.00'
    }

    // ── P&L computation ────────────────────────────────────────────────────────
    const buildPnl = (amount: number, base: number) => ({
        amount,
        pct: base > 0 ? ((amount / base) * 100).toFixed(2) : '0.00',
        label: `${amount >= 0 ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`
    })

    const inRange = (dateStr: string, period: string) => {
        const now = new Date(); const d = new Date(dateStr)
        if (period === 'Today') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
        if (period === '7 Days')  return now.getTime() - d.getTime() <= 7  * 86400000
        if (period === '30 Days') return now.getTime() - d.getTime() <= 30 * 86400000
        return true // All Time
    }

    // ── Spot PnL = realized PnL from closed SPOT trades in the selected period
    const computePnl = () => {
        // Realized: sum of backend-stored pnl on closed spot trades in the chosen period
        const realized = closedTrades
            .filter(t => (!t.type || t.type === 'spot') && inRange(t.closedAt || t.updatedAt || t.createdAt, pnlPeriod))
            .reduce((sum, t) => sum + (Number(t.pnl) || 0), 0)
        return buildPnl(realized, totalValuation > 0 ? totalValuation : balance)
    }

    // ── Futures PnL = unrealized PnL from OPEN futures positions (live from backend)
    //    + realized PnL from closed FUTURES trades in period
    const computeFuturesPnl = () => {
        const unrealized = openTrades
            .filter(t => t.type === 'futures')
            .reduce((sum, t) => sum + (Number(t.unrealizedPnL) || 0), 0)
        const realized = closedTrades
            .filter(t => t.type === 'futures' && inRange(t.closedAt || t.updatedAt || t.createdAt, pnlPeriod))
            .reduce((sum, t) => sum + (Number(t.pnl) || 0), 0)
        const amount = unrealized + realized
        const base = futuresEquity > 0 ? futuresEquity : balance
        return buildPnl(amount, base)
    }

    const pnl = computePnl()
    const futuresPnl = computeFuturesPnl()
    const pnlColor = pnl.amount >= 0 ? '#10b981' : '#ef4444'
    const futuresPnlColor = futuresPnl.amount >= 0 ? '#10b981' : '#ef4444'
    // Overview P&L = combined spot + futures so closing a futures trade shows in the summary
    const overviewPnlAmount = pnl.amount + futuresPnl.amount
    const overviewPnl = buildPnl(overviewPnlAmount, totalValuation > 0 ? totalValuation : balance)
    const overviewPnlColor = overviewPnlAmount >= 0 ? '#10b981' : '#ef4444'

    const renderPnlPeriodDropdown = () => (
        showPnlPeriodDropdown ? (
            <div className="pnl-period-dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, background: '#1e1e2d', borderRadius: 8, border: '1px solid #2a2a3a', padding: '4px 0', minWidth: 140, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                {PNL_PERIODS.map(opt => (
                    <div
                        key={opt.key}
                        onClick={(e) => { e.stopPropagation(); setPnlPeriod(opt.key); setShowPnlPeriodDropdown(false) }}
                        style={{ padding: '8px 16px', cursor: 'pointer', color: pnlPeriod === opt.key ? '#00b8a3' : '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2a3a')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        <span>{opt.label}</span>
                        {pnlPeriod === opt.key && <span style={{ color: '#00b8a3' }}>✓</span>}
                    </div>
                ))}
            </div>
        ) : null
    )

    const renderSearchInput = () => (
        showSearchInput ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e1e2d', borderRadius: 8, padding: '6px 12px', border: '1px solid #2a2a3a', flex: 1 }}>
                <Search size={14} className="text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search coin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, width: '100%' }}
                />
                <X size={14} className="text-zinc-500" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setShowSearchInput(false); setSearchQuery('') }} />
            </div>
        ) : null
    )

    const renderOverview = () => (
        <>
            {/* Desktop View Content */}
            <div className="desktop-only assets-main-layout">
                <div className="assets-content-left">
                    <div className="valuation-card">
                        <div className="valuation-header">
                            <div className="flex items-center gap-2">
                                <span className="valuation-label">Total Portfolio Value</span>
                                {balanceHidden
                                    ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                    : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                }
                            </div>
                            <div className="pnl-summary">
                                <span className="pnl-link">Profit and Loss</span>
                                <div className="pnl-dropdown" style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowPnlPeriodDropdown(!showPnlPeriodDropdown) }}>
                                    {pnlPeriod} <ChevronDown size={12} />
                                    {renderPnlPeriodDropdown()}
                                </div>
                            </div>
                        </div>

                        <div className="valuation-amount-row">
                            <div className="flex items-center gap-2">
                                <span className="valuation-main">{balanceHidden ? maskedValue : formatValuation().amount}</span>
                            </div>
                            <div className="valuation-secondary-col">
                                <div className="valuation-usd">{balanceHidden ? maskedValue : '$' + totalValuation.toFixed(2)}</div>
                                <div className="valuation-perc" style={{ color: overviewPnlColor }}>{overviewPnlAmount >= 0 ? '+' : ''}{overviewPnl.pct}%</div>
                            </div>
                        </div>
                        <div className="valuation-subtext">{balanceHidden ? maskedValue : formatValuation().usd}</div>
                        <div style={{ fontSize: 11, color: '#71717a', marginTop: 2, marginBottom: 4 }}>
                            USDT Cash: <span style={{ color: '#a1a1aa', fontWeight: 600 }}>{balanceHidden ? maskedValue : balance.toFixed(2) + ' USDT'}</span>
                            &nbsp;·&nbsp; Coins: <span style={{ color: '#a1a1aa', fontWeight: 600 }}>{balanceHidden ? maskedValue : '$' + spotHoldingsUsdValue.toFixed(2)}</span>
                        </div>

                        <div className="assets-filter-row">
                            <span className="my-assets-label">My Assets</span>
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setHideSmallAssets(!hideSmallAssets)}>
                                <div className="hide-assets-checkbox" style={{ background: hideSmallAssets ? '#00b8a3' : 'transparent', borderColor: hideSmallAssets ? '#00b8a3' : undefined }}></div>
                                <span className="text-xs text-zinc-500">Hide other assets less than 1 USD</span>
                            </div>
                        </div>

                        <div className="accounts-breakdown-list">
                            <div className="accounts-header">
                                <span>Symbol</span>
                                <span className="text-center">Ratio</span>
                                <span className="text-right">Quantity</span>
                            </div>

                            <div className="account-item">
                                <div className="account-info">
                                    <div className="account-icon-box">
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                                        </div>
                                    </div>
                                    <span className="account-name">Spot Account</span>
                                </div>
                                <div className="account-ratio">--</div>
                                <div className="account-balance text-right">
                                    <div className="bal-main">{balanceHidden ? maskedValue : spotTotalUsd.toFixed(2) + ' USDT'}</div>
                                    <div className="bal-sub">{balanceHidden ? maskedValue : '≈$' + spotTotalUsd.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="account-item">
                                <div className="account-info">
                                    <div className="account-icon-box">
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        </div>
                                    </div>
                                    <span className="account-name">Futures Account</span>
                                </div>
                                <div className="account-ratio">--</div>
                                <div className="account-balance text-right">
                                    <div className="bal-main">{balanceHidden ? maskedValue : futuresEquity.toFixed(2) + ' USDT'}</div>
                                    <div className="bal-sub">{balanceHidden ? maskedValue : '≈$' + futuresEquity.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="account-item">
                                <div className="account-info">
                                    <div className="account-icon-box">
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
                                        </div>
                                    </div>
                                    <span className="account-name">Bot Account</span>
                                </div>
                                <div className="account-ratio">--</div>
                                <div className="account-balance text-right">
                                    <div className="bal-main">{balanceHidden ? maskedValue : '0.00 USDT'}</div>
                                    <div className="bal-sub">{balanceHidden ? maskedValue : '≈$0.00'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="assets-content-right">
                    <div className="recent-activity-card">
                        <h3 className="recent-title">Recent Deposits and Trades</h3>
                        <div className="recent-empty-state">
                            <div className="recent-empty-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c2c36" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <circle cx="15" cy="15" r="3"></circle>
                                    <line x1="17.5" y1="17.5" x2="20" y2="20"></line>
                                    <line x1="8" y1="13" x2="10" y2="13"></line>
                                    <line x1="8" y1="17" x2="11" y2="17"></line>
                                </svg>
                            </div>
                            <span className="empty-text">No recent deposits or trades</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View Content - Persistent Tabs moved out, this is just content */}
            <div className="mobile-only">
                <div className="mobile-assets-container pt-0">
                    <div className="mobile-valuation-section">
                        <div className="m-val-header">
                            <span className="m-val-label">Total Portfolio Value</span>
                            {balanceHidden
                                ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                            }
                        </div>
                        <div className="m-val-amount-row">
                            <span className="m-val-amount">{balanceHidden ? maskedValue : formatValuation().amount}</span>
                        </div>
                        <div className="m-val-usd">{balanceHidden ? maskedValue : formatValuation().usd}</div>
                        <div style={{ fontSize: 11, color: '#71717a', marginTop: 3 }}>
                            USDT Cash:&nbsp;<span style={{ color: '#a1a1aa', fontWeight: 600 }}>{balanceHidden ? maskedValue : balance.toFixed(2) + ' USDT'}</span>
                            &nbsp;·&nbsp;Coins:&nbsp;<span style={{ color: '#a1a1aa', fontWeight: 600 }}>{balanceHidden ? maskedValue : '$' + spotHoldingsUsdValue.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mobile-pnl-section">
                        <div className="m-pnl-header">
                            <span className="m-pnl-label">Profit and Loss</span>
                            <div className="m-pnl-dropdown" style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowPnlPeriodDropdown(!showPnlPeriodDropdown) }}>
                                <span>{pnlPeriod}</span>
                                <ChevronDown size={12} />
                                {renderPnlPeriodDropdown()}
                            </div>
                        </div>
                        <div className="m-pnl-values">
                            <div className="m-pnl-usd" style={{ color: balanceHidden ? undefined : overviewPnlColor }}>{balanceHidden ? maskedValue : overviewPnl.label}</div>
                            <div className="m-pnl-perc" style={{ color: balanceHidden ? undefined : overviewPnlColor }}>{balanceHidden ? maskedValue : `${overviewPnlAmount >= 0 ? '+' : ''}${overviewPnl.pct}%`}</div>
                        </div>
                    </div>

                    <div className="mobile-action-buttons">
                        <button
                            className={`m-btn-deposit ${mobileAction === 'deposit' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard/deposit')}
                        >
                            Deposit
                        </button>
                        <button
                            className={`m-btn-action ${mobileAction === 'transfer' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard/transfer')}
                        >
                            Transfer
                        </button>
                        <button
                            className={`m-btn-action ${mobileAction === 'withdraw' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard/withdraw')}
                        >
                            Withdraw
                        </button>
                    </div>

                    <div className="mobile-options-row">
                        {showSearchInput ? (
                            renderSearchInput()
                        ) : (
                            <>
                                <div className="m-option-left" onClick={() => setHideSmallAssets(!hideSmallAssets)} style={{ cursor: 'pointer' }}>
                                    <div className="m-circular-checkbox" style={{ background: hideSmallAssets ? '#00b8a3' : 'transparent', borderColor: hideSmallAssets ? '#00b8a3' : undefined }}></div>
                                    <span className="m-option-text">Hide other assets less than 1 USD</span>
                                </div>
                                <Search size={18} className="text-zinc-400" style={{ cursor: 'pointer' }} onClick={() => setShowSearchInput(true)} />
                            </>
                        )}
                    </div>

                    <div className="mobile-accounts-list">
                        <div className="m-account-item" onClick={() => navigate('/dashboard/trade')} style={{ cursor: 'pointer' }}>
                            <div className="m-acc-left">
                                <div className="m-acc-icon-box">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                                </div>
                                <span className="m-acc-name">Spot Account</span>
                            </div>
                            <div className="m-acc-right">
                                <div className="m-acc-val">{balanceHidden ? maskedValue : spotTotalUsd.toFixed(2) + ' USDT'}</div>
                                <div className="m-acc-usd">{balanceHidden ? maskedValue : "≈$" + spotTotalUsd.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="m-account-item" onClick={() => navigate('/dashboard/futures')} style={{ cursor: 'pointer' }}>
                            <div className="m-acc-left">
                                <div className="m-acc-icon-box">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                </div>
                                <span className="m-acc-name">Futures Account</span>
                            </div>
                            <div className="m-acc-right">
                                <div className="m-acc-val">{balanceHidden ? maskedValue : futuresEquity.toFixed(2) + ' USDT'}</div>
                                <div className="m-acc-usd">{balanceHidden ? maskedValue : '≈$' + futuresEquity.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="m-account-item">
                            <div className="m-acc-left">
                                <div className="m-acc-icon-box">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
                                </div>
                                <span className="m-acc-name">Bot Account</span>
                            </div>
                            <div className="m-acc-right">
                                <div className="m-acc-val">{balanceHidden ? maskedValue : '0.00 USDT'}</div>
                                <div className="m-acc-usd">{balanceHidden ? maskedValue : '≈$0.00'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

    const renderSpot = () => (
        <>
            {/* Desktop View */}
            <div className="desktop-only spot-layout">
                <div className="spot-valuation-card">
                    <div className="valuation-header">
                        <div className="flex items-center gap-2">
                            <span className="valuation-label">Valuation</span>
                            {balanceHidden
                                ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                            }
                        </div>
                        <div className="pnl-summary">
                            <span className="pnl-link">Profit and Loss</span>
                            <div className="pnl-dropdown" style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowPnlPeriodDropdown(!showPnlPeriodDropdown) }}>
                                {pnlPeriod} <ChevronDown size={12} />
                                {renderPnlPeriodDropdown()}
                            </div>
                        </div>
                    </div>
                    <div className="valuation-amount-row">
                        <div className="flex items-center gap-2">
                            <span className="valuation-main">{balanceHidden ? maskedValue : spotTotalUsd.toFixed(2) + ' USDT'}</span>
                        </div>
                        <div className="valuation-subtext mt-1">{balanceHidden ? maskedValue : '≈$' + spotTotalUsd.toFixed(2)}</div>
                    </div>
                </div>

                <div className="spot-toolbar">
                    <div className="spot-toolbar-left">
                        <span className="fund-list-label">Fund lists</span>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setHideSmallAssets(!hideSmallAssets)}>
                            <div className="hide-assets-checkbox" style={{ background: hideSmallAssets ? '#00b8a3' : 'transparent', borderColor: hideSmallAssets ? '#00b8a3' : undefined }}></div>
                            <span className="text-xs text-zinc-500">Hide other assets less than 1 USD</span>
                        </div>
                    </div>
                    <div className="spot-search-box">
                        <Search size={16} className="spot-search-icon" />
                        <input type="text" placeholder="Search for currency pairs" className="spot-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                {/* Category Tab Buttons */}
                <div style={{ display: 'flex', gap: 8, padding: '8px 0 4px' }}>
                    {(['crypto', 'stock', 'commodities'] as const).map(cat => (
                        <button key={cat} onClick={() => setActiveSpotCategory(cat)}
                            style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', letterSpacing: 0.3,
                                background: activeSpotCategory === cat ? '#00b8a3' : 'transparent',
                                color: activeSpotCategory === cat ? '#fff' : '#71717a',
                                borderColor: activeSpotCategory === cat ? '#00b8a3' : '#3f3f46' }}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="spot-table-container">
                    <table className="spot-table">
                        <thead>
                            <tr>
                                <th className="st-header">Coin</th>
                                <th className="st-header">Total <span className="sort-arrow">↕</span></th>
                                <th className="st-header">Available <span className="sort-arrow">↕</span></th>
                                <th className="st-header">In order</th>
                                <th className="st-header text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {showUsdt && (
                                <tr key="USDT" className="st-row">
                                    <td>
                                        <div className="st-coin-cell">
                                            <CoinLogo coin={USDT_COIN} size={28} />
                                            <div className="st-token-info">
                                                <span className="st-symbol">USDT</span>
                                                <span className="st-name">Tether USD</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="st-val-main">{balanceHidden ? maskedValue : balance.toFixed(2) + ' USDT'}</div>
                                        <div className="st-val-sub">{balanceHidden ? maskedValue : '≈$' + balance.toFixed(2)}</div>
                                    </td>
                                    <td className="st-val-main">{balanceHidden ? maskedValue : balance.toFixed(2)}</td>
                                    <td className="st-val-main">{balanceHidden ? maskedValue : '0.00'}</td>
                                    <td>
                                        <div className="st-actions">
                                            <button className="st-action-btn" onClick={() => navigate('/dashboard/deposit')}>Deposit</button>
                                            <button className="st-action-btn" onClick={() => navigate('/dashboard/withdraw')}>Withdraw</button>
                                            <button className="st-action-btn" onClick={() => navigate('/dashboard/trade')}>Trade</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {(activeSpotCategory === 'crypto' ? allFilteredCoins
                              : activeSpotCategory === 'stock' ? stockFilteredCoins
                              : commodityFilteredCoins
                            ).map((coin) => (
                                <tr key={coin.symbol} className="st-row">
                                    <td>
                                        <div className="st-coin-cell">
                                            <CoinLogo coin={coin} size={28} />
                                            <div className="st-token-info">
                                                <span className="st-symbol">{coin.symbol}</span>
                                                <span className="st-name">{coin.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="st-val-main">{balanceHidden ? maskedValue : ((spotHoldings[coin.symbol] || 0).toFixed(8) + ' ' + coin.symbol)}</div>
                                        <div className="st-val-sub">{balanceHidden ? maskedValue : coinUsdLabel(coin.symbol)}</div>
                                    </td>
                                    <td className="st-val-main">{balanceHidden ? maskedValue : (spotHoldings[coin.symbol] || 0).toFixed(8)}</td>
                                    <td className="st-val-main">{balanceHidden ? maskedValue : '0.000000'}</td>
                                    <td>
                                        <div className="st-actions">
                                            <button className="st-action-btn" onClick={() => navigate('/dashboard/deposit')}>Deposit</button>
                                            <button className="st-action-btn" onClick={() => navigate('/dashboard/withdraw')}>Withdraw</button>
                                            <button className="st-action-btn" onClick={() => navigate('/dashboard/trade')}>Trade</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-only">
                <div className="mobile-spot-container">
                    <div className="mobile-spot-valuation">
                        <div className="ms-val-header">
                            <span className="ms-val-label">Valuation</span>
                            {balanceHidden
                                ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                            }
                        </div>
                        <div className="ms-val-amount-row">
                            <span className="ms-val-amount">{balanceHidden ? maskedValue : spotTotalUsd.toFixed(2) + ' USDT'}</span>
                        </div>
                        <div className="ms-val-usd">{balanceHidden ? maskedValue : '≈$' + spotTotalUsd.toFixed(2)}</div>
                    </div>

                    <div className="mobile-spot-pnl">
                        <div className="ms-pnl-row">
                            <span className="ms-pnl-label">Profit and Loss</span>
                            <div className="ms-pnl-dropdown" style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowPnlPeriodDropdown(!showPnlPeriodDropdown) }}>
                                <span>{pnlPeriod}</span>
                                <ChevronDown size={10} />
                                {renderPnlPeriodDropdown()}
                            </div>
                        </div>
                        <div className="ms-pnl-amount" style={{ color: balanceHidden ? undefined : pnlColor }}>{balanceHidden ? maskedValue : pnl.label}</div>
                        <div className="ms-pnl-perc" style={{ color: balanceHidden ? undefined : pnlColor }}>{balanceHidden ? maskedValue : `${pnl.amount >= 0 ? '+' : ''}${pnl.pct}%`}</div>
                    </div>

                    <div className="mobile-spot-buttons">
                        <button
                            className={`ms-btn-deposit ${mobileAction === 'deposit' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard/deposit')}
                        >
                            Deposit
                        </button>
                        <button
                            className={`ms-btn-action ${mobileAction === 'transfer' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard/transfer')}
                        >
                            Transfer
                        </button>
                        <button
                            className={`ms-btn-action ${mobileAction === 'withdraw' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard/withdraw')}
                        >
                            Withdraw
                        </button>
                    </div>

                    <div className="mobile-spot-filter">
                        {showSearchInput ? (
                            renderSearchInput()
                        ) : (
                            <>
                                <div className="ms-filter-left" onClick={() => setHideSmallAssets(!hideSmallAssets)} style={{ cursor: 'pointer' }}>
                                    <div className="ms-checkbox" style={{ background: hideSmallAssets ? '#00b8a3' : 'transparent', borderColor: hideSmallAssets ? '#00b8a3' : undefined }}></div>
                                    <span className="ms-filter-text">Hide other assets less than 1 USD</span>
                                </div>
                                <Search size={16} className="text-zinc-500" style={{ cursor: 'pointer' }} onClick={() => setShowSearchInput(true)} />
                            </>
                        )}
                    </div>

                    {/* Category Tab Buttons - Mobile */}
                    <div style={{ display: 'flex', gap: 8, padding: '8px 16px 4px' }}>
                        {(['crypto', 'stock', 'commodities'] as const).map(cat => (
                            <button key={cat} onClick={() => setActiveSpotCategory(cat)}
                                style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                    background: activeSpotCategory === cat ? '#00b8a3' : 'transparent',
                                    color: activeSpotCategory === cat ? '#fff' : '#71717a',
                                    borderColor: activeSpotCategory === cat ? '#00b8a3' : '#3f3f46' }}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="mobile-spot-list">
                        {showUsdt && (
                            <div key="USDT" className="ms-coin-item">
                                <div className="ms-coin-left">
                                    <CoinLogo coin={USDT_COIN} size={36} />
                                    <div className="ms-coin-info">
                                        <span className="ms-coin-symbol">USDT</span>
                                        <span className="ms-coin-name">Tether USD</span>
                                    </div>
                                </div>
                                <div className="ms-coin-right">
                                    <span className="ms-coin-balance">{balanceHidden ? maskedValue : balance.toFixed(2) + ' USDT'}</span>
                                    <span className="ms-coin-usd">{balanceHidden ? maskedValue : '≈$' + balance.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                        {(activeSpotCategory === 'crypto' ? allFilteredCoins
                          : activeSpotCategory === 'stock' ? stockFilteredCoins
                          : commodityFilteredCoins
                        ).map((coin) => (
                            <div key={coin.symbol} className="ms-coin-item">
                                <div className="ms-coin-left">
                                    <CoinLogo coin={coin} size={36} />
                                    <div className="ms-coin-info">
                                        <span className="ms-coin-symbol">{coin.symbol}</span>
                                        <span className="ms-coin-name">{coin.name}</span>
                                    </div>
                                </div>
                                <div className="ms-coin-right">
                                    <span className="ms-coin-balance">{balanceHidden ? maskedValue : (spotHoldings[coin.symbol] || 0).toFixed(6) + ' ' + coin.symbol}</span>
                                    <span className="ms-coin-usd">{balanceHidden ? maskedValue : coinUsdLabel(coin.symbol)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )

    const renderFuturesTab = () => (
        <>
            {/* Desktop View */}
            <div className="desktop-only futures-layout">
                {/* Estimated Value & Total PnL Row */}
                <div className="futures-top-section">
                    <div className="futures-valuation-left">
                        <div className="futures-val-header">
                            <span className="futures-val-label">Estimated value</span>
                            {balanceHidden
                                ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                            }
                        </div>
                        <div className="futures-val-amount-row">
                            <span className="futures-val-main">{balanceHidden ? maskedValue : futuresEquity.toFixed(2) + ' USDT'}</span>
                        </div>
                        <div className="futures-val-usd">{balanceHidden ? maskedValue : '≈$' + futuresEquity.toFixed(2)}</div>
                    </div>
                    <div className="futures-pnl-right">
                        <div className="futures-pnl-header">
                            <span className="futures-pnl-link">Total PnL</span>
                            <div className="futures-pnl-dropdown" style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowPnlPeriodDropdown(!showPnlPeriodDropdown) }}>
                                {pnlPeriod} <ChevronDown size={12} />
                                {renderPnlPeriodDropdown()}
                            </div>
                        </div>
                        <div className="futures-pnl-values">
                            <div className="futures-pnl-amount" style={{ color: balanceHidden ? undefined : futuresPnlColor }}>{balanceHidden ? maskedValue : futuresPnl.label}</div>
                            <div className="futures-pnl-chevron">
                                <ChevronDown size={14} className="text-zinc-500" />
                            </div>
                        </div>
                        <div className="futures-pnl-perc" style={{ color: futuresPnlColor }}>{balanceHidden ? maskedValue : `${futuresPnl.amount >= 0 ? '+' : ''}${futuresPnl.pct}%`}</div>
                    </div>
                </div>

                {/* Trade Record Section */}
                <div className="futures-toolbar">
                    <div className="futures-toolbar-left">
                        <span className="futures-trade-record-label">Trade record</span>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setHideSmallAssets(!hideSmallAssets)}>
                            <div className="futures-hide-checkbox" style={{ background: hideSmallAssets ? '#00b8a3' : 'transparent', borderColor: hideSmallAssets ? '#00b8a3' : undefined }}>
                                <div className="futures-checkbox-inner" style={{ background: hideSmallAssets ? '#fff' : 'transparent' }}></div>
                            </div>
                            <span className="text-xs text-zinc-500">Hide other assets less than 1 USD</span>
                        </div>
                        <div className="futures-copy-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </div>
                    </div>
                    <div className="futures-search-box">
                        <Search size={16} className="futures-search-icon" />
                        <input type="text" placeholder="Search for currency pairs" className="futures-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                {/* Futures Assets Table */}
                <div className="futures-table-container">
                    <table className="futures-table">
                        <thead>
                            <tr>
                                <th className="ft-header">Coin</th>
                                <th className="ft-header">Total Balance</th>
                                <th className="ft-header">
                                    Wallet Balance
                                    <span className="ft-sort-icon">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M7 10l5-5 5 5"></path>
                                            <path d="M7 14l5 5 5-5"></path>
                                        </svg>
                                    </span>
                                </th>
                                <th className="ft-header">Available</th>
                                <th className="ft-header">PnL</th>
                                <th className="ft-header ft-header-right">Operation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allFilteredCoins.map((coin) => (
                                <tr key={coin.symbol} className="ft-row">
                                    <td>
                                        <div className="ft-coin-cell">
                                            <CoinLogo coin={coin} size={28} />
                                            <div className="ft-token-info">
                                                <span className="ft-symbol">{coin.symbol}</span>
                                                <span className="ft-name">{coin.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ft-val-main">{balanceHidden ? maskedValue : '0.000000 ' + coin.symbol}</div>
                                        <div className="ft-val-sub">{balanceHidden ? maskedValue : "≈$" + (marketPrices[coin.symbol + "USDT"] || 0).toFixed(2)}</div>
                                    </td>
                                    <td className="ft-val-main">{balanceHidden ? maskedValue : '0.000000'}</td>
                                    <td className="ft-val-main">{balanceHidden ? maskedValue : '0.000000'}</td>
                                    <td className="ft-val-main">{balanceHidden ? maskedValue : '0.000000'}</td>
                                    <td>
                                        <div className="ft-actions">
                                            <button className="ft-action-btn" onClick={() => navigate('/dashboard/futures-trading')}>Trade</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-only">
                <div className="mobile-futures-container">
                    <div className="mf-valuation-section">
                        <div className="mf-val-header">
                            <span className="mf-val-label">Estimation value</span>
                            {balanceHidden
                                ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                            }
                        </div>
                        <div className="mf-val-amount-row">
                            <span className="mf-val-amount">{balanceHidden ? maskedValue : futuresEquity.toFixed(2) + ' USDT'}</span>
                        </div>
                        <div className="mf-val-usd">{balanceHidden ? maskedValue : '≈$' + futuresEquity.toFixed(2)}</div>
                    </div>

                    <div className="mf-pnl-section">
                        <div className="mf-pnl-row">
                            <span className="mf-pnl-label">Today's PnL</span>
                            <div className="mf-pnl-dropdown" style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowPnlPeriodDropdown(!showPnlPeriodDropdown) }}>
                                <span>{pnlPeriod}</span>
                                <ChevronDown size={10} />
                                {renderPnlPeriodDropdown()}
                            </div>
                        </div>
                        <div className="mf-pnl-amount-row">
                            <span className="mf-pnl-amount" style={{ color: balanceHidden ? undefined : futuresPnlColor }}>{balanceHidden ? maskedValue : futuresPnl.label}</span>
                            <ChevronDown size={14} className="text-zinc-500" />
                        </div>
                        <div className="mf-pnl-perc" style={{ color: futuresPnlColor }}>{balanceHidden ? maskedValue : `${futuresPnl.amount >= 0 ? '+' : ''}${futuresPnl.pct}%`}</div>
                    </div>

                    <button className="mf-transfer-btn" onClick={() => navigate('/dashboard/transfer')}>Transfer</button>

                    <div className="mf-filter-row">
                        {showSearchInput ? (
                            renderSearchInput()
                        ) : (
                            <>
                                <div className="mf-filter-left" onClick={() => setHideSmallAssets(!hideSmallAssets)} style={{ cursor: 'pointer' }}>
                                    <div className="mf-checkbox" style={{ background: hideSmallAssets ? '#00b8a3' : 'transparent', borderColor: hideSmallAssets ? '#00b8a3' : undefined }}></div>
                                    <span className="mf-filter-text">Hide other assets less than 1 USD</span>
                                </div>
                                <Search size={16} className="text-zinc-500" style={{ cursor: 'pointer' }} onClick={() => setShowSearchInput(true)} />
                            </>
                        )}
                    </div>

                    <div className="mf-trade-record-header">
                        <span className="mf-trade-label">Trade record</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </div>

                    <div className="mf-coin-list">
                        {allFilteredCoins.map((coin) => (
                            <div key={coin.symbol} className="mf-coin-card" onClick={() => setShowPnlAnalysis(true)}>
                                <div className="mf-coin-header">
                                    <CoinLogo coin={coin} size={36} />
                                    <div className="mf-coin-info">
                                        <span className="mf-coin-symbol">{coin.symbol}</span>
                                        <span className="mf-coin-name">{coin.name}</span>
                                    </div>
                                </div>
                                <div className="mf-coin-balances">
                                    <div className="mf-balance-row">
                                        <div className="mf-balance-item">
                                            <span className="mf-balance-label">Total Balance</span>
                                            <span className="mf-balance-value">{balanceHidden ? maskedValue : '$0.00'}</span>
                                        </div>
                                        <div className="mf-balance-item mf-balance-right">
                                            <span className="mf-balance-label">Wallet Balance</span>
                                            <span className="mf-balance-value">{balanceHidden ? maskedValue : '$0.00'}</span>
                                        </div>
                                    </div>
                                    <div className="mf-balance-row">
                                        <div className="mf-balance-item">
                                            <span className="mf-balance-label">Available Balance</span>
                                            <span className="mf-balance-value">{balanceHidden ? maskedValue : '$0.00'}</span>
                                        </div>
                                        <div className="mf-balance-item mf-balance-right">
                                            <span className="mf-balance-label">PnL</span>
                                            <span className="mf-balance-value">{balanceHidden ? maskedValue : '$0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PnL Analysis Mobile View */}
            {showPnlAnalysis && (
                <div className="mobile-only pnl-analysis-overlay">
                    <div className="pnl-analysis-container">
                        <div className="pnl-header">
                            <ArrowLeft size={20} className="pnl-back-icon" onClick={() => setShowPnlAnalysis(false)} />
                            <span className="pnl-header-title">Profit and loss analysis</span>
                        </div>

                        <div className="pnl-content">
                            <div className="pnl-estimation-section">
                                <div className="pnl-est-header">
                                    <span className="pnl-est-label">Estimation value</span>
                                    {balanceHidden
                                        ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                        : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                    }
                                </div>
                                <div className="pnl-est-amount-row">
                                    <span className="pnl-est-amount">{balanceHidden ? maskedValue : futuresEquity.toFixed(2) + ' USDT'}</span>
                                </div>
                                <div className="pnl-est-usd">{balanceHidden ? maskedValue : '≈$' + futuresEquity.toFixed(2)}</div>
                            </div>

                            <div className="pnl-periods-section">
                                <div className="pnl-periods-row">
                                    {['Today\'s PNL', '7D PNL', '30D PNL'].map(period => (
                                        <div
                                            key={period}
                                            className={`pnl-period-item ${selectedPnlPeriod === period ? 'active' : ''}`}
                                            onClick={() => setSelectedPnlPeriod(period)}
                                        >
                                            <span className="pnl-period-label">{period}</span>
                                            <span className="pnl-period-icon">ⓘ</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pnl-period-values">
                                    <span className="pnl-period-value" style={{ color: futuresPnlColor }}>{balanceHidden ? maskedValue : futuresPnl.label}</span>
                                    <span className="pnl-period-value" style={{ color: futuresPnlColor }}>{balanceHidden ? maskedValue : futuresPnl.label}</span>
                                    <span className="pnl-period-value" style={{ color: futuresPnlColor }}>{balanceHidden ? maskedValue : futuresPnl.label}</span>
                                </div>
                            </div>

                            <div className="pnl-time-filters">
                                {['Last 7 days', 'Last 30 days', 'Custom time'].map(filter => (
                                    <button
                                        key={filter}
                                        className={`pnl-time-btn ${selectedTimeFilter === filter ? 'active' : ''}`}
                                        onClick={() => {
                                            setSelectedTimeFilter(filter)
                                            setShowHistoryPage(true)
                                        }}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            <div className="pnl-chart-section">
                                <div className="pnl-chart-header">
                                    <span className="pnl-chart-title">Cumulative profit and loss (%)</span>
                                    <span className="pnl-chart-value">%0</span>
                                </div>
                                <div className="pnl-chart-container pnl-chart-large">
                                    <div className="pnl-chart-y-axis">
                                        <span>4%</span>
                                        <span>3%</span>
                                        <span>2%</span>
                                        <span>1%</span>
                                        <span>0%</span>
                                    </div>
                                    <div className="pnl-chart-area">
                                        <svg viewBox="0 0 300 120" className="pnl-chart-svg" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#00b8a3" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#00b8a3" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M0,60 L30,50 L60,35 L90,40 L120,55 L150,45 L180,50 L210,60 L240,25 L270,10 L300,5" fill="none" stroke="#00b8a3" strokeWidth="2" />
                                            <path d="M0,60 L30,50 L60,35 L90,40 L120,55 L150,45 L180,50 L210,60 L240,25 L270,10 L300,5 L300,120 L0,120 Z" fill="url(#chartGradient)" />
                                        </svg>
                                    </div>
                                    <div className="pnl-chart-x-axis">
                                        <span>12/25</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pnl-chart-section">
                                <div className="pnl-chart-header">
                                    <span className="pnl-chart-title">Daily PnL</span>
                                    <span className="pnl-chart-value">USD 0.00</span>
                                </div>
                                <div className="pnl-chart-container pnl-chart-large">
                                    <div className="pnl-chart-y-axis">
                                        <span>4%</span>
                                        <span>3%</span>
                                        <span>2%</span>
                                        <span>1%</span>
                                        <span>0%</span>
                                    </div>
                                    <div className="pnl-chart-area">
                                        <div className="pnl-empty-chart"></div>
                                    </div>
                                    <div className="pnl-chart-x-axis">
                                        <span>12/25</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pnl-chart-section">
                                <div className="pnl-chart-header">
                                    <span className="pnl-chart-title">Cumulative PnL</span>
                                    <span className="pnl-chart-value">0.00USD</span>
                                </div>
                                <div className="pnl-chart-container pnl-chart-large">
                                    <div className="pnl-chart-y-axis">
                                        <span>4%</span>
                                        <span>3%</span>
                                        <span>2%</span>
                                        <span>1%</span>
                                        <span>0%</span>
                                    </div>
                                    <div className="pnl-chart-area">
                                        <div className="pnl-empty-chart"></div>
                                    </div>
                                    <div className="pnl-chart-x-axis">
                                        <span>12/25</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pnl-chart-section">
                                <div className="pnl-chart-header">
                                    <span className="pnl-chart-title">Total Assets value</span>
                                    <span className="pnl-chart-value">0.00USD</span>
                                </div>
                                <div className="pnl-chart-container pnl-chart-large">
                                    <div className="pnl-chart-y-axis">
                                        <span>4%</span>
                                        <span>3%</span>
                                        <span>2%</span>
                                        <span>1%</span>
                                        <span>0%</span>
                                    </div>
                                    <div className="pnl-chart-area">
                                        <div className="pnl-empty-chart"></div>
                                    </div>
                                    <div className="pnl-chart-x-axis">
                                        <span>12/25</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                        <span>12/27</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pnl-stats-section">
                                <div className="pnl-stat-row">
                                    <div className="pnl-stat-label">
                                        <span className="pnl-stat-dot"></span>
                                        Total Profit
                                    </div>
                                    <span className="pnl-stat-value">0.00USD</span>
                                </div>
                                <div className="pnl-stat-row">
                                    <div className="pnl-stat-label">
                                        <span className="pnl-stat-dot"></span>
                                        Winning Days
                                    </div>
                                    <span className="pnl-stat-value">0 Day</span>
                                </div>
                                <div className="pnl-stat-row">
                                    <div className="pnl-stat-label">
                                        <span className="pnl-stat-dot"></span>
                                        Total Loss
                                    </div>
                                    <span className="pnl-stat-value">0.00USD</span>
                                </div>
                                <div className="pnl-stat-row">
                                    <div className="pnl-stat-label">
                                        <span className="pnl-stat-dot"></span>
                                        Losing Days
                                    </div>
                                    <span className="pnl-stat-value">0 Day</span>
                                </div>
                                <div className="pnl-stat-row">
                                    <div className="pnl-stat-label">
                                        <span className="pnl-stat-dot"></span>
                                        Average Profit
                                    </div>
                                    <span className="pnl-stat-value">0.00USD</span>
                                </div>
                                <div className="pnl-stat-row">
                                    <div className="pnl-stat-label">
                                        <span className="pnl-stat-dot"></span>
                                        Breakeven Days
                                    </div>
                                    <span className="pnl-stat-value">7 Days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Page Overlay */}
            {showHistoryPage && (
                <div className="history-page-overlay">
                    <div className="history-header">
                        <button className="history-back-btn" onClick={() => setShowHistoryPage(false)}>
                            <ArrowLeft size={20} />
                        </button>
                        <span className="history-title">History</span>
                        <div className="history-header-spacer"></div>
                    </div>

                    <div className="history-filters-row">
                        <div className="history-dropdown">
                            <span>{historyAsset}</span>
                            <ChevronDown size={16} />
                        </div>
                        <div className="history-dropdown">
                            <span>{historyType}</span>
                            <ChevronDown size={16} />
                        </div>
                        <button className="history-filter-btn" onClick={() => setShowFilterPopup(true)}>
                            <Filter size={18} />
                        </button>
                    </div>

                    <div className="history-empty-state">
                        <div className="history-empty-icon">
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                <rect x="15" y="20" width="50" height="40" rx="4" stroke="#3a3a4a" strokeWidth="2" fill="none" />
                                <line x1="15" y1="32" x2="65" y2="32" stroke="#3a3a4a" strokeWidth="2" />
                                <line x1="25" y1="26" x2="35" y2="26" stroke="#3a3a4a" strokeWidth="2" />
                                <circle cx="55" cy="50" r="12" stroke="#3a3a4a" strokeWidth="2" fill="none" />
                                <line x1="63" y1="58" x2="70" y2="65" stroke="#3a3a4a" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className="history-empty-text">No data</span>
                    </div>
                </div>
            )}

            {/* Filter Bottom Popup */}
            {showFilterPopup && (
                <div className="filter-popup-overlay" onClick={() => setShowFilterPopup(false)}>
                    <div className="filter-popup-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-popup-header">
                            <span className="filter-popup-title">Filter</span>
                            <button className="filter-popup-close" onClick={() => setShowFilterPopup(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="filter-period-tabs">
                            {['1 Day', '1 week', '1 month', '3 months', '5 months'].map(period => (
                                <button
                                    key={period}
                                    className={`filter-period-tab ${selectedFilterPeriod === period ? 'active' : ''}`}
                                    onClick={() => setSelectedFilterPeriod(period)}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>

                        <div className="filter-date-range">
                            <div className="filter-date-input">
                                <span className="filter-date-label">Start</span>
                                <span className="filter-date-value">{filterStartDate}</span>
                            </div>
                            <span className="filter-date-arrow">→</span>
                            <div className="filter-date-input">
                                <span className="filter-date-label">End</span>
                                <span className="filter-date-value">{filterEndDate}</span>
                            </div>
                        </div>

                        <div className="filter-date-picker">
                            <div className="filter-picker-column">
                                {[2023, 2024, 2025, 2026, 2027].map(year => (
                                    <div
                                        key={year}
                                        className={`filter-picker-item ${selectedYear === year ? 'active' : ''}`}
                                        onClick={() => setSelectedYear(year)}
                                    >
                                        {year}
                                    </div>
                                ))}
                            </div>
                            <div className="filter-picker-column">
                                {[10, 11, 12, 1, 2].map(month => (
                                    <div
                                        key={month}
                                        className={`filter-picker-item ${selectedMonth === month ? 'active' : ''}`}
                                        onClick={() => setSelectedMonth(month)}
                                    >
                                        {month.toString().padStart(2, '0')}
                                    </div>
                                ))}
                            </div>
                            <div className="filter-picker-column">
                                {[17, 18, 19, 20, 21].map(day => (
                                    <div
                                        key={day}
                                        className={`filter-picker-item ${selectedDay === day ? 'active' : ''}`}
                                        onClick={() => setSelectedDay(day)}
                                    >
                                        {day.toString().padStart(2, '0')}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="filter-popup-actions">
                            <button className="filter-reset-btn" onClick={() => {
                                setSelectedFilterPeriod('1 Day')
                                setSelectedYear(2025)
                                setSelectedMonth(12)
                                setSelectedDay(19)
                            }}>
                                Reset
                            </button>
                            <button className="filter-confirm-btn" onClick={() => setShowFilterPopup(false)}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )

    const renderBotTab = () => (
        <>
            {/* Desktop View */}
            <div className="desktop-only bot-layout">
                <div className="bot-card">
                    <div className="bot-top-section">
                        <div className="bot-val-header">
                            <span className="bot-val-label">Valuation</span>
                            {balanceHidden
                                ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                                : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                            }
                        </div>
                        <div className="bot-val-amount">{balanceHidden ? maskedValue : '0.00 USDT'}</div>
                        <div className="bot-val-usd">{balanceHidden ? maskedValue : '≈$0.00'}</div>

                        <div className="bot-nav-pills">
                            <button className={`bot-pill ${botGridTab === 'spot' ? 'active' : ''}`} onClick={() => setBotGridTab('spot')}>Spot Grid</button>
                            <button className={`bot-pill ${botGridTab === 'futures' ? 'active' : ''}`} onClick={() => setBotGridTab('futures')}>Futures Grid</button>
                        </div>
                    </div>

                    <div className="bot-stats-row">
                        <div className="bot-stat-item">
                            <span className="bot-stat-label">Wallet Balance</span>
                            <span className="bot-stat-val">{balanceHidden ? maskedValue : '0.00 USDT'}</span>
                            <span className="bot-stat-sub">{balanceHidden ? maskedValue : '≈$0.00'}</span>
                        </div>

                        <div className="bot-stat-item bot-stat-right">
                            <span className="bot-stat-label">Total Profit</span>
                            <span className="bot-stat-val">{balanceHidden ? maskedValue : '0.00 USDT'}</span>
                            <span className="bot-stat-sub">{balanceHidden ? maskedValue : '≈$0.00'}</span>
                        </div>
                    </div>

                    <div className="bot-divider"></div>

                    <div className="bot-data-section">
                        <div className="bot-filter-row">
                            <div className={`bot-filter-item ${botDataFilter === 'running' ? 'active' : ''}`} onClick={() => setBotDataFilter('running')}>Running</div>
                            <div className={`bot-filter-item ${botDataFilter === 'assets' ? 'active' : ''}`} onClick={() => setBotDataFilter('assets')}>Assets</div>
                        </div>

                        {botDataFilter === 'running' ? (
                            <>
                                <div className="bot-grid-header">
                                    {botGridTab === 'spot' ? (
                                        <>
                                            <span>Strategy</span>
                                            <span>Strategy ID</span>
                                            <span>initial Investment</span>
                                            <span>Current Balance</span>
                                            <span>Total Profit</span>
                                            <span className="bot-header-right">Operation</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Pair</span>
                                            <span>Direction</span>
                                            <span>Leverage</span>
                                            <span>Margin</span>
                                            <span>Unrealized PnL</span>
                                            <span className="bot-header-right">Operation</span>
                                        </>
                                    )}
                                </div>

                                <div className="bot-empty-area">
                                    <div className="bot-empty-icon">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <circle cx="10" cy="13" r="2"></circle>
                                            <path d="M12 15l2 2"></path>
                                        </svg>
                                    </div>
                                    <span className="bot-empty-text">No running bots</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bot-grid-header">
                                    <span>Coin</span>
                                    <span>Available</span>
                                    <span>Frozen</span>
                                    <span className="bot-header-right">Total</span>
                                </div>

                                <div className="bot-empty-area">
                                    <div className="bot-empty-icon">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <circle cx="10" cy="13" r="2"></circle>
                                            <path d="M12 15l2 2"></path>
                                        </svg>
                                    </div>
                                    <span className="bot-empty-text">No assets</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-only mobile-bot-container">
                <div className="mb-valuation-section">
                    <div className="mb-val-header">
                        <span className="mb-val-label">Valuation</span>
                        <div className="mb-val-actions">
                            {balanceHidden
                                ? <EyeOff size={14} className="mb-eye-icon cursor-pointer" onClick={toggleBalanceVisibility} />
                                : <Eye size={14} className="mb-eye-icon cursor-pointer" onClick={toggleBalanceVisibility} />
                            }
                            <button className="mb-more-btn" onClick={() => setShowFeaturesPopup(true)}>
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="mb-val-amount-row">
                        <span className="mb-val-amount">{balanceHidden ? maskedValue : '0.00 USDT'}</span>
                    </div>
                    <div className="mb-val-usd">{balanceHidden ? maskedValue : '≈$0.00'}</div>
                </div>

                <div className="mb-grid-pills">
                    <button className={`mb-grid-pill ${botGridTab === 'spot' ? 'active' : ''}`} onClick={() => setBotGridTab('spot')}>Spot Grid</button>
                    <button className={`mb-grid-pill ${botGridTab === 'futures' ? 'active' : ''}`} onClick={() => setBotGridTab('futures')}>Futures Grid</button>
                </div>

                <div className="mb-stats-row">
                    <div className="mb-stat-item">
                        <span className="mb-stat-label">Wallet Balance</span>
                        <span className="mb-stat-value">{balanceHidden ? maskedValue : '0.00 USDT'}</span>
                        <span className="mb-stat-usd">{balanceHidden ? maskedValue : '≈$0.00'}</span>
                    </div>
                    <div className="mb-stat-item mb-stat-right">
                        <span className="mb-stat-label">Total Profit</span>
                        <span className="mb-stat-value">{balanceHidden ? maskedValue : '0.00 USDT'}</span>
                        <span className="mb-stat-usd">{balanceHidden ? maskedValue : '≈$0.00'}</span>
                    </div>
                </div>

                <div className="mb-action-buttons">
                    <button className="mb-create-btn" onClick={() => navigate(botGridTab === 'spot' ? '/dashboard/spot-grid' : '/dashboard/futures-trading')}>Create</button>
                    <button className="mb-history-btn" onClick={() => navigate('/dashboard/history')}>Trade history</button>
                </div>

                <div className="mb-tab-filters">
                    <button className={`mb-tab-filter ${botDataFilter === 'running' ? 'active' : ''}`} onClick={() => setBotDataFilter('running')}>Running</button>
                    <button className={`mb-tab-filter ${botDataFilter === 'assets' ? 'active' : ''}`} onClick={() => setBotDataFilter('assets')}>Assets</button>
                </div>

                {botDataFilter === 'running' ? (
                    <div className="mb-empty-state">
                        <div className="mb-empty-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="12" y="8" width="40" height="48" rx="4" stroke="#3a3a4a" strokeWidth="2" fill="none" />
                                <line x1="12" y1="20" x2="52" y2="20" stroke="#3a3a4a" strokeWidth="2" />
                                <rect x="18" y="28" width="16" height="12" rx="2" stroke="#00b8a3" strokeWidth="2" fill="none" />
                                <line x1="22" y1="32" x2="30" y2="32" stroke="#00b8a3" strokeWidth="2" />
                                <line x1="22" y1="36" x2="28" y2="36" stroke="#00b8a3" strokeWidth="2" />
                                <circle cx="44" cy="44" r="10" stroke="#3a3a4a" strokeWidth="2" fill="none" />
                                <line x1="51" y1="51" x2="56" y2="56" stroke="#3a3a4a" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className="mb-empty-text">No running bots</span>
                    </div>
                ) : (
                    <div className="mb-empty-state">
                        <div className="mb-empty-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect x="12" y="8" width="40" height="48" rx="4" stroke="#3a3a4a" strokeWidth="2" fill="none" />
                                <line x1="12" y1="20" x2="52" y2="20" stroke="#3a3a4a" strokeWidth="2" />
                                <rect x="18" y="28" width="16" height="12" rx="2" stroke="#00b8a3" strokeWidth="2" fill="none" />
                                <line x1="22" y1="32" x2="30" y2="32" stroke="#00b8a3" strokeWidth="2" />
                                <line x1="22" y1="36" x2="28" y2="36" stroke="#00b8a3" strokeWidth="2" />
                                <circle cx="44" cy="44" r="10" stroke="#3a3a4a" strokeWidth="2" fill="none" />
                                <line x1="51" y1="51" x2="56" y2="56" stroke="#3a3a4a" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className="mb-empty-text">No assets</span>
                    </div>
                )}

                {/* Features Popup */}
                {showFeaturesPopup && (
                    <>
                        <div className="features-overlay" onClick={() => setShowFeaturesPopup(false)}></div>
                        <div className="features-popup">
                            <div className="features-popup-header">
                                <span className="features-popup-title">Features</span>
                                <button className="features-popup-close" onClick={() => setShowFeaturesPopup(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="features-popup-grid">
                                <button className="features-item" onClick={() => { setShowFeaturesPopup(false); navigate('/dashboard/deposit'); }}>
                                    <div className="features-item-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                                        </svg>
                                    </div>
                                    <span className="features-item-label">Transfer</span>
                                </button>
                                <button className="features-item" onClick={() => { setShowFeaturesPopup(false); navigate('/dashboard/deposit'); }}>
                                    <div className="features-item-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                    </div>
                                    <span className="features-item-label">Deposit</span>
                                </button>
                                <button className="features-item" onClick={() => { setShowFeaturesPopup(false); navigate('/dashboard/bot-order'); }}>
                                    <div className="features-item-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <path d="M9 9h6M9 12h6M9 15h4" />
                                        </svg>
                                    </div>
                                    <span className="features-item-label">Bot Order</span>
                                </button>
                                <button className="features-item" onClick={() => { setShowFeaturesPopup(false); navigate('/dashboard/spot-grid'); }}>
                                    <div className="features-item-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="7" />
                                            <rect x="14" y="3" width="7" height="7" />
                                            <rect x="14" y="14" width="7" height="7" />
                                            <rect x="3" y="14" width="7" height="7" />
                                        </svg>
                                    </div>
                                    <span className="features-item-label">Strategy Plaza</span>
                                </button>
                            </div>
                            <button className="features-favorite-btn">
                                <Star size={16} fill="#FFFFFF" />
                                <span>Add to favorite</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    )

    const renderP2PTab = () => (
        <>
            {/* Desktop P2P View */}
            <div className="desktop-only p2p-layout">
                <div className="p2p-top-section">
                    <div className="p2p-val-header">
                        <span className="p2p-val-label">Valuation</span>
                        {balanceHidden
                            ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                            : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                        }
                    </div>
                    <div className="p2p-val-amount">{balanceHidden ? maskedValue : '0.00 USDT'}</div>
                    <div className="p2p-val-usd">{balanceHidden ? maskedValue : '≈$0.00'}</div>
                </div>

                <div className="p2p-toolbar">
                    <span className="p2p-fund-label">Fund list</span>
                    <div className="p2p-search-box">
                        <Search size={16} className="p2p-search-icon" />
                        <input type="text" placeholder="Search for currency pairs" className="p2p-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="p2p-empty-area">
                    <div className="p2p-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <circle cx="10" cy="13" r="2"></circle>
                            <path d="M12 15l2 2"></path>
                        </svg>
                    </div>
                    <span className="p2p-empty-text">No data</span>
                </div>
            </div>

            {/* Mobile P2P View */}
            <div className="mobile-only mobile-p2p-container">
                <div className="mobile-p2p-valuation">
                    <div className="mp2p-val-header">
                        <span className="mp2p-val-label">Valuation</span>
                        {balanceHidden
                            ? <EyeOff size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                            : <Eye size={14} className="text-zinc-500 cursor-pointer" onClick={toggleBalanceVisibility} />
                        }
                    </div>
                    <div className="mp2p-val-amount-row">
                        <span className="mp2p-val-amount">{balanceHidden ? maskedValue : '0.00 USDT'}</span>
                    </div>
                    <div className="mp2p-val-usd">{balanceHidden ? maskedValue : '≈$0.00'}</div>
                </div>

                <div className="mobile-p2p-buttons">
                    <button className="mp2p-btn-buy" onClick={() => navigate('/dashboard/buy')}>Buy</button>
                    <button className="mp2p-btn-action" onClick={() => navigate('/dashboard/sell')}>Sell</button>
                    <button className="mp2p-btn-action" onClick={() => navigate('/dashboard/deposit')}>Transfer</button>
                </div>

                <div className="mobile-p2p-fund-header">
                    <span className="mp2p-fund-label">Fund list</span>
                </div>

                <div className="mobile-p2p-filter">
                    <div className="mp2p-filter-left" onClick={() => setHideSmallAssets(!hideSmallAssets)} style={{ cursor: 'pointer' }}>
                        <div className="mp2p-checkbox" style={{ background: hideSmallAssets ? '#00b8a3' : 'transparent', borderColor: hideSmallAssets ? '#00b8a3' : undefined }}></div>
                        <span className="mp2p-filter-text">Hide other assets less than 1 USD</span>
                    </div>
                </div>

                <div className="mobile-p2p-empty">
                    <div className="mp2p-empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <circle cx="10" cy="13" r="2"></circle>
                            <path d="M12 15l2 2"></path>
                        </svg>
                    </div>
                    <span className="mp2p-empty-text">No data</span>
                </div>
            </div>
        </>
    )

    // Determine if footer should be shown
    const shouldShowFooter = activeTab === 'Futures account' || activeTab === 'Bot account' || activeTab === 'P2P account';

    return (
        <Layout activePage="assets" hideFooter={!shouldShowFooter} hideFooterMobile={true}>
            <div className="assets-page-container">
                <div className="assets-inner-wrapper">
                    <div className="desktop-only">
                        <h1 className="assets-page-title">Assets</h1>

                        {/* Modified Header with Buttons */}
                        <div className="assets-tabs-container">
                            <div className="assets-tabs-scroll">
                                {['Assets Overview', 'Spot account', 'Futures account', 'Bot account', 'P2P account'].map(tab => (
                                    <button
                                        key={tab}
                                        className={`assets-tab-v2 ${activeTab === tab ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <div className="assets-header-actions">
                                {activeTab === 'Bot account' ? (
                                    <>
                                        <button className="btn-emerald" onClick={() => navigate('/dashboard/spot-grid')}>Create</button>
                                        <button className="btn-dark" onClick={() => navigate('/dashboard/history')}>Trade history</button>
                                    </>
                                ) : activeTab === 'P2P account' ? (
                                    <>
                                        <button className="btn-emerald" onClick={() => navigate('/dashboard/buy')}>Buy</button>
                                        <button className="btn-dark" onClick={() => navigate('/dashboard/sell')}>Sell</button>
                                        <button className="btn-dark" onClick={() => navigate('/dashboard/deposit')}>Transfer</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn-emerald" onClick={() => navigate('/dashboard/deposit')}>Deposit</button>
                                        <button className="btn-dark" onClick={() => navigate('/dashboard/deposit')}>Transfer</button>
                                        <button className="btn-dark" onClick={() => navigate('/dashboard/withdraw')}>Withdraw</button>
                                        <button className="btn-dark" onClick={() => navigate('/dashboard/history')}>Trade history</button>
                                        <button className="btn-dark" onClick={() => navigate('/dashboard/history')}>Trade record</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Persistent Mobile Tabs & Title */}
                    <div className="mobile-only w-full flex flex-col">
                        <div className="mobile-assets-header">
                            <h2 className="mobile-assets-title">Assets</h2>
                        </div>
                        <div className="mobile-assets-tabs">
                            <div className="mobile-tabs-scroll">
                                {['Assets overview', 'Spot account', 'Futures account', 'Bot account', 'P2P account'].map(tab => (
                                    <div
                                        key={tab}
                                        className={`mobile-tab-item ${activeTab === tab || (activeTab === 'Assets Overview' && tab === 'Assets overview') ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab === 'Assets overview' ? 'Assets Overview' : tab)}
                                    >
                                        {tab}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="assets-content-area w-full">
                        {activeTab === 'Assets Overview' && renderOverview()}
                        {activeTab === 'Spot account' && renderSpot()}
                        {activeTab === 'Futures account' && renderFuturesTab()}
                        {activeTab === 'Bot account' && renderBotTab()}
                        {activeTab === 'P2P account' && renderP2PTab()}
                    </div>
                </div>
            </div>
        </Layout>
    )
}
