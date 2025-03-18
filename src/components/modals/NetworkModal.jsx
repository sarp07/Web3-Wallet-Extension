import React, { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'


const NetworkModal = ({
    showNetworkModal,
    setShowNetworkModal,
    networks,
    currentNetwork,
    handleNetworkSwitch,
    isTestnetEnabled
  }) => {
    const { translate } = useLanguage()
    const [activeTab, setActiveTab] = useState('popular')
  
    if (!showNetworkModal) return null
  
    // Network'leri kategorilere ayır
    const getNetworksByCategory = () => {
      const networksArray = Object.entries(networks)
      
      // Ana ağlar ve test ağları
      const mainNetworks = ['ethereum', 'polygon', 'bsc', 'optimism', 'arbitrum']
      const testNetworks = ['sepolia', 'goerli', 'mumbai', 'bsc-testnet', 'optimism-goerli', 'arbitrum-goerli']
      
      switch (activeTab) {
        case 'popular':
          // Ana ağlar
          const mainChains = networksArray.filter(([key]) => 
            mainNetworks.includes(key.toLowerCase())
          )
          
          // Eğer testnet aktifse, test ağlarını da ekle
          if (isTestnetEnabled) {
            const testChains = networksArray.filter(([key]) => 
              testNetworks.includes(key.toLowerCase())
            )
            return [...mainChains, ...testChains]
          }
          
          return mainChains
          
        case 'custom':
          // Custom networks: Kullanıcının eklediği tüm ağlar
          return networksArray.filter(([key]) => 
            ![...mainNetworks, ...testNetworks].includes(key.toLowerCase())
          )
          
        default:
          return []
      }
    }
  
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="w-[300px] h-[500px] bg-[#1c1c1c] rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">{translate('dashboard.selectNetwork')}</h3>
              <button 
                onClick={() => setShowNetworkModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
  
            {/* Network Type Tabs */}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setActiveTab('popular')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'popular'
                    ? 'bg-[#4caf8e] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {translate('dashboard.popularNetworks')}
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'custom'
                    ? 'bg-[#4caf8e] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {translate('dashboard.customNetworks')}
              </button>
            </div>
          </div>
  
          {/* Networks List */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === 'popular' && (
              <>
                {/* Ana Ağlar / Main Networks */}
                <div className="space-y-2">
                  {getNetworksByCategory()
                    .filter(([key, network]) => !network.isTestnet)
                    .map(([key, network]) => (
                      <button
                        key={key}
                        onClick={() => {
                          handleNetworkSwitch(key)
                          setShowNetworkModal(false)
                        }}
                        className={`w-full p-3 rounded-xl flex items-center space-x-3 transition-all ${
                          currentNetwork?.name === network.name
                            ? 'bg-[#4caf8e]/20 border border-[#4caf8e]'
                            : 'bg-gray-800/50 border border-gray-700 hover:border-[#4caf8e]/50'
                        }`}
                      >
                        <img
                          src={network.logo}
                          alt={network.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 text-left">
                          <p className="text-white font-medium text-sm">{network.name}</p>
                          <p className="text-gray-400 text-xs">{network.symbol}</p>
                        </div>
                        {currentNetwork?.name === network.name && (
                          <div className="w-5 h-5 rounded-full bg-[#4caf8e] flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                </div>

                {/* Test Ağları / Test Networks */}
                {isTestnetEnabled && (
                  <div className="mt-6">
                    <div className="px-2 py-1.5 text-sm font-medium text-gray-400 mb-2">
                      {translate('dashboard.testnetNetworks')}
                    </div>
                    <div className="space-y-2">
                      {getNetworksByCategory()
                        .filter(([key, network]) => network.isTestnet)
                        .map(([key, network]) => (
                          <button
                            key={key}
                            onClick={() => {
                              handleNetworkSwitch(key)
                              setShowNetworkModal(false)
                            }}
                            className={`w-full p-3 rounded-xl flex items-center space-x-3 transition-all ${
                              currentNetwork?.name === network.name
                                ? 'bg-[#4caf8e]/20 border border-[#4caf8e]'
                                : 'bg-gray-800/50 border border-gray-700 hover:border-[#4caf8e]/50'
                            }`}
                          >
                            <img
                              src={network.logo}
                              alt={network.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 text-left">
                              <div className="flex items-center">
                                <p className="text-white font-medium text-sm">{network.name}</p>
                                <span className="ml-2 px-2 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-500 rounded-full">
                                  Testnet
                                </span>
                              </div>
                              <p className="text-gray-400 text-xs">{network.symbol}</p>
                            </div>
                            {currentNetwork?.name === network.name && (
                              <div className="w-5 h-5 rounded-full bg-[#4caf8e] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
  
            {/* Custom Networks */}
            {activeTab === 'custom' && (
              <div className="space-y-2">
                {getNetworksByCategory().length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {translate('dashboard.noCustomNetworks')}
                    </p>
                  </div>
                ) : (
                  getNetworksByCategory().map(([key, network]) => (
                    <button
                      key={key}
                      onClick={() => {
                        handleNetworkSwitch(key)
                        setShowNetworkModal(false)
                      }}
                      className={`w-full p-3 rounded-xl flex items-center space-x-3 transition-all ${
                        currentNetwork?.name === network.name
                          ? 'bg-[#4caf8e]/20 border border-[#4caf8e]'
                          : 'bg-gray-800/50 border border-gray-700 hover:border-[#4caf8e]/50'
                      }`}
                    >
                      <img
                        src={network.logo}
                        alt={network.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 text-left">
                        <div className="flex items-center">
                          <p className="text-white font-medium text-sm">{network.name}</p>
                          {network.isTestnet && (
                            <span className="ml-2 px-2 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-500 rounded-full">
                              Testnet
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs">{network.symbol}</p>
                      </div>
                      {currentNetwork?.name === network.name && (
                        <div className="w-5 h-5 rounded-full bg-[#4caf8e] flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
  
          {/* Add Custom Network Button */}
          {activeTab === 'custom' && (
            <div className="p-3 border-t border-gray-800">
              <button
                onClick={() => {
                  // Handle add custom network
                }}
                className="w-full py-2.5 bg-[#4caf8e] hover:bg-[#3d8b71] text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{translate('dashboard.addCustomNetwork')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  export default NetworkModal