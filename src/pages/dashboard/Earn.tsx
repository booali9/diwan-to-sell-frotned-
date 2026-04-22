"use client"
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, ArrowUpRight, Clock, Shield, PieChart, Activity, DollarSign, ExternalLink } from 'lucide-react'
import Layout from '../../components/Layout/Layout'
import { getMyStakes, unstakeAsset } from '../../services/stakingService'
import { useToast } from '../../context/ToastContext'
import '../../styles/earn.css'

export default function Earn() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [stakes, setStakes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalStaked: 0,
        totalRewards: 0,
        activePositions: 0
    })

    const fetchStakes = async () => {
        try {
            const data = await getMyStakes()
            setStakes(data)

            const active = data.filter((s: any) => s.status === 'active')
            const totalS = active.reduce((acc: number, s: any) => acc + s.amount, 0)
            const totalR = data.reduce((acc: number, s: any) => acc + (s.accruedRewards || 0), 0)

            setStats({
                totalStaked: totalS,
                totalRewards: totalR,
                activePositions: active.length
            })
        } catch (error) {
            console.error('Error fetching stakes:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStakes()

        // Polling for live reward updates (every 10 seconds for visual effect)
        const interval = setInterval(fetchStakes, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleUnstake = async (id: string, duration: number, endDate: string) => {
        const isEarly = duration > 0 && new Date() < new Date(endDate)
        const msg = isEarly
            ? "This is a locked pool. Unstaking early may result in loss of rewards. Proceed?"
            : "Are you sure you want to unstake and claim rewards?"

        if (window.confirm(msg)) {
            try {
                await unstakeAsset(id)
                toast('Unstaked successfully!', 'success')
                fetchStakes()
            } catch (error: any) {
                toast(error.response?.data?.message || 'Unstaking failed', 'error')
            }
        }
    }

    return (
        <Layout activePage="earn">
            <div className="earn-page-container">
                <div className="earn-header-v2">
                    <div className="header-text">
                        <h1 className="earn-title">Yield <span className="highlight-text">Dashboard</span></h1>
                        <p className="earn-subtitle">Track your passive income and active staking positions.</p>
                    </div>
                    <button className="new-stake-btn" onClick={() => navigate('/dashboard/staking')}>
                        Stake More <ArrowUpRight size={16} />
                    </button>
                </div>

                {/* Stats Overview */}
                <div className="earn-stats-grid">
                    <div className="earn-stat-card primary">
                        <div className="stat-icon"><DollarSign size={24} /></div>
                        <div className="stat-content">
                            <span className="stat-label">Total Amount Staked</span>
                            <div className="stat-value-group">
                                <h2 className="stat-value">{stats.totalStaked.toLocaleString()}</h2>
                                <span className="stat-unit">USDT</span>
                            </div>
                        </div>
                        <div className="stat-decoration"><Activity size={60} /></div>
                    </div>

                    <div className="earn-stat-card secondary">
                        <div className="stat-icon"><TrendingUp size={24} /></div>
                        <div className="stat-content">
                            <span className="stat-label">Total Rewards Earned</span>
                            <div className="stat-value-group">
                                <h2 className="stat-value">+{stats.totalRewards.toFixed(4)}</h2>
                                <span className="stat-unit">USDT</span>
                            </div>
                        </div>
                    </div>

                    <div className="earn-stat-card">
                        <div className="stat-icon"><PieChart size={24} /></div>
                        <div className="stat-content">
                            <span className="stat-label">Active Positions</span>
                            <div className="stat-value-group">
                                <h2 className="stat-value">{stats.activePositions}</h2>
                                <span className="stat-unit">Pools</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Positions Table */}
                <div className="positions-section">
                    <div className="section-header">
                        <h2 className="section-title">My Staking Positions</h2>
                    </div>

                    <div className="positions-table-wrapper">
                        {loading ? (
                            <div className="loading-state">Loading positions...</div>
                        ) : stakes.length === 0 ? (
                            <div className="empty-positions">
                                <Clock size={48} className="empty-icon" />
                                <h3>No active positions</h3>
                                <p>Start your first staking position to earn daily rewards.</p>
                                <button className="start-staking-btn" onClick={() => navigate('/dashboard/staking')}>
                                    Explore Pools
                                </button>
                            </div>
                        ) : (
                            <table className="positions-table">
                                <thead>
                                    <tr>
                                        <th>Pool Type</th>
                                        <th>Amount</th>
                                        <th>APY</th>
                                        <th>Accrued Rewards</th>
                                        <th>Status</th>
                                        <th>Maturity Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stakes.map((stake) => (
                                        <tr key={stake._id}>
                                            <td>
                                                <div className="pool-cell">
                                                    <div className={`pool-mini-icon ${stake.duration === 0 ? 'flexible' : 'locked'}`}>
                                                        {stake.duration === 0 ? <TrendingUp size={14} /> : <Shield size={14} />}
                                                    </div>
                                                    <div className="pool-cell-text">
                                                        <span className="pool-type-name">{stake.duration === 0 ? 'Flexible' : `${stake.duration} Days Fixed`}</span>
                                                        <span className="pool-asset">{stake.asset}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="weight-600">{stake.amount.toLocaleString()} USDT</span></td>
                                            <td><span className="apy-badge">{stake.apy}%</span></td>
                                            <td>
                                                <div className="rewards-cell">
                                                    <span className="reward-value">+{stake.accruedRewards.toFixed(6)}</span>
                                                    <span className="reward-unit">USDT</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-tag ${stake.status}`}>
                                                    {stake.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="maturity-date">
                                                    {stake.duration === 0 ? 'Any time' : new Date(stake.endDate).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td>
                                                {stake.status === 'active' && (
                                                    <button
                                                        className="unstake-btn"
                                                        onClick={() => handleUnstake(stake._id, stake.duration, stake.endDate)}
                                                    >
                                                        Unstake
                                                    </button>
                                                )}
                                                {stake.status === 'completed' && (
                                                    <button className="claim-btn">Claimed</button>
                                                )}
                                                {stake.status === 'withdrawn' && (
                                                    <button className="withdrawn-btn" disabled>Withdrawn</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="earn-bottom-actions">
                    <div className="internal-link-card" onClick={() => navigate('/dashboard/trade')}>
                        <div className="card-icon"><Activity size={20} /></div>
                        <div className="card-info">
                            <h4>Active Trading</h4>
                            <p>Use your unstaked balance to trade with leverage.</p>
                        </div>
                        <ExternalLink size={16} className="card-arrow" />
                    </div>
                    <div className="internal-link-card" onClick={() => navigate('/dashboard/market')}>
                        <div className="card-icon"><TrendingUp size={20} /></div>
                        <div className="card-info">
                            <h4>Market Insights</h4>
                            <p>Track the best performing assets in real-time.</p>
                        </div>
                        <ExternalLink size={16} className="card-arrow" />
                    </div>
                </div>
            </div>
        </Layout>
    )
}
