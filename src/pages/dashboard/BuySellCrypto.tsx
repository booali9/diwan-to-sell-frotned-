import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronDown, Check, CheckCircle, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import PaymentModal from '../../components/dashboard/PaymentModal'
import { getBalance, getCachedBalance, setCachedBalance, applyLocalBalanceChange, addSpotHolding, deductSpotHolding, getSpotHolding } from '../../services/walletService'
import { useToast } from '../../context/ToastContext'
import '../../styles/dashboard.css'
import '../../styles/buy-sell.css'

interface BuySellCryptoProps {
  defaultTab?: 'buy' | 'sell'
}

// Simple but high-fidelity SVG Mascot (Frog/Mascot character representation)
const MascotSVG = () => (
  <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Background Glow */}
    <circle cx="70" cy="70" r="60" fill="#1B9B8C" fillOpacity="0.1" />

    {/* Simple Character Body (Representative of the green mascot) */}
    <rect x="40" y="50" width="60" height="60" rx="30" fill="#1B9B8C" />
    <circle cx="55" cy="45" r="15" fill="#1B9B8C" />
    <circle cx="85" cy="45" r="15" fill="#1B9B8C" />

    {/* Eyes */}
    <circle cx="55" cy="45" r="5" fill="white" />
    <circle cx="85" cy="45" r="5" fill="white" />
    <circle cx="55" cy="45" r="2" fill="black" />
    <circle cx="85" cy="45" r="2" fill="black" />

    {/* Phone */}
    <rect x="80" y="70" width="20" height="35" rx="4" fill="#2E2E3E" />
    <rect x="83" y="73" width="14" height="29" rx="2" fill="#1B9B8C" />

    {/* Bubble */}
    <path d="M100 40C100 34.4772 104.477 30 110 30H125C130.523 30 135 34.4772 135 40V50C135 55.5228 130.523 60 125 60H110C104.477 60 100 55.5228 100 50V40Z" fill="#F7931A" />
    <text x="105" y="48" fill="white" fontSize="10" fontWeight="bold">BUY!</text>
  </svg>
)

function BuySellCrypto({ defaultTab = 'buy' }: BuySellCryptoProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>(defaultTab)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalData, _setModalData] = useState<any>({})
  const { toast } = useToast()

  const [btcPrice, setBtcPrice] = useState(0)
  const [simResult, setSimResult] = useState<null | { type: 'buy' | 'sell'; spent: string; received: string; txId: string; newBalance: number }>(null)
  const [userBalance, setUserBalance] = useState(() => getCachedBalance())

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD')
        const data = await res.json()
        if (data?.USD) setBtcPrice(parseFloat(data.USD))
      } catch {
        setBtcPrice(65000)
      }
    }
    const fetchWallet = async () => {
      try {
        const bal = await getBalance()
        const b = bal.balance || 0
        setUserBalance(b)
        setCachedBalance(b)
      } catch { /* ignore */ }
    }
    fetchPrice()
    fetchWallet()
    const interval = setInterval(fetchPrice, 15000)
    return () => clearInterval(interval)
  }, [])

  // Real-time conversion: how much BTC the entered USDT amount buys (or vice-versa)
  const price = btcPrice > 0 ? btcPrice : 65000
  const receiveAmount = activeTab === 'buy'
    ? (Number(amount) > 0 ? (Number(amount) / price).toFixed(8) : '')
    : (Number(amount) > 0 ? (Number(amount) * price).toFixed(2) : '')
  const rateLabel = btcPrice > 0
    ? `1 USDT ≈ ${(1 / price).toFixed(8)} BTC`
    : 'Fetching rate...'

  const handleNumericInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./, '$1')
    setter(cleaned)
  }

  const handleBuy = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast('Please enter a valid amount', 'warning')
      return
    }
    const usdtAmt = Number(amount)
    if (usdtAmt > userBalance) {
      toast(`Insufficient balance — you have ${userBalance.toFixed(2)} USDT`, 'error')
      return
    }
    setIsLoading(true)
    try {
      const btcReceived = usdtAmt / price
      await new Promise(r => setTimeout(r, 1500))
      applyLocalBalanceChange(-usdtAmt)
      addSpotHolding('BTC', btcReceived, usdtAmt)
      const newBal = parseFloat((userBalance - usdtAmt).toFixed(2))
      setUserBalance(newBal)
      setCachedBalance(newBal)
      setSimResult({
        type: 'buy',
        spent: `${usdtAmt.toFixed(2)} USDT`,
        received: `${btcReceived.toFixed(8)} BTC`,
        txId: `SIM${Date.now().toString(16).toUpperCase()}`,
        newBalance: newBal,
      })
      toast('Buy order completed!', 'success')
      setAmount('')
    } catch (error: any) {
      toast(error.message || 'Failed to process order', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSell = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast('Please enter a valid amount', 'warning')
      return
    }
    const btcHeld = getSpotHolding('BTC')
    if (btcHeld <= 0) {
      toast('No BTC in your spot account to sell', 'error')
      return
    }
    setIsLoading(true)
    try {
      const btcAmt = Math.min(Number(amount), btcHeld)
      const usdtReceived = btcAmt * price
      await new Promise(r => setTimeout(r, 1500))
      deductSpotHolding('BTC', btcAmt)
      applyLocalBalanceChange(usdtReceived)
      const newBal = parseFloat((userBalance + usdtReceived).toFixed(2))
      setUserBalance(newBal)
      setCachedBalance(newBal)
      setSimResult({
        type: 'sell',
        spent: `${btcAmt.toFixed(8)} BTC`,
        received: `${usdtReceived.toFixed(2)} USDT`,
        txId: `SIM${Date.now().toString(16).toUpperCase()}`,
        newBalance: newBal,
      })
      toast('Sell order completed!', 'success')
      setAmount('')
    } catch (error: any) {
      toast(error.message || 'Failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <Layout activePage={activeTab === 'buy' ? 'buy' : 'sell'} hideMobileNav={true}>
      <div className="buysell-refined-container">
        {/* Mobile View Start */}
        <div className="mobile-only mobile-buysell-view">
          <div className="mob-page-header">
            <ArrowLeft size={22} className="mob-back-icon" onClick={() => navigate(-1)} />
            <h1 className="mob-page-title">Buy & Sell Crypto</h1>
          </div>

          <div className="mob-buysell-card">
            <div className="mob-buysell-tabs">
              <button
                className={`mob-bs-tab ${activeTab === 'buy' ? 'active' : ''}`}
                onClick={() => setActiveTab('buy')}
              >
                Buy
              </button>
              <button
                className={`mob-bs-tab ${activeTab === 'sell' ? 'active' : ''}`}
                onClick={() => setActiveTab('sell')}
              >
                Sell
              </button>
            </div>

            {/* Balance pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(13,148,136,0.12)', borderRadius: '10px', marginBottom: '4px' }}>
              <Wallet size={13} color="#0d9488" />
              <span style={{ color: '#71717a', fontSize: '12px' }}>Balance:</span>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>{userBalance.toFixed(2)} USDT</span>
            </div>

            <div className="mob-bs-fields">
              <div className="mob-bs-field-group">
                <label className="mob-bs-label">{activeTab === 'buy' ? 'Spend (USDT)' : 'Sell (BTC)'}</label>
                <div className="mob-bs-input-row">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={activeTab === 'buy' ? "100" : "0.00001"}
                    className="mob-bs-input"
                    value={amount}
                    onChange={(e) => handleNumericInput(e.target.value, setAmount)}
                  />
                  <div className="mob-bs-currency">
                    {activeTab === 'buy' ? (
                      <><span className="currency-mini-icon usdt">₮</span><span className="currency-code">USDT</span></>
                    ) : (
                      <><span className="currency-mini-icon btc">₿</span><span className="currency-code">BTC</span></>
                    )}
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              <div className="mob-bs-field-group">
                <label className="mob-bs-label">Receive</label>
                <div className="mob-bs-input-row">
                  <input type="text" placeholder="0" className="mob-bs-input" value={receiveAmount} readOnly />
                  <div className="mob-bs-currency">
                    {activeTab === 'buy' ? (
                      <><span className="currency-mini-icon btc">₿</span><span className="currency-code">BTC</span></>
                    ) : (
                      <><span className="currency-mini-icon usdt">₮</span><span className="currency-code">USDT</span></>
                    )}
                    <ChevronDown size={14} />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#0d9488', marginTop: '5px', paddingLeft: '2px' }}>{rateLabel}</div>
              </div>
            </div>

            <button
              className="mob-bs-submit-btn"
              onClick={activeTab === 'buy' ? handleBuy : handleSell}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (activeTab === 'buy' ? 'Buy Now' : 'Sell Now')}
            </button>
          </div>
        </div>
        {/* Mobile View End */}

        <div className="desktop-only">
          <div className="page-header">
            <h1 className="page-title">{activeTab === 'buy' ? 'Buy crypto' : 'Sell crypto'}</h1>
            <p className="page-subtitle">Transfer your crypto assets into your Diwanfinance wallet</p>
          </div>

          <div className="buysell-main-card">
            {/* Left Column - Mascot and Instructions */}
            <div className="buysell-info-col">
              <div className="buysell-mascot-box">
                <MascotSVG />
              </div>

              <div className="how-it-works-refined">
                <h3>How it works</h3>

                <div className="refined-step">
                  <div className="refined-check">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="refined-step-text">Enter amount and currency</span>
                </div>

                <div className="refined-step">
                  <div className="refined-check">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="refined-step-text">Choose the crypto you want and Select a payment provider</span>
                </div>

                <div className="refined-step">
                  <div className="refined-check">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="refined-step-text">Receive crypto in your wallet</span>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="buysell-form-col">
              {/* Tabs inside the card */}
              <div className="buysell-form-tabs">
                <button
                  className={`buysell-form-tab ${activeTab === 'buy' ? 'active' : ''}`}
                  onClick={() => setActiveTab('buy')}
                >
                  Buy crypto
                </button>
                <button
                  className={`buysell-form-tab ${activeTab === 'sell' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sell')}
                >
                  Sell crypto
                </button>
              </div>

              {/* Balance row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '10px 14px', background: 'rgba(13,148,136,0.1)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wallet size={14} color="#0d9488" />
                  <span style={{ color: '#71717a', fontSize: '13px' }}>Available Balance</span>
                </div>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{userBalance.toFixed(2)} USDT</span>
              </div>

              {/* Field: Amount */}
              <div className="buysell-field-group">
                <label>{activeTab === 'buy' ? 'Spend (USDT)' : 'Sell (BTC)'}</label>
                <div className="refined-input-box">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={activeTab === 'sell' ? '0.00001' : '0.00'}
                    value={amount}
                    onChange={(e) => handleNumericInput(e.target.value, setAmount)}
                  />
                  <div className="currency-selector-mini">
                    {activeTab === 'buy' ? (
                      <><div className="mini-icon usdt">₮</div><span className="currency-name-mini">USDT</span></>
                    ) : (
                      <><div className="mini-icon btc">₿</div><span className="currency-name-mini">BTC</span></>
                    )}
                    <ChevronDown size={14} className="text-zinc-500" />
                  </div>
                </div>
              </div>

              {/* Field: Receive */}
              <div className="buysell-field-group">
                <label>{activeTab === 'buy' ? 'Receive (BTC)' : 'Receive (USDT)'}</label>
                <div className="refined-input-box">
                  <input
                    type="text"
                    placeholder="0.00"
                    value={receiveAmount}
                    readOnly
                    style={{ color: '#10b981' }}
                  />
                  <div className="currency-selector-mini">
                    {activeTab === 'buy' ? (
                      <><div className="mini-icon btc">₿</div><span className="currency-name-mini">BTC</span></>
                    ) : (
                      <><div className="mini-icon usdt">₮</div><span className="currency-name-mini">USDT</span></>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#0d9488', marginTop: '6px' }}>{rateLabel}</div>
              </div>

              <button
                className="buysell-submit-btn"
                onClick={activeTab === 'buy' ? handleBuy : handleSell}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (activeTab === 'buy' ? 'Buy Crypto' : 'Sell Crypto')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalData.type}
        amount={modalData.amount}
        currency={modalData.currency}
        address={modalData.address}
        network={modalData.network}
        status={modalData.status}
      />

      {/* Simulated transaction result overlay */}
      {simResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111118', borderRadius: '16px', padding: '32px 24px', width: '100%', maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>Order Completed</h2>
            <p style={{ color: '#71717a', fontSize: '14px', margin: '0 0 24px' }}>Your simulated {simResult.type} order has been processed. New wallet balance: <strong style={{ color: '#10b981' }}>{simResult.newBalance.toFixed(2)} USDT</strong></p>
            <div style={{ background: '#1a1a24', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#71717a', fontSize: '13px' }}>{simResult.type === 'buy' ? 'Spent' : 'Sold'}</span>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{simResult.spent}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#71717a', fontSize: '13px' }}>Received</span>
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>{simResult.received}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#71717a', fontSize: '13px' }}>Transaction ID</span>
                <span style={{ color: '#71717a', fontSize: '11px', fontFamily: 'monospace' }}>{simResult.txId}</span>
              </div>
            </div>
            <button onClick={() => setSimResult(null)} style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </Layout >
  )
}

export default BuySellCrypto
