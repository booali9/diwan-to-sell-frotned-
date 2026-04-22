import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Settings2, RefreshCw, LayoutGrid, Wallet } from 'lucide-react'

interface BottomNavProps {
    activePage: string
    hideMobile?: boolean
}

function BottomNav({ activePage, hideMobile = false }: BottomNavProps) {
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, path: '/dashboard/home' },
        { id: 'market', label: 'Market', icon: Settings2, path: '/dashboard/market?view=list&tab=spot' },
        { id: 'trade', label: 'Trade', icon: RefreshCw, path: '/dashboard/trade' },
        { id: 'futures', label: 'Futures', icon: LayoutGrid, path: '/dashboard/futures' },
        { id: 'assets', label: 'Assets', icon: Wallet, path: '/dashboard/assets' },
    ]

    if (hideMobile) {
        return null
    }

    return (
        <nav className="mobile-bottom-nav">
            {navItems.map((item) => (
                <div
                    key={item.id}
                    className={`bottom-nav-item ${activePage === item.id || location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                >
                    <item.icon size={22} strokeWidth={activePage === item.id ? 2.5 : 2} />
                    <span className="bottom-nav-label">{item.label}</span>
                </div>
            ))}
        </nav>
    )
}

export default BottomNav
