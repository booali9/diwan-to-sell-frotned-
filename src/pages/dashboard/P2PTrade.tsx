import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout/Layout';
import { getP2PAds, createP2POrder } from '../../services/p2pService';
import { getProfile } from '../../services/userService';
import { Check, Filter, X } from 'lucide-react';
import '../../styles/p2p.css';
import { useNavigate } from 'react-router-dom';

export default function P2PTrade() {
    const { toast } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    const [sectionTab, setSectionTab] = useState<'market' | 'orders' | 'my-ads'>('market');
    const [crypto, setCrypto] = useState('USDT');
    const [fiat, setFiat] = useState('USD');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('All');

    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [orderAmount, setOrderAmount] = useState('');
    const [orderLoading, setOrderLoading] = useState(false);

    useEffect(() => {
        getProfile().catch(() => {});
    }, []);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const params: any = { side: activeTab, crypto, fiat };
            if (amount) params.amount = amount;
            if (paymentMethod && paymentMethod !== 'All') params.paymentMethod = paymentMethod;

            const res = await getP2PAds(params);
            setAds(res.ads || []);
        } catch (error: any) {
            toast(error.message || 'Failed to fetch P2P ads', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sectionTab === 'market') {
            fetchAds();
        }
    }, [activeTab, crypto, fiat, amount, paymentMethod, sectionTab]);

    const handleCreateOrder = async () => {
        if (!orderAmount || isNaN(Number(orderAmount)) || Number(orderAmount) <= 0) {
            toast('Please enter a valid amount', 'error');
            return;
        }

        const numAmount = Number(orderAmount);
        if (numAmount < selectedAd.minOrderAmount || numAmount > selectedAd.maxOrderAmount) {
            toast(`Amount must be between ${selectedAd.minOrderAmount} and ${selectedAd.maxOrderAmount}`, 'error');
            return;
        }

        setOrderLoading(true);
        try {
            const order = await createP2POrder({
                adId: selectedAd._id,
                amount: numAmount,
                paymentMethod: selectedAd.paymentMethods[0]
            });
            toast('Order created successfully!', 'success');
            setSelectedAd(null);
            setOrderAmount('');
            // Navigate to order details
            navigate(`/dashboard/p2p/order/${order._id}`);
        } catch (error: any) {
            toast(error.message || 'Failed to create order', 'error');
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <Layout activePage="p2p">
            <div className="p2p-page">
                <div className="main-content">
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>P2P Trading</h1>

                    <div className="p2p-section-tabs">
                        <button className={`p2p-section-tab ${sectionTab === 'market' ? 'active' : ''}`} onClick={() => setSectionTab('market')}>Market</button>
                        <button className={`p2p-section-tab ${sectionTab === 'orders' ? 'active' : ''}`} onClick={() => navigate('/dashboard/p2p/orders')}>Orders</button>
                        <button className={`p2p-section-tab ${sectionTab === 'my-ads' ? 'active' : ''}`} onClick={() => navigate('/dashboard/p2p/ads')}>My Ads</button>
                    </div>

                    {sectionTab === 'market' && (
                        <>
                            <div className="p2p-filters">
                                <div className="p2p-side-tabs">
                                    <button className={`p2p-side-tab ${activeTab === 'buy' ? 'active-buy' : ''}`} onClick={() => setActiveTab('buy')}>Buy</button>
                                    <button className={`p2p-side-tab ${activeTab === 'sell' ? 'active-sell' : ''}`} onClick={() => setActiveTab('sell')}>Sell</button>
                                </div>

                                <div className="p2p-filter-row-mobile">
                                    <select className="p2p-filter-select" value={crypto} onChange={e => setCrypto(e.target.value)}>
                                        <option value="USDT">USDT</option>
                                        <option value="BTC">BTC</option>
                                        <option value="ETH">ETH</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                    <select className="p2p-filter-select" value={fiat} onChange={e => setFiat(e.target.value)}>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="AED">AED</option>
                                        <option value="KES">KES</option>
                                    </select>
                                </div>

                                <input
                                    type="number"
                                    className="p2p-filter-input"
                                    placeholder="Enter Amount"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                />

                                <select className="p2p-filter-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option value="All">All Payments</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="PayPal">PayPal</option>
                                    <option value="Zelle">Zelle</option>
                                    <option value="Revolut">Revolut</option>
                                </select>
                            </div>

                            <div className="p2p-table-container">
                                {loading ? (
                                    <div>
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="p2p-skeleton p2p-skeleton-row" />)}
                                    </div>
                                ) : ads.length === 0 ? (
                                    <div className="p2p-empty">
                                        <div className="p2p-empty-icon"><Filter size={24} /></div>
                                        <div className="p2p-empty-title">No Ads Found</div>
                                        <div className="p2p-empty-desc">Try adjusting your filters</div>
                                    </div>
                                ) : (
                                    <table className="p2p-table desktop-only">
                                        <thead>
                                            <tr>
                                                <th>Advertiser (Completion Rate)</th>
                                                <th>Price</th>
                                                <th>Limit/Available</th>
                                                <th>Payment</th>
                                                <th style={{ textAlign: 'right' }}>Trade <span style={{ color: '#1CD4A7' }}>0 Fee</span></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ads.map(ad => (
                                                <tr key={ad._id}>
                                                    <td>
                                                        <div className="p2p-merchant">
                                                            <div className="p2p-merchant-avatar">
                                                                {ad.user?.avatar ? <img src={ad.user.avatar} alt="Avatar" /> : ad.user?.name?.charAt(0)}
                                                            </div>
                                                            <div className="p2p-merchant-info">
                                                                <div className="p2p-merchant-name">
                                                                    {ad.user?.name}
                                                                    {ad.user?.kycStatus === 'verified' && <span className="p2p-badge-verified"><Check size={8} strokeWidth={4} /></span>}
                                                                </div>
                                                                <div className="p2p-merchant-stats">
                                                                    <span>{ad.completedTrades || 0} orders</span>
                                                                    <span>|</span>
                                                                    <span>{ad.completionRate || 100}% completion</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-price">{ad.fixedPrice} <span className="p2p-price-fiat">{ad.fiat}</span></div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-available">Available: <strong>{ad.availableAmount?.toFixed(2)} {ad.crypto}</strong></div>
                                                        <div className="p2p-limits">Limit: {ad.minOrderAmount} - {ad.maxOrderAmount} {ad.fiat}</div>
                                                    </td>
                                                    <td>
                                                        <div className="p2p-payment-tags">
                                                            {ad.paymentMethods?.map((pm: string, i: number) => (
                                                                <span key={i} className="p2p-payment-tag">{pm}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button 
                                                            className={`p2p-action-btn ${activeTab === 'buy' ? 'p2p-buy-btn' : 'p2p-sell-btn'}`}
                                                            onClick={() => {
                                                                setSelectedAd(ad);
                                                                setOrderAmount('');
                                                            }}
                                                        >
                                                            {activeTab === 'buy' ? 'Buy' : 'Sell'} {ad.crypto}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ORDER MODAL */}
            {selectedAd && (
                <div className="p2p-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedAd(null); }}>
                    <div className="p2p-modal">
                        <div className="p2p-modal-header">
                            <div className="p2p-modal-title">{activeTab === 'buy' ? 'Buy' : 'Sell'} {selectedAd.crypto}</div>
                            <button className="p2p-modal-close" onClick={() => setSelectedAd(null)}><X size={20} /></button>
                        </div>

                        <div className="p2p-merchant" style={{ marginBottom: '20px' }}>
                            <div className="p2p-merchant-avatar">
                                {selectedAd.user?.avatar ? <img src={selectedAd.user.avatar} alt="Avatar" /> : selectedAd.user?.name?.charAt(0)}
                            </div>
                            <div className="p2p-merchant-info">
                                <div className="p2p-merchant-name">{selectedAd.user?.name}</div>
                                <div className="p2p-merchant-stats">
                                    <span>{selectedAd.completedTrades || 0} orders</span> • <span>{selectedAd.completionRate || 100}%</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '16px', background: '#1a1a24', borderRadius: '8px' }}>
                            <div>
                                <div className="p2p-info-label">Price</div>
                                <div className="p2p-info-value price" style={{ color: activeTab === 'buy' ? '#1CD4A7' : '#ef4444' }}>{selectedAd.fixedPrice} {selectedAd.fiat}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="p2p-info-label">Payment Time</div>
                                <div className="p2p-info-value">{selectedAd.paymentTimeLimit || 15} mins</div>
                            </div>
                        </div>

                        <div className="p2p-form-group">
                            <label className="p2p-form-label">I want to pay ({selectedAd.fiat})</label>
                            <input
                                type="number"
                                className="p2p-form-input"
                                placeholder={`${selectedAd.minOrderAmount} - ${selectedAd.maxOrderAmount}`}
                                value={orderAmount}
                                onChange={e => setOrderAmount(e.target.value)}
                            />
                        </div>

                        <div className="p2p-form-group" style={{ marginBottom: '24px' }}>
                            <label className="p2p-form-label">I will receive ({selectedAd.crypto})</label>
                            <input
                                type="text"
                                className="p2p-form-input"
                                value={orderAmount && !isNaN(Number(orderAmount)) ? (Number(orderAmount) / selectedAd.fixedPrice).toFixed(6) : '0.00'}
                                disabled
                                style={{ opacity: 0.7 }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="p2p-confirm-btn outline" style={{ flex: 1 }} onClick={() => setSelectedAd(null)}>Cancel</button>
                            <button 
                                className={`p2p-confirm-btn ${activeTab === 'buy' ? 'primary' : 'danger'}`}
                                style={{ flex: 1 }}
                                onClick={handleCreateOrder}
                                disabled={orderLoading}
                            >
                                {orderLoading ? 'Processing...' : (activeTab === 'buy' ? 'Buy' : 'Sell')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
