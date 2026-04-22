import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import './styles/toast.css'
import './styles/dropdown.css'
import App from './App.tsx'
import { runBalanceAdjMigrationIfNeeded } from './services/walletService'

// Fix stale dw_local_bal_adj values accumulated by old buggy trade-open code
runBalanceAdjMigrationIfNeeded()

const CLERK_PUBLISHABLE_KEY = 'pk_test_ZHluYW1pYy1iaXJkLTYyLmNsZXJrLmFjY291bnRzLmRldiQ'

// Global error handler to suppress known third-party errors
window.addEventListener('error', (event) => {
  // Suppress checkout popup config errors from third-party scripts
  if (event.message?.includes('No checkout popup config found')) {
    console.warn('Suppressed third-party checkout error:', event.message)
    event.preventDefault()
    return false
  }
})

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress checkout popup config errors from third-party scripts
  if (event.reason?.message?.includes('No checkout popup config found')) {
    console.warn('Suppressed third-party checkout promise rejection:', event.reason.message)
    event.preventDefault()
    return false
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
