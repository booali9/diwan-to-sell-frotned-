import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { getP2POrderDetail, markP2PPaymentSent, releaseP2PCrypto, cancelP2POrder, sendP2PMessage, getP2PMessages } from '../../services/p2pService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Send, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function P2POrderView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [order, setOrder] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const fetchOrder = async () => {
        try {
            const data = await getP2POrderDetail(id!);
            setOrder(data);
            if (data.status === 'pending_payment') {
                const expiry = new Date(data.expiresAt).getTime();
                setTimeLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));
            }
        } catch (err: any) {
            toast(err.message, 'error');
            navigate('/dashboard/p2p/orders');
        }
    };

    const fetchMessages = async () => {
        try {
            const data = await getP2PMessages(id!);
            setMessages(data);
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 100);
        } catch (err) {}
    };

    useEffect(() => {
        if (id) {
            fetchOrder().then(() => { setLoading(false); fetchMessages(); });
            const intOrder = setInterval(fetchOrder, 10000);
            const intMsgs = setInterval(fetchMessages, 5000);
            return () => { clearInterval(intOrder); clearInterval(intMsgs); };
        }
    }, [id]);

    useEffect(() => {
        if (timeLeft > 0 && order?.status === 'pending_payment') {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, order?.status]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await sendP2PMessage(id!, { text: newMessage });
            setNewMessage('');
            fetchMessages();
        } catch (err: any) { toast(err.message, 'error'); }
    };

    const handleMarkPaid = async () => {
        if (!window.confirm('Are you sure you have paid the seller?')) return;
        try {
            await markP2PPaymentSent(id!);
            toast('Payment marked as sent', 'success');
            fetchOrder();
        } catch (err: any) { toast(err.message, 'error'); }
    };

    const handleRelease = async () => {
        if (!window.confirm('Are you sure you want to release the crypto to the buyer? This action is irreversible.')) return;
        try {
            await releaseP2PCrypto(id!);
            toast('Crypto released successfully', 'success');
            fetchOrder();
        } catch (err: any) { toast(err.message, 'error'); }
    };

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await cancelP2POrder(id!);
            toast('Order cancelled', 'success');
            fetchOrder();
        } catch (err: any) { toast(err.message, 'error'); }
    };

    if (loading || !order) return <Layout activePage="p2p"><div style={{ padding: '40px', color: '#fff' }}>Loading...</div></Layout>;

    const isBuyer = order.buyer._id === user?._id;

    return (
        <Layout activePage="p2p">
            <div className="p2p-page p2p-order-layout">
                {/* LEFT: ORDER DETAILS */}
                <div className="p2p-order-main">
                    <div className="p2p-order-header">
                        <div>
                            <div className="p2p-order-number">Order {order.orderNumber}</div>
                            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                                {isBuyer ? 'Buy' : 'Sell'} {order.crypto}
                            </h1>
                        </div>
                        <div className={`p2p-order-status-badge p2p-status-${order.status === 'pending_payment' ? 'pending' : order.status === 'payment_sent' ? 'paid' : order.status === 'completed' ? 'completed' : 'cancelled'}`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                        </div>
                    </div>

                    {order.status === 'pending_payment' && (
                        <div className="p2p-timer-box">
                            <Clock className="p2p-timer-icon" size={24} />
                            <div className="p2p-timer-text">
                                Please pay the seller within <br/>
                                <strong>{formatTime(timeLeft)}</strong>
                            </div>
                        </div>
                    )}

                    <div className="p2p-order-info-grid">
                        <div className="p2p-info-card">
                            <div className="p2p-info-label">Fiat Amount</div>
                            <div className="p2p-info-value price">{order.fiatAmount} {order.fiat}</div>
                        </div>
                        <div className="p2p-info-card">
                            <div className="p2p-info-label">Crypto Amount</div>
                            <div className="p2p-info-value">{order.cryptoAmount.toFixed(4)} {order.crypto}</div>
                        </div>
                        <div className="p2p-info-card">
                            <div className="p2p-info-label">Price</div>
                            <div className="p2p-info-value">{order.price} {order.fiat}</div>
                        </div>
                        <div className="p2p-info-card">
                            <div className="p2p-info-label">Payment Method</div>
                            <div className="p2p-info-value">{order.paymentMethod}</div>
                        </div>
                    </div>

                    {/* STEPS / ACTIONS */}
                    <div style={{ marginTop: '32px' }}>
                        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Order Progress</h3>
                        <div className="p2p-order-steps">
                            <div className="p2p-step">
                                <div className={`p2p-step-dot done`}><CheckCircle2 size={18} /></div>
                                <div className="p2p-step-text">
                                    <div className="p2p-step-title">Order Created</div>
                                    <div className="p2p-step-desc">Crypto locked in escrow</div>
                                </div>
                            </div>
                            <div className="p2p-step">
                                <div className={`p2p-step-dot ${order.status !== 'pending_payment' ? 'done' : 'active'}`}>
                                    {order.status !== 'pending_payment' ? <CheckCircle2 size={18} /> : '2'}
                                </div>
                                <div className="p2p-step-text">
                                    <div className="p2p-step-title">Payment Transfer</div>
                                    <div className="p2p-step-desc">{isBuyer ? 'Transfer funds to seller' : 'Wait for buyer payment'}</div>
                                    
                                    {isBuyer && order.status === 'pending_payment' && (
                                        <div className="p2p-action-buttons">
                                            <button className="p2p-confirm-btn outline" onClick={handleCancel}>Cancel Order</button>
                                            <button className="p2p-confirm-btn primary" onClick={handleMarkPaid}>Transferred, Notify Seller</button>
                                        </div>
                                    )}
                                    {!isBuyer && order.status === 'pending_payment' && (
                                        <div style={{ marginTop: '12px', fontSize: '13px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '10px', borderRadius: '8px' }}>
                                            <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} />
                                            Wait for the buyer to transfer funds.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p2p-step">
                                <div className={`p2p-step-dot ${order.status === 'completed' ? 'done' : order.status === 'payment_sent' ? 'active' : 'pending'}`}>
                                    {order.status === 'completed' ? <CheckCircle2 size={18} /> : '3'}
                                </div>
                                <div className="p2p-step-text">
                                    <div className="p2p-step-title">Release Crypto</div>
                                    <div className="p2p-step-desc">Seller releases crypto from escrow</div>
                                    
                                    {!isBuyer && order.status === 'payment_sent' && (
                                        <div className="p2p-action-buttons">
                                            <button className="p2p-confirm-btn outline">Appeal</button>
                                            <button className="p2p-confirm-btn primary" onClick={handleRelease}>Payment Received, Release Crypto</button>
                                        </div>
                                    )}
                                    {isBuyer && order.status === 'payment_sent' && (
                                        <div style={{ marginTop: '12px', fontSize: '13px', color: '#1CD4A7', background: 'rgba(28,212,167,0.1)', padding: '10px', borderRadius: '8px' }}>
                                            Payment sent. Waiting for seller to release {order.crypto}.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CHAT */}
                <div className="p2p-order-chat">
                    <div className="p2p-chat-header">
                        <div className="p2p-chat-title">{isBuyer ? order.seller.name : order.buyer.name}</div>
                    </div>
                    <div className="p2p-chat-body" ref={chatContainerRef}>
                        <div className="p2p-msg system"><div className="p2p-msg-bubble">Order Created. Do not release crypto before verifying payment receipt.</div></div>
                        
                        {messages.map((msg, i) => {
                            if (msg.type === 'system') return (
                                <div key={i} className="p2p-msg system">
                                    <div className="p2p-msg-bubble">{msg.text}</div>
                                </div>
                            );
                            const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                            return (
                                <div key={i} className={`p2p-msg ${isMine ? 'mine' : 'theirs'}`}>
                                    <div className="p2p-msg-bubble">{msg.text}</div>
                                    <div className="p2p-msg-time">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {['pending_payment', 'payment_sent'].includes(order.status) && (
                        <form className="p2p-chat-input-area" onSubmit={handleSendMessage}>
                            <input 
                                type="text" 
                                className="p2p-chat-input" 
                                placeholder="Type a message..." 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="p2p-chat-send"><Send size={16} /></button>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
}
