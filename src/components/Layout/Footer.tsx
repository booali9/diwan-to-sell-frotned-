import { useNavigate } from 'react-router-dom'

function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo-wrapper" onClick={() => navigate('/dashboard/market')} style={{ cursor: 'pointer' }}>
            <img src="/logo.png" alt="Diwanfinance" className="footer-logo-img-v2" />
          </div>

        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>About us</h4>
            <a onClick={() => navigate('/terms-of-use')} style={{ cursor: 'pointer' }}>Terms of use</a>
            <a onClick={() => navigate('/privacy-policy')} style={{ cursor: 'pointer' }}>Privacy Policy</a>
            <a onClick={() => navigate('/cookie-policy')} style={{ cursor: 'pointer' }}>Cookie Policy</a>
            <a onClick={() => navigate('/disclaimer')} style={{ cursor: 'pointer' }}>Disclaimer</a>
            <a onClick={() => navigate('/support-policy')} style={{ cursor: 'pointer' }}>Support Policy</a>
            <a onClick={() => navigate('/about-us')} style={{ cursor: 'pointer' }}>About Us</a>
            <a onClick={() => navigate('/fees')} style={{ cursor: 'pointer' }}>Fees</a>
          </div>

          <div className="footer-column">
            <h4>Help center</h4>
            <a href="#">Support</a>
            <a href="#">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
