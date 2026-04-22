import { ArrowLeft, Gift } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import '../../styles/dashboard.css'
import '../../styles/campaign.css'

export default function Campaign() {
  const navigate = useNavigate()
  
  return (
    <Layout activePage="campaign" hideMobileNav={true}>
      <div className="campaign-page">
        {/* Mobile Header */}
        <div className="mobile-only mob-page-header campaign-mob-header">
          <ArrowLeft size={22} className="mob-back-icon" onClick={() => navigate(-1)} />
          <h1 className="mob-page-title">Campaign</h1>
        </div>

        {/* Hero Section */}
        <section className="campaign-hero">
          <div className="hero-content">
            <div className="reward-pill">
              <Gift size={16} className="pill-icon-svg" />
              Complete the tasks below to claim amazing rewards
            </div>
            <h1 className="hero-title">
              Turn Your Passion<br />
              Into Real Earnings
            </h1>
            <p className="hero-subtitle">
              Unlock rewards as you grow. Join a platform designed to help creators succeed with clear targets, fair payouts, and powerful support tools
            </p>
          </div>
          <div className="hero-graphic">
            <div className="graphic-container">
              <div className="hero-dotted-bg"></div>
              <div className="graphic-glow-bg"></div>
              <img src="/camNum.png" alt="Reward Cluster" className="hero-cluster-img" />
            </div>
          </div>
        </section>

        {/* Recent Campaign Section */}
        <section className="recent-campaigns">
          <h2 className="section-title">Recent campaign</h2>

          <div className="campaign-list">
            {/* Card 1: 20% */}
            <div className="campaign-card">
              <div className="card-info">
                <h1 className="card-title">
                  Zero cost fees <br />
                  <span className="highlight-green">on Xmas</span>
                </h1>
                <div className="card-badges">
                  <span className="badge purple-solid">KYC</span>
                  <span className="badge cyan-solid">Place 3 Futures trade</span>
                </div>
                <p className="card-desc">Enjoy 0 fees on all transactions on Xmas</p>
              </div>
              <div className="card-visual">
                <div className="reward-img-container">
                  <img src="/20.png" alt="20% Reward" className="reward-img" />
                </div>
              </div>
            </div>

            {/* Card 2: 30 USDT */}
            <div className="campaign-card">
              <div className="card-info">
                <h1 className="card-title">
                  Complete tasks and <br />
                  <span className="highlight-green">Earn 30 USDT</span>
                </h1>
                <div className="card-badges">
                  <span className="badge purple-solid">KYC</span>
                  <span className="badge cyan-solid">Place 3 Futures trade</span>
                </div>
                <p className="card-desc">Enjoy 0 fees on all transactions on Xmas</p>
              </div>
              <div className="card-visual">
                <div className="reward-img-container">
                  <img src="/30.png" alt="30 USDT Reward" className="reward-img" />
                </div>
              </div>
            </div>

            {/* Card 3: $1500 */}
            <div className="campaign-card">
              <div className="card-info">
                <h1 className="card-title">
                  Increase your volume <br />
                  <span className="highlight-green">Earn up to $1500</span>
                </h1>
                <div className="card-badges">
                  <span className="badge purple-solid">KYC</span>
                  <span className="badge cyan-solid">Place 3 Futures trade</span>
                </div>
                <p className="card-desc">Enjoy 0 fees on all transactions on Xmas</p>
              </div>
              <div className="card-visual">
                <div className="reward-img-container">
                  <img src="/1500.png" alt="$1500 Reward" className="reward-img" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
