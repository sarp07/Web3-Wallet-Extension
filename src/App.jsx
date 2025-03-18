import React, { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { LockProvider } from './contexts/LockContext'
import web3Service from './services/web3Service'

// Ana bileşenler / Main components
import Welcome from './views/Welcome'
import GetStarted from './views/GetStarted'
import CreateWallet from './views/CreateWallet'
import ImportWallet from './views/ImportWallet'
import Dashboard from './views/Dashboard'
import Settings from './views/Settings'
import Lock from './views/Lock'
import Send from './views/Send'
import ConnectPage from './views/ConnectPage'

function RouteHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  const isTabView = web3Service.isTabView()

  useEffect(() => {
    console.log('Current location:', location.pathname);
    console.log('Is tab view:', isTabView);

    // Tab view kontrolü
    if (isTabView) {
      // Tab view'da sadece get-started, create-wallet ve import-wallet sayfalarına izin ver
      const allowedTabPaths = ['/get-started', '/create-wallet', '/import-wallet']
      const isAllowedPath = allowedTabPaths.some(path => location.pathname === path)
      
      if (!isAllowedPath) {
        console.log('Not allowed in tab view, closing...');
        // İzin verilmeyen sayfalarda popup'a yönlendir
        window.close()
      }
    } else {
      // Popup view'da get-started sayfasına erişimi engelle
      if (location.pathname === '/get-started') {
        console.log('Get started not allowed in popup, redirecting...');
        navigate('/')
      }
    }
  }, [location.pathname, isTabView, navigate])

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/get-started" element={<GetStarted />} />
      <Route path="/create-wallet/*" element={<CreateWallet />} />
      <Route path="/import-wallet/*" element={<ImportWallet />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/send" element={<Send />} />
      <Route path="/settings/*" element={<Settings />} />
      <Route path="/lock" element={<Lock />} />
      <Route path="/connect" element={<ConnectPage />} />
    </Routes>
  )
}

function App() {
  const isTabView = web3Service.isTabView()

  return (
    <HashRouter>
      <LanguageProvider>
        <NotificationProvider>
          <LockProvider>
            <div className={`${isTabView ? 'w-full min-h-screen bg-[#e6f7ef]' : 'w-[350px] h-[600px] bg-[#e6f7ef]'}`}>
              <RouteHandler />
            </div>
          </LockProvider>
        </NotificationProvider>
      </LanguageProvider>
    </HashRouter>
  )
}

export default App
