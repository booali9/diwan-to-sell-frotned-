import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import Layout from './Layout/Layout'
import '../styles/login-required.css'

interface LoginRequiredProps {
    activePage: string
}

export default function LoginRequired({ activePage }: LoginRequiredProps) {
    const navigate = useNavigate()

    return (
        <Layout activePage={activePage} hideFooter={true}>
            <div className="login-required-container">
                <div className="login-required-content">
                    <div className="login-required-icon">
                        <Lock size={48} />
                    </div>
                    <h2 className="login-required-title">Login Required</h2>
                    <p className="login-required-message">
                        Please sign in to access this feature and start trading.
                    </p>
                    <div className="login-required-buttons">
                        <button
                            className="login-btn-primary"
                            onClick={() => navigate('/signin')}
                        >
                            Sign In
                        </button>
                        <button
                            className="login-btn-secondary"
                            onClick={() => navigate('/signup')}
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
