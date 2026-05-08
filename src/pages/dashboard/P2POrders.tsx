import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getMyP2POrders } from '../../services/p2pService';
import { useToast } from '../../context/ToastContext';
import { ChevronRight } from 'lucide-react';

export default function P2POrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        getMyP2POrders().then(res => {
            setOrders(res);
            setLoading(false);
        }).catch(err => {
            toast(err.message, 'error');
            setLoading(false);
        });
    }, []);

    return (
        <Layout activePage="p2p">
            <div className="p2p-page">
                <div className="main-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/dashboard/p2p')}>P2P Trading</h1>
                        <ChevronRight size={20} color="#71717A" />
                        <h2 style={{ fontSize: '18px', color: '#a1a1aa' }}>Order History</h2>
                    </div>

                    <div className="p2p-section-tabs">
                        <button className="p2p-section-tab" onClick={() => navigate('/dashboard/p2p')}>Market</button>
                        <button className="p2p-section-tab active">Orders</button>
                        <button className="p2p-section-tab" onClick={() => navigate('/dashboard/p2p/ads')}>My Ads</button>
                    </div>

                    {loading ? (
                        <div>Loading...</div>
                    ) : orders.length === 0 ? (
                        <div className="p2p-empty">No orders found.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {orders.map(order => (
                                <div key={order._id} className="p2p-order-card" onClick={() => navigate(`/dashboard/p2p/order/${order._id}`)}>
                                    <div className="p2p-order-card-top">
                                        <div>
                                            <span style={{ fontWeight: 600, color: '#fff', fontSize: '16px', marginRight: '8px' }}>
                                                {order.crypto}
                                            </span>
                                            <span style={{ color: '#71717A', fontSize: '12px' }}>{order.orderNumber}</span>
                                        </div>
                                        <div className={`p2p-order-status-badge p2p-status-${order.status === 'pending_payment' ? 'pending' : order.status === 'payment_sent' ? 'paid' : order.status === 'completed' ? 'completed' : order.status === 'cancelled' ? 'cancelled' : 'expired'}`}>
                                            {order.status.replace('_', ' ').toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="p2p-order-card-bottom">
                                        <div>Amount: <span style={{ color: '#fff', fontWeight: 500 }}>{order.fiatAmount} {order.fiat}</span></div>
                                        <div>Quantity: <span style={{ color: '#fff', fontWeight: 500 }}>{order.cryptoAmount?.toFixed(4)} {order.crypto}</span></div>
                                        <div>{new Date(order.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
