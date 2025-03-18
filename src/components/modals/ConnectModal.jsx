import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import web3Service from '../../services/web3Service'
import { useNotification } from '../../contexts/NotificationContext'

const ConnectModal = ({ showModal, setShowModal }) => {
  const { translate } = useLanguage()
  const { showNotification } = useNotification()
  const [connectedDapps, setConnectedDapps] = useState([])
  const [wcUri, setWcUri] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Bağlı dApp'leri yükle
  useEffect(() => {
    if (showModal) {
      loadConnectedDapps()
    }
  }, [showModal])

  const loadConnectedDapps = () => {
    try {
      const dapps = web3Service.loadDAppConnections()
      setConnectedDapps(Object.entries(dapps).map(([origin, data]) => ({
        origin,
        ...data
      })))
    } catch (error) {
      console.error('Failed to load dApps:', error)
    }
  }

  const handleDisconnect = async (origin) => {
    try {
      await web3Service.disconnectDApp(origin)
      showNotification(translate('notifications.dappDisconnected'), 'success')
      loadConnectedDapps()
    } catch (error) {
      console.error('Disconnect error:', error)
      showNotification(translate('notifications.disconnectError'), 'error')
    }
  }

  const handleConnect = async () => {
    if (!wcUri) {
      showNotification(translate('notifications.enterWcUri'), 'warning')
      return
    }

    try {
      setIsLoading(true)
      await web3Service.initWalletConnect()
      // URI ile bağlantı işlemi
      // Not: Bu kısım WalletConnect v2 implementasyonuna göre güncellenecek
      showNotification(translate('notifications.connectionSuccess'), 'success')
      setWcUri('')
      loadConnectedDapps()
    } catch (error) {
      console.error('Connection error:', error)
      showNotification(translate('notifications.connectionError'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[300px] bg-[#1c1c1c] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">
              {translate('connect.title')}
            </h3>
            <button 
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* WalletConnect URI Input */}
        <div className="p-4 border-b border-gray-800">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {translate('connect.wcUri')}
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={wcUri}
              onChange={(e) => setWcUri(e.target.value)}
              placeholder="wc:..."
              className="flex-1 px-3 py-2 bg-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4caf8e]"
            />
            <button
              onClick={handleConnect}
              disabled={isLoading || !wcUri}
              className="px-4 py-2 bg-[#4caf8e] text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3d8b71] transition-colors"
            >
              {isLoading ? '⌛' : translate('connect.connect')}
            </button>
          </div>
        </div>

        {/* Connected dApps List */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            {translate('connect.connectedDapps')}
          </h4>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {connectedDapps.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">
                  {translate('connect.noDappsFound')}
                </p>
              </div>
            ) : (
              connectedDapps.map((dapp, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={dapp.icon || '/default-dapp-icon.png'}
                      alt={dapp.name}
                      className="w-8 h-8 rounded-full bg-gray-700"
                    />
                    <div>
                      <p className="text-white text-sm font-medium">
                        {dapp.name || dapp.origin}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {dapp.origin}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(dapp.origin)}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    {translate('connect.disconnect')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectModal 