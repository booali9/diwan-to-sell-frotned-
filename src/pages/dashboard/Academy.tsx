import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import '../../styles/dashboard.css'
import '../../styles/academy.css'

type AcademyTab = 'analysis' | 'education' | 'guide'

interface AcademyCard {
    id: number
    date: string
    title: string
    description: string
    imageType: 'dome' | 'calc' | 'stacks'
}

export default function Academy() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<AcademyTab>('analysis')

    const cards: AcademyCard[] = [
        {
            id: 1,
            date: 'December 20, 2025',
            title: 'Crypto Market Analysis Report',
            description: 'Unlock rewards as you grow. Join a platform designed to help creators succeed with clear targets, fair payouts, and powerful support tools',
            imageType: 'dome'
        },
        {
            id: 2,
            date: 'December 20, 2025',
            title: 'Crypto Market Analysis Report',
            description: 'Unlock rewards as you grow. Join a platform designed to help creators succeed with clear targets, fair payouts, and powerful support tools',
            imageType: 'calc'
        },
        {
            id: 3,
            date: 'December 20, 2025',
            title: 'Crypto Market Analysis Report',
            description: 'Unlock rewards as you grow. Join a platform designed to help creators succeed with clear targets, fair payouts, and powerful support tools',
            imageType: 'stacks'
        },
        {
            id: 4,
            date: 'December 20, 2025',
            title: 'Crypto Market Analysis Report',
            description: 'Unlock rewards as you grow. Join a platform designed to help creators succeed with clear targets, fair payouts, and powerful support tools',
            imageType: 'calc'
        },
        {
            id: 5,
            date: 'December 20, 2025',
            title: 'Crypto Market Analysis Report',
            description: 'Unlock rewards as you grow. Join a platform designed to help creators succeed with clear targets, fair payouts, and powerful support tools',
            imageType: 'stacks'
        },
        {
            id: 6,
            date: 'December 20, 2025',
            title: 'Crypto Market Analysis Report',
            description: 'Unlock rewards as you grow. Join a platform designed to help creators succeed with clear targets, fair payouts, and powerful support tools',
            imageType: 'dome'
        }
    ]

    return (
        <Layout activePage="academy" hideMobileNav={true}>
            <div className="academy-container">
                {/* Mobile Header */}
                <div className="mobile-only mob-page-header">
                    <ArrowLeft size={22} className="mob-back-icon" onClick={() => navigate(-1)} />
                    <h1 className="mob-page-title">Academy</h1>
                </div>

                <div className="academy-tabs">
                    <button
                        className={`academy-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analysis')}
                    >
                        Analysis
                    </button>
                    <button
                        className={`academy-tab ${activeTab === 'education' ? 'active' : ''}`}
                        onClick={() => setActiveTab('education')}
                    >
                        Education
                    </button>
                    <button
                        className={`academy-tab ${activeTab === 'guide' ? 'active' : ''}`}
                        onClick={() => setActiveTab('guide')}
                    >
                        Guide
                    </button>
                    <div className="tabs-underline-bg"></div>
                </div>

                <div className="academy-grid">
                    {cards.map((card, index) => (
                        <div key={card.id} className="academy-card">
                            <div className="academy-image-wrapper">
                                <img
                                    src={`/academy${(index % 3) + 1}.png`}
                                    alt={card.title}
                                    className="academy-img"
                                />
                            </div>
                            <div className="academy-card-content">
                                <span className="academy-date">{card.date}</span>
                                <h3 className="academy-card-title">{card.title}</h3>
                                <p className="academy-card-desc">{card.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    )
}
