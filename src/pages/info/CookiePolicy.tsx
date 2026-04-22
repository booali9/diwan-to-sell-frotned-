import React from 'react';
import InfoLayout from './InfoLayout';
import { Cookie, Layers, Settings } from 'lucide-react';

const CookiePolicy: React.FC = () => {
    return (
        <InfoLayout title="Cookie Policy" lastUpdated="February 19, 2026" activePage="cookie-policy">
            <section className="info-section">
                <h2 className="info-section-title">
                    <Cookie size={24} /> 1. What Are Cookies
                </h2>
                <p className="info-text">
                    Cookies are small data files stored on your device to enhance functionality and performance.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Layers size={24} /> 2. Types of Cookies Used
                </h2>
                <div className="info-grid">
                    <div className="info-card">
                        <h3 className="info-card-title">Essential cookies</h3>
                        <p className="info-card-text">Required for core platform functionality and security.</p>
                    </div>
                    <div className="info-card">
                        <h3 className="info-card-title">Performance cookies</h3>
                        <p className="info-card-text">Help us understand how users interact with our platform (analytics).</p>
                    </div>
                    <div className="info-card">
                        <h3 className="info-card-title">Security cookies</h3>
                        <p className="info-card-text">Used to identify and prevent security risks.</p>
                    </div>
                    <div className="info-card">
                        <h3 className="info-card-title">Marketing cookies</h3>
                        <p className="info-card-text">Used to deliver relevant advertisements where applicable.</p>
                    </div>
                </div>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Settings size={24} /> 3. Managing Cookies
                </h2>
                <p className="info-text">
                    Users can control cookie settings via browser preferences. Disabling certain cookies may affect platform performance.
                </p>
            </section>
        </InfoLayout>
    );
};

export default CookiePolicy;
