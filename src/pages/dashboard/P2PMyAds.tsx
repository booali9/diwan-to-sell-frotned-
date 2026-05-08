import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getMyP2PAds, toggleP2PAd, deleteP2PAd, createP2PAd } from '../../services/p2pService';
import { useToast } from '../../context/ToastContext';
import { ChevronRight, Plus, X } from 'lucide-react';

export default function P2PMyAds() {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    const [showCreate, setShowCreate] = useState(false);
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

    useEffect(() => { fetchAds(); }, []);

    const handleCreate = async () => {
        try {
            await createP2PAd({ ...formData, fixedPrice: Number(formData.fixedPrice), totalAmount: Number(formData.totalAmount), minOrderAmount: Number(formData.minOrderAmount), maxOrderAmount: Number(formData.maxOrderAmount), paymentTimeLimit: Number(formData.paymentTimeLimit) });
            toast('Ad created successfully', 'success');
            setShowCreate(false);
            fetchAds();
        } catch (err: any) {
            toast(err.message, 'error');
        }
    };

    return (
        <Layout activePage="p2p">
            <div className="p2p-page">
                <div className="main-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/dashboard/p2p')}>P2P Trading</h1>
                            <ChevronRight size={20} color="#71717A" />
                            <h2 style={{ fontSize: '18px', color: '#a1a1aa' }}>My Ads</h2>
                        </div>
                        <button className="p2p-confirm-btn primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> Post New Ad
                        </button>
                    </div>

                    <div className="p2p-section-tabs">
                        <button className="p2p-section-tab" onClick={() => navigate('/dashboard/p2p')}>Market</button>
                        <button className="p2p-section-tab" onClick={() => navigate('/dashboard/p2p/orders')}>Orders</button>
                        <button className="p2p-section-tab active">My Ads</button>
                    </div>

                    {loading ? <div>Loading...</div> : ads.length === 0 ? <div className="p2p-empty">No ads created yet.</div> : (
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

                        <button className={`p2p-submit-btn ${formData.side === 'buy' ? 'buy' : 'sell'}`} onClick={handleCreate}>Post Advertisement</button>
                    </div>
                </div>
            )}
        </Layout>
    );
}
