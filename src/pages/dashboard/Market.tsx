import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Check,
  PlayCircle,
  Star,
  ChevronDown,
  ClipboardList,
  Megaphone,
  Zap,
  Activity,
  Library,
  Gift,
  MoreVertical,
} from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { getDetailedMarketData } from '../../services/tradeService'

import '../../styles/dashboard.css'
import '../../styles/market.css'

// High-fidelity SVG components for Crypto Logos
const BTCLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <path d="M22.962 14.244c.401-2.68-1.64-4.12-4.43-5.08l.904-3.626-2.207-.55-.88 3.532c-.58-.145-1.177-.281-1.77-.417l.886-3.553-2.207-.55-.904 3.626c-.48-.11-.95-.216-1.411-.328l.002-.007-3.044-.76-.587 2.356s1.638.375 1.604.398c.894.223 1.056.815 1.028 1.284l-1.03 4.133c.062.015.142.037.23.072-.074-.019-.153-.038-.232-.057l-1.443 5.79c-.11.272-.388.68-1.015.524.023.033-1.604-.4-1.604-.4l-1.096 2.527 2.872.716c.534.133 1.058.272 1.576.401l-.912 3.664 2.207.551.904-3.626c.602.164 1.188.311 1.761.45l-.893 3.582 2.207.551.912-3.664c3.764.713 6.594.425 7.785-2.978.96-2.74-.047-4.322-2.025-5.353 1.44-.333 2.524-1.282 2.812-3.243zm-5.035 7.087c-.683 2.743-5.3 1.26-6.8 .886l1.213-4.86c1.5.374 6.3 1.114 5.587 3.974zm.683-7.123c-.622 2.497-4.467 1.228-5.719.917l1.1-4.414c1.25.311 5.258.892 4.619 3.497z" fill="white" />
  </svg>
)

const ETHLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <path d="M16 4.667l-.23.784v13.064l.23.23 6.01-3.553L16 4.667z" fill="white" fillOpacity="0.602" />
    <path d="M16 4.667L9.99 15.192l6.01 3.553V4.667z" fill="white" />
    <path d="M16 20.155l-.13.158v6.784l.13.38 6.014-8.472-6.014 1.15z" fill="white" fillOpacity="0.602" />
    <path d="M16 27.477V20.155L9.99 19.006l6.01 8.471z" fill="white" />
    <path d="M16 18.745l6.01-3.553L16 12.607v6.138z" fill="white" fillOpacity="0.2" />
    <path d="M9.99 15.192l6.01 3.553v-6.138l-6.01 2.585z" fill="white" fillOpacity="0.602" />
  </svg>
)

const AVAXLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#E84142" />
    <path d="M18.814 11.234l1.137 1.968c-.979.809-1.396 1.487-1.442 2.373a2.768 2.768 0 00.323 1.579c.277.47.67.85 1.137 1.099.646.346 1.34.46 2.03.323.231-.046.462-.115.67-.208l1.13 1.962c-.624.462-1.316.786-2.078.946a7.18 7.18 0 01-3.116-.185c-1.454-.531-2.61-1.571-3.233-2.934a6.593 6.593 0 01-.139-4.85c.577-1.478 1.709-2.61 3.116-3.134 1.431-.555 2.979-.555 4.38.01l-1.138 1.964c-.878-.44-1.85-.509-2.77-.208a3.172 3.172 0 00-1.87 1.282c-.37.531-.555 1.156-.555 1.778 0 .162.023.324.046.462l3.43-5.942z" fill="white" />
    <path fillRule="evenodd" clipRule="evenodd" d="M16 27L10.334 17.185L4.667 27H16zM18.835 17.185L13.167 7.37l-5.666 9.815h11.334zM27.334 27h-11.334l5.667-9.815L27.334 27z" fill="white" />
  </svg>
)

const SOLLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="black" />
    <path d="M24.71 19.332a.5.5 0 0 1-.353.147H7.7a.5.5 0 0 1-.354-.853l3.078-3.078a.5.5 0 0 1 .354-.147H27.7a.5.5 0 0 1 .353.853l-3.344 3.33zm-.001-9.993a.5.5 0 0 1-.353.147H7.7a.5.5 0 0 1-.354-.853l3.078-3.078a.5.5 0 0 1 .354-.147H27.7a.5.5 0 0 1 .354.854l-3.345 3.328zm-20.063 6.643a.5.5 0 0 1 .354-.147h16.657a.5.5 0 0 1 .353.853l-3.078 3.079a.5.5 0 0 1-.354.147H7.29a.5.5 0 0 1-.353-.853l3.072-3.079z" fill="url(#paint0_linear)" />
    <defs>
      <linearGradient id="paint0_linear" x1="4.29" y1="21.751" x2="28.054" y2="5.402" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
    </defs>
  </svg>
)

function Market() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const view = searchParams.get('view') || 'dashboard'
  const tabParam = searchParams.get('tab') as 'favorites' | 'spot' | 'futures' | null
  const [activeTab, setActiveTab] = useState<'favorites' | 'spot' | 'futures'>(tabParam || 'spot')
  const [mobileMarketTab, setMobileMarketTab] = useState<'favorites' | 'spot' | 'futures'>(tabParam || 'spot')
  const [futuresSubTab, setFuturesSubTab] = useState<'all' | 'usdt-m' | 'coin-m'>('all')
  const [mobileHotTab, setMobileHotTab] = useState<'hot' | 'new' | '24h'>('hot')
  const [marketData, setMarketData] = useState<Record<string, any>>({})
  const [selectedFavorites, setSelectedFavorites] = useState<Set<string>>(new Set(['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'AVAX']))

  const allSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'LINK/USDT', 'LTC/USDT', 'NEAR/USDT', 'APT/USDT', 'ATOM/USDT', 'UNI/USDT', 'OP/USDT', 'ARB/USDT', 'MATIC/USDT']

    useEffect(() => {
        let ws: WebSocket | null = null;
        let retryTimeout: any;
      let fallbackPollInterval: any;
      let isWsConnected = false;

      const mergeMarketSnapshot = (snapshot: Record<string, any>) => {
        setMarketData(prev => {
          const next = { ...prev };
          let changed = false;

          allSymbols.forEach((symbol) => {
            const data = snapshot[symbol];
            if (!data || typeof data.price !== 'number' || data.price <= 0) return;

            const existing = next[symbol] || {};
            const merged = {
              ...existing,
              price: data.price,
              change24h: typeof data.change24h === 'number' ? data.change24h : (existing.change24h || 0),
              volume24h: typeof data.volume24h === 'number' ? data.volume24h : (existing.volume24h || 0),
            };

            if (
              existing.price !== merged.price ||
              existing.change24h !== merged.change24h ||
              existing.volume24h !== merged.volume24h
            ) {
              next[symbol] = merged;
              changed = true;
            }
          });

          return changed ? next : prev;
        });
      };

      const fetchFallbackMarketData = async () => {
        try {
          const snapshot = await getDetailedMarketData(allSymbols);
          mergeMarketSnapshot(snapshot);
        } catch {
          // Keep existing values on transient network failures.
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
                            setMarketData(prev => {
                                const next = { ...prev };
                                let changed = false;
                                data.forEach((ticker: any) => {
                                    if (ticker.s.endsWith('USDT')) {
                                        const cleanPair = ticker.s.replace('USDT', '/USDT');
                                        if (allSymbols.includes(cleanPair)) {
                                            const p = parseFloat(ticker.c);
                                            const changePct = parseFloat(ticker.P);
                                            
                                            if (!next[cleanPair] || next[cleanPair].price !== p) {
                                                next[cleanPair] = {
                                                    ...(next[cleanPair] || {}),
                                                    price: p,
                                                    change24h: changePct,
                                                    volume24h: parseFloat(ticker.q) || (next[cleanPair]?.volume24h)
                                                };
                                                changed = true;
                                            }
                                        }
                                    }
                                });
                                return changed ? next : prev;
                            });
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

      const fmt = (n: number, digits = 2) => n ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—'
    const fmtChange = (n: number) => n >= 0 ? "+" + n.toFixed(2) + '%' : n.toFixed(2) + '%'
    const fmtVol = (n: number) => n > 1e9 ? "$" + (n / 1e9).toFixed(2) + 'B' : n > 1e6 ? "$" + (n / 1e6).toFixed(2) + 'M' : "$" + n.toLocaleString()

    const logoMap: Record<string, any> = { BTC: BTCLogo, ETH: ETHLogo, AVAX: AVAXLogo, SOL: SOLLogo }

  const coinLabels: Record<string, string> = { BTC: 'Bitcoin', ETH: 'Ethereum', XRP: 'Ripple', SOL: 'Solana', AVAX: 'Avalanche', DOGE: 'Dogecoin', BNB: 'Binance', ADA: 'Cardano', DOT: 'Polkadot', LINK: 'Chainlink', LTC: 'Litecoin', NEAR: 'NEAR', APT: 'Aptos', ATOM: 'Cosmos', UNI: 'Uniswap', OP: 'Optimism', ARB: 'Arbitrum', MATIC: 'Polygon' }
  const coinColors: Record<string, string> = { BTC: '#F7931A', ETH: '#627EEA', XRP: '#23292F', SOL: '#9945FF', AVAX: '#E84142', DOGE: '#C2A633', BNB: '#F3BA2F', ADA: '#0033AD', DOT: '#E6007A', LINK: '#2A5ADA', LTC: '#345D9D', NEAR: '#000', APT: '#4EB4A0', ATOM: '#2E3148', UNI: '#FF007A', OP: '#FF0420', ARB: '#28A0F0', MATIC: '#8247E5' }
  // Mock volume multipliers per coin for realistic data
  const mockVolMultiplier: Record<string, number> = { BTC: 28.4, ETH: 14.7, XRP: 3.2, SOL: 5.8, AVAX: 1.9, DOGE: 4.1, BNB: 8.3, ADA: 2.4, DOT: 1.6, LINK: 2.1, LTC: 1.8, NEAR: 0.9, APT: 0.7, ATOM: 1.1, UNI: 1.3, OP: 0.8, ARB: 0.6, MATIC: 1.5 }

  const priceCards = ['BTC/USDT', 'ETH/USDT', 'AVAX/USDT', 'SOL/USDT'].map(s => {
    const coin = s.split('/')[0]
    const d = marketData[s] || {}
    return { coin, pair: 'USDT', price: fmt(d.price), change: fmtChange(d.change24h || 0), volume: `24h Vol ${fmtVol(d.volume24h || 0)}`, Logo: logoMap[coin] || BTCLogo }
  })

  const favoritesData = [
    { coin: 'BTC', pair: 'USDT', label: 'Bitcoin' },
    { coin: 'ETH', pair: 'USDT', label: 'Ethereum' },
    { coin: 'SOL', pair: 'USDT', label: 'Solana' },
    { coin: 'BNB', pair: 'USDT', label: 'Binance' },
    { coin: 'XRP', pair: 'USDT', label: 'Ripple' },
    { coin: 'AVAX', pair: 'USDT', label: 'Avalanche' },
  ]

  const spotTableData = allSymbols.slice(0, 8).map(s => {
    const coin = s.split('/')[0]
    const d = marketData[s] || {}
    const price = d.price || 0
    const change = d.change24h || 0
    const vol = d.volume24h || (price * (mockVolMultiplier[coin] || 1) * 1000000)
    return {
      symbol: s,
      name: coin, pair: 'USDT',
      lastPrice: fmt(price), lastPriceFiat: fmt(price),
      change: fmtChange(change),
      high: fmt(price * (1 + Math.abs(change || 1.5) / 100 * 1.2)),
      low: fmt(price * (1 - Math.abs(change || 1.5) / 100 * 0.8)),
      volume: fmtVol(vol),
    }
  })

  // Futures volume multipliers (higher than spot — derivatives markets are larger)
  const futuresVolMultiplier: Record<string, number> = { BTC: 42.6, ETH: 21.3, XRP: 5.7, SOL: 9.4, AVAX: 3.1, DOGE: 6.8, BNB: 12.5, ADA: 4.2, DOT: 2.9, LINK: 3.6, LTC: 2.7, NEAR: 1.4, APT: 1.2, ATOM: 1.8, UNI: 2.0, OP: 1.3, ARB: 1.1, MATIC: 2.3 }
  // Coin-M volume multipliers (lower liquidity than USDT-M)
  const coinMVolMultiplier: Record<string, number> = { BTC: 18.9, ETH: 8.7, SOL: 3.2, BNB: 4.6, XRP: 1.8, DOGE: 2.1, ADA: 1.1, AVAX: 0.9 }
  // Slight premium/discount offsets for futures (fraction of 1%)
  const futuresPremium: Record<string, number> = { BTC: 1.00012, ETH: 1.00018, XRP: 0.99985, SOL: 1.00024, AVAX: 0.99972, DOGE: 1.00008, BNB: 1.00015, ADA: 0.99991, DOT: 1.00006, LINK: 1.00011, LTC: 0.99988, NEAR: 1.00020, APT: 1.00009, ATOM: 0.99995, UNI: 1.00013, OP: 1.00007, ARB: 0.99982, MATIC: 1.00010 }
  const coinMPremium: Record<string, number> = { BTC: 0.99978, ETH: 0.99965, SOL: 1.00032, BNB: 0.99988, XRP: 1.00041, DOGE: 0.99956, ADA: 1.00028, AVAX: 0.99971 }
  // Change offsets so futures don't mirror spot exactly
  const futuresChangeOffset: Record<string, number> = { BTC: 0.13, ETH: -0.22, XRP: 0.35, SOL: -0.18, AVAX: 0.27, DOGE: -0.09, BNB: 0.16, ADA: -0.31, DOT: 0.08, LINK: -0.14, LTC: 0.21, NEAR: -0.06, APT: 0.11, ATOM: -0.19, UNI: 0.05, OP: 0.23, ARB: -0.12, MATIC: 0.09 }
  const coinMChangeOffset: Record<string, number> = { BTC: -0.08, ETH: 0.19, SOL: -0.27, BNB: 0.11, XRP: -0.16, DOGE: 0.32, ADA: -0.14, AVAX: 0.22 }

  const usdtMSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'LINK/USDT', 'LTC/USDT', 'NEAR/USDT', 'APT/USDT', 'ATOM/USDT', 'UNI/USDT', 'OP/USDT', 'ARB/USDT', 'MATIC/USDT']
  const coinMSymbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'DOGE/USD', 'ADA/USD', 'AVAX/USD']

  const usdtMTableData = usdtMSymbols.slice(0, 8).map(s => {
    const coin = s.split('/')[0]
    const spotData = marketData[`${coin}/USDT`] || {}
    const spotPrice = spotData.price || 0
    const price = spotPrice * (futuresPremium[coin] || 1)
    const change = (spotData.change24h || 0) + (futuresChangeOffset[coin] || 0)
    const vol = price * (futuresVolMultiplier[coin] || 2) * 1000000
    return {
      symbol: s, name: coin, pair: 'USDT Perp',
      lastPrice: fmt(price), lastPriceFiat: fmt(price),
      change: fmtChange(change),
      high: fmt(price * (1 + Math.abs(change || 1.8) / 100 * 1.15)),
      low: fmt(price * (1 - Math.abs(change || 1.8) / 100 * 0.85)),
      volume: fmtVol(vol),
    }
  })

  const coinMTableData = coinMSymbols.map(s => {
    const coin = s.split('/')[0]
    const spotData = marketData[`${coin}/USDT`] || {}
    const spotPrice = spotData.price || 0
    const price = spotPrice * (coinMPremium[coin] || 1)
    const change = (spotData.change24h || 0) + (coinMChangeOffset[coin] || 0)
    const vol = price * (coinMVolMultiplier[coin] || 1) * 1000000
    return {
      symbol: s, name: coin, pair: 'USD Perp',
      lastPrice: fmt(price), lastPriceFiat: fmt(price),
      change: fmtChange(change),
      high: fmt(price * (1 + Math.abs(change || 2.0) / 100 * 1.1)),
      low: fmt(price * (1 - Math.abs(change || 2.0) / 100 * 0.9)),
      volume: fmtVol(vol),
    }
  })

  const tableData = (activeTab === 'futures' || mobileMarketTab === 'futures')
    ? futuresSubTab === 'coin-m' ? coinMTableData
      : futuresSubTab === 'usdt-m' ? usdtMTableData
      : [...usdtMTableData, ...coinMTableData]
    : spotTableData

  const mobileFunctions = [
    { icon: ClipboardList, label: 'Trade', color: '#5D5FEF', path: '/dashboard/trade' },
    { icon: Megaphone, label: 'Announcement', color: '#1B9B8C', path: '/dashboard/notifications' },
    { icon: Zap, label: 'Deposit', color: '#F59E0B', path: '/dashboard/deposit' },
    { icon: Activity, label: 'Futures', color: '#EF4444', path: '/dashboard/futures' },
    { icon: Library, label: 'Academy', color: '#1B9B8C', path: '/dashboard/academy' },
    { icon: Gift, label: 'Campaign', color: '#8B5CF6', path: '/dashboard/campaign' },
  ]

  const spotMobileCoins = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'AVAX/USDT', 'DOGE/USDT', 'BNB/USDT', 'ADA/USDT'].map(s => {
    const coin = s.split('/')[0]
    const d = marketData[s] || {}
    const price = d.price || 0
    const vol = d.volume24h || (price * (mockVolMultiplier[coin] || 1) * 1000000)
    return {
      symbol: s, name: coin, pairSuffix: '/USDT',
      label: coinLabels[coin] || coin,
      price: fmt(price), rawPrice: price,
      change: fmtChange(d.change24h || 0), volume: fmtVol(vol),
      high: fmt(price * (1 + Math.abs(d.change24h || 1.5) / 100 * 1.2)),
      low: fmt(price * (1 - Math.abs(d.change24h || 1.5) / 100 * 0.8)),
      Logo: logoMap[coin] || (() => <div className="coin-icon-placeholder" style={{ backgroundColor: coinColors[coin] || '#333' }}>{coin[0]}</div>),
    }
  })

  const usdtMMobileCoins = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT'].map(s => {
    const coin = s.split('/')[0]
    const spotData = marketData[s] || {}
    const spotPrice = spotData.price || 0
    const price = spotPrice * (futuresPremium[coin] || 1)
    const change = (spotData.change24h || 0) + (futuresChangeOffset[coin] || 0)
    const vol = price * (futuresVolMultiplier[coin] || 2) * 1000000
    return {
      symbol: `${coin}/USDT`, name: coin, pairSuffix: '/USDT Perp',
      label: coinLabels[coin] || coin,
      price: fmt(price), rawPrice: price,
      change: fmtChange(change), volume: fmtVol(vol),
      high: fmt(price * (1 + Math.abs(change || 1.8) / 100 * 1.15)),
      low: fmt(price * (1 - Math.abs(change || 1.8) / 100 * 0.85)),
      Logo: logoMap[coin] || (() => <div className="coin-icon-placeholder" style={{ backgroundColor: coinColors[coin] || '#333' }}>{coin[0]}</div>),
    }
  })

  const coinMMobileCoins = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD', 'DOGE/USD', 'ADA/USD', 'AVAX/USD'].map(s => {
    const coin = s.split('/')[0]
    const spotData = marketData[`${coin}/USDT`] || {}
    const spotPrice = spotData.price || 0
    const price = spotPrice * (coinMPremium[coin] || 1)
    const change = (spotData.change24h || 0) + (coinMChangeOffset[coin] || 0)
    const vol = price * (coinMVolMultiplier[coin] || 1) * 1000000
    return {
      symbol: `${coin}/USD`, name: coin, pairSuffix: '/USD Perp',
      label: coinLabels[coin] || coin,
      price: fmt(price), rawPrice: price,
      change: fmtChange(change), volume: fmtVol(vol),
      high: fmt(price * (1 + Math.abs(change || 2.0) / 100 * 1.1)),
      low: fmt(price * (1 - Math.abs(change || 2.0) / 100 * 0.9)),
      Logo: logoMap[coin] || (() => <div className="coin-icon-placeholder" style={{ backgroundColor: coinColors[coin] || '#333' }}>{coin[0]}</div>),
    }
  })

  const mobileCoins = (mobileMarketTab === 'futures')
    ? futuresSubTab === 'coin-m' ? coinMMobileCoins
      : futuresSubTab === 'usdt-m' ? usdtMMobileCoins
      : [...usdtMMobileCoins, ...coinMMobileCoins]
    : spotMobileCoins

  const currentMobileTab = mobileMarketTab as string

  const toggleFavorite = (coin: string) => {
    setSelectedFavorites(prev => {
      const next = new Set(prev)
      if (next.has(coin)) next.delete(coin)
      else next.add(coin)
      return next
    })
  }

  const addAllFavorites = () => {
    setSelectedFavorites(new Set(favoritesData.map(a => a.coin)))
  }

  const removeAllFavorites = () => {
    setSelectedFavorites(new Set())
  }

  return (
    <Layout activePage={view === 'list' ? 'market' : 'home'} hideFooterMobile={true}>
      <div className="market-refined-container">
        {/* Mobile View Start */}
        <div className="mobile-only">
          {view === 'dashboard' ? (
            <div className="mobile-dashboard">
              {/* Campaign Banner Mobile */}
              <div className="mobile-campaign-banner">
                <div className="mb-content">
                  <h2 className="mb-title">Trade with <br /> <span className="text-green-500">Zero Fees</span></h2>
                  <p className="mb-subtitle">Enjoy 0 fees on all transactions this season</p>
                  <div className="mb-badges">
                    <span className="mb-badge purple">KYC</span>
                    <span className="mb-badge cyan">Place 3 Futures trade</span>
                  </div>
                </div>
                <div className="mb-image">
                  <img src="/30.png" alt="Promo" />
                </div>
              </div>

              {/* Function Grid Mobile */}
              <div className="mobile-function-grid">
                {mobileFunctions.map((item, idx) => (
                  <div key={idx} className="mf-item" onClick={() => navigate(item.path)}>
                    <div className="mf-icon-wrapper" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      <item.icon size={24} />
                    </div>
                    <span className="mf-label">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Coin List Mobile */}
              <div className="mobile-coin-list-section">
                <div className="mcl-header">
                  <div className="mcl-tabs">
                    <button className={`mcl-tab ${mobileHotTab === 'hot' ? 'active' : ''}`} onClick={() => setMobileHotTab('hot')}>Hot</button>
                    <button className={`mcl-tab ${mobileHotTab === 'new' ? 'active' : ''}`} onClick={() => setMobileHotTab('new')}>New</button>
                    <button className={`mcl-tab ${mobileHotTab === '24h' ? 'active' : ''}`} onClick={() => setMobileHotTab('24h')}>24h Vol</button>
                  </div>
                  <ChevronDown size={14} className="text-zinc-500" />
                </div>

                <div className="mcl-list">
                  {mobileCoins.map((coin, idx) => (
                    <div key={idx} className="mcl-item" onClick={() => navigate(`/dashboard/trade?pair=${coin.symbol}`)}>
                      <div className="mcl-left">
                        <coin.Logo />
                        <div className="mcl-info">
                          <span className="mcl-name">{coin.name}</span>
                          <span className="mcl-label">{coin.label}</span>
                        </div>
                      </div>
                      <div className="mcl-right">
                        <span className="mcl-price">{coin.price}</span>
                        <span className={`mcl-change ${coin.change.startsWith('+') ? 'positive' : 'negative'}`}>
                          {coin.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Favorites View */}
              {mobileMarketTab === 'favorites' && (
                <div className="mobile-favorites-view">
                  <div className="mml-header-top">
                    <span className="mml-title">Market</span>
                    <MoreVertical size={20} color="#ffffff" />
                  </div>

                  <div className="mml-tabs-container">
                    <div className="mml-main-tabs">
                      <button
                        className={`mml-tab-v3 ${currentMobileTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setMobileMarketTab('favorites')}
                      >
                        Favorites
                      </button>
                      <button
                        className={`mml-tab-v3 ${currentMobileTab === 'spot' ? 'active' : ''}`}
                        onClick={() => setMobileMarketTab('spot')}
                      >
                        Spot
                      </button>
                      <button
                        className={`mml-tab-v3 ${currentMobileTab === 'futures' ? 'active' : ''}`}
                        onClick={() => setMobileMarketTab('futures')}
                      >
                        Futures
                      </button>
                    </div>
                    <Search size={18} className="mml-search-icon" />
                  </div>

                  <div className="mobile-favorites-grid">
                    {favoritesData.map((asset, idx) => (
                      <div key={idx} className="mobile-fav-card" onClick={() => navigate(`/dashboard/trade?pair=${asset.coin}/USDT`)} style={{ cursor: 'pointer' }}>
                        <div className="mobile-fav-info">
                          <div className="mobile-fav-pair">
                            <span className="mobile-fav-coin">{asset.coin}</span>
                            <span className="mobile-fav-suffix"> /{asset.pair}</span>
                          </div>
                          <div className="mobile-fav-label">{asset.label}</div>
                        </div>
                        <div
                          className={`mobile-fav-check ${selectedFavorites.has(asset.coin) ? 'selected' : 'unselected'}`}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.coin) }}
                          style={{ cursor: 'pointer' }}
                        >
                          {selectedFavorites.has(asset.coin) && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="mobile-add-all-btn"
                    onClick={() => { selectedFavorites.size === favoritesData.length ? removeAllFavorites() : addAllFavorites() }}
                  >
                    {selectedFavorites.size === favoritesData.length ? 'Remove all' : 'Add all'}
                  </button>
                </div>
              )}

              {/* Mobile Spot/Futures View */}
              {(mobileMarketTab === 'spot' || mobileMarketTab === 'futures') && (
                <div className="mobile-market-list-view">
                  <div className="mml-header-top">
                    <span className="mml-title">Market</span>
                  </div>

                  <div className="mml-tabs-container">
                    <div className="mml-main-tabs">
                      <button
                        className={`mml-tab-v3 ${currentMobileTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setMobileMarketTab('favorites')}
                      >
                        Favorites
                      </button>
                      <button
                        className={`mml-tab-v3 ${currentMobileTab === 'spot' ? 'active' : ''}`}
                        onClick={() => setMobileMarketTab('spot')}
                      >
                        Spot
                      </button>
                      <button
                        className={`mml-tab-v3 ${currentMobileTab === 'futures' ? 'active' : ''}`}
                        onClick={() => setMobileMarketTab('futures')}
                      >
                        Futures
                      </button>
                    </div>
                    <Search size={20} className="mml-search-icon" />
                  </div>

                  {mobileMarketTab === 'futures' && (
                    <div className="mml-futures-sub-nav">
                      <button
                        className={`mml-f-sub-tab ${futuresSubTab === 'all' ? 'active' : ''}`}
                        onClick={() => setFuturesSubTab('all')}
                      >
                        All
                      </button>
                      <button
                        className={`mml-f-sub-tab ${futuresSubTab === 'usdt-m' ? 'active' : ''}`}
                        onClick={() => setFuturesSubTab('usdt-m')}
                      >
                        USDT-M
                      </button>
                      <button
                        className={`mml-f-sub-tab ${futuresSubTab === 'coin-m' ? 'active' : ''}`}
                        onClick={() => setFuturesSubTab('coin-m')}
                      >
                        Coin-M
                      </button>
                    </div>
                  )}

                  <div className="mml-table-v2">
                    <div className="mml-table-header-v2">
                      <div className="mml-th-group">
                        <span className="mml-th">Name</span>
                        <span className="mml-th">Volume</span>
                      </div>
                      <div className="mml-th-group text-right">
                        <span className="mml-th">Last Price</span>
                        <span className="mml-th">24h change</span>
                      </div>
                    </div>

                    <div className="mml-list-v2">
                      {mobileCoins.map((coin, idx) => (
                        <div key={idx} className="mml-item-v2" onClick={() => navigate(`/dashboard/trade?pair=${coin.symbol}`)}>
                          <div className="mml-item-left-v2">
                            <Star size={16} className="mml-star-icon" onClick={(e) => { e.stopPropagation(); toggleFavorite(coin.name) }} style={{ color: selectedFavorites.has(coin.name) ? '#14B8A6' : undefined }} />
                            <div className="mml-coin-info-v2">
                              <div className="mml-pair-row">
                                <span className="mml-symbol-v2">{coin.name}</span>
                                <span className="mml-base-v2">{coin.pairSuffix}</span>
                              </div>
                              <span className="mml-volume-v2">{coin.volume}</span>
                            </div>
                          </div>
                          <div className="mml-item-right-v2">
                            <div className="mml-price-col">
                              <span className="mml-main-price-v2">{coin.price}</span>
                              <span className="mml-fiat-price-v2">{coin.price}</span>
                            </div>
                            <div className={`mml-change-badge-v2 ${coin.change.startsWith('+') ? 'positive' : 'negative'}`}>
                              {coin.change}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {/* Mobile View End */}

        <div className="desktop-only">
          {/* Top Feature Cards */}
          <div className="market-feature-row">
            {priceCards.map((card, idx) => (
              <div key={idx} className="m-feature-card">
                <div className="m-feature-header">
                  <div className="m-feature-coin">
                    <card.Logo />
                    <span className="m-feature-name">{card.coin} <span className="text-zinc-500">/{card.pair}</span></span>
                  </div>
                  <span className="m-feature-change positive">{card.change}</span>
                </div>
                <div className="m-feature-price">{card.price}</div>
                <div className="m-feature-footer">
                  <span className="m-feature-vol text-zinc-500">{card.volume}</span>
                  <PlayCircle size={16} className="text-zinc-300" />
                </div>
              </div>
            ))}
          </div>

          <div className="market-main-header">
            <h1 className="page-title">Market</h1>
            <p className="page-subtitle">Transfer your crypto assets into your Diwanfinance wallet</p>
          </div>

          {/* Main Tabs and Search */}
          <div className="market-controls-v2">
            <div className="market-tabs-v2">
              <button
                className={`m-tab-v2 ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                Favorites
              </button>
              <button
                className={`m-tab-v2 ${activeTab === 'spot' ? 'active' : ''}`}
                onClick={() => setActiveTab('spot')}
              >
                Spot
              </button>
              <button
                className={`m-tab-v2 ${activeTab === 'futures' ? 'active' : ''}`}
                onClick={() => setActiveTab('futures')}
              >
                Futures
              </button>
            </div>
            <div className="m-search-v2">
              <Search size={18} className="text-zinc-500" />
              <input type="text" placeholder="Search for currency pairs" className="m-search-input" />
            </div>
          </div>

          {/* Content Area */}
          {activeTab === 'favorites' && (
            <>
              <div className="market-assets-grid-v2">
                {favoritesData.map((asset, idx) => (
                  <div key={idx} className="m-asset-card" onClick={() => navigate(`/dashboard/trade?pair=${asset.coin}/USDT`)} style={{ cursor: 'pointer' }}>
                    <div className="m-asset-info">
                      <div className="m-asset-pair">
                        <span className="m-white-text">{asset.coin}</span>
                        <span className="text-zinc-500">/{asset.pair}</span>
                      </div>
                      <div className="m-asset-label text-zinc-500">{asset.label}</div>
                    </div>
                    <div className="m-asset-check">
                      <div className="check-circle-teal">
                        <Check size={12} className="white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="market-actions-v2">
                <button className="add-all-btn-v2">Add all</button>
              </div>
            </>
          )}

          {(activeTab === 'spot' || activeTab === 'futures') && (
            <div className="market-table-section">
              {activeTab === 'futures' && (
                <div className="futures-sub-nav">
                  <button
                    className={`futures-sub-tab ${futuresSubTab === 'all' ? 'active' : ''}`}
                    onClick={() => setFuturesSubTab('all')}
                  >
                    All
                  </button>
                  <button
                    className={`futures-sub-tab ${futuresSubTab === 'usdt-m' ? 'active' : ''}`}
                    onClick={() => setFuturesSubTab('usdt-m')}
                  >
                    USDT-M
                  </button>
                  <button
                    className={`futures-sub-tab ${futuresSubTab === 'coin-m' ? 'active' : ''}`}
                    onClick={() => setFuturesSubTab('coin-m')}
                  >
                    Coin-M
                  </button>
                </div>
              )}

              <div className="m-table-container">
                <table className="m-refined-table">
                  <thead>
                    <tr>
                      <th className="text-left">Name <ChevronDown size={14} className="inline ml-1" /></th>
                      <th className="text-left">Last Price <ChevronDown size={14} className="inline ml-1" /></th>
                      <th className="text-left">24h change <ChevronDown size={14} className="inline ml-1" /></th>
                      <th className="text-left">24h High <ChevronDown size={14} className="inline ml-1" /></th>
                      <th className="text-left">24h Low <ChevronDown size={14} className="inline ml-1" /></th>
                      <th className="text-left">Volume <ChevronDown size={14} className="inline ml-1" /></th>
                      <th className="text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="m-table-name-cell">
                            <Star size={14} className="text-zinc-500 cursor-pointer" />
                            <span className="m-white-text font-bold ml-2">{row.name}</span>
                            <span className="text-zinc-500 text-xs ml-1">/ {row.pair}</span>
                          </div>
                        </td>
                        <td>
                          <div className="m-table-price-cell">
                            <span className="m-white-text font-bold">{row.lastPrice}</span>
                            <span className="text-zinc-500 text-xs ml-1">/{row.lastPriceFiat}</span>
                          </div>
                        </td>
                        <td>
                          <span className="m-positive-text">{row.change}</span>
                        </td>
                        <td>
                          <span className="m-white-text">{row.high}</span>
                        </td>
                        <td>
                          <span className="m-white-text">{row.low}</span>
                        </td>
                        <td>
                          <span className="m-white-text">{row.volume}</span>
                        </td>
                        <td>
                          <button className="m-trade-link" onClick={() => navigate(`/dashboard/trade?pair=${row.symbol}`)}>Trade</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Market






