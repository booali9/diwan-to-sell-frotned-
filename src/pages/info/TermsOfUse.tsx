import React from 'react';
import InfoLayout from './InfoLayout';
import { Shield, Users, UserCheck, AlertTriangle, Play, CreditCard, Lock, Scale, RefreshCcw } from 'lucide-react';

const TermsOfUse: React.FC = () => {
    return (
        <InfoLayout title="Terms of Use" lastUpdated="February 19, 2026" activePage="terms-of-use">
            <section className="info-section">
                <h2 className="info-section-title">
                    <UserCheck size={24} /> 1. Acceptance of Terms
                </h2>
                <p className="info-text">
                    By accessing or using the Diwan Finance website and trading platform (“Platform”), you agree to be bound by these Terms of Use, applicable laws, and regulatory requirements. If you do not agree, you must discontinue use immediately.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Users size={24} /> 2. Eligibility
                </h2>
                <p className="info-text">
                    You must be at least 18 years of age and legally capable of entering binding agreements. Access may be restricted in certain jurisdictions based on regulatory limitations.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Shield size={24} /> 3. Account Registration
                </h2>
                <p className="info-text">To access trading services, users must:</p>
                <ul className="info-list">
                    <li className="info-list-item">Complete identity verification (KYC)</li>
                    <li className="info-list-item">Provide accurate and complete information</li>
                    <li className="info-list-item">Maintain confidentiality of login credentials</li>
                </ul>
                <p className="info-text">
                    Diwan Finance reserves the right to suspend or terminate accounts for non-compliance or suspicious activity.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <AlertTriangle size={24} /> 4. Risk Disclosure
                </h2>
                <div className="risk-alert">
                    <div className="risk-alert-title">
                        <AlertTriangle size={18} /> TRADING INVOLVES SIGNIFICANT RISK
                    </div>
                    <ul className="info-list">
                        <li className="info-list-item">Capital is at risk</li>
                        <li className="info-list-item">Market volatility may result in rapid losses</li>
                        <li className="info-list-item">Past performance is not indicative of future results</li>
                    </ul>
                </div>
                <p className="info-text">
                    You should assess whether trading is appropriate for your financial situation and risk tolerance.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Play size={24} /> 5. Platform Use
                </h2>
                <p className="info-text">Users agree not to:</p>
                <ul className="info-list">
                    <li className="info-list-item">Engage in market manipulation</li>
                    <li className="info-list-item">Use automated systems without authorization</li>
                    <li className="info-list-item">Attempt unauthorized access</li>
                    <li className="info-list-item">Disrupt platform infrastructure</li>
                </ul>
                <p className="info-text">
                    We reserve the right to restrict or revoke access at our discretion.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <CreditCard size={24} /> 6. Fees & Charges
                </h2>
                <p className="info-text">
                    All applicable fees, spreads, commissions, and financing charges are disclosed on the Fees page. Diwan Finance may amend fee structures with prior notice.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Lock size={24} /> 7. Intellectual Property
                </h2>
                <p className="info-text">
                    All platform technology, content, branding, and materials remain the exclusive property of Diwan Finance. Unauthorized use is prohibited.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Scale size={24} /> 8. Limitation of Liability
                </h2>
                <p className="info-text">Diwan Finance shall not be liable for:</p>
                <ul className="info-list">
                    <li className="info-list-item">Market losses</li>
                    <li className="info-list-item">System interruptions beyond reasonable control</li>
                    <li className="info-list-item">Third-party service failures</li>
                    <li className="info-list-item">Indirect or consequential damages</li>
                </ul>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <RefreshCcw size={24} /> 9. Amendments
                </h2>
                <p className="info-text">
                    Terms may be updated periodically. Continued use constitutes acceptance of revised terms.
                </p>
            </section>
        </InfoLayout>
    );
};

export default TermsOfUse;
