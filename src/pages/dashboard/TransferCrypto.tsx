import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowUpDown, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    getBalance,
    getCachedBalance,
    getFuturesBalance,
    recordInternalTransfer,
    getSpotHoldings,
    getLastKnownPrices,
    getSpotCostBasis,
} from '../../services/walletService'
import { useToast } from '../../context/ToastContext'
import Layout from '../../components/Layout/Layout'

type AccountType = 'Spot' | 'Futures'


function TransferCrypto() {
    const navigate = useNavigate()
    const { toast } = useToast()

    const [fromAccount, setFromAccount] = useState<AccountType>('Spot')
    const [toAccount, setToAccount] = useState<AccountType>('Futures')
    const [spotBalance, setSpotBalance] = useState(() => getCachedBalance())
    const [spotHoldingsUsd, setSpotHoldingsUsd] = useState(0)
    const [futuresBalance, setFuturesBalanceState] = useState(() => getFuturesBalance())
    const [amount, setAmount] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [lastTransferred, setLastTransferred] = useState(0)

    useEffect(() => {
        const load = async () => {
            try {
                const bal = await getBalance()
                if (bal.balance > 0) setSpotBalance(bal.balance)
            } catch { /* use cached */ }
            setFuturesBalanceState(getFuturesBalance())
            // Compute coin holdings USD value (same formula as Assets page)
            const holdings = getSpotHoldings()
            const lastPrices = getLastKnownPrices()
            const costBasis = getSpotCostBasis()
            const holdingsUsd = Object.entries(holdings).reduce((sum, [sym, held]) => {
                if (!held || held <= 0) return sum
                const p = lastPrices[sym + '/USDT'] || lastPrices[sym + 'USDT'] || 0
                if (p > 0) return sum + held * p
                return sum + (costBasis[sym] || 0)
            }, 0)
            setSpotHoldingsUsd(holdingsUsd)
        }
        load()
    }, [])

    const fromBalance = fromAccount === 'Spot' ? spotBalance : futuresBalance
    const toBalance = toAccount === 'Spot' ? spotBalance : futuresBalance

    const handleSwap = () => {
        setFromAccount(toAccount)
        setToAccount(fromAccount)
        setAmount('')
    }

    const handleMax = () => {
        if (fromBalance > 0) setAmount((Math.floor(fromBalance * 100) / 100).toFixed(2))
    }

    const handleTransfer = async () => {
        const amt = parseFloat(amount)
        if (!amt || isNaN(amt) || amt <= 0) {
            toast('Please enter a valid amount', 'warning')
            return
        }
        if (amt > parseFloat(fromBalance.toFixed(8))) {
            toast(`Insufficient ${fromAccount} balance`, 'error')
            return
        }
        setIsSubmitting(true)
        try {
        const result = await recordInternalTransfer(amt, fromAccount, toAccount)
            setSpotBalance(result.balance)
            setFuturesBalanceState(result.futuresBalance)
            setLastTransferred(amt)
            setAmount('')
            setSuccess(true)
        } catch (e: any) {
            toast(e.message || 'Transfer failed', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const isValid = !!(amount && parseFloat(amount) > 0 && parseFloat(amount) <= parseFloat(fromBalance.toFixed(8)))

    if (success) {
        return (
            <Layout activePage="assets" hideMobileNav={true} hideFooterMobile={true}>
                <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 24 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,192,163,0.12)', border: '2px solid #00C0A3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={36} color="#00C0A3" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Transfer Successful</div>
                        <div style={{ fontSize: 14, color: '#71717a', lineHeight: 1.6 }}>
                            {lastTransferred.toFixed(2)} USDT transferred<br />
                            from <span style={{ color: '#fff' }}>{fromAccount === 'Spot' ? 'Futures' : 'Spot'}</span> to <span style={{ color: '#fff' }}>{fromAccount === 'Spot' ? 'Spot' : 'Futures'}</span>
                        </div>
                    </div>
                    <div style={{ width: '100%', maxWidth: 360, background: '#111118', borderRadius: 16, border: '1px solid #1a1a28', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#71717a' }}>Spot Balance</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{(spotBalance + spotHoldingsUsd).toFixed(2)} USDT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#71717a' }}>Futures Balance</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{futuresBalance.toFixed(2)} USDT</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSuccess(false)}
                        style={{ width: '100%', maxWidth: 360, background: 'linear-gradient(135deg,#0d9488,#0a7a70)', border: 'none', borderRadius: 14, padding: '16px', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        Transfer Again
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ width: '100%', maxWidth: 360, background: 'transparent', border: '1px solid #1a1a28', borderRadius: 14, padding: '16px', color: '#71717a', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        Done
                    </button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout activePage="assets" hideMobileNav={true} hideFooterMobile={true}>
            <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 0' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ width: 38, height: 38, borderRadius: 12, background: '#141420', border: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>Transfer</h1>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Info Banner */}
                    <div style={{ background: 'rgba(0,192,163,0.06)', border: '1px solid rgba(0,192,163,0.18)', borderRadius: 14, padding: '13px 16px', fontSize: 13, color: '#00C0A3', lineHeight: 1.6 }}>
                        Transfer funds between your <strong>Spot</strong> and <strong>Futures</strong> accounts instantly and fee-free.
                    </div>

                    {/* From / To Card */}
                    <div style={{ background: '#111118', borderRadius: 18, border: '1px solid #1a1a28', padding: '0 18px' }}>
                        {/* From Row */}
                        <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#52526a', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>From</div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{fromAccount} Account</div>
                                <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>Balance: {(fromAccount === 'Spot' ? (spotBalance + spotHoldingsUsd) : futuresBalance).toFixed(2)} USDT</div>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: fromAccount === 'Spot' ? 'rgba(0,192,163,0.12)' : 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                {fromAccount === 'Spot' ? '💼' : '📈'}
                            </div>
                        </div>

                        {/* Swap Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 -18px', padding: '8px 18px', background: '#0d0d14', borderTop: '1px solid #1a1a28', borderBottom: '1px solid #1a1a28' }}>
                            <div style={{ flex: 1, height: 1, background: '#1a1a28' }} />
                            <button
                                onClick={handleSwap}
                                style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,192,163,0.12)', border: '1px solid rgba(0,192,163,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                            >
                                <ArrowUpDown size={16} color="#00C0A3" />
                            </button>
                            <div style={{ flex: 1, height: 1, background: '#1a1a28' }} />
                        </div>

                        {/* To Row */}
                        <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#52526a', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>To</div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{toAccount} Account</div>
                                <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>Balance: {toBalance.toFixed(2)} USDT</div>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: toAccount === 'Futures' ? 'rgba(239,68,68,0.10)' : 'rgba(0,192,163,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                {toAccount === 'Futures' ? '📈' : '💼'}
                            </div>
                        </div>
                    </div>

                    {/* Amount Card */}
                    <div style={{ background: '#111118', borderRadius: 18, border: '1px solid #1a1a28', padding: '16px 18px' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#52526a', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Amount (USDT)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 28, fontWeight: 700, fontFamily: 'inherit', minWidth: 0 }}
                            />
                            <button
                                onClick={handleMax}
                                style={{ background: 'rgba(0,192,163,0.12)', border: '1px solid rgba(0,192,163,0.25)', borderRadius: 8, color: '#00C0A3', fontWeight: 700, fontSize: 12, padding: '5px 12px', cursor: 'pointer', flexShrink: 0, letterSpacing: '0.4px', fontFamily: 'inherit' }}
                            >
                                MAX
                            </button>
                        </div>
                        {amount && parseFloat(amount) > 0 && (
                            <div style={{ fontSize: 12, color: '#52526a', marginTop: 6 }}>≈ ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</div>
                        )}
                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #1a1a28', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#71717a' }}>Spot: <span style={{ color: '#fff', fontWeight: 600 }}>{(spotBalance + spotHoldingsUsd).toFixed(2)} USDT</span></span>
                            <span style={{ color: '#71717a' }}>Futures: <span style={{ color: '#fff', fontWeight: 600 }}>{futuresBalance.toFixed(2)} USDT</span></span>
                        </div>
                    </div>

                    {/* Transfer Button */}
                    <button
                        onClick={handleTransfer}
                        disabled={!isValid || isSubmitting}
                        style={{
                            background: isValid ? 'linear-gradient(135deg,#0d9488,#0a7a70)' : '#141420',
                            border: isValid ? 'none' : '1px solid #1e1e2e',
                            borderRadius: 16,
                            padding: 17,
                            color: isValid ? '#fff' : '#3a3a50',
                            fontSize: 16,
                            fontWeight: 700,
                            width: '100%',
                            cursor: isValid ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            transition: 'all 0.25s ease',
                            boxShadow: isValid ? '0 8px 24px rgba(13,148,136,0.25)' : 'none',
                            fontFamily: 'inherit',
                            marginTop: 4,
                        }}
                    >
                        <ArrowUpDown size={18} />
                        {isSubmitting ? 'Processing...' : `Transfer to ${toAccount}`}
                    </button>

                    {/* How it works */}
                    <div style={{ background: '#111118', borderRadius: 16, border: '1px solid #1a1a28', padding: '16px 18px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10 }}>How it works</div>
                        {([
                            ['⚡', 'Instant transfer', 'Funds arrive immediately, no waiting'],
                            ['🆓', 'Fee-free', 'No fees for internal account transfers'],
                            ['🔄', 'Reversible', 'You can transfer back at any time'],
                        ] as const).map(([icon, title, sub]) => (
                            <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 16, marginTop: 1 }}>{icon}</span>
                                <div>
                                    <div style={{ fontSize: 13, color: '#d4d4d8', fontWeight: 600 }}>{title}</div>
                                    <div style={{ fontSize: 11, color: '#52526a', marginTop: 2 }}>{sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </Layout>
    )
}

export default TransferCrypto
