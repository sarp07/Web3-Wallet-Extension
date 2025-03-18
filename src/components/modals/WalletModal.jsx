import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

const WalletModal = ({
  showWalletModal,
  setShowWalletModal,
  searchQuery,
  setSearchQuery,
  filteredWallets,
  selectedWallet,
  handleWalletSelect,
  showWalletSettings,
  setShowWalletSettings,
  handleHideWallet,
  handleShowWallet,
  hiddenWallets,
  showHiddenWallets,
  setShowHiddenWallets,
}) => {
  const navigate = useNavigate()
  const { translate } = useLanguage()

  if (!showWalletModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-[300px] h-[550px] bg-[#1c1c1c] rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-800 flex-none">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">{translate('dashboard.selectWallet')}</h3>
            <button 
              onClick={() => setShowWalletModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-3 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translate('dashboard.searchAccounts')}
              className="w-full px-4 py-2 bg-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4caf8e] text-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Wallet List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Regular Wallets */}
          <div className="p-3">
            {filteredWallets.map((wallet, index) => (
              <div
                key={index}
                className={`w-full p-3 rounded-xl flex items-center space-x-3 transition-all mb-2 relative ${
                  selectedWallet?.address === wallet.address
                    ? 'bg-[#4caf8e]/20 border border-[#4caf8e]'
                    : 'bg-gray-800/50 border border-gray-700 hover:border-[#4caf8e]/50'
                }`}
              >
                <button
                  onClick={() => {
                    handleWalletSelect(wallet)
                    setShowWalletModal(false)
                  }}
                  className="flex items-center space-x-3 flex-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4caf8e] to-emerald-600 flex items-center justify-center flex-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {wallet.accountName || `${translate('dashboard.currentWallet')} ${index + 1}`}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-400 truncate">
                        {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'No address'}
                      </p>
                      {wallet.type === 'imported' && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-gray-700 text-gray-300 rounded-full">
                          {translate('dashboard.importAccount')}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedWallet?.address === wallet.address && (
                    <div className="w-5 h-5 rounded-full bg-[#4caf8e] flex items-center justify-center flex-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Settings Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowWalletSettings(showWalletSettings === wallet.address ? null : wallet.address)
                  }}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                {/* Settings Dropdown */}
                {showWalletSettings === wallet.address && (
                  <div className="absolute right-2 top-14 w-36 bg-gray-900 rounded-xl shadow-lg border border-gray-700 z-10">
                    <button
                      onClick={() => {
                        // Handle edit
                        setShowWalletSettings(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-2 rounded-t-xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>{translate('dashboard.edit')}</span>
                    </button>
                    {wallet.isHidden ? (
                      <button
                        onClick={() => handleShowWallet(wallet)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{translate('dashboard.showWallet')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleHideWallet(wallet)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        <span>{translate('dashboard.hideWallet')}</span>
                      </button>
                    )}
                    {!wallet.isSystem && (
                      <button
                        onClick={() => {
                          // Handle delete
                          setShowWalletSettings(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors flex items-center space-x-2 rounded-b-xl"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>{translate('dashboard.delete')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hidden Wallets Section - Only show if there are hidden wallets */}
          {hiddenWallets.length > 0 && (
            <div className="px-3 pb-3">
              <button
                onClick={() => setShowHiddenWallets(!showHiddenWallets)}
                className="w-full flex items-center justify-between p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-gray-800/50"
              >
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  <span className="text-sm">{translate('dashboard.hiddenWallets')} ({hiddenWallets.length})</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${showHiddenWallets ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-800 flex-none">
          <button
            onClick={() => {
              setShowWalletModal(false)
              navigate('/create-wallet')
            }}
            className="w-full py-2.5 bg-[#4caf8e] hover:bg-[#3d8b71] text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{translate('dashboard.addAccount')}</span>
          </button>
          
          <button
            onClick={() => {
              setShowWalletModal(false)
              navigate('/import-wallet')
            }}
            className="w-full mt-2 py-2.5 border border-[#4caf8e] text-[#4caf8e] hover:bg-[#4caf8e]/10 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{translate('dashboard.importAccount')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default WalletModal