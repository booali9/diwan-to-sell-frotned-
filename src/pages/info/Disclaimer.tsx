import React from 'react';
import InfoLayout from './InfoLayout';
import { AlertCircle, HelpCircle, BarChart3, Globe } from 'lucide-react';

const Disclaimer: React.FC = () => {
    return (
        <InfoLayout title="Disclaimer" lastUpdated="February 19, 2026" activePage="disclaimer">
            <section className="info-section">
                <h2 className="info-section-title">
                    <AlertCircle size={24} /> Investment Risk Warning
                </h2>
                <div className="risk-alert">
                    <p className="info-text" style={{ color: '#ffffff', marginBottom: '8px' }}>
                        Trading leveraged products carries a high level of risk and may not be suitable for all investors.
                    </p>
                    <p className="info-text" style={{ margin: 0 }}>
                        Losses may exceed initial deposits depending on product structure and jurisdiction.
                    </p>
                </div>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <HelpCircle size={24} /> No Investment Advice
                </h2>
                <p className="info-text">
                    All information provided on this website is for informational purposes only and does not constitute investment advice, portfolio management, or financial recommendation.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <BarChart3 size={24} /> Market Data
                </h2>
                <p className="info-text">
                    Market prices, charts, and data may be delayed or provided by third-party sources. Accuracy is not guaranteed.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Globe size={24} /> Regulatory Status
                </h2>
                <p className="info-text">
                    Services may not be available in all jurisdictions and are subject to local laws and regulations.
                </p>
            </section>
        </InfoLayout>
    );
};

export default Disclaimer;
