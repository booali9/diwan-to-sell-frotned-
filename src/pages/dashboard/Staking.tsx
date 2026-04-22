"use client"
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Lock, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { getBalance } from '../../services/walletService'
import { stakeAsset, getStakingPools } from '../../services/stakingService'
import type { StakingPool } from '../../services/stakingService'
import { useToast } from '../../context/ToastContext'
import '../../styles/staking.css'

export default function Staking() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [stakingPools, setStakingPools] = useState<StakingPool[]>([])
    const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null)
    const [amount, setAmount] = useState('')
    const [userBalance, setUserBalance] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [autoCompound, setAutoCompound] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [balanceData, pools] = await Promise.all([
                    getBalance(),
                    getStakingPools()
                ])
                setUserBalance(balanceData.balance)
                setStakingPools(pools)
                if (pools.length > 0) setSelectedPool(pools[0])
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleStake = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast('Please enter a valid amount', 'error')
            return
        }

        if (Number(amount) > userBalance) {
            toast('Insufficient balance', 'error')
            return
        }

        setIsSubmitting(true)
        try {
            await stakeAsset({
                amount: Number(amount),
                duration: selectedPool!.duration,
                autoCompound
            })
            toast('Staking successful!', 'success')
            navigate('/dashboard/earn')
        } catch (error: any) {
            toast(error.response?.data?.message || 'Staking failed', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const estimatedAnnual = selectedPool ? Number(amount) * (selectedPool.apy / 100) : 0

    if (loading) {
        return (
            <Layout activePage="staking">
                <div className="staking-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <p style={{ color: '#888' }}>Loading staking pools...</p>
                </div>
            </Layout>
        )
    }

    if (!selectedPool) {
        return (
            <Layout activePage="staking">
                <div className="staking-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <p style={{ color: '#888' }}>No staking pools available.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout activePage="staking">
            <div className="staking-page-container">
                <div className="staking-header">
                    <h1 className="staking-title">Diwan <span className="highlight-text">Earn</span></h1>
                    <p className="staking-subtitle">Simple & Secure. Stake your crypto and earn daily rewards.</p>
                </div>

                <div className="staking-grid">
                    {/* Left: Pool Selection */}
                    <div className="staking-pools-section">
                        <h2 className="section-title">Select Savings Pool</h2>
                        <div className="pools-list">
                            {stakingPools.map((pool) => (
                                <div
                                    key={pool.id}
                                    className={`pool-card ${selectedPool.id === pool.id ? 'active' : ''}`}
                                    onClick={() => setSelectedPool(pool)}
                                >
                                    <div className="pool-info">
                                        <div className="pool-icon-wrapper">
                                            {pool.duration === 0 ? <TrendingUp size={20} /> : <Lock size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="pool-name">{pool.name}</h3>
                                            <p className="pool-duration">{pool.duration === 0 ? 'Flexible' : `${pool.duration} Days`}</p>
                                        </div>
                                    </div>
                                    <div className="pool-apy">
                                        <span className="apy-label">Estimated APY</span>
                                        <span className="apy-value">{pool.apy}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Action Panel */}
                    <div className="staking-action-panel">
                        <div className="panel-header">
                            <h2 className="panel-title">Stake USDT</h2>
                            <button className="earn-history-btn" onClick={() => navigate('/dashboard/earn')}>
                                My Positions <ArrowRight size={14} />
                            </button>
                        </div>

                        <div className="staking-input-group">
                            <div className="input-header">
                                <span className="input-label">Amount to Stake</span>
                                <span className="input-balance">Available: {userBalance.toLocaleString()} USDT</span>
                            </div>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <button className="max-btn" onClick={() => setAmount(userBalance.toString())}>MAX</button>
                            </div>
                        </div>

                        <div className="staking-details-summary">
                            <div className="summary-row">
                                <span className="summary-label">Selected Pool</span>
                                <span className="summary-value">{selectedPool.name}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Annual Yield</span>
                                <span className="summary-value highlight">{selectedPool.apy}%</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Estimated Annual Reward</span>
                                <span className="summary-value">
                                    {!isNaN(estimatedAnnual) ? estimatedAnnual.toFixed(2) : '0.00'} USDT
                                </span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-label">Redemption Date</span>
                                <span className="summary-value">
                                    {selectedPool.duration === 0 ? 'Any time' :
                                        new Date(Date.now() + selectedPool.duration * 86400000).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="autocompound-toggle">
                            <div className="toggle-info">
                                <h4 className="toggle-title">Auto-Compound</h4>
                                <p className="toggle-desc">Automatically re-stake your rewards to maximize yield.</p>
                            </div>
                            <div
                                className={`custom-toggle ${autoCompound ? 'active' : ''}`}
                                onClick={() => setAutoCompound(!autoCompound)}
                            >
                                <div className="toggle-knob"></div>
                            </div>
                        </div>

                        <button
                            className="stake-submit-btn"
                            onClick={handleStake}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Stake Now'}
                        </button>

                        <div className="staking-risk-notice">
                            <Info size={14} />
                            <span>Digital assets staking involves risks. Rewards are educational simulation.</span>
                        </div>
                    </div>
                </div>

                {/* Why Stake Section */}
                <div className="staking-benefits">
                    <div className="benefit-card">
                        <CheckCircle2 size={24} className="benefit-icon" />
                        <h3>Daily Payouts</h3>
                        <p>Watch your rewards accumulate in real-time every minute.</p>
                    </div>
                    <div className="benefit-card">
                        <CheckCircle2 size={24} className="benefit-icon" />
                        <h3>Zero Fees</h3>
                        <p>There are no commission fees for staking or unstaking your assets.</p>
                    </div>
                    <div className="benefit-card">
                        <CheckCircle2 size={24} className="benefit-icon" />
                        <h3>Secure Storage</h3>
                        <p>Your assets are protected by our multi-layer security infrastructure.</p>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
