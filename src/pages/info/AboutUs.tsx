import React from 'react';
import InfoLayout from './InfoLayout';
import { Rocket, Target, Cpu, TrendingUp, Shield, BarChart2, Anchor, Star } from 'lucide-react';

const AboutUs: React.FC = () => {
    return (
        <InfoLayout title="About Us" lastUpdated="February 19, 2026" activePage="about-us">
            <section className="info-section">
                <h2 className="info-section-title">
                    <Rocket size={24} /> Institutional-Grade Market Access
                </h2>
                <p className="info-text">
                    Diwan Finance is a technology-driven trading platform providing access to global financial markets, including equities, digital assets, and commodities.
                </p>
                <p className="info-text">
                    Our infrastructure is engineered for performance, security, and transparency, serving both active traders and professional market participants.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Target size={24} /> Our Mission
                </h2>
                <p className="info-text" style={{ fontSize: '18px', color: '#ffffff', fontWeight: '500' }}>
                    To deliver secure, efficient, and transparent access to multi-asset markets through advanced technology and disciplined risk management.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Anchor size={24} /> Our Approach
                </h2>
                <div className="info-grid">
                    <div className="info-card">
                        <Cpu className="info-card-icon" style={{ color: '#ffffff', marginBottom: '12px' }} />
                        <h3 className="info-card-title">Technology-first</h3>
                        <p className="info-card-text">Execution infrastructure built for speed and reliability.</p>
                    </div>
                    <div className="info-card">
                        <TrendingUp className="info-card-icon" style={{ color: '#ffffff', marginBottom: '12px' }} />
                        <h3 className="info-card-title">Transparent pricing</h3>
                        <p className="info-card-text">Clear pricing model with no hidden charges.</p>
                    </div>
                    <div className="info-card">
                        <Shield className="info-card-icon" style={{ color: '#ffffff', marginBottom: '12px' }} />
                        <h3 className="info-card-title">Risk management</h3>
                        <p className="info-card-text">Advanced systems to monitor and manage market risk.</p>
                    </div>
                    <div className="info-card">
                        <BarChart2 className="info-card-icon" style={{ color: '#ffffff', marginBottom: '12px' }} />
                        <h3 className="info-card-title">Compliance-focused</h3>
                        <p className="info-card-text">Strict operational framework following global standards.</p>
                    </div>
                </div>
                <p className="info-text" style={{ marginTop: '24px' }}>
                    We prioritize operational integrity, platform stability, and regulatory awareness in all aspects of our service delivery.
                </p>
            </section>

            <section className="info-section">
                <h2 className="info-section-title">
                    <Star size={24} /> Core Values
                </h2>
                <ul className="info-list">
                    <li className="info-list-item">Transparency</li>
                    <li className="info-list-item">Security</li>
                    <li className="info-list-item">Performance</li>
                    <li className="info-list-item">Accountability</li>
                    <li className="info-list-item">Client Protection</li>
                </ul>
            </section>
        </InfoLayout>
    );
};

export default AboutUs;
