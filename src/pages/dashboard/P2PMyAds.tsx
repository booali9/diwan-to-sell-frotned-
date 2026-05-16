import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getMyP2PAds, toggleP2PAd, deleteP2PAd, createP2PAd } from '../../services/p2pService';
import { getProfile } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { ChevronRight, Plus, X, Check } from 'lucide-react';

export default function P2PMyAds() {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userBalance, setUserBalance] = useState(0);
    const { toast } = useToast();
    const navigate = useNavigate();

    const [showCreate, setShowCreate] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successAd, setSuccessAd] = useState<any>(null);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        side: 'buy', crypto: 'USDT', fiat: 'USD', priceType: 'fixed', fixedPrice: '', totalAmount: '', minOrderAmount: '', maxOrderAmount: '', paymentTimeLimit: '15'
    });

    const fetchAds = () => {
        setLoading(true);
        getMyP2PAds().then(res => {
            setAds(res);
            setLoading(false);
        }).catch(err => {
            toast(err.message, 'error');
            setLoading(false);
        });
    };

    const fetchUserProfile = () => {
        getProfile().then(profile => {
            setUserBalance(profile.balance || 0);
        }).catch(err => {
            console.error('Failed to fetch profile:', err);
        });
    };

    useEffect(() => { 
        fetchAds();
        fetchUserProfile();
    }, []);

    const handleCreate = async () => {
        try {
            // Validate required fields
            if (!formData.fixedPrice || !formData.totalAmount || !formData.minOrderAmount || !formData.maxOrderAmount) {
                toast('Please fill all required fields', 'error');
                return;
            }

            const fixedPrice = Number(formData.fixedPrice);
            const totalAmount = Number(formData.totalAmount);
            const minOrder = Number(formData.minOrderAmount);
            const maxOrder = Number(formData.maxOrderAmount);

            if (fixedPrice <= 0 || totalAmount <= 0 || minOrder <= 0 || maxOrder <= 0) {
                toast('All amounts must be greater than 0', 'error');
                return;
            }

            if (minOrder > maxOrder) {
                toast('Min limit cannot be greater than max limit', 'error');
                return;
            }

            // For SELL ads, check user has sufficient balance
            if (formData.side === 'sell') {
                if (userBalance < totalAmount) {
                    toast(`Insufficient balance. You have ${userBalance.toFixed(2)} ${formData.crypto}, but need ${totalAmount}`, 'error');
                    return;
                }
            }

            setCreating(true);
            const newAd = await createP2PAd({ 
                ...formData, 
                fixedPrice, 
                totalAmount, 
                minOrderAmount: minOrder, 
                maxOrderAmount: maxOrder, 
                paymentTimeLimit: Number(formData.paymentTimeLimit) 
            });
            
            // Show success modal
            setSuccessAd(newAd);
            setShowSuccess(true);
            setShowCreate(false);
            
            // Update balance if sell ad
            if (formData.side === 'sell') {
                setUserBalance(userBalance - totalAmount);
            }

            // Refresh ads list
            fetchAds();
            
            // Reset form
            setFormData({
                side: 'buy', crypto: 'USDT', fiat: 'USD', priceType: 'fixed', fixedPrice: '', totalAmount: '', minOrderAmount: '', maxOrderAmount: '', paymentTimeLimit: '15'
            });
        } catch (err: any) {
            toast(err.message, 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <Layout activePage="p2p">
            <div className="p2p-page">
                <div className="main-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => navigate('/dashboard/p2p')}>P2P Trading</h1>
                            <ChevronRight size={18} color="#71717A" style={{ flexShrink: 0 }} />
                            <h2 style={{ fontSize: '16px', margin: 0, color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>My Ads</h2>
                        </div>
                        <button className="p2p-confirm-btn primary" style={{ flexShrink: 0 }} onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> Post New Ad
                        </button>
                    </div>

                    <div className="p2p-section-tabs">
                        <button className="p2p-section-tab" onClick={() => navigate('/dashboard/p2p')}>Market</button>
                        <button className="p2p-section-tab" onClick={() => navigate('/dashboard/p2p/orders')}>Orders</button>
                        <button className="p2p-section-tab active">My Ads</button>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[1, 2, 3].map(i => <div key={i} className="p2p-skeleton p2p-skeleton-row" />)}
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="p2p-empty">
                            <div className="p2p-empty-icon">
                                <Plus size={32} />
                            </div>
                            <div className="p2p-empty-title">No Advertisements Found</div>
                            <p className="p2p-empty-desc">
                                You haven't posted any P2P ads yet. Create one to start trading with others.
                            </p>
                            <button 
                                className="p2p-confirm-btn primary" 
                                style={{ marginTop: '28px', padding: '10px 24px' }}
                                onClick={() => setShowCreate(true)}
                            >
                                <Plus size={18} /> Post Your First Ad
                            </button>
                        </div>
                    ) : (
                        <div>
                            {ads.map(ad => (
                                <div key={ad._id} className="p2p-my-ad-card">
                                    <div className="p2p-my-ad-left">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className={`p2p-my-ad-side ${ad.side}`}>{ad.side}</span>
                                            <span style={{ color: '#fff', fontWeight: 600 }}>{ad.crypto}</span>
                                        </div>
                                        <div className="p2p-my-ad-price">{ad.fixedPrice} <span style={{ fontSize: '12px', color: '#71717A' }}>{ad.fiat}</span></div>
                                        <div className="p2p-my-ad-meta">Available: {(ad.totalAmount - ad.filledAmount).toFixed(4)} {ad.crypto}</div>
                                        <div className="p2p-my-ad-meta">Limits: {ad.minOrderAmount} - {ad.maxOrderAmount} {ad.fiat}</div>
                                    </div>
                                    <div className="p2p-my-ad-actions">
                                        <button onClick={async () => { await toggleP2PAd(ad._id); fetchAds(); }}>
                                            {ad.status === 'active' ? 'Pause' : ad.status === 'paused' ? 'Resume' : ad.status}
                                        </button>
                                        <button className="delete" onClick={async () => { if(window.confirm('Delete ad?')) { await deleteP2PAd(ad._id); fetchAds(); } }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <div className="p2p-modal-overlay">
                    <div className="p2p-modal">
                        <div className="p2p-modal-header">
                            <div className="p2p-modal-title">Post P2P Advertisement</div>
                            <button className="p2p-modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
                        </div>

                        <div className="p2p-form-group">
                            <label className="p2p-form-label">Type</label>
                            <div className="p2p-side-tabs" style={{ width: '100%' }}>
                                <button className={`p2p-side-tab ${formData.side === 'buy' ? 'active-buy' : ''}`} style={{ flex: 1 }} onClick={() => setFormData({...formData, side: 'buy'})}>Buy</button>
                                <button className={`p2p-side-tab ${formData.side === 'sell' ? 'active-sell' : ''}`} style={{ flex: 1 }} onClick={() => setFormData({...formData, side: 'sell'})}>Sell</button>
                            </div>
                        </div>

                        <div className="p2p-form-row">
                            <div className="p2p-form-group">
                                <label className="p2p-form-label">Asset</label>
                                <select className="p2p-form-input p2p-filter-select" style={{ width: '100%' }} value={formData.crypto} onChange={e => setFormData({...formData, crypto: e.target.value})}>
                                    <option value="USDT">USDT</option>
                                    <option value="BTC">BTC</option>
                                    <option value="ETH">ETH</option>
                                </select>
                            </div>
                            <div className="p2p-form-group">
                                <label className="p2p-form-label">Fiat Currency</label>
                                <select className="p2p-form-input p2p-filter-select" style={{ width: '100%' }} value={formData.fiat} onChange={e => setFormData({...formData, fiat: e.target.value})}>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="AED">AED</option>
                                    <option value="KES">KES</option>
                                </select>
                            </div>
                        </div>

                        <div className="p2p-form-group">
                            <label className="p2p-form-label">Fixed Price</label>
                            <input type="number" className="p2p-form-input" value={formData.fixedPrice} onChange={e => setFormData({...formData, fixedPrice: e.target.value})} placeholder="e.g. 1.00" />
                        </div>

                        <div className="p2p-form-group">
                            <label className="p2p-form-label">Total Amount ({formData.crypto})</label>
                            <input type="number" className="p2p-form-input" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} />
                            {formData.side === 'sell' && (
                                <div style={{ fontSize: '12px', color: formData.totalAmount && Number(formData.totalAmount) > userBalance ? '#ef4444' : '#71717A', marginTop: '6px' }}>
                                    Available: {userBalance.toFixed(4)} {formData.crypto}
                                </div>
                            )}
                        </div>

                        <div className="p2p-form-row">
                            <div className="p2p-form-group">
                                <label className="p2p-form-label">Min Limit ({formData.fiat})</label>
                                <input type="number" className="p2p-form-input" value={formData.minOrderAmount} onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} />
                            </div>
                            <div className="p2p-form-group">
                                <label className="p2p-form-label">Max Limit ({formData.fiat})</label>
                                <input type="number" className="p2p-form-input" value={formData.maxOrderAmount} onChange={e => setFormData({...formData, maxOrderAmount: e.target.value})} />
                            </div>
                        </div>

                        <button className={`p2p-submit-btn ${formData.side === 'buy' ? 'buy' : 'sell'}`} onClick={handleCreate} disabled={creating}>
                            {creating ? 'Creating...' : 'Post Advertisement'}
                        </button>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            {showSuccess && successAd && (
                <div className="p2p-modal-overlay" onClick={() => setShowSuccess(false)}>
                    <div className="p2p-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="p2p-modal-header" style={{ marginBottom: '20px' }}>
                            <div style={{ flex: 1 }} />
                            <button className="p2p-modal-close" onClick={() => setShowSuccess(false)}><X size={20} /></button>
                        </div>

                        <div className="p2p-success-container">
                            <div className="p2p-success-icon">
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(28,212,167,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <Check size={40} color="#1CD4A7" />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0', textAlign: 'center' }}>Ad Successfully Posted</h3>
                            <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 28px 0', textAlign: 'center' }}>Your ad has been published and users can now place orders.</p>

                            <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ color: '#a1a1aa', fontSize: '13px' }}>{successAd.side === 'buy' ? 'Buy' : 'Sell'} {successAd.crypto} with {successAd.fiat}</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#1CD4A7', color: '#0C0C17' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} /> Online
                                    </span>
                                </div>

                                <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
                                    {successAd.fiat} {successAd.fixedPrice}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#71717A' }}>Amount</span>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{successAd.totalAmount} {successAd.crypto}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#71717A' }}>Limit</span>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{successAd.minOrderAmount.toLocaleString()} - {successAd.maxOrderAmount.toLocaleString()} {successAd.fiat}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                        <span style={{ color: '#71717A' }}>Ad Number</span>
                                        <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'monospace', fontSize: '12px' }}>{successAd._id?.slice(-8).toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                className="p2p-submit-btn buy" 
                                onClick={() => {
                                    setShowSuccess(false);
                                    navigate('/dashboard/p2p/ads');
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
