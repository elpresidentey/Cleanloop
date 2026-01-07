import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AppProviders } from './providers/AppProviders.tsx'
import { initSentry } from './lib/sentry'
import './style.css'

// Initialize Sentry error monitoring (if configured)
initSentry().catch(() => {
  // Silently fail if Sentry is not configured
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
)
