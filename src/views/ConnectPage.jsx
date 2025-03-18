import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import web3Service from '../services/web3Service'
import { useNotification } from '../contexts/NotificationContext'

const ConnectPage = () => {
  const navigate = useNavigate()
  const { translate } = useLanguage()
  const { showNotification } = useNotification()
  const [wcUri, setWcUri] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedDapps, setConnectedDapps] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadConnectedDapps()
  }, [])

  const loadConnectedDapps = async () => {
    try {
      const dapps = await web3Service.getConnectedDapps()
      setConnectedDapps(dapps || [])
    } catch (error) {
      console.error('Error loading connected dapps:', error)
      setConnectedDapps([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!wcUri) {
      showNotification(translate('notifications.enterWcUri'), 'warning')
      return
    }

    setIsConnecting(true)
    try {
      await web3Service.connectToWalletConnect(wcUri)
      showNotification(translate('notifications.connectionSuccess'), 'success')
      setWcUri('')
      loadConnectedDapps()
    } catch (error) {
      console.error('Connection error:', error)
      showNotification(translate('notifications.connectionError'), 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (dapp) => {
    try {
      await web3Service.disconnectDApp(dapp.origin)
      showNotification(translate('notifications.dappDisconnected'), 'success')
      loadConnectedDapps()
    } catch (error) {
      console.error('Disconnect error:', error)
      showNotification(translate('notifications.disconnectError'), 'error')
    }
  }

  return (
    <div className="w-[350px] h-[600px] bg-[#e6f7ef]">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-[#c5e7d7]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600"
        >
          <span className="text-lg mr-1">←</span>
          <span>{translate('common.back')}</span>
        </button>
        <h1 className="flex-1 text-center text-[15px] font-medium text-gray-700">
          {translate('connect.title')}
        </h1>
        <div className="w-[52px]" /> {/* Balance back button width */}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* WalletConnect URI Section */}
        <div className="mb-6">
          <h2 className="text-[15px] text-gray-700 mb-2">
            {translate('connect.wcUri')}
          </h2>
          <div className="flex gap-2 mb-1">
            <input
              type="text"
              value={wcUri}
              onChange={(e) => setWcUri(e.target.value)}
              placeholder="wc:...."
              className="flex-1 px-4 h-[42px] bg-white rounded-xl border border-[#c5e7d7] text-[15px] placeholder-gray-400"
            />
            <button
              onClick={handleConnect}
              disabled={isConnecting || !wcUri}
              className="h-[42px] px-6 bg-[#4caf8e]/20 rounded-xl text-[#4caf8e] text-[15px] font-medium disabled:opacity-50"
            >
              {isConnecting ? '...' : translate('connect.connect')}
            </button>
          </div>
          <p className="text-[13px] text-gray-500">
            {translate('connect.wcUriDescription')}
          </p>
        </div>

        {/* Connected dApps Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] text-gray-700">
              {translate('connect.connectedDapps')}
            </h2>
            <span className="text-[13px] text-gray-500">
              {connectedDapps.length} {translate('connect.connected')}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <span className="text-gray-600">{translate('common.loading')}</span>
            </div>
          ) : connectedDapps.length > 0 ? (
            <div className="space-y-2">
              {connectedDapps.map((dapp, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/60 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={dapp.icon || '/default-dapp-icon.png'}
                      alt={dapp.name}
                      className="w-10 h-10 rounded-full bg-[#4caf8e]/10"
                    />
                    <div>
                      <p className="text-[15px] text-gray-700 font-medium">
                        {dapp.name || dapp.origin}
                      </p>
                      <p className="text-[13px] text-gray-500">
                        {dapp.origin}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(dapp)}
                    className="text-[13px] text-[#4caf8e] font-medium"
                  >
                    {translate('connect.disconnect')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12C26.2091 12 28 10.2091 28 8C28 5.79086 26.2091 4 24 4C21.7909 4 20 5.79086 20 8C20 10.2091 21.7909 12 24 12Z" stroke="#4caf8e" strokeWidth="2"/>
                  <path d="M24 28C26.2091 28 28 26.2091 28 24C28 21.7909 26.2091 20 24 20C21.7909 20 20 21.7909 20 24C20 26.2091 21.7909 28 24 28Z" stroke="#4caf8e" strokeWidth="2"/>
                  <path d="M24 44C26.2091 44 28 42.2091 28 40C28 37.7909 26.2091 36 24 36C21.7909 36 20 37.7909 20 40C20 42.2091 21.7909 44 24 44Z" stroke="#4caf8e" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-[15px] text-gray-700 font-medium mb-1">
                {translate('connect.noDappsFoundTitle')}
              </h3>
              <p className="text-[13px] text-gray-500">
                {translate('connect.noDappsFoundDescription')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectPage 