import React from 'react';
import InfoLayout from './InfoLayout';
import { Tag, LineChart, Wallet, Clock, PlusCircle, Info } from 'lucide-react';

const Fees: React.FC = () => {
    return (
        <InfoLayout title="Fees" lastUpdated="February 19, 2026" activePage="fees">
            <section className="info-section">
                <h2 className="info-section-title">
                    <Tag size={24} /> Transparent Pricing Structure
                </h2>
                <p className="info-text">
                    Diwan Finance operates on a clear and disclosed pricing model. Fees may vary depending on account type, instrument, and jurisdiction.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <LineChart size={24} /> 1. Trading Fees
                </h2>
                <p className="info-text">Depending on asset class, fees may include:</p>
                <ul className="info-list">
                    <li className="info-list-item">Spread-based pricing</li>
                    <li className="info-list-item">Commission per trade</li>
                    <li className="info-list-item">Overnight financing (swap/rollover) charges</li>
                    <li className="info-list-item">Margin interest (where applicable)</li>
                </ul>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Wallet size={24} /> 2. Funding & Withdrawal Fees
                </h2>
                <ul className="info-list">
                    <li className="info-list-item">Bank transfer fees (if applicable)</li>
                    <li className="info-list-item">Payment processor charges</li>
                    <li className="info-list-item">Currency conversion spreads</li>
                </ul>
                <div className="risk-alert" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p className="info-text" style={{ color: '#ffffff', margin: 0, fontSize: '14px' }}>
                        Certain funding methods may be free of charge.
                    </p>
                </div>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Clock size={24} /> 3. Inactivity Fee
                </h2>
                <p className="info-text">
                    Accounts that remain inactive for a defined period may incur a maintenance fee, as disclosed in the account agreement.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <PlusCircle size={24} /> 4. Additional Charges
                </h2>
                <ul className="info-list">
                    <li className="info-list-item">Market data subscriptions (if applicable)</li>
                    <li className="info-list-item">Premium feature access</li>
                    <li className="info-list-item">Special order types</li>
                </ul>
                <div className="risk-alert">
                    <p className="info-text" style={{ color: '#ffffff', margin: 0, fontSize: '14px' }}>
                        All applicable fees are disclosed before trade confirmation.
                    </p>
                </div>
            </section>

            <section className="info-section" style={{ borderStyle: 'dashed' }}>
                <h2 className="info-section-title" style={{ color: '#71717A' }}>
                    <Info size={24} /> Fee Changes
                </h2>
                <p className="info-text">
                    Diwan Finance reserves the right to amend fees with prior notice in accordance with applicable regulations.
                </p>
            </section>
        </InfoLayout>
    );
};

export default Fees;
