import React from 'react';
import InfoLayout from './InfoLayout';
import { Headset, MessageSquare, Mail, ClipboardList, Clock } from 'lucide-react';

const SupportPolicy: React.FC = () => {
    return (
        <InfoLayout title="Support Policy" lastUpdated="February 19, 2026" activePage="support-policy">
            <section className="info-section">
                <h2 className="info-section-title">
                    <Headset size={24} /> Client Support Framework
                </h2>
                <p className="info-text">
                    Diwan Finance is committed to providing structured, responsive, and secure client support.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <MessageSquare size={24} /> 1. Support Channels
                </h2>
                <p className="info-text">Clients may contact support via:</p>
                <div className="info-grid">
                    <div className="info-card">
                        <h3 className="info-card-title">Portal</h3>
                        <p className="info-card-text">Secure Client Portal for all account-specific inquiries.</p>
                    </div>
                    <div className="info-card">
                        <h3 className="info-card-title">Email</h3>
                        <p className="info-card-text">Official Support Email for general assistance.</p>
                    </div>
                    <div className="info-card">
                        <h3 className="info-card-title">Live Chat</h3>
                        <p className="info-card-text">Real-time assistance (where available).</p>
                    </div>
                    <div className="info-card">
                        <h3 className="info-card-title">Accounts</h3>
                        <p className="info-card-text">Dedicated Account Management for eligible accounts.</p>
                    </div>
                </div>
                <div className="risk-alert" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)', marginTop: '24px' }}>
                    <p className="info-text" style={{ margin: 0, fontSize: '14px' }}>
                        Support is provided during published operating hours. Response times may vary depending on inquiry complexity and market conditions.
                    </p>
                </div>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <ClipboardList size={24} /> 2. Scope of Support
                </h2>
                <p className="info-text">We provide assistance related to:</p>
                <ul className="info-list">
                    <li className="info-list-item">Account access and verification</li>
                    <li className="info-list-item">Platform functionality</li>
                    <li className="info-list-item">Funding and withdrawals</li>
                    <li className="info-list-item">Technical troubleshooting</li>
                    <li className="info-list-item">General service inquiries</li>
                </ul>
                <div className="risk-alert">
                    <p className="info-text" style={{ color: '#ffffff', margin: 0, fontSize: '14px' }}>
                        We do not provide investment advice, portfolio management, or trading recommendations.
                    </p>
                </div>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Mail size={24} /> 3. Complaint Handling Procedure
                </h2>
                <p className="info-text">If you wish to file a formal complaint:</p>
                <div className="info-list">
                    <div className="info-list-item">1. Submit written notice via official support email.</div>
                    <div className="info-list-item">2. Provide account ID and detailed description.</div>
                    <div className="info-list-item">3. Our compliance team will acknowledge receipt within a reasonable timeframe.</div>
                    <div className="info-list-item">4. A formal review and written response will follow.</div>
                </div>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Clock size={24} /> 4. Service Limitations
                </h2>
                <p className="info-text">Support services may be limited during:</p>
                <ul className="info-list">
                    <li className="info-list-item">System maintenance</li>
                    <li className="info-list-item">Market disruptions</li>
                    <li className="info-list-item">Regulatory investigations</li>
                    <li className="info-list-item">Force majeure events</li>
                </ul>
                <p className="info-text" style={{ color: '#71717A', fontStyle: 'italic' }}>
                    Diwan Finance reserves the right to record communications for quality assurance and regulatory compliance.
                </p>
            </section>
        </InfoLayout>
    );
};

export default SupportPolicy;
