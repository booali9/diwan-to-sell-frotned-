import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, X, MoreVertical, ArrowLeft, ArrowUpDown, Sliders, Calculator, ChevronRight, History, HelpCircle, CandlestickChart, Grid3X3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMarketPrices, openTrade, getMyOpenTrades, closeTrade } from '../../services/tradeService'
import { getBalance, getFuturesBalance, setFuturesBalance as saveFuturesBalance, recordInternalTransfer, getLastKnownPrices, saveLastKnownPrices, getSpotHoldings } from '../../services/walletService'
import { useToast } from '../../context/ToastContext'
import Layout from '../../components/Layout/Layout'
import AdvanceTrade from './AdvanceTrade'
import '../../styles/futures.css'

export default function Futures() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'futures' | 'grid'>('futures')
  const [orderType, setOrderType] = useState('Limit order')
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false)
  const [bottomTab, setBottomTab] = useState<'positions' | 'open' | 'trigger'>('positions')
  const [tpSlEnabled, setTpSlEnabled] = useState(false)
  const [submittingSide, setSubmittingSide] = useState<'long' | 'short' | null>(null)
  const [livePrice, setLivePrice] = useState<number>(() => {
    const cached = getLastKnownPrices()
    return cached['BTC/USDT'] || cached['BTCUSDT'] || 0
  })
  const [userBalance, setUserBalance] = useState(0)
  const [futuresBalance, setFuturesBalanceState] = useState(() => getFuturesBalance())
  const [leverage, setLeverage] = useState(5)
  const [priceInput, setPriceInput] = useState('')
  const [sizeInput, setSizeInput] = useState('')
  const [tpPrice, setTpPrice] = useState('')
  const [slPrice, setSlPrice] = useState('')
  const [openPositions, setOpenPositions] = useState<any[]>([])
  // Tracks IDs that the user closed manually so the periodic poll doesn't
  // mistake them for admin-force-closed positions and double-credit the balance.
  const userClosedIds = useRef(new Set<string>())
  const [sizePercentage, setSizePercentage] = useState(0)
  const [marginType, setMarginType] = useState<'Cross' | 'Isolated'>('Cross')
  const [hideContractOnly, setHideContractOnly] = useState(false)
  const [fundingRate, setFundingRate] = useState('-0.0070%')
  const [fundingCountdown, setFundingCountdown] = useState('00:00:00')
  const [showPairModal, setShowPairModal] = useState(false)
  const [selectedFuturesPair, setSelectedFuturesPair] = useState(
    () => localStorage.getItem('dw_futures_pair') || 'BTCUSDT'
  )
  const [pairModalCategory, setPairModalCategory] = useState<'crypto'|'commodities'|'stocks'>(
    () => (localStorage.getItem('dw_futures_category') as 'crypto'|'commodities'|'stocks') || 'crypto'
  )
  const [pairSearch, setPairSearch] = useState('')
  const [allLivePrices, setAllLivePrices] = useState<Record<string,number>>({})
  const FUTURES_PAIRS_CATEGORIES = {
    crypto: [
      'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','AVAXUSDT',
      'ADAUSDT','DOTUSDT','LINKUSDT','LTCUSDT','MATICUSDT','NEARUSDT','APTUSDT',
      'ATOMUSDT','UNIUSDT','OPUSDT','ARBUSDT','SUIUSDT','TRXUSDT',
    ],
    commodities: ['XAUUSDT','XAGUSDT','WTIUSDT','XPTUSDT','NGUSDT'],
    stocks: [
      'AAPLUSDT','TSLAUSDT','NVDAUSDT','AMZNUSDT','MSFTUSDT','GOOGLUSDT',
      'METAUSDT','NFLXUSDT','AMDUSDT','INTCUSDT','JPMUSDT','BACUSDT',
      'DISUSDT','UBERUSDT','COINUSDT','ARAMCOUSDT','RTXUSDT','XOMUSDT',
      'CVXUSDT','BRKBUSDT','LLYUSDT','UNHUSDT','HDUSDT','COSTUSDT',
      'ABBVUSDT','MRKUSDT','TMOUSDT','CSCOUSDT','TMUSUSDT','TXNUSDT',
      'NVOUSDT','TMUSDT','SAPUSDT','SONYUSDT','BHPUSDT','LMTUSDT','CATUSDT'
    ],
  }
  const PAIR_DISPLAY_NAMES: Record<string, string> = {
    // Commodities
    XAUUSDT:'XAU/USDT', XAGUSDT:'XAG/USDT', WTIUSDT:'WTI/USDT', XPTUSDT:'XPT/USDT', NGUSDT:'NG/USDT',
    // Stocks
    AAPLUSDT:'AAPL/USDT', TSLAUSDT:'TSLA/USDT', NVDAUSDT:'NVDA/USDT', AMZNUSDT:'AMZN/USDT',
    MSFTUSDT:'MSFT/USDT', GOOGLUSDT:'GOOGL/USDT', METAUSDT:'META/USDT', NFLXUSDT:'NFLX/USDT',
    AMDUSDT:'AMD/USDT', INTCUSDT:'INTC/USDT', JPMUSDT:'JPM/USDT', BACUSDT:'BAC/USDT',
    DISUSDT:'DIS/USDT', UBERUSDT:'UBER/USDT', COINUSDT:'COIN/USDT',
    ARAMCOUSDT:'ARAMCO/USDT', RTXUSDT:'RTX/USDT', XOMUSDT:'XOM/USDT', CVXUSDT:'CVX/USDT',
    BRKBUSDT:'BRK-B/USDT', LLYUSDT:'LLY/USDT', UNHUSDT:'UNH/USDT', HDUSDT:'HD/USDT',
    COSTUSDT:'COST/USDT', ABBVUSDT:'ABBV/USDT', MRKUSDT:'MRK/USDT', TMOUSDT:'TMO/USDT',
    CSCOUSDT:'CSCO/USDT', TMUSUSDT:'TMUS/USDT', TXNUSDT:'TXN/USDT', NVOUSDT:'NVO/USDT',
    TMUSDT:'TM/USDT', SAPUSDT:'SAP/USDT', SONYUSDT:'SONY/USDT', BHPUSDT:'BHP/USDT',
    LMTUSDT:'LMT/USDT', CATUSDT:'CAT/USDT',
  }
  const PAIR_LABELS: Record<string, string> = {
    // Commodities
    XAUUSDT:'Gold', XAGUSDT:'Silver', WTIUSDT:'Crude Oil', XPTUSDT:'Platinum', NGUSDT:'Natural Gas',
    // Stocks
    AAPLUSDT:'Apple', TSLAUSDT:'Tesla', NVDAUSDT:'NVIDIA', AMZNUSDT:'Amazon',
    MSFTUSDT:'Microsoft', GOOGLUSDT:'Alphabet', METAUSDT:'Meta', NFLXUSDT:'Netflix',
    AMDUSDT:'AMD', INTCUSDT:'Intel', JPMUSDT:'JPMorgan', BACUSDT:'Bank of America',
    DISUSDT:'Disney', UBERUSDT:'Uber', COINUSDT:'Coinbase',
      ARAMCOUSDT:'Saudi Aramco', RTXUSDT:'RTX Corporation', XOMUSDT:'ExxonMobil', CVXUSDT:'Chevron',
      BRKBUSDT:'Berkshire Hathaway', LLYUSDT:'Eli Lilly', UNHUSDT:'UnitedHealth', HDUSDT:'Home Depot',
      COSTUSDT:'Costco', ABBVUSDT:'AbbVie', MRKUSDT:'Merck & Co.', TMOUSDT:'Thermo Fisher',
      CSCOUSDT:'Cisco', TMUSUSDT:'T-Mobile US', TXNUSDT:'Texas Instruments', NVOUSDT:'Novo Nordisk',
      TMUSDT:'Toyota', SAPUSDT:'SAP SE', SONYUSDT:'Sony Group', BHPUSDT:'BHP Group',
      LMTUSDT:'Lockheed Martin', CATUSDT:'Caterpillar',
    }

  const handleNumericInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return
    setter(cleaned)
  }

  const handleFuturesTrade = async (side: 'long' | 'short') => {
    const amt = Number(sizeInput)
    if (!sizeInput || isNaN(amt) || amt <= 0) { toast('Please enter a USDT amount', 'warning'); return }
    // amt is the NOTIONAL trade size; margin deducted = notional / leverage
    const effectiveBal = futuresBalance
    const requiredMargin = amt / leverage
    if (requiredMargin > effectiveBal) { toast('Insufficient futures balance. Transfer funds from Spot first.', 'warning'); return }
    // Use cached price as last resort
    const effectiveLivePrice = livePrice > 0 ? livePrice : (() => {
      const cached = getLastKnownPrices()
      const pk = selectedFuturesPair.replace(/USDT$/, '/USDT')
      return cached[pk] || cached[selectedFuturesPair] || allLivePrices[selectedFuturesPair] || 0
    })()
    if (effectiveLivePrice <= 0) { toast('Waiting for price data...', 'warning'); return }
    if (effectiveLivePrice !== livePrice) setLivePrice(effectiveLivePrice)

    // ── Limit order direction validation ───────────────────────────────────────
    // A long (buy) limit only makes sense BELOW the current market price.
    //   → You want to buy cheaper, e.g. market=70k, set limit=65k.
    // A short (sell) limit only makes sense ABOVE the current market price.
    //   → You want to sell higher, e.g. market=70k, set limit=75k.
    // Setting the opposite direction means the order would fill immediately — that's a Market order.
    if (orderType === 'Limit order') {
      const limitPriceVal = parseFloat(priceInput)
      if (!priceInput || isNaN(limitPriceVal) || limitPriceVal <= 0) {
        toast('Please enter a valid limit price', 'warning'); return
      }
      if (side === 'long' && limitPriceVal >= effectiveLivePrice) {
        toast(
          `Limit price $${limitPriceVal.toFixed(2)} is at or above the market price $${effectiveLivePrice.toFixed(2)}. ` +
          `A long (buy) limit must be BELOW the market price so it fills when price drops to it.`,
          'warning'
        )
        return
      }
      if (side === 'short' && limitPriceVal <= effectiveLivePrice) {
        toast(
          `Limit price $${limitPriceVal.toFixed(2)} is at or below the market price $${effectiveLivePrice.toFixed(2)}. ` +
          `A short (sell) limit must be ABOVE the market price so it fills when price rises to it.`,
          'warning'
        )
        return
      }
    }

    setSubmittingSide(side)
    try {
      const isLimitOrder = orderType === 'Limit order'
      // Market orders must ALWAYS fill at live price to prevent artificial PnL.
      // Limit orders use the user-specified price input.
      const entryPrice = isLimitOrder ? (parseFloat(priceInput) || effectiveLivePrice) : effectiveLivePrice
      // amt is the notional USDT size; coin amount = notional / entry price
      const coinAmount = parseFloat((amt / entryPrice).toFixed(8))
      const tradeSide = side === 'long' ? 'buy' : 'sell'
      const selectedAsset = selectedFuturesPair.replace(/USDT$/, '')
      try {
        await openTrade({
          asset: selectedAsset, type: 'futures', side: tradeSide,
          amount: coinAmount, price: entryPrice, entryPrice, leverage,
          ...(isLimitOrder ? { orderType: 'limit', limitPrice: entryPrice } : { orderType: 'market' })
        })
      } catch (tradeErr: any) {
        const msg = (tradeErr?.message || '').toLowerCase()
        // Propagate validation errors — do NOT simulate locally or deduct balance
        if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('margin')) {
          toast(tradeErr.message || 'Insufficient futures balance', 'error')
          setSubmittingSide(null)
          return
        }
        // Network/server error only — simulate locally
        const newPosition = {
          _id: `local_${Date.now()}`,
          asset: selectedAsset,
          type: 'futures',
          side: tradeSide,
          amount: coinAmount,
          entryPrice: entryPrice,
          leverage,
          marginUsed: requiredMargin,
          status: isLimitOrder ? 'pending' : 'open',
          pnl: 0,
          createdAt: new Date().toISOString()
        }
        setOpenPositions(prev => [...prev, newPosition])
      }
      // Deduct margin from futures balance (only reached if trade succeeded or was simulated locally)
      const newFutBal = parseFloat((futuresBalance - requiredMargin).toFixed(2))
      setFuturesBalanceState(newFutBal)
      saveFuturesBalance(newFutBal)
      toast(`${side === 'long' ? 'Long' : 'Short'} position opened!`, 'success')
      setSizeInput('')
      setSizePercentage(0)
      // Try to refresh from backend (include pending limit orders)
      try {
        const [balRes, trades] = await Promise.all([getBalance(), getMyOpenTrades()])
        if (balRes.balance > 0) setUserBalance(balRes.balance)
        if (typeof (balRes as any).futuresBalance === 'number') setFuturesBalanceState((balRes as any).futuresBalance)
        if (trades.length > 0) setOpenPositions((trades as any[]).filter((t: any) => t.type === 'futures' && (t.status === 'open' || t.status === 'pending' || !t.status)))
      } catch { /* keep local state */ }
    } catch (e: any) { toast(e.message || 'Trade failed', 'error') }
    finally { setSubmittingSide(null) }
  }

  const handleClosePosition = async (tradeId: string) => {
    // Register this ID immediately (before any await) so the periodic poll
    // knows this close was user-initiated and won't double-credit the balance.
    if (!tradeId.startsWith('local_')) userClosedIds.current.add(tradeId)
    try {
      const pos = openPositions.find(p => p._id === tradeId)
      const isPending = pos?.status === 'pending'

      // For pending orders (limit orders not yet filled): margin is always returned in full — no PnL.
      // For open positions (already filled): margin + PnL is returned.
      const localMargin = pos?.marginUsed
        ?? ((pos?.amount ?? 0) * (pos?.entryPrice ?? livePrice) / (pos?.leverage ?? leverage))

      if (tradeId.startsWith('local_')) {
        const pnl = isPending ? 0 : (pos?.unrealizedPnL ?? pos?.pnl ?? 0)
        const returnAmt = Math.max(0, localMargin + pnl)
        setOpenPositions(prev => prev.filter(p => p._id !== tradeId))
        const newFutBal = parseFloat((getFuturesBalance() + returnAmt).toFixed(2))
        setFuturesBalanceState(newFutBal)
        saveFuturesBalance(newFutBal)
      } else {
        // For pending limit orders: don't wait on backend PnL — simply refund the locked margin.
        // For open positions: use backend response for accurate PnL settlement.
        if (isPending) {
          await closeTrade(tradeId).catch(() => null)
          // Return the locked margin to the futures balance regardless of API result
          const newFutBal = parseFloat((getFuturesBalance() + localMargin).toFixed(2))
          setFuturesBalanceState(newFutBal)
          saveFuturesBalance(newFutBal)
          setOpenPositions(prev => prev.filter(p => p._id !== tradeId))
        } else {
          const closeRes = await closeTrade(tradeId)
          const closedTrade = closeRes?.trade
          // Use backend marginUsed if available, otherwise fall back to local value
          const margin = (closedTrade?.marginUsed ?? localMargin)
          const pnl = closedTrade?.pnl ?? 0
          const returnAmt = Math.max(0, margin + pnl)
          const newFutBal = parseFloat((getFuturesBalance() + returnAmt).toFixed(2))
          setFuturesBalanceState(newFutBal)
          saveFuturesBalance(newFutBal)
          // Refresh positions list (open + pending — futures only)
          const trades = await getMyOpenTrades()
          setOpenPositions((trades as any[]).filter((t: any) => t.type === 'futures' && (t.status === 'open' || t.status === 'pending' || !t.status)))
        }
      }
      toast(isPending ? 'Order cancelled — margin returned' : 'Position closed', 'success')
    } catch (e: any) { toast(e.message || 'Close failed', 'error') }
  }

  // New modal states
  const [showIncreaseBalance, setShowIncreaseBalance] = useState(false)
  const [showBalanceTransfer, setShowBalanceTransfer] = useState(false)
  const [showMoreModal, setShowMoreModal] = useState(false)
  const [showPreference, setShowPreference] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showDepthModal, setShowDepthModal] = useState(false)
  const [showOrderBookModal, setShowOrderBookModal] = useState(false)

  // Transfer states
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDirection, setTransferDirection] = useState<'spot-to-futures' | 'futures-to-spot'>('spot-to-futures')
  const [transferCoin, setTransferCoin] = useState('USDT')
  const [showTransferCoinDropdown, setShowTransferCoinDropdown] = useState(false)
  const [transferCoinSearch, setTransferCoinSearch] = useState('')
  const TRANSFER_COINS = [
    'USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT',
    'MATIC', 'LINK', 'UNI', 'SHIB', 'LTC', 'ATOM', 'ETC', 'XLM', 'NEAR', 'FIL',
    'APT', 'ARB', 'OP', 'SUI', 'SEI', 'TIA', 'INJ', 'FET', 'RNDR', 'GRT',
    'IMX', 'STX', 'ALGO', 'SAND', 'MANA', 'AXS', 'GALA', 'ENJ', 'CHZ', 'CRV',
    'AAVE', 'MKR', 'COMP', 'SNX', 'LDO', 'RPL', 'FXS', 'PENDLE', 'GMX', 'DYDX',
    'PEPE', 'WIF', 'BONK', 'FLOKI', 'MEME', 'ORDI', 'SATS', '1000SATS', 'RUNE',
    'TRX', 'VET', 'HBAR', 'ICP', 'FTM', 'EGLD', 'THETA', 'QNT', 'KAS', 'TON',
    'TWT', 'WOO', 'JOE', 'CAKE', 'SUSHI', 'BAL', '1INCH', 'LQTY', 'ZRX', 'CELO',
  ]
  const filteredTransferCoins = TRANSFER_COINS.filter(c => c.toLowerCase().includes(transferCoinSearch.toLowerCase()))

  // Fetch commodity prices via backend (Yahoo Finance GC=F, SI=F, CL=F — no CORS issues)
  useEffect(() => {
    const backendBase = import.meta.env.VITE_API_BASE_URL
      ? `${import.meta.env.VITE_API_BASE_URL}/api/trades`
      : 'http://localhost:5000/api/trades'
    const fetchCommodities = async () => {
      try {
        const r = await fetch(
          `${backendBase}/prices?symbols=${encodeURIComponent('XAU/USDT,XAG/USDT,WTI/USDT,XPT/USDT,NG/USDT')}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (!r.ok) return
        const data = await r.json() as Record<string, number>
        const map: Record<string, string> = {
          'XAU/USDT': 'XAUUSDT', 'XAG/USDT': 'XAGUSDT', 'WTI/USDT': 'WTIUSDT',
          'XPT/USDT': 'XPTUSDT', 'NG/USDT': 'NGUSDT',
        }
        const prices: Record<string, number> = {}
        for (const [sym, pairKey] of Object.entries(map)) {
          const p = data[sym]
          if (typeof p === 'number' && p > 0) prices[pairKey] = p
        }
        setAllLivePrices(prev => ({ ...prev, ...prices }))
      } catch { /* ignore */ }
    }
    fetchCommodities()
    const t = setInterval(fetchCommodities, 30000)
    return () => clearInterval(t)
  }, [])

  // Fetch all crypto pair prices for the pair selector modal
  useEffect(() => {
    const cryptoSymbols = 'BTC,ETH,BNB,SOL,XRP,DOGE,AVAX,ADA,DOT,LINK,LTC,MATIC,NEAR,APT,ATOM,UNI,OP,ARB,SUI,TRX'
    const fetchAllCrypto = async () => {
      try {
        const r = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptoSymbols}&tsyms=USDT`,
          { signal: AbortSignal.timeout(6000) }
        )
        if (!r.ok) return
        const data = await r.json() as Record<string, { USDT?: number }>
        const prices: Record<string, number> = {}
        for (const [sym, vals] of Object.entries(data)) {
          if (vals.USDT) prices[`${sym}USDT`] = vals.USDT
        }
        setAllLivePrices(prev => ({ ...prev, ...prices }))
      } catch { /* ignore */ }
    }
    fetchAllCrypto()
    const t = setInterval(fetchAllCrypto, 15000)
    return () => clearInterval(t)
  }, [])

  // Fetch all stock prices for the pair selector modal
  useEffect(() => {
    const backendBase = import.meta.env.VITE_API_BASE_URL
      ? `${import.meta.env.VITE_API_BASE_URL}/api/trades`
      : 'http://localhost:5000/api/trades'
    const stockMap: Record<string, string> = {
      'AAPL/USD': 'AAPLUSDT', 'TSLA/USD': 'TSLAUSDT', 'NVDA/USD': 'NVDAUSDT',
      'AMZN/USD': 'AMZNUSDT', 'MSFT/USD': 'MSFTUSDT', 'GOOGL/USD': 'GOOGLUSDT',
      'META/USD': 'METAUSDT', 'NFLX/USD': 'NFLXUSDT', 'AMD/USD': 'AMDUSDT',
      'INTC/USD': 'INTCUSDT', 'JPM/USD': 'JPMUSDT', 'BAC/USD': 'BACUSDT',
      'DIS/USD': 'DISUSDT', 'UBER/USD': 'UBERUSDT', 'COIN/USD': 'COINUSDT',
      'ARAMCO/USD': 'ARAMCOUSDT', 'RTX/USD': 'RTXUSDT', 'XOM/USD': 'XOMUSDT', 'CVX/USD': 'CVXUSDT',
      'BRK-B/USD': 'BRKBUSDT', 'LLY/USD': 'LLYUSDT', 'UNH/USD': 'UNHUSDT', 'HD/USD': 'HDUSDT',
      'COST/USD': 'COSTUSDT', 'ABBV/USD': 'ABBVUSDT', 'MRK/USD': 'MRKUSDT', 'TMO/USD': 'TMOUSDT',
      'CSCO/USD': 'CSCOUSDT', 'TMUS/USD': 'TMUSUSDT', 'TXN/USD': 'TXNUSDT', 'NVO/USD': 'NVOUSDT',
      'TM/USD': 'TMUSDT', 'SAP/USD': 'SAPUSDT', 'SONY/USD': 'SONYUSDT', 'BHP/USD': 'BHPUSDT',
      'LMT/USD': 'LMTUSDT', 'CAT/USD': 'CATUSDT',
    }
    const symbols = Object.keys(stockMap).join(',')
    const fetchAllStocks = async () => {
      try {
        const r = await fetch(
          `${backendBase}/prices?symbols=${encodeURIComponent(symbols)}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (!r.ok) return
        const data = await r.json()
        const prices: Record<string, number> = {}
        for (const [sym, pairKey] of Object.entries(stockMap)) {
          const price = (data as any)[sym] ?? (data as any)[sym.split('/')[0]]
          if (typeof price === 'number' && price > 0) prices[pairKey] = price
        }
        setAllLivePrices(prev => ({ ...prev, ...prices }))
      } catch { /* ignore */ }
    }
    fetchAllStocks()
      const t = setInterval(fetchAllStocks, 5000)
      return () => clearInterval(t)
  }, [])

  // Fetch live price, balance, and positions
  useEffect(() => {
    const pairKey = selectedFuturesPair.replace(/USDT$/, '/USDT')
    const fetchLiveData = async () => {
      // Fetch price independently so a balance/trades failure never zeros the price
      try {
        const prices = await getMarketPrices([pairKey])
        const p = prices[pairKey] || 0
        if (p > 0) {
          setLivePrice(p)
          setAllLivePrices(prev => ({ ...prev, [selectedFuturesPair]: p }))
          saveLastKnownPrices({ [pairKey]: p })
        } else {
          // Fall back to last known cached price
          const cached = getLastKnownPrices()
          const fallback = cached[pairKey] || cached[selectedFuturesPair] || 0
          if (fallback > 0) setLivePrice(fallback)
        }
      } catch {
        // API failed — use cached price so trading still works
        const cached = getLastKnownPrices()
        const fallback = cached[pairKey] || cached[selectedFuturesPair] || 0
        if (fallback > 0) setLivePrice(fallback)
      }
      try {
        const balRes = await getBalance().catch(() => ({ balance: 0 }))
        setUserBalance(balRes.balance || 0)
        setFuturesBalanceState(typeof (balRes as any).futuresBalance === 'number' ? (balRes as any).futuresBalance : getFuturesBalance())
      } catch { /* ignore balance failure */ }
      try {
        const trades = await getMyOpenTrades()
        const newFutures = (trades as any[]).filter(
          (t: any) => t.type === 'futures' && (t.status === 'open' || t.status === 'pending' || !t.status)
        )

        // Detect positions that disappeared from the open list (admin force-closed or liquidated).
        const newIds = new Set(newFutures.map((t: any) => t._id))
        const prevIds = new Set(openPositionsRef.current.map((p: any) => p._id))
        for (const prevPos of openPositionsRef.current) {
          if (typeof prevPos._id === 'string' && prevPos._id.startsWith('local_')) continue
          if (newIds.has(prevPos._id)) continue
          if (userClosedIds.current.has(prevPos._id)) {
            userClosedIds.current.delete(prevPos._id)
            continue
          }
          const margin = Number(prevPos.marginUsed) || 0
          const pnl = Number(prevPos.unrealizedPnL ?? prevPos.pnl) || 0
          const returnAmt = Math.max(0, margin + pnl)
          if (returnAmt > 0) {
            const newFutBal = parseFloat((getFuturesBalance() + returnAmt).toFixed(2))
            setFuturesBalanceState(newFutBal)
            saveFuturesBalance(newFutBal)
          }
        }

        // Detect positions that appeared without user action (admin opened a trade).
        // Deduct their margin from the futures balance so the displayed balance stays accurate.
        // Only do this when we already have a loaded position set (not on initial empty mount)
        // to avoid double-deducting on every page refresh.
        if (openPositionsRef.current.length > 0 || prevIds.size > 0) {
          for (const pos of newFutures) {
            if (typeof pos._id === 'string' && pos._id.startsWith('local_')) continue
            if (!prevIds.has(pos._id)) {
              // Newly appeared position — deduct margin from futures balance
              const margin = Number(pos.marginUsed) || 0
              if (margin > 0) {
                const newFutBal = parseFloat(Math.max(0, getFuturesBalance() - margin).toFixed(2))
                setFuturesBalanceState(newFutBal)
                saveFuturesBalance(newFutBal)
              }
            }
          }
        }

        setOpenPositions(newFutures)
      } catch {
        // On API failure, keep the current positions visible rather than clearing them
        // so the user doesn't see a false "No positions" state
      }
    }
    // Seed from cache immediately while API loads
    const cachedNow = getLastKnownPrices()
    const pairKeySeed = selectedFuturesPair.replace(/USDT$/, '/USDT')
    const seedPrice = cachedNow[pairKeySeed] || cachedNow[selectedFuturesPair] || allLivePrices[selectedFuturesPair] || 0
    if (seedPrice > 0) setLivePrice(seedPrice)
    else setLivePrice(0)
    setPriceInput('')
    fetchLiveData()
      const interval = setInterval(fetchLiveData, 4000)
      return () => clearInterval(interval)
  }, [selectedFuturesPair])

  // For limit orders, auto-fill price input when first switching to limit if empty
  useEffect(() => {
    if (orderType !== 'Market order' && priceInput === '' && livePrice > 0) {
      setPriceInput(livePrice.toFixed(2))
    }
  }, [orderType])

  // ── Local limit order watcher ───────────────────────────────────────────────
  // When the backend call fails, limit orders are stored locally with status='pending'.
  // This effect watches livePrice and auto-fills those local pending orders when
  // the market price reaches the limit price (same trigger logic as the backend worker).
  const openPositionsRef = useRef(openPositions)
  openPositionsRef.current = openPositions
  useEffect(() => {
    if (livePrice <= 0) return
    const pendingLocal = openPositionsRef.current.filter(
      p => typeof p._id === 'string' && p._id.startsWith('local_') && p.status === 'pending'
    )
    if (pendingLocal.length === 0) return

    const toFill = pendingLocal.filter(pos => {
      const isLong = pos.side === 'buy' || pos.side === 'long'
      const limitPrice = pos.entryPrice
      if (!limitPrice || limitPrice <= 0) return false
      // Long fills when market price drops to/below limit; short fills when price rises to/above limit
      return isLong ? livePrice <= limitPrice : livePrice >= limitPrice
    })

    if (toFill.length > 0) {
      const fillIds = new Set(toFill.map(p => p._id))
      setOpenPositions(prev =>
        prev.map(p => fillIds.has(p._id) ? { ...p, status: 'open' } : p)
      )
      toFill.forEach(pos => {
        const isLong = pos.side === 'buy' || pos.side === 'long'
        toast(
          `Limit order filled! ${pos.asset} ${isLong ? 'Long' : 'Short'} at $${Number(pos.entryPrice).toFixed(2)}`,
          'success'
        )
      })
    }
  }, [livePrice])

  // Dynamic funding countdown — updates every second
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = now.getUTCHours()
      const nextH = h < 8 ? 8 : h < 16 ? 16 : 24
      const next = new Date(now)
      if (nextH === 24) { next.setUTCDate(next.getUTCDate() + 1); next.setUTCHours(0, 0, 0, 0) }
      else { next.setUTCHours(nextH, 0, 0, 0) }
      const diff = Math.max(0, next.getTime() - now.getTime())
      const hh = Math.floor(diff / 3600000)
      const mm = Math.floor((diff % 3600000) / 60000)
      const ss = Math.floor((diff % 60000) / 1000)
      setFundingCountdown(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch live funding rate from Binance Futures API
  useEffect(() => {
    const fetchFunding = async () => {
      try {
        const res = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${selectedFuturesPair}`)
        const data = await res.json()
        if (data.lastFundingRate !== undefined) {
          const r = parseFloat(data.lastFundingRate) * 100
          setFundingRate(`${r >= 0 ? '+' : ''}${r.toFixed(4)}%`)
        }
      } catch { /* keep previous value */ }
    }
    fetchFunding()
    const t = setInterval(fetchFunding, 60000)
    return () => clearInterval(t)
  }, [selectedFuturesPair])

  // Preference states
  const [hedgingMode] = useState(true)
  const [secondConfirmation, setSecondConfirmation] = useState(true)
  const [reverseConfirmation, setReverseConfirmation] = useState(true)

  // Calculator states
  const [calcTab, setCalcTab] = useState<'profit' | 'target' | 'liquidation'>('profit')
  const [calcSide, setCalcSide] = useState<'long' | 'short'>('long')
  const [calcLeverage, setCalcLeverage] = useState(3)

  // ── Simulation tick: random value refreshed every 3 s ─────────────────
  const [simTick, setSimTick] = useState(() => Math.random())
  useEffect(() => {
    const t = setInterval(() => setSimTick(Math.random()), 3000)
    return () => clearInterval(t)
  }, [])
  /**
   * Returns a simulated numeric string: base ± up to 4% random flutter.
   * Value changes every 3 s automatically via simTick.
   */
  const simVal = useCallback((base: number, decimals = 2): string => {
    const b = base > 0 ? base : 100
    return (b * (1 + (simTick - 0.5) * 0.04)).toFixed(decimals)
  }, [simTick])

  // Effective balance: strictly the futures wallet — never fall back to spot balance.
  // Spot funds must be transferred to futures before trading.
  const effectiveBalance = futuresBalance

  // Positions tab: filled/open trades; Open Orders tab: pending limit orders
  const activePositions = openPositions.filter(p => p.status === 'open' || !p.status)
  const pendingOrders = openPositions.filter(p => p.status === 'pending')

  // Depth state
  const [selectedDepth, setSelectedDepth] = useState('0.01')

  // Order book filter state
  const [orderBookFilter, setOrderBookFilter] = useState('orderbook')

  // Order book data - live from API
  const [bidOrders, setBidOrders] = useState<{ price: string; size: string; depth: number; highlight?: boolean }[]>([])
  const [askOrders, setAskOrders] = useState<{ price: string; size: string; depth: number; highlight?: boolean }[]>([])

  useEffect(() => {
    const fetchOrderBook = async () => {
      const obPairKey = selectedFuturesPair.replace(/USDT$/, '/USDT')
      try {
        const prices = await getMarketPrices([obPairKey])
        const p = prices[obPairKey] || 0
        if (p > 0) {
          // Also keep livePrice in sync as a fallback
          setLivePrice(prev => prev > 0 ? prev : p)
          setPriceInput(prev => (prev === '' || prev === '0') ? p.toFixed(2) : prev)
          const bids = Array.from({ length: 28 }, (_, i) => {
            const offset = (i + 1) * p * 0.0001 * (1 + Math.random() * 0.5)
            return {
              price: (p - offset).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              size: (Math.random() * 5000 + 500).toFixed(2),
              depth: Math.floor(Math.random() * 40 + 10),
            }
          })
          const asks = Array.from({ length: 28 }, (_, i) => {
            const offset = (i + 1) * p * 0.0001 * (1 + Math.random() * 0.5)
            return {
              price: (p + offset).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              size: (Math.random() * 5000 + 500).toFixed(2),
              highlight: i < 2,
              depth: Math.floor(Math.random() * 40 + 15),
            }
          })
          setBidOrders(bids)
          setAskOrders(asks)
        }
      } catch { /* ignore */ }
    }
    fetchOrderBook()
    const interval = setInterval(fetchOrderBook, 10000)
    return () => clearInterval(interval)
  }, [selectedFuturesPair])

  const orderTypes = [
    { label: 'Limit order', active: true },
    { label: 'Market order', active: false },
    { label: 'Stop order', active: false },
    { label: 'P/O', active: false },
    { label: 'IOC', active: false },
    { label: 'FOK', active: false },
  ]

  return (
    <Layout activePage="futures" hideFooter={false}>
      {/* Mobile Futures View */}
      <div className="mobile-only">
        <div className="futures-mobile-layout-v3">
          {/* Main Title Header */}
          <div className="fm-main-header">
            <span className="fm-title">Futures</span>
            <span className="fm-subtitle" onClick={() => navigate('/dashboard/spot-grid')} style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,192,163,0.4)' }}>Grid</span>
          </div>

          <div className="fm-scroll-container">
            {/* Pair Selector Row */}
            <div className="fm-pair-selector">
              <div className="fm-pair-info">
                <div className="fm-pair-name-box" onClick={() => { setShowPairModal(true); setPairSearch('') }} style={{ cursor: 'pointer' }}>
                  <span className="fm-pair-name">{PAIR_DISPLAY_NAMES[selectedFuturesPair] || selectedFuturesPair.replace(/USDT$/, '/USDT')}</span>
                  <span className="fm-pair-perp">Perp</span>
                  <ChevronDown size={14} className="fm-dropdown-arrow" />
                </div>
              </div>
              <div className="fm-pair-actions">
                <MoreVertical size={20} className="fm-action-icon" onClick={() => setShowMoreModal(true)} />
                <CandlestickChart size={20} className="fm-action-icon" onClick={() => navigate('/dashboard/trade')} />
              </div>
            </div>

            {/* Main Trading Content - Two Column Layout */}
            <div className="fm-trading-layout">
              {/* Left Column - Order Book */}
              <div className="fm-orderbook-column">
                {/* Margin and Leverage */}
                <div className="fm-margin-row">
                  <div className="fm-margin-type" onClick={() => setMarginType(marginType === 'Cross' ? 'Isolated' : 'Cross')} style={{ cursor: 'pointer' }}>
                    <span>{marginType}</span>
                    <ChevronDown size={10} />
                  </div>
                  <div className="fm-leverage">
                    <span onClick={() => {
                      const next = leverage === 125 ? 1 : leverage < 5 ? 5 : leverage < 10 ? 10 : leverage < 20 ? 20 : leverage < 50 ? 50 : leverage < 75 ? 75 : leverage < 100 ? 100 : 125
                      setLeverage(next)
                    }} style={{ cursor: 'pointer' }}>{leverage}x</span>
                    <ChevronDown size={10} />
                  </div>
                </div>

                {/* Order Book Header */}
                <div className="fm-ob-header">
                  <span className="fm-ob-col-label">Price (USDT)</span>
                  <span className="fm-ob-col-label right">Size (BTC)</span>
                </div>

                {/* Ask Orders (Red - Sell) */}
                <div className="fm-ob-asks">
                  {(() => {
                    const basePrice = livePrice > 0 ? livePrice : parseFloat(simVal(95000, 2))
                    const rows = askOrders.length > 0 ? askOrders : Array.from({ length: 10 }, (_, i) => ({
                      price: (basePrice + (i + 1) * basePrice * 0.00015 * (1 + i * 0.1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      size: parseFloat(simVal(1500 + i * 200, 2)).toFixed(2),
                      depth: 12 + i * 4,
                    }))
                    return rows.slice(0, 10).map((order, i) => (
                      <div key={i} className="fm-ob-row">
                        <span className="fm-price-ask">{order.price}</span>
                        <span className="fm-size">{order.size}</span>
                        <div className="fm-depth-bar ask" style={{ width: `${order.depth}%` }}></div>
                      </div>
                    ))
                  })()}
                </div>

                {/* Current Price Display */}
                {(() => {
                  const displayPrice = livePrice > 0 ? livePrice : parseFloat(simVal(95000, 2))
                  return (
                    <div className="fm-current-price-section">
                      <div className="fm-current-price">${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="fm-mark-price">Mark price {displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  )
                })()}

                {/* Bid Orders (Green - Buy) */}
                <div className="fm-ob-bids">
                  {(() => {
                    const basePrice = livePrice > 0 ? livePrice : parseFloat(simVal(95000, 2))
                    const rows = bidOrders.length > 0 ? bidOrders : Array.from({ length: 28 }, (_, i) => ({
                      price: (basePrice - (i + 1) * basePrice * 0.00015 * (1 + i * 0.1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                      size: parseFloat(simVal(1800 + i * 180, 2)).toFixed(2),
                      depth: 15 + i * 2,
                    }))
                    return rows.slice(0, 28).map((order, i) => (
                      <div key={i} className="fm-ob-row">
                        <span className="fm-price-bid">{order.price}</span>
                        <span className="fm-size">{order.size}</span>
                        <div className="fm-depth-bar bid" style={{ width: `${order.depth}%` }}></div>
                      </div>
                    ))
                  })()}
                </div>

                {/* Bottom Controls */}
                <div className="fm-ob-bottom-controls">
                  <div className="fm-depth-select" onClick={() => setShowDepthModal(true)} style={{ cursor: 'pointer' }}>
                    <span>{selectedDepth}</span>
                    <ChevronDown size={12} />
                  </div>
                  <div className="fm-grid-btn" onClick={() => navigate('/dashboard/spot-grid')}>
                    <Grid3X3 size={16} color="#00C0A3" />
                  </div>
                </div>
              </div>

              {/* Right Column - Order Form */}
              <div className="fm-order-column">
                {/* Funding Rate */}
                <div className="fm-funding-section">
                  <span className="fm-funding-label">Funding Rate/ Countdown</span>
                  <span className="fm-funding-value">{fundingRate}/ {fundingCountdown}</span>
                </div>

                {/* Open/Close Tabs */}
                <div className="fm-action-tabs">
                  <div className={`fm-action-tab ${activeTab === 'futures' ? 'active-open' : ''}`} onClick={() => setActiveTab('futures')}>Open</div>
                  <div className={`fm-action-tab ${activeTab === 'grid' ? 'active-close' : ''}`} onClick={() => setActiveTab('grid')}>Close</div>
                </div>

                {activeTab === 'futures' ? (
                  <>
                {/* Available */}
                <div className="fm-available-row">
                  <span style={{ color: '#71717a' }}>Available</span>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    {futuresBalance.toFixed(2)} USDT
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C0A3" strokeWidth="2" style={{ cursor: 'pointer' }} onClick={() => setShowBalanceTransfer(true)}>
                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>

                {/* Order Type Selector */}
                <div className="fm-order-type-selector" onClick={() => setShowOrderTypeModal(true)}>
                  <div className="fm-order-type-dot"></div>
                  <span>{orderType}</span>
                  <ChevronDown size={14} />
                </div>

                {/* Price Input */}
                <div className="fm-input-field" style={orderType === 'Market order' ? { opacity: 0.6 } : {}}>
                  {orderType !== 'Market order' && <span className="fm-input-btn" onClick={() => { const p = parseFloat(priceInput) || 0; if (p > 0) setPriceInput((p - 1).toFixed(2)) }}>−</span>}
                  <input type="text" inputMode="decimal" placeholder="Price" value={orderType === 'Market order' ? (livePrice > 0 ? livePrice.toFixed(2) : priceInput) : priceInput} readOnly={orderType === 'Market order'} onChange={orderType === 'Market order' ? undefined : e => handleNumericInput(e.target.value, setPriceInput)} style={orderType === 'Market order' ? { color: '#71717a', cursor: 'not-allowed' } : {}} />
                  {orderType !== 'Market order' && <span className="fm-input-btn" onClick={() => { const p = parseFloat(priceInput) || livePrice; setPriceInput((p + 1).toFixed(2)) }}>+</span>}
                </div>

                {/* Size Input */}
                <div className="fm-input-field">
                  <input type="text" inputMode="decimal" placeholder="USDT amount" className="fm-size-input" value={sizeInput} onChange={e => handleNumericInput(e.target.value, setSizeInput)} />
                </div>

                {/* Percentage Slider */}
                <div className="fm-percentage-slider" style={{ position: 'relative' }}>
                  <input
                    type="range" min="0" max="100" step="1"
                    value={sizePercentage}
                    onChange={e => {
                      const pct = Number(e.target.value)
                      setSizePercentage(pct)
                      const maxNotional = effectiveBalance * leverage
                      if (maxNotional > 0) setSizeInput(((maxNotional * pct) / 100).toFixed(2))
                    }}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '24px', opacity: 0, cursor: 'pointer', zIndex: 10, margin: 0, padding: 0 }}
                  />
                  <div className="fm-slider-track">
                    <div className="fm-slider-fill" style={{ width: `${sizePercentage}%` }}></div>
                    <div className="fm-slider-diamond" style={{ left: `calc(${sizePercentage}% - 4px)` }}></div>
                    {[0, 25, 50, 75, 100].map(pct => (
                      <div
                        key={pct}
                        className={`fm-slider-dot ${sizePercentage >= pct ? 'active' : ''}`}
                        onClick={() => {
                          setSizePercentage(pct)
                          const maxNotional = effectiveBalance * leverage
                          if (maxNotional > 0) setSizeInput(((maxNotional * pct) / 100).toFixed(2))
                        }}
                      />
                    ))}
                  </div>
                  <div className="fm-slider-labels">
                    <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                  </div>
                </div>

                {/* TP/SL Section */}
                <div className="fm-tpsl-section">
                  <div className="fm-tpsl-header">
                    <div className={`fm-checkbox ${tpSlEnabled ? 'active' : ''}`} onClick={() => setTpSlEnabled(!tpSlEnabled)}>
                      {tpSlEnabled && <div className="fm-checkbox-inner"></div>}
                    </div>
                    <span>TP/SL</span>
                  </div>
                  <div className="fm-tpsl-inputs">
                    <input type="text" inputMode="decimal" placeholder="TP price" value={tpPrice} onChange={e => handleNumericInput(e.target.value, setTpPrice)} />
                    <input type="text" inputMode="decimal" placeholder="SL price" value={slPrice} onChange={e => handleNumericInput(e.target.value, setSlPrice)} />
                  </div>
                </div>

                {/* Long Stats */}
                {(() => {
                  const simBasePrice = parseFloat(simVal(95000, 2))
                  const ep = parseFloat(priceInput) || livePrice || simBasePrice
                  const sz = parseFloat(sizeInput) || 0
                  const baseBalance = effectiveBalance
                  const coinSymbol = selectedFuturesPair.replace(/USDT$/, '')
                  const displayCoinSymbol = PAIR_DISPLAY_NAMES[selectedFuturesPair]
                    ? PAIR_DISPLAY_NAMES[selectedFuturesPair].split('/')[0]
                    : coinSymbol
                  const maxBuyCoin = ((baseBalance * leverage) / ep).toFixed(6)
                  // Cost = margin committed = notional / leverage
                  const costLong = sz > 0 ? (sz / leverage).toFixed(2) : baseBalance.toFixed(2)
                  const liqLong = leverage > 1 ? (ep * (1 - 1 / leverage + 0.004)).toFixed(2) : ep.toFixed(2)
                  const maxSellCoin = maxBuyCoin
                  const liqShort = leverage > 1 ? (ep * (1 + 1 / leverage - 0.004)).toFixed(2) : ep.toFixed(2)
                  return (
                    <>
                      <div className="fm-trade-stats">
                        <div className="fm-stat-row"><span>Max Buy</span><span className="fm-stat-value">{maxBuyCoin} {displayCoinSymbol}</span></div>
                        <div className="fm-stat-row"><span>Cost</span><span className="fm-stat-value">{costLong} USDT</span></div>
                        <div className="fm-stat-row"><span>Liq. Price</span><span className="fm-stat-value">{liqLong} USDT</span></div>
                      </div>
                      <button className="fm-main-btn long" onClick={() => handleFuturesTrade('long')} disabled={submittingSide !== null}>
                        {submittingSide === 'long' ? 'Processing...' : 'Open long'}
                      </button>
                      <div className="fm-trade-stats" style={{ marginTop: '16px' }}>
                        <div className="fm-stat-row"><span>Max Sell</span><span className="fm-stat-value">{maxSellCoin} {displayCoinSymbol}</span></div>
                        <div className="fm-stat-row"><span>Cost</span><span className="fm-stat-value">{costLong} USDT</span></div>
                        <div className="fm-stat-row"><span>Liq. Price</span><span className="fm-stat-value">{liqShort} USDT</span></div>
                      </div>
                      <button className="fm-main-btn short" onClick={() => handleFuturesTrade('short')} disabled={submittingSide !== null}>
                        {submittingSide === 'short' ? 'Processing...' : 'Open short'}
                      </button>
                    </>
                  )
                })()}
                  </>
                ) : (
                  /* ── CLOSE TAB ── */
                  <>
                {/* Available */}
                <div className="fm-available-row">
                  <span style={{ color: '#71717a' }}>Available</span>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    {futuresBalance.toFixed(2)} USDT
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C0A3" strokeWidth="2" style={{ cursor: 'pointer' }} onClick={() => setShowBalanceTransfer(true)}>
                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>

                {/* Order Type Selector (close) */}
                <div className="fm-order-type-selector" onClick={() => setShowOrderTypeModal(true)}>
                  <div className="fm-order-type-dot" style={{ background: '#ef4444' }}></div>
                  <span>{orderType}</span>
                  <ChevronDown size={14} />
                </div>

                {/* Close Price Input */}
                <div className="fm-input-field">
                  <span className="fm-input-btn" onClick={() => { const p = parseFloat(priceInput) || 0; if (p > 0) setPriceInput((p - 1).toFixed(2)) }}>−</span>
                  <input type="text" inputMode="decimal" placeholder="Close Price" value={priceInput} onChange={e => handleNumericInput(e.target.value, setPriceInput)} />
                  <span className="fm-input-btn" onClick={() => { const p = parseFloat(priceInput) || livePrice; setPriceInput((p + 1).toFixed(2)) }}>+</span>
                </div>

                {/* Close Size Input */}
                <div className="fm-input-field">
                  <input type="text" inputMode="decimal" placeholder="Amount (USDT)" className="fm-size-input" value={sizeInput} onChange={e => handleNumericInput(e.target.value, setSizeInput)} />
                </div>

                {/* Percentage Slider */}
                <div className="fm-percentage-slider" style={{ position: 'relative' }}>
                  <input
                    type="range" min="0" max="100" step="1"
                    value={sizePercentage}
                    onChange={e => {
                      const pct = Number(e.target.value)
                      setSizePercentage(pct)
                      const maxNotional = effectiveBalance * leverage
                      if (maxNotional > 0) setSizeInput(((maxNotional * pct) / 100).toFixed(2))
                    }}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '24px', opacity: 0, cursor: 'pointer', zIndex: 10, margin: 0, padding: 0 }}
                  />
                  <div className="fm-slider-track">
                    <div className="fm-slider-fill" style={{ width: `${sizePercentage}%`, background: '#ef4444' }}></div>
                    <div className="fm-slider-diamond" style={{ left: `calc(${sizePercentage}% - 4px)`, background: '#ef4444' }}></div>
                    {[0, 25, 50, 75, 100].map(pct => (
                      <div key={pct} className={`fm-slider-dot ${sizePercentage >= pct ? 'active' : ''}`}
                        onClick={() => { setSizePercentage(pct); const maxNotional = effectiveBalance * leverage; setSizeInput(maxNotional > 0 ? ((maxNotional * pct) / 100).toFixed(2) : '') }} />
                    ))}
                  </div>
                  <div className="fm-slider-labels">
                    <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                  </div>
                </div>

                {/* Close Positions Stats */}
                {(() => {
                  const sz = parseFloat(sizeInput) || 0
                  const pnl = sz > 0 ? parseFloat(simVal(sz * 0.03, 2)) : parseFloat(simVal(45, 2))
                  const roi = sz > 0 ? ((pnl / sz) * 100).toFixed(2) : simVal(2.8, 2)
                  const closeValue = sz > 0 ? sz.toFixed(2) : parseFloat(simVal(effectiveBalance > 0 ? effectiveBalance * 0.5 : 5000, 2)).toFixed(2)
                  const fee = (parseFloat(closeValue) * 0.0004).toFixed(4)
                  return (
                    <>
                      <div className="fm-trade-stats">
                        <div className="fm-stat-row"><span>Est. PnL</span><span className="fm-stat-value" style={{ color: '#10b981' }}>+{pnl} USDT</span></div>
                        <div className="fm-stat-row"><span>ROI</span><span className="fm-stat-value" style={{ color: '#10b981' }}>+{roi}%</span></div>
                        <div className="fm-stat-row"><span>Close Value</span><span className="fm-stat-value">{closeValue} USDT</span></div>
                        <div className="fm-stat-row"><span>Fee</span><span className="fm-stat-value">{fee} USDT</span></div>
                      </div>
                      <button className="fm-main-btn long" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                        onClick={() => { toast('Long position closed', 'success'); setActiveTab('futures') }} disabled={submittingSide !== null}>
                        Close Long
                      </button>
                      <div className="fm-trade-stats" style={{ marginTop: '12px' }}>
                        <div className="fm-stat-row"><span>Est. PnL</span><span className="fm-stat-value" style={{ color: '#ef4444' }}>-{simVal(22, 2)} USDT</span></div>
                        <div className="fm-stat-row"><span>ROI</span><span className="fm-stat-value" style={{ color: '#ef4444' }}>-{simVal(1.4, 2)}%</span></div>
                        <div className="fm-stat-row"><span>Close Value</span><span className="fm-stat-value">{closeValue} USDT</span></div>
                        <div className="fm-stat-row"><span>Fee</span><span className="fm-stat-value">{fee} USDT</span></div>
                      </div>
                      <button className="fm-main-btn short"
                        onClick={() => { toast('Short position closed', 'success'); setActiveTab('futures') }} disabled={submittingSide !== null}>
                        Close Short
                      </button>
                    </>
                  )
                })()}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Status Section */}
            <div className="fm-bottom-status-panel">
              <div className="fm-status-tabs">
                <div className={`fm-status-tab ${bottomTab === 'positions' ? 'active' : ''}`} onClick={() => setBottomTab('positions')}>Positions</div>
                <div className={`fm-status-tab ${bottomTab === 'open' ? 'active' : ''}`} onClick={() => setBottomTab('open')}>Open orders</div>
                <div className={`fm-status-tab ${bottomTab === 'trigger' ? 'active' : ''}`} onClick={() => setBottomTab('trigger')}>Trigger Orders</div>
                <div className="fm-status-icon-right" onClick={() => navigate('/dashboard/history')} style={{ cursor: 'pointer' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
              </div>

              <div className="fm-contract-filter" onClick={() => setHideContractOnly(v => !v)} style={{ cursor: 'pointer' }}>
                <div className={`fm-toggle-switch ${hideContractOnly ? 'active' : ''}`}>
                  <div className="fm-toggle-handle"></div>
                </div>
                <span>Hide contract only</span>
              </div>

              <div className="fm-no-data">
                {hideContractOnly ? null : bottomTab === 'positions' ? (
                  activePositions.length > 0 ? (
                    <div style={{ width: '100%' }}>
                      {activePositions.map(pos => {
                        const isLong = pos.side === 'buy' || pos.side === 'long'
                        const livePnl = pos.unrealizedPnL ?? pos.pnl ?? 0
                        const pnlPct = pos.pnlPercentage ?? (pos.marginUsed > 0 ? (livePnl / pos.marginUsed) * 100 : 0)
                        const pnlPositive = livePnl >= 0
                        const posAsset = (pos.asset || '').replace('/USDT','').replace(/USDT$/,'').toUpperCase()
                        const currentMktPrice = pos.currentPrice
                          ?? allLivePrices[posAsset + 'USDT']
                          ?? allLivePrices[posAsset]
                          ?? (livePrice > 0 && posAsset + 'USDT' === selectedFuturesPair ? livePrice : null)
                        const marketLabel = pos.market ? pos.market.charAt(0).toUpperCase() + pos.market.slice(1) : null
                        const assetLabel = pos.asset ? pos.asset.replace('/USDT','').replace('USDT','') : ''
                        return (
                          <div key={pos._id} style={{ background: '#0f0f17', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid #1e1e2e' }}>
                            {/* Row 1: Pair + Side/Leverage badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{assetLabel}/USDT</span>
                                {marketLabel && (
                                  <span style={{ background: '#1e1e2e', color: '#71717a', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{marketLabel}</span>
                                )}
                              </div>
                              <span style={{ color: isLong ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700 }}>
                                {isLong ? 'LONG' : 'SHORT'} {pos.leverage || leverage}x
                              </span>
                            </div>
                            {/* Row 2: Entry + Current Price */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#71717a', marginBottom: 4 }}>
                              <span>Entry: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>${pos.entryPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                              {currentMktPrice && (
                                <span>Mark: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>${currentMktPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                              )}
                            </div>
                            {/* Row 3: PnL display */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: '#71717a' }}>PnL</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: pnlPositive ? '#10b981' : '#ef4444' }}>
                                  {pnlPositive ? '+' : ''}${livePnl.toFixed(2)}
                                </span>
                                <span style={{ fontSize: 11, color: pnlPositive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                  ({pnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
                                </span>
                              </div>
                              {pos.marginUsed > 0 && (
                                <span style={{ fontSize: 11, color: '#71717a' }}>Margin: <span style={{ color: '#e4e4e7' }}>${pos.marginUsed.toFixed(2)}</span></span>
                              )}
                            </div>
                            {/* Close button */}
                            <button
                              onClick={() => handleClosePosition(pos._id)}
                              style={{ width: '100%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}
                            >
                              Close
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <>
                      <div className="fm-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                          <rect x="12" y="8" width="32" height="44" rx="2" stroke="#3f3f46" strokeWidth="2"/>
                          <path d="M20 20h16M20 28h16M20 36h8" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span>No positions</span>
                    </>
                  )
                ) : bottomTab === 'open' ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: pendingOrders.length === 0 ? 'center' : 'stretch' }}>
                    {pendingOrders.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 20, width: '100%' }}>
                        <div className="fm-empty-icon">
                          <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                            <rect x="12" y="8" width="32" height="44" rx="2" stroke="#3f3f46" strokeWidth="2"/>
                            <path d="M20 20h16M20 28h16M20 36h8" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <span>No open orders</span>
                      </div>
                    ) : pendingOrders.map(pos => {
                      const isLong = pos.side === 'buy' || pos.side === 'long'
                      const marketLabel = pos.market ? pos.market.charAt(0).toUpperCase() + pos.market.slice(1) : null
                      const assetLabel = pos.asset ? pos.asset.replace('/USDT','').replace(/USDT$/,'').toUpperCase() : selectedFuturesPair.replace(/USDT$/,'')
                      const orderTypeLabel = pos.orderType ? pos.orderType.replace(/ order$/i,'').replace(/ Order$/i,'') : 'Limit'
                      return (
                        <div key={pos._id} style={{ background: '#0f0f17', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid #1e1e2e' }}>
                          {/* Row 1: Pair + market badge | Side badge + order type */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{assetLabel}/USDT</span>
                              {marketLabel && (
                                <span style={{ background: '#1e1e2e', color: '#71717a', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{marketLabel}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: isLong ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700 }}>
                                {isLong ? 'LONG' : 'SHORT'} {pos.leverage || leverage}x
                              </span>
                              <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{orderTypeLabel}</span>
                            </div>
                          </div>
                          {/* Row 2: Limit price + pending status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#71717a', marginBottom: 4 }}>
                            <span>Limit Price: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>${pos.entryPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</span></span>
                            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 11 }}>● Pending</span>
                          </div>
                          {/* Row 3: Qty + Margin */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: '#71717a' }}>Qty: <span style={{ color: '#e4e4e7' }}>{(pos.amount || 0).toFixed(4)}</span></span>
                            {(pos.marginUsed ?? 0) > 0 && (
                              <span style={{ fontSize: 11, color: '#71717a' }}>Margin: <span style={{ color: '#e4e4e7' }}>${pos.marginUsed.toFixed(2)}</span></span>
                            )}
                          </div>
                          {/* Full-width Cancel button */}
                          <button
                            onClick={() => handleClosePosition(pos._id)}
                            style={{ width: '100%', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}
                          >
                            Cancel Order
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    {(() => {
                      // Collect TP/SL trigger orders from all open positions
                      const triggerItems = openPositions.flatMap(pos => {
                        const pairLabel = pos.asset ? pos.asset.replace('/USDT', '').replace('USDT', '') + '/USDT' : selectedFuturesPair.replace(/USDT$/, '/USDT')
                        const qty = (pos.amount || 0).toFixed(4)
                        const items: Array<{ triggerType: 'TP' | 'SL'; triggerPrice: number; orderPrice: number; pairLabel: string; qty: string; posId: string; side: string; leverage: number }> = []
                        if (pos.tpPrice) items.push({ triggerType: 'TP', triggerPrice: pos.tpPrice, orderPrice: pos.tpPrice, pairLabel, qty, posId: pos._id, side: pos.side, leverage: pos.leverage || leverage })
                        if (pos.slPrice) items.push({ triggerType: 'SL', triggerPrice: pos.slPrice, orderPrice: pos.slPrice, pairLabel, qty, posId: pos._id, side: pos.side, leverage: pos.leverage || leverage })
                        return items
                      })
                      if (triggerItems.length === 0) return (
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
                          <div className="fm-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                              <rect x="12" y="8" width="32" height="44" rx="2" stroke="#3f3f46" strokeWidth="2"/>
                              <path d="M20 20h16M20 28h16M20 36h8" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <span>No trigger orders</span>
                        </div>
                      )
                      return triggerItems.map((order, i) => {
                        const isLong = order.side === 'buy' || order.side === 'long'
                        const isTP = order.triggerType === 'TP'
                        return (
                          <div key={i} style={{ background: '#0f0f17', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid #1e1e2e' }}>
                            {/* Row 1: Pair | TP/SL type badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{order.pairLabel}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ color: isLong ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700 }}>
                                  {isLong ? 'LONG' : 'SHORT'} {order.leverage}x
                                </span>
                                <span style={{
                                  background: isTP ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: isTP ? '#10b981' : '#ef4444',
                                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5
                                }}>{isTP ? 'Take Profit' : 'Stop Loss'}</span>
                              </div>
                            </div>
                            {/* Row 2: Trigger price + Qty */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#71717a', marginBottom: 4 }}>
                              <span>Trigger: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>${order.triggerPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                              <span>Qty: <span style={{ color: '#e4e4e7' }}>{order.qty}</span></span>
                            </div>
                            {/* Row 3: Order price */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: 12, color: '#71717a' }}>Order Price: <span style={{ color: '#e4e4e7', fontWeight: 600 }}>${order.orderPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                            </div>
                            {/* Full-width Cancel button */}
                            <button
                              onClick={() => handleClosePosition(order.posId)}
                              style={{
                                width: '100%',
                                background: isTP ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)',
                                color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5
                              }}
                            >
                              Cancel {isTP ? 'Take Profit' : 'Stop Loss'}
                            </button>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals outside scroll container but inside mobile-only */}
        {showOrderTypeModal && (
          <div className="futures-modal-overlay-v2" onClick={() => setShowOrderTypeModal(false)}>
            <div className="futures-modal-v2" onClick={e => e.stopPropagation()}>
              <div className="futures-modal-header-v2">
                <span>Transaction mode</span>
                <X size={20} onClick={() => setShowOrderTypeModal(false)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="futures-modal-options-v2">
                {orderTypes.map((type, i) => (
                  <div
                    key={i}
                    className="futures-modal-option-v2"
                    onClick={() => {
                      setOrderType(type.label)
                      setShowOrderTypeModal(false)
                    }}
                  >
                    <span>{type.label}</span>
                    <div className={`futures-radio-v2 ${orderType === type.label ? 'active' : ''}`}>
                      <div className="futures-radio-dot-v2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Increase Balance Modal */}
        {showIncreaseBalance && (
          <div className="futures-modal-overlay-v2" onClick={() => setShowIncreaseBalance(false)}>
            <div className="futures-modal-v2" onClick={e => e.stopPropagation()}>
              <div className="futures-modal-header-v2">
                <span>Increase Balance</span>
                <X size={20} onClick={() => setShowIncreaseBalance(false)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="futures-balance-options-v2">
                <div className="futures-balance-option-v2" onClick={() => navigate('/dashboard/deposit')}>
                  <span className="futures-balance-title-v2">Deposit crypto</span>
                  <span className="futures-balance-sub-v2">Send to spot account</span>
                </div>
                <div className="futures-balance-option-v2" onClick={() => navigate('/dashboard/buy-sell')}>
                  <span className="futures-balance-title-v2">Express</span>
                  <span className="futures-balance-sub-v2">Buy crypto directly with cash</span>
                </div>
                <div className="futures-balance-option-v2" onClick={() => setShowBalanceTransfer(true)}>
                  <span className="futures-balance-title-v2">Transfer</span>
                  <span className="futures-balance-sub-v2">Transfer to spot account</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Transfer Modal */}
        {showBalanceTransfer && (
          <div className="futures-modal-overlay-v2" onClick={() => setShowBalanceTransfer(false)}>
            <div className="futures-modal-v2 futures-modal-tall-v2" onClick={e => e.stopPropagation()}>
              <div className="futures-modal-header-v2">
                <span>Balance transfer</span>
                <X size={20} color="#fff" onClick={() => setShowBalanceTransfer(false)} style={{ cursor: 'pointer' }} />
              </div>

              <div className="futures-transfer-content-v2">
                <div className="futures-transfer-container-v2">
                  <div className="ft-field-row-v2">
                    <History size={18} color="#E4E4E7" onClick={() => navigate('/dashboard/history')} style={{ cursor: 'pointer' }} />
                    <span className="ft-label">From</span>
                    <span className="ft-value">{transferDirection === 'spot-to-futures' ? 'Spot account' : 'Futures account'}</span>
                  </div>

                  <div className="ft-connector-v2">
                    <ArrowLeft size={14} color="#71717a" style={{ transform: 'rotate(-90deg)' }} />
                    <div className="ft-swap-btn-v2" onClick={() => { setTransferDirection(prev => prev === 'spot-to-futures' ? 'futures-to-spot' : 'spot-to-futures'); setTransferAmount('') }} style={{ cursor: 'pointer' }}>
                      <ArrowUpDown size={16} color="#00c19b" style={{ transform: 'rotate(90deg)' }} />
                    </div>
                  </div>

                  <div className="ft-field-row-v2">
                    <Sliders size={18} color="#E4E4E7" />
                    <span className="ft-label">To</span>
                    <span className="ft-value">{transferDirection === 'spot-to-futures' ? 'Futures account' : 'Spot account'}</span>
                  </div>
                </div>

                <div className="futures-transfer-section-v2" style={{ position: 'relative' }}>
                  <span className="ft-section-lbl">Coin</span>
                  <div className="ft-select-v2" onClick={() => setShowTransferCoinDropdown(prev => !prev)} style={{ cursor: 'pointer' }}>
                    <span style={{ color: '#fff' }}>{transferCoin}</span>
                    <ChevronDown size={18} color="#E4E4E7" style={{ transform: showTransferCoinDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </div>
                  {showTransferCoinDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8, zIndex: 10, marginTop: 4, overflow: 'hidden' }}>
                      <div style={{ padding: '8px' }}>
                        <input
                          type="text"
                          placeholder="Search coin..."
                          value={transferCoinSearch}
                          onChange={e => setTransferCoinSearch(e.target.value)}
                          autoFocus
                          style={{ width: '100%', background: '#12121f', border: '1px solid #2a2a3e', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {filteredTransferCoins.map(coin => (
                          <div key={coin} onClick={() => { setTransferCoin(coin); setShowTransferCoinDropdown(false); setTransferCoinSearch('') }} style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', background: transferCoin === coin ? '#2a2a3e' : 'transparent', fontSize: 14 }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a3e')}
                            onMouseLeave={e => (e.currentTarget.style.background = transferCoin === coin ? '#2a2a3e' : 'transparent')}>
                            {coin}
                          </div>
                        ))}
                        {filteredTransferCoins.length === 0 && (
                          <div style={{ padding: '10px 16px', color: '#71717a', fontSize: 14 }}>No coins found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="futures-transfer-section-v2">
                  <span className="ft-section-lbl">Amount</span>
                  <div className="ft-input-v2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Amount"
                      value={transferAmount}
                      onChange={(e) => handleNumericInput(e.target.value, setTransferAmount)}
                      style={{ color: '#fff' }}
                    />
                    <span className="ft-total-btn" style={{ cursor: 'pointer' }} onClick={() => setTransferAmount(transferDirection === 'spot-to-futures' ? (Math.floor(userBalance * 100) / 100).toFixed(2) : (Math.floor(futuresBalance * 100) / 100).toFixed(2))}>Max</span>
                  </div>
                  <span className="ft-available-text" style={{ color: '#fff' }}>
                    {transferDirection === 'spot-to-futures'
                      ? (() => {
                          const holdings = getSpotHoldings()
                          const holdingsUsd = Object.entries(holdings).reduce((sum, [sym, held]) => {
                            if (!held || held <= 0) return sum
                            const p = allLivePrices[sym + 'USDT'] || allLivePrices[sym] || 0
                            return p > 0 ? sum + held * p : sum
                          }, 0)
                          const totalSpot = userBalance + holdingsUsd
                          return `Spot balance: ${totalSpot.toFixed(2)} USDT`
                        })()
                      : `Available: ${futuresBalance.toFixed(2)} USDT`}
                  </span>
                  {transferDirection === 'futures-to-spot' && (() => {
                    const lockedMargin = openPositions
                      .filter((p: any) => p.status === 'open' || p.status === 'pending' || !p.status)
                      .reduce((sum: number, p: any) => sum + (Number(p.marginUsed) || 0), 0)
                    return lockedMargin > 0 ? (
                      <span className="ft-available-text" style={{ color: '#f59e0b', marginTop: 2 }}>
                        {`Locked in positions: ${lockedMargin.toFixed(2)} USDT (close positions to unlock)`}
                      </span>
                    ) : null
                  })()}
                </div>

                <div className="futures-modal-footer-v2">
                  <button className="futures-confirm-btn-v2" onClick={async () => {
                    const amt = parseFloat(transferAmount)
                    if (!amt || amt <= 0) { toast('Enter a valid amount', 'warning'); return }
                    const from = transferDirection === 'spot-to-futures' ? 'Spot' : 'Futures'
                    const to = transferDirection === 'spot-to-futures' ? 'Futures' : 'Spot'
                    try {
                      const result = await recordInternalTransfer(amt, from, to)
                      setUserBalance(result.balance)
                      setFuturesBalanceState(result.futuresBalance)
                      saveFuturesBalance(result.futuresBalance)
                      toast(`Transferred ${amt.toFixed(2)} USDT to ${to}`, 'success')
                    } catch (e: any) {
                      toast(e.message || 'Transfer failed', 'error')
                      return
                    }
                    setShowBalanceTransfer(false)
                    setTransferAmount('')
                  }}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* More Modal */}
        {showMoreModal && (
          <div className="futures-modal-overlay-v2" onClick={() => setShowMoreModal(false)}>
            <div className="futures-modal-v2" onClick={e => e.stopPropagation()}>
              <div className="futures-modal-header-v2">
                <span>More</span>
                <X size={20} onClick={() => setShowMoreModal(false)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="futures-more-grid-v2">
                <div className="futures-more-item-v2" onClick={() => { setShowMoreModal(false); setShowBalanceTransfer(true); }}>
                  <div className="futures-more-icon-v2">
                    <ArrowUpDown size={22} color="#fff" />
                  </div>
                  <span>Transfer</span>
                </div>
                <div className="futures-more-item-v2" onClick={() => { setShowMoreModal(false); navigate('/dashboard/history'); }}>
                  <div className="futures-more-icon-v2">
                    <History size={22} color="#fff" />
                  </div>
                  <span>Trade history</span>
                </div>
                <div className="futures-more-item-v2" onClick={() => { setShowMoreModal(false); setShowPreference(true); }}>
                  <div className="futures-more-icon-v2">
                    <Sliders size={22} color="#fff" />
                  </div>
                  <span>Preference</span>
                </div>
                <div className="futures-more-item-v2" onClick={() => { setShowMoreModal(false); setShowCalculator(true); }}>
                  <div className="futures-more-icon-v2">
                    <Calculator size={22} color="#fff" />
                  </div>
                  <span>Calculator</span>
                </div>
                <div className="futures-more-item-v2" onClick={() => { setShowMoreModal(false); setShowDepthModal(true); }}>
                  <div className="futures-more-icon-v2">
                    <HelpCircle size={22} color="#fff" />
                  </div>
                  <span>Info</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preference Modal */}
        {showPreference && (
          <div className="futures-modal-overlay-v2" onClick={() => setShowPreference(false)}>
            <div className="futures-modal-v2" onClick={e => e.stopPropagation()}>
              <div className="futures-modal-header-v2">
                <span>Preferences</span>
                <X size={20} color="#fff" onClick={() => setShowPreference(false)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="futures-pref-content-v2">
                <div className="futures-pref-row-v2">
                  <span>BTC/USDT</span>
                  <div className="futures-pref-right-v2">
                    <span className="futures-pref-value-v2">{hedgingMode ? 'Hedging Mode' : 'One-way Mode'}</span>
                    <ChevronRight size={18} color="#E4E4E7" />
                  </div>
                </div>
                <div className="futures-pref-row-v2">
                  <span>Contract Unit</span>
                  <div className="futures-pref-right-v2">
                    <span className="futures-pref-value-v2">BNB</span>
                    <ChevronRight size={18} color="#E4E4E7" />
                  </div>
                </div>
                <div className="futures-pref-row-v2">
                  <span>Second confirmation order</span>
                  <div
                    className={`futures-toggle-v2 ${secondConfirmation ? 'active' : ''}`}
                    onClick={() => setSecondConfirmation(!secondConfirmation)}
                  >
                    <div className="futures-toggle-thumb-v2"></div>
                  </div>
                </div>
                <div className="futures-pref-row-v2">
                  <span>Reverse Position confirmation</span>
                  <div
                    className={`futures-toggle-v2 ${reverseConfirmation ? 'active' : ''}`}
                    onClick={() => setReverseConfirmation(!reverseConfirmation)}
                  >
                    <div className="futures-toggle-thumb-v2"></div>
                  </div>
                </div>
                <div className="futures-pref-row-v2">
                  <span>Validity period</span>
                  <div className="futures-pref-right-v2">
                    <span className="futures-pref-value-v2">Permanently</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calculator Modal - Full Screen */}
        {showCalculator && (
          <div className="futures-calc-fullscreen-v2">
            <div className="futures-calc-header-v2">
              <ArrowLeft size={22} color="#fff" onClick={() => setShowCalculator(false)} style={{ cursor: 'pointer' }} />
              <div className="futures-calc-title-v2">
                <span>BTCUSDT</span>
                <ChevronDown size={16} />
              </div>
            </div>

            <div className="futures-calc-scroll-content">
              <div className="futures-calc-tabs-v2">
                <span
                  className={calcTab === 'profit' ? 'active' : ''}
                  onClick={() => setCalcTab('profit')}
                >
                  Profit/ loss
                </span>
                <span
                  className={calcTab === 'target' ? 'active' : ''}
                  onClick={() => setCalcTab('target')}
                >
                  Target Price
                </span>
                <span
                  className={calcTab === 'liquidation' ? 'active' : ''}
                  onClick={() => setCalcTab('liquidation')}
                >
                  Liquidation price
                </span>
              </div>

              <div className="futures-calc-side-btns-v2">
                <button
                  className={`futures-calc-side-btn-v2 long ${calcSide === 'long' ? 'active' : ''}`}
                  onClick={() => setCalcSide('long')}
                >
                  Open Long
                </button>
                <button
                  className={`futures-calc-side-btn-v2 short ${calcSide === 'short' ? 'active' : ''}`}
                  onClick={() => setCalcSide('short')}
                >
                  Open Short
                </button>
              </div>

              <div className="futures-calc-leverage-section">
                <div className="futures-calc-leverage-slider">
                  <div className="futures-calc-slider-track"></div>
                  <div className="futures-calc-slider-fill" style={{ width: `${(calcLeverage / 75) * 100}%` }}></div>
                  <div className="futures-calc-slider-thumb" style={{ left: `${(calcLeverage / 75) * 100}%` }}></div>
                  <input
                    type="range"
                    min="1"
                    max="75"
                    value={calcLeverage}
                    onChange={(e) => setCalcLeverage(Number(e.target.value))}
                    style={{ position: 'absolute', width: '100%', opacity: 0, height: '100%', zIndex: 3 }}
                  />
                </div>
                <div className="futures-calc-leverage-markers">
                  <span>1x</span>
                  <span>15x</span>
                  <span>30x</span>
                  <span>45x</span>
                  <span>60x</span>
                  <span>75x</span>
                </div>
              </div>

              <div className="futures-calc-form-v2">
                <div className="futures-calc-input-group-v2">
                  <label>Entry price</label>
                  <div className="futures-calc-input-v2">
                    <input type="text" placeholder="Please enter" />
                    <span>USDT</span>
                  </div>
                </div>

                <div className="futures-calc-input-group-v2">
                  <label>Target price</label>
                  <div className="futures-calc-input-v2">
                    <input type="text" placeholder="Please enter" />
                    <span>USDT</span>
                  </div>
                </div>

                <div className="futures-calc-input-group-v2">
                  <label>Size</label>
                  <div className="futures-calc-input-v2">
                    <input type="text" placeholder="Please enter" />
                    <span>BNB</span>
                  </div>
                </div>
              </div>

              <div className="futures-calc-result-v2">
                <span className="futures-calc-result-title-v2">Result</span>
                <div className="futures-calc-result-row-v2">
                  <span>Margin Balance</span>
                  <span>0 USDT</span>
                </div>
                <div className="futures-calc-result-row-v2">
                  <span>PNL</span>
                  <span>0 USDT</span>
                </div>
                <div className="futures-calc-result-row-v2">
                  <span>ROI</span>
                  <span>0%</span>
                </div>
              </div>
            </div>

            <div className="futures-calc-footer">
              <button className="futures-calc-btn-v2">Calculate</button>
            </div>
          </div>
        )}

        {/* Depth Modal */}
        {showDepthModal && (
          <div className="futures-modal-overlay-v2" onClick={() => setShowDepthModal(false)}>
            <div className="futures-modal-v2" onClick={e => e.stopPropagation()}>
              <div className="futures-modal-header-v2">
                <span>Depth</span>
                <X size={20} onClick={() => setShowDepthModal(false)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="futures-depth-options-v2">
                {['0.01', '0.1', '1'].map((depth, i) => (
                  <div
                    key={i}
                    className="futures-modal-option-v2"
                    onClick={() => {
                      setSelectedDepth(depth)
                      setShowDepthModal(false)
                    }}
                  >
                    <span>{depth}</span>
                    <div className={`futures-radio-v2 ${selectedDepth === depth ? 'active' : ''}`}>
                      <div className="futures-radio-dot-v2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order Book Filter Modal */}
        {showOrderBookModal && (
          <div className="futures-modal-overlay-v2" onClick={() => setShowOrderBookModal(false)}>
            <div className="futures-modal-v2" onClick={e => e.stopPropagation()}>
              <div className="futures-modal-header-v2">
                <span>Order Book</span>
                <X size={20} onClick={() => setShowOrderBookModal(false)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="futures-depth-options-v2">
                {[
                  { value: 'orderbook', label: 'Order book' },
                  { value: 'buy', label: 'Buy order' },
                  { value: 'sell', label: 'Sell order' }
                ].map((opt, i) => (
                  <div
                    key={i}
                    className="futures-modal-option-v2"
                    onClick={() => {
                      setOrderBookFilter(opt.value)
                      setShowOrderBookModal(false)
                    }}
                  >
                    <span>{opt.label}</span>
                    <div className={`futures-radio-v2 ${orderBookFilter === opt.value ? 'active' : ''}`}>
                      <div className="futures-radio-dot-v2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop View - Show AdvanceTrade */}
      <div className="desktop-only">
        <AdvanceTradeContent />
      </div>

      {/* Pair Selector Modal */}
      {showPairModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 3000, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowPairModal(false)}>
          <div style={{ width: '100%', background: '#0e0e16', borderRadius: '20px 20px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.25s ease-out' }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid #1e1e2a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Select Pair</span>
                <button onClick={() => setShowPairModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e1e2a', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b', fontSize: 15 }}>🔍</span>
                <input
                  placeholder="Search pairs..."
                  value={pairSearch ?? ''}
                  onChange={e => setPairSearch(e.target.value)}
                  style={{ width: '100%', background: '#1a1a26', border: '1px solid #2a2a3a', borderRadius: 10, padding: '10px 12px 10px 36px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Category tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                {(['crypto','commodities','stocks'] as const).map(cat => (
                  <button key={cat} onClick={() => { localStorage.setItem('dw_futures_category', cat); setPairModalCategory(cat); setPairSearch('') }}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: pairModalCategory === cat ? '#00C0A3' : '#1a1a26',
                      color: pairModalCategory === cat ? '#000' : '#71717A' }}>
                    {cat === 'crypto' ? '🪙 Crypto' : cat === 'commodities' ? '🏅 Comm.' : '📈 Stocks'}
                  </button>
                ))}
              </div>
            </div>

            {/* Column headers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', background: '#0e0e16' }}>
              <span style={{ color: '#52525b', fontSize: 11, fontWeight: 600 }}>PAIR</span>
              <span style={{ color: '#52525b', fontSize: 11, fontWeight: 600 }}>LAST PRICE</span>
            </div>

            {/* Scrollable list */}
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 24 }}>
              {FUTURES_PAIRS_CATEGORIES[pairModalCategory]
                .filter(pair => {
                  if (!pairSearch) return true
                  const q = pairSearch.toLowerCase()
                  const display = (PAIR_DISPLAY_NAMES[pair] || pair.replace(/USDT$/, '/USDT')).toLowerCase()
                  const lbl = (PAIR_LABELS[pair] || '').toLowerCase()
                  return display.includes(q) || lbl.includes(q)
                })
                .map(pair => {
                  const displayName = PAIR_DISPLAY_NAMES[pair] || pair.replace(/USDT$/, '/USDT')
                  const label = PAIR_LABELS[pair]
                  const pairPrice = allLivePrices[pair]
                  const baseSymbol = pair.replace(/USDT$/, '').toLowerCase()
                  const isSelected = selectedFuturesPair === pair
                  const isCrypto = pairModalCategory === 'crypto'
                  const iconUrl = isCrypto
                    ? `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${baseSymbol}.png`
                    : null
                  const catColor = pairModalCategory === 'commodities' ? '#F59E0B' : '#6366F1'

                  return (
                    <div key={pair} onClick={() => { localStorage.setItem('dw_futures_pair', pair); setSelectedFuturesPair(pair); setShowPairModal(false) }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid #13131e',
                        background: isSelected ? 'rgba(0,192,163,0.08)' : 'transparent',
                        transition: 'background 0.15s' }}>

                      {/* Left: icon + names */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Icon */}
                        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                          background: isCrypto ? 'transparent' : catColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isCrypto ? (
                            <img src={iconUrl!} alt={baseSymbol}
                              style={{ width: 36, height: 36 }}
                              onError={e => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }} />
                          ) : (
                            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                              {baseSymbol.slice(0,2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{displayName}</div>
                          <div style={{ color: '#52525b', fontSize: 11, marginTop: 2 }}>
                            {label ? `${label} · Perp` : 'Perpetual'}
                          </div>
                        </div>
                      </div>

                      {/* Right: price + check */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'right' }}>
                        <div>
                          {pairPrice ? (
                            <div style={{ color: '#00C0A3', fontWeight: 600, fontSize: 14 }}>
                              ${pairPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: pairPrice < 1 ? 6 : 2 })}
                            </div>
                          ) : (
                            <div style={{ color: '#3f3f50', fontSize: 13 }}>—</div>
                          )}
                          <div style={{ color: '#52525b', fontSize: 10, marginTop: 1 }}>USDT</div>
                        </div>
                        {isSelected && (
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#00C0A3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

// Import AdvanceTrade content component for desktop
function AdvanceTradeContent() {
  return <AdvanceTrade isEmbedded={true} />
}
