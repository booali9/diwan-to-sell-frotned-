import React, { useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import '../../styles/info.css';

interface InfoLayoutProps {
    children: React.ReactNode;
    title: string;
    lastUpdated?: string;
    activePage: string;
}

const InfoLayout: React.FC<InfoLayoutProps> = ({ children, title, lastUpdated, activePage }) => {
    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Layout activePage={activePage}>
            <div className="info-page-container">
                <div className="info-content-wrapper">
                    <header className="info-header">
                        <h1 className="info-title">{title}</h1>
                        {lastUpdated && <p className="info-last-updated">Last Updated: {lastUpdated}</p>}
                    </header>
                    <div className="info-main-content">
                        {children}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default InfoLayout;
