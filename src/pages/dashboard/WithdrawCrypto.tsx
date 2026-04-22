import { useState, useEffect } from 'react'
import Layout from '../../components/Layout/Layout'
import { Info, ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react'
import '../../styles/withdraw.css'
import { useNavigate } from 'react-router-dom'
import { getBalance, withdrawFunds, getTransactions } from '../../services/walletService'
import { useToast } from '../../context/ToastContext'

function WithdrawCrypto() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [balance, setBalance] = useState(0)
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])

  // Dropdown States
  const [isOpenAsset, setIsOpenAsset] = useState(false)
  const [isOpenNetwork, setIsOpenNetwork] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState({ symbol: 'USDT', name: 'Tether', icon: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/usdt.png' })
  const [selectedNetwork, setSelectedNetwork] = useState({ name: 'BNB Smart Chain (BEP20)', desc: 'Fast & Low Fees' })

  const assets = [
    { symbol: 'USDT', name: 'Tether', icon: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/usdt.png' },
    { symbol: 'BTC', name: 'Bitcoin', icon: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/btc.png' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/eth.png' }
  ]

  const networks = [
    { name: 'BNB Smart Chain (BEP20)', desc: 'Arrival time ~2 mins' },
    { name: 'Tron (TRC20)', desc: 'Arrival time ~1 min' },
    { name: 'Ethereum (ERC20)', desc: 'Arrival time ~5 mins' }
  ]

  const handleNumericInput = (value: string, setter: (v: string) => void) => {
    const cleaned = value.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    setter(cleaned)
  }

  const fetchData = async () => {
    try {
      const balanceData = await getBalance()
      setBalance(balanceData.balance)

      const txData = await getTransactions()
      setTransactions(txData.filter(t => t.type === 'withdrawal'))
    } catch (error) {
      console.error('Error fetching withdraw data:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleWithdraw = async () => {
    if (!address) {
      toast('Please enter a destination address', 'warning')
      return
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast('Please enter a valid amount', 'warning')
      return
    }
    if (Number(amount) < 10) {
      toast('Minimum withdrawal is 10 USDT', 'warning')
      return
    }
    if (Number(amount) > balance) {
      toast('Insufficient balance', 'error')
      return
    }

    setLoading(true)
    try {
      await withdrawFunds(Number(amount), address, selectedAsset.symbol, selectedNetwork.name)
      toast(`Successfully withdrawn ${amount} ${selectedAsset.symbol}`, 'success')
      setAmount('')
      setAddress('')
      fetchData() // Refresh balance and history
    } catch (error: any) {
      toast(error.message || 'Withdrawal failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout activePage="withdraw" hideMobileNav={true} hideFooterMobile={true}>
      <div className="withdraw-page-container">
        {/* Mobile Back Button */}
        <div className="mobile-only mobile-back-header">
          <button className="mobile-back-btn" onClick={() => navigate('/dashboard/assets')}>
            <ArrowLeft size={22} />
          </button>
        </div>
        <div className="withdraw-header">
          <h1 className="withdraw-title">Withdraw crypto</h1>
          <p className="withdraw-subtitle">Transfer your crypto assets from your Diwanfinance wallet with ease</p>
        </div>

        <div className="withdraw-content">
          <div className="withdraw-main">
            <div className="withdraw-form-card">
              {/* Asset Selection */}
              <div className="withdraw-form-group">
                <label className="withdraw-form-label">Select Asset</label>
                <div className="withdraw-input-wrapper">
                  <div className="withdraw-select-trigger" onClick={() => setIsOpenAsset(!isOpenAsset)}>
                    <div className="coin-select-item">
                      <img src={selectedAsset.icon} alt={selectedAsset.symbol} className="coin-icon-small" />
                      <span className="coin-symbol">{selectedAsset.symbol}</span>
                      <span className="coin-name">{selectedAsset.name}</span>
                    </div>
                    <ChevronDown size={18} style={{ marginLeft: 'auto', color: '#71717A', transform: isOpenAsset ? 'rotate(180deg)' : 'none' }} />
                  </div>
                  {isOpenAsset && (
                    <div className="dropdown-menu">
                      {assets.map((asset) => (
                        <div key={asset.symbol} className={`dropdown-item ${selectedAsset.symbol === asset.symbol ? 'active' : ''}`} onClick={() => { setSelectedAsset(asset); setIsOpenAsset(false); }}>
                          <img src={asset.icon} alt={asset.symbol} className="coin-icon-small" />
                          <span className="coin-symbol">{asset.symbol}</span>
                          <span className="coin-name">{asset.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Network Selection */}
              <div className="withdraw-form-group">
                <label className="withdraw-form-label">Withdrawal Network</label>
                <div className="withdraw-input-wrapper">
                  <div className="withdraw-select-trigger" onClick={() => setIsOpenNetwork(!isOpenNetwork)}>
                    <span>{selectedNetwork.name}</span>
                    <ChevronDown size={18} style={{ marginLeft: 'auto', color: '#71717A', transform: isOpenNetwork ? 'rotate(180deg)' : 'none' }} />
                  </div>
                  {isOpenNetwork && (
                    <div className="dropdown-menu">
                      {networks.map((net) => (
                        <div key={net.name} className={`dropdown-item ${selectedNetwork.name === net.name ? 'active' : ''}`} onClick={() => { setSelectedNetwork(net); setIsOpenNetwork(false); }}>
                          <div className="network-item">
                            <span className="network-name">{net.name}</span>
                            <span className="network-desc">{net.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="network-warning">
                  <Info size={18} className="warning-icon-teal" />
                  <div className="warning-text-small">
                    Ensure the withdrawal network matches the deposit network.
                    Matching to the wrong network may result in permanent loss of funds.
                  </div>
                </div>
              </div>

              {/* Address Input */}
              <div className="withdraw-form-group">
                <label className="withdraw-form-label">Withdrawal Address</label>
                <div className="withdraw-input-wrapper">
                  <input
                    type="text"
                    className="withdraw-input"
                    placeholder="Paste your wallet address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div className="withdraw-form-group">
                <label className="withdraw-form-label">Amount</label>
                <div className="amount-input-container">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="withdraw-input"
                    placeholder="Minimum 10 USDT"
                    value={amount}
                    onChange={(e) => handleNumericInput(e.target.value, setAmount)}
                  />
                  <button className="amount-max-btn" onClick={() => setAmount(balance.toString())}>MAX</button>
                </div>
                <div className="balance-info-row">
                  <span className="balance-label">Available Balance</span>
                  <span className="balance-value">{balance.toFixed(2)} USDT</span>
                </div>
              </div>

              {/* Summary Section */}
              <div className="summary-card">
                <div className="summary-row">
                  <span className="summary-label">Network Fee</span>
                  <span className="summary-value">0.8 USDT</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Receive Amount</span>
                  <span className="summary-value highlight">
                    {amount && !isNaN(Number(amount)) ? Math.max(0, Number(amount) - 0.8).toFixed(2) : '0.00'} USDT
                  </span>
                </div>
              </div>

              <button
                className="main-withdraw-btn"
                onClick={handleWithdraw}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Withdraw Funds'}
              </button>
            </div>

            {/* Recent Withdrawals Table */}
            <div className="recent-withdrawals-section">
              <h2 className="recent-title">Recent Withdrawals</h2>
              <div className="withdrawals-card">
                <table className="withdrawals-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Network</th>
                      <th>Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#71717A' }}>No recent withdrawals</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx._id}>
                          <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td>{tx.asset}</td>
                          <td>{tx.amount}</td>
                          <td>{tx.network || 'BEP20'}</td>
                          <td>{(tx.walletAddress || '-').substring(0, 10)}...</td>
                          <td><span className={`status-badge ${tx.status}`}>{tx.status}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="withdraw-sidebar">
            {/* FAQ/Info Card */}
            <div className="info-card">
              <div className="info-card-title">
                <HelpCircle size={18} className="text-teal-500" />
                <span>Tips</span>
              </div>
              <ul className="info-list">
                <li className="info-list-item">
                  <div className="info-bullet"></div>
                  <span>Withdrawals are usually processed within 5-30 minutes depending on network congestion.</span>
                </li>
                <li className="info-list-item">
                  <div className="info-bullet"></div>
                  <span>Maximum daily withdrawal limit for your account is $50,000 USDT.</span>
                </li>
                <li className="info-list-item">
                  <div className="info-bullet"></div>
                  <span>Confirm the address and network carefully; blockchain transactions are irreversible.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default WithdrawCrypto
