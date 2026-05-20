import { useState, useEffect } from 'react'
import Layout from '../../components/Layout/Layout'
import { Info, ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react'
import '../../styles/withdraw.css'
import { useNavigate } from 'react-router-dom'
import { getBalance, withdrawFunds, getTransactions, getWithdrawalFee, sendWithdrawalOTP, transferFunds } from '../../services/walletService'
import { getProfile } from '../../services/userService'
import { useToast } from '../../context/ToastContext'

function WithdrawCrypto() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'onchain' | 'internal'>('onchain')
  const [balance, setBalance] = useState(0)
  const [address, setAddress] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [fundPassword, setFundPassword] = useState('')
  const [google2faCode, setGoogle2faCode] = useState('')
  const [emailOtpCode, setEmailOtpCode] = useState('')
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [networkFee, setNetworkFee] = useState(2.5)
  const [profile, setProfile] = useState<any>(null)

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
      // Filter withdrawal & transfer types
      setTransactions(txData.filter(t => t.type === 'withdrawal' || t.type === 'transfer'))
    } catch (error) {
      console.error('Error fetching withdraw data:', error)
    }

    try {
      const profileData = await getProfile()
      setProfile(profileData)
    } catch (err) {
      console.error('Error fetching profile:', err)
    }

    try {
      const feeData = await getWithdrawalFee()
      if (feeData && typeof feeData.fee === 'number') {
        setNetworkFee(feeData.fee)
      }
    } catch (err) {
      console.error('Error fetching withdrawal fee:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpCooldown])

  const handleSendOtp = async () => {
    try {
      await sendWithdrawalOTP()
      toast('Verification code sent to your email', 'success')
      setOtpCooldown(60)
    } catch (err: any) {
      toast(err.message || 'Failed to send verification code', 'error')
    }
  }

  const handleWithdraw = async () => {
    if (activeTab === 'onchain') {
      if (!address) {
        toast('Please enter a destination address', 'warning')
        return
      }
    } else {
      if (!recipientId) {
        toast('Please enter the recipient Email, Phone, or UID', 'warning')
        return
      }
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast('Please enter a valid amount', 'warning')
      return
    }

    const minAmount = activeTab === 'onchain' ? 10 : 0.1
    if (Number(amount) < minAmount) {
      toast(`Minimum amount is ${minAmount} ${selectedAsset.symbol}`, 'warning')
      return
    }

    if (Number(amount) > balance) {
      toast('Insufficient balance', 'error')
      return
    }

    if (!fundPassword) {
      toast('Fund password is required', 'warning')
      return
    }

    if (profile?.isGoogleAuthenticatorEnabled && !google2faCode) {
      toast('Google Authenticator code is required', 'warning')
      return
    }

    if (!emailOtpCode) {
      toast('Email verification code is required', 'warning')
      return
    }

    setLoading(true)
    try {
      if (activeTab === 'onchain') {
        await withdrawFunds(Number(amount), address, selectedAsset.symbol, selectedNetwork.name, fundPassword, google2faCode, emailOtpCode)
        toast(`Successfully withdrawn ${amount} ${selectedAsset.symbol}`, 'success')
      } else {
        await transferFunds(recipientId, Number(amount), selectedAsset.symbol, 'Internal Ledger', fundPassword, google2faCode, emailOtpCode)
        toast(`Successfully transferred ${amount} ${selectedAsset.symbol} internally`, 'success')
      }
      setAmount('')
      setAddress('')
      setRecipientId('')
      setFundPassword('')
      setGoogle2faCode('')
      setEmailOtpCode('')
      fetchData() // Refresh balance and history
    } catch (error: any) {
      toast(error.message || 'Transaction failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const activeFee = activeTab === 'onchain' ? networkFee : 0
  const receiveAmount = amount && !isNaN(Number(amount)) ? Math.max(0, Number(amount) - activeFee) : 0

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
          <h1 className="withdraw-title">Withdraw & Transfer</h1>
          <p className="withdraw-subtitle">Transfer assets from your Bicoin wallet on-chain or via Internal Funding ledger</p>
        </div>

        <div className="withdraw-content">
          <div className="withdraw-main">
            <div className="withdraw-form-card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Premium Dual-Mode Tab Selector */}
              <div className="withdraw-tab-selector" style={{ display: 'flex', borderBottom: '1px solid #1C1C2C', marginBottom: '28px', paddingBottom: '2px', gap: '24px' }}>
                <button
                  type="button"
                  className={`withdraw-tab-btn ${activeTab === 'onchain' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('onchain'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'onchain' ? '#1B9B8C' : '#71717A',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    paddingBottom: '12px',
                    borderBottom: activeTab === 'onchain' ? '2.5px solid #1B9B8C' : '2.5px solid transparent',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  On-chain Withdrawal
                </button>
                <button
                  type="button"
                  className={`withdraw-tab-btn ${activeTab === 'internal' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('internal'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'internal' ? '#1B9B8C' : '#71717A',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    paddingBottom: '12px',
                    borderBottom: activeTab === 'internal' ? '2.5px solid #1B9B8C' : '2.5px solid transparent',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Internal Funding Ledger
                </button>
              </div>

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

              {/* Conditionally Render On-Chain Network & Address or Internal Recipient Details */}
              {activeTab === 'onchain' ? (
                <>
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
                </>
              ) : (
                <>
                  {/* Internal Recipient Input */}
                  <div className="withdraw-form-group">
                    <label className="withdraw-form-label">Recipient Account</label>
                    <div className="withdraw-input-wrapper">
                      <input
                        type="text"
                        className="withdraw-input"
                        placeholder="Enter Recipient Email, Phone (+254...), or UID"
                        value={recipientId}
                        onChange={(e) => setRecipientId(e.target.value)}
                      />
                    </div>
                    <div className="network-warning" style={{ background: 'rgba(27, 155, 140, 0.03)', borderColor: 'rgba(27, 155, 140, 0.1)' }}>
                      <Info size={18} className="warning-icon-teal" />
                      <div className="warning-text-small">
                        Internal Ledger transfers route immediately to other Bicoin users with <strong>zero gas or transaction fees</strong>.
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Amount Input */}
              <div className="withdraw-form-group">
                <label className="withdraw-form-label">Amount</label>
                <div className="amount-input-container">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="withdraw-input"
                    placeholder={activeTab === 'onchain' ? "Minimum 10 USDT" : "Minimum 0.1 USDT"}
                    value={amount}
                    onChange={(e) => handleNumericInput(e.target.value, setAmount)}
                  />
                  <button className="amount-max-btn" onClick={() => setAmount(balance.toString())}>MAX</button>
                </div>
                <div className="balance-info-row">
                  <span className="balance-label">Available Balance</span>
                  <span className="balance-value">{balance.toFixed(2)} {selectedAsset.symbol}</span>
                </div>
              </div>

              {/* Fund Password */}
              <div className="withdraw-form-group">
                <label className="withdraw-form-label">Fund Password</label>
                <div className="withdraw-input-wrapper">
                  <input
                    type="password"
                    className="withdraw-input"
                    placeholder="Enter your fund password"
                    value={fundPassword}
                    onChange={(e) => setFundPassword(e.target.value)}
                  />
                </div>
                {profile && !profile.hasFundPassword && (
                  <div className="network-warning" style={{ marginTop: 8 }}>
                    <Info size={18} className="warning-icon-teal" />
                    <div className="warning-text-small">
                      You must set a Fund Password in your <a href="/dashboard/settings" style={{ color: '#14b8a6', textDecoration: 'underline' }}>Security Settings</a> before making transfers or withdrawals.
                    </div>
                  </div>
                )}
              </div>

              {/* Email Verification OTP Code with Cooldown Timer */}
              <div className="withdraw-form-group">
                <label className="withdraw-form-label">Email Verification Code</label>
                <div className="withdraw-input-wrapper" style={{ gap: '12px' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="withdraw-input"
                    placeholder="Enter 6-digit code"
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpCooldown > 0}
                    style={{
                      padding: '12px 16px',
                      background: otpCooldown > 0 ? '#1C1C2C' : 'rgba(27, 155, 140, 0.15)',
                      color: otpCooldown > 0 ? '#71717A' : '#1B9B8C',
                      border: otpCooldown > 0 ? '1px solid #1C1C2C' : '1px solid rgba(27, 155, 140, 0.3)',
                      borderRadius: '12px',
                      cursor: otpCooldown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      minWidth: '110px',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {otpCooldown > 0 ? `${otpCooldown}s` : 'Send OTP'}
                  </button>
                </div>
              </div>

              {/* Google 2FA (if enabled) */}
              {profile?.isGoogleAuthenticatorEnabled && (
                <div className="withdraw-form-group">
                  <label className="withdraw-form-label">Google Authenticator Code</label>
                  <div className="withdraw-input-wrapper">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="withdraw-input"
                      placeholder="Enter 6-digit code"
                      value={google2faCode}
                      onChange={(e) => setGoogle2faCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={{ letterSpacing: 6, textAlign: 'center', fontSize: 18, fontWeight: 600 }}
                    />
                  </div>
                </div>
              )}

              {/* Summary Section */}
              <div className="summary-card">
                <div className="summary-row">
                  <span className="summary-label">Network Fee</span>
                  <span className="summary-value">{activeFee.toFixed(2)} {selectedAsset.symbol}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Receive Amount</span>
                  <span className="summary-value highlight">
                    {receiveAmount.toFixed(2)} {selectedAsset.symbol}
                  </span>
                </div>
              </div>

              <button
                className="main-withdraw-btn"
                onClick={handleWithdraw}
                disabled={loading || (profile && !profile.hasFundPassword)}
              >
                {loading ? 'Processing...' : (profile && !profile.hasFundPassword) ? 'Set Fund Password First' : activeTab === 'onchain' ? 'Withdraw Funds' : 'Transfer Internally'}
              </button>
            </div>

            {/* Recent Transactions Table */}
            <div className="recent-withdrawals-section">
              <h2 className="recent-title">Recent Activity</h2>
              <div className="withdrawals-card">
                <table className="withdrawals-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Asset</th>
                      <th>Amount</th>
                      <th>Destination / Network</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#71717A' }}>No recent withdrawals or transfers</td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx._id}>
                          <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{tx.type === 'transfer' ? 'Internal Transfer' : 'Withdrawal'}</td>
                          <td>{tx.asset}</td>
                          <td>{tx.amount}</td>
                          <td>
                            {tx.type === 'transfer' 
                              ? (tx.walletAddress || 'Internal Funding Ledger') 
                              : `${tx.network || 'BEP20'} (${(tx.walletAddress || '-').substring(0, 10)}...)`
                            }
                          </td>
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
                  <span>On-chain withdrawals are processed via blockchain nodes within 5-30 mins depending on fee and network load.</span>
                </li>
                <li className="info-list-item">
                  <div className="info-bullet"></div>
                  <span>Internal ledger transfers bypass blockchain confirmations entirely, posting instantly to recipient balances.</span>
                </li>
                <li className="info-list-item">
                  <div className="info-bullet"></div>
                  <span>For security, changing passwords, email, or 2FA locks withdrawals and transfers for exactly 24 hours.</span>
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


