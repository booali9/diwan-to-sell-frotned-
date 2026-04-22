import React from 'react'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import '../../styles/dashboard.css'

interface LayoutProps {
  children: React.ReactNode
  activePage: string
  hideFooter?: boolean
  hideFooterMobile?: boolean
  hideMobileNav?: boolean
  hideMobileHeader?: boolean
  hideHeader?: boolean
}

function Layout({ children, activePage, hideFooter = false, hideFooterMobile = false, hideMobileNav = false, hideMobileHeader, hideHeader = false }: LayoutProps) {
  const shouldHideMobileHeader = hideMobileHeader !== undefined ? hideMobileHeader : hideMobileNav
  return (
    <div className={`dashboard-layout page-${activePage} ${hideFooterMobile ? 'hide-footer-mobile' : ''} ${hideHeader ? 'hide-header' : ''}`}>
      {!hideHeader && <Header activePage={activePage} hideMobile={shouldHideMobileHeader} />}
      <main className="main-content">
        {children}
      </main>
      <BottomNav activePage={activePage} hideMobile={hideMobileNav} />
      {!hideFooter && (
        <div className={hideFooterMobile ? 'desktop-only' : ''}>
          <Footer />
        </div>
      )}
    </div>
  )
}

export default Layout
