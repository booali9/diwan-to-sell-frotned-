import React from 'react';
import InfoLayout from './InfoLayout';
import { Database, Target, ShieldCheck, Share2, History, User } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
    return (
        <InfoLayout title="Privacy Policy" lastUpdated="February 19, 2026" activePage="privacy-policy">
            <section className="info-section">
                <h2 className="info-section-title">
                    <Database size={24} /> 1. Information We Collect
                </h2>
                <p className="info-text">We collect:</p>
                <ul className="info-list">
                    <li className="info-list-item">Personal identification data</li>
                    <li className="info-list-item">Financial and transaction data</li>
                    <li className="info-list-item">Device and usage information</li>
                    <li className="info-list-item">Communication records</li>
                </ul>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Target size={24} /> 2. Purpose of Collection
                </h2>
                <p className="info-text">Information is used to:</p>
                <div className="info-grid">
                    <div className="info-card">
                        <h3 className="info-card-title">Compliance</h3>
                        <p className="info-card-text">Verify identity (AML/KYC compliance) and meet regulatory obligations.</p>
                    </div>
                    <div className="info-card">
                        <h3 className="info-card-title">Services</h3>
                        <p className="info-card-text">Provide trading services and improve platform performance.</p>
                    </div>
                    <div className="info-card">
                        <h3 className="info-card-title">Security</h3>
                        <p className="info-card-text">Prevent fraud and financial crime.</p>
                    </div>
                </div>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <ShieldCheck size={24} /> 3. Data Security
                </h2>
                <p className="info-text">We implement:</p>
                <ul className="info-list">
                    <li className="info-list-item">End-to-end encryption</li>
                    <li className="info-list-item">Secure data storage</li>
                    <li className="info-list-item">Access control protocols</li>
                    <li className="info-list-item">Continuous monitoring systems</li>
                </ul>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Share2 size={24} /> 4. Data Sharing
                </h2>
                <p className="info-text">We may share data with:</p>
                <ul className="info-list">
                    <li className="info-list-item">Regulatory authorities</li>
                    <li className="info-list-item">Payment processors</li>
                    <li className="info-list-item">Liquidity providers</li>
                    <li className="info-list-item">Identity verification partners</li>
                </ul>
                <div className="risk-alert" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <p className="info-text" style={{ margin: 0, color: '#ffffff' }}>
                        We do not sell personal data.
                    </p>
                </div>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <History size={24} /> 5. Data Retention
                </h2>
                <p className="info-text">
                    Information is retained in accordance with legal and regulatory requirements.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <User size={24} /> 6. User Rights
                </h2>
                <p className="info-text">Users may:</p>
                <ul className="info-list">
                    <li className="info-list-item">Request access to their data</li>
                    <li className="info-list-item">Request correction</li>
                    <li className="info-list-item">Withdraw consent where applicable</li>
                </ul>
                <p className="info-text">
                    Requests may be submitted via official support channels.
                </p>
            </section>
        </InfoLayout>
    );
};

export default PrivacyPolicy;
