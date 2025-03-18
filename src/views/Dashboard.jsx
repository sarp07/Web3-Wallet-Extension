import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import web3Service from '../services/web3Service'
import priceService from '../services/priceService'
import tokenService from '../services/tokenService'
import { useLanguage } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import WalletModal from '../components/modals/WalletModal'
import BuyModal from '../components/modals/BuyModal'
import BottomBar from '../components/BottomBar'
import NetworkModal from '../components/modals/NetworkModal'

/**
 * Dashboard bileşeni
 * Dashboard component
 */
const Dashboard = () => {
  const navigate = useNavigate()
  const { translate } = useLanguage()
  const { showNotification } = useNotification()
  const [activeTab, setActiveTab] = useState('tokens')
  const [wallets, setWallets] = useState([])
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [currentNetwork, setCurrentNetwork] = useState(null)
  const [balance, setBalance] = useState('0')
  const [networks, setNetworks] = useState({})
  const [showTopNetworkSelector, setShowTopNetworkSelector] = useState(false)
  const [showBottomNetworkSelector, setShowBottomNetworkSelector] = useState(false)
  const [connectedDapps, setConnectedDapps] = useState([]) // Bağlı dapp'ler için state
  const [showPopularNetworks, setShowPopularNetworks] = useState(true)
  const [tokenData, setTokenData] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showHiddenWallets, setShowHiddenWallets] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredWallets, setFilteredWallets] = useState([])
  const [showWalletSettings, setShowWalletSettings] = useState(null)
  const [hiddenWallets, setHiddenWallets] = useState([])
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [isTestnetEnabled, setIsTestnetEnabled] = useState(false)
  const [showBuyModal, setShowBuyModal] = useState(false)

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Get wallet data from localStorage
        const walletData = localStorage.getItem('walletData')
        if (!walletData) {
          navigate('/')
          return
        }

        const { mnemonic, accountName, selectedChains } = JSON.parse(walletData)

        // Load networks
        const availableNetworks = web3Service.getAllNetworks()
        setNetworks(availableNetworks)
        
        // Get current network
        const network = web3Service.getCurrentNetwork()
        setCurrentNetwork(network)

        // Load wallets
        const availableWallets = web3Service.getAllWallets()
        setWallets(availableWallets)

        if (availableWallets.length > 0) {
          const wallet = availableWallets[0]
          setSelectedWallet(wallet)
          const balance = await web3Service.getBalance(wallet.address)
          setBalance(balance)
        }
      } catch (error) {
        console.error('Dashboard initialization error:', error)
        navigate('/')
      }
    }

    initDashboard()
    // Coin ID'leri doğrula
    priceService.verifyCoinIds()
  }, [navigate])

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!selectedWallet || !currentNetwork) return

      setIsLoading(true)
      try {
        if (showPopularNetworks) {
          // Tüm ağlardaki tokenleri tara
          const allNetworkData = {}
          const popularNetworks = web3Service.getPopularNetworks()
          const networkPromises = Object.entries(popularNetworks).map(async ([networkKey, network]) => {
            // Önce native token bilgisini al
            const nativeTokenData = await priceService.getTokenPrice(null, network)
            const nativeBalance = await web3Service.getBalance(selectedWallet.address)
            
            // Token listesini tara
            const tokens = await tokenService.scanNetworkTokens(selectedWallet.address, networkKey)
            
            return {
              networkKey, // networkKey direkt olarak object key'i
              data: {
                native: {
                  ...nativeTokenData,
                  balance: nativeBalance,
                  symbol: network.symbol
                },
                tokens: tokens || []
              }
            }
          })

          const results = await Promise.all(networkPromises)
          results.forEach(({ networkKey, data }) => {
            allNetworkData[networkKey] = data
          })

          // Debug için network data'yı logla
          console.log('All Network Data:', allNetworkData)
          
          setTokenData(allNetworkData)
        } else {
          // Sadece mevcut ağın tokenlerini tara
          // Network key'i normalize et
          const networkKey = currentNetwork.name.toLowerCase()
          const normalizedNetworkKey = networkKey === 'bnb smart chain' ? 'bsc' 
            : networkKey === 'arbitrum one' ? 'arbitrum' 
            : networkKey
          
          // Testnet kontrolü
          const isTestnet = currentNetwork.isTestnet
          
          // Önce native token bilgisini al
          const nativeTokenData = await priceService.getTokenPrice(null, {
            ...currentNetwork,
            key: normalizedNetworkKey,
            isTestnet
          })
          const nativeBalance = await web3Service.getBalance(selectedWallet.address)
          
          // Token listesini tara
          const tokens = await tokenService.scanNetworkTokens(selectedWallet.address, normalizedNetworkKey)
          
          console.log('Current Network Data:', {
            networkKey,
            normalizedNetworkKey,
            nativeTokenData,
            nativeBalance,
            isTestnet
          })

          setTokenData({
            [normalizedNetworkKey]: {
              native: {
                ...nativeTokenData,
                balance: nativeBalance,
                symbol: currentNetwork.symbol,
                isTestnet
              },
              tokens: tokens || [] // Eğer token yoksa boş array
            }
          })
        }
      } catch (error) {
        console.error('Token data fetch error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokenData()
  }, [selectedWallet, currentNetwork, showPopularNetworks])

  useEffect(() => {
    if (!wallets) return
    
    const query = searchQuery.toLowerCase().trim()
    if (!query) {
      setFilteredWallets(wallets)
      return
    }

    const filtered = wallets.filter(wallet => {
      const accountName = (wallet.accountName || '').toLowerCase()
      const address = wallet.address.toLowerCase()
      
      return accountName.includes(query) || address.includes(query)
    })

    setFilteredWallets(filtered)
  }, [searchQuery, wallets])

  useEffect(() => {
    setFilteredWallets(wallets)
  }, [wallets])

  useEffect(() => {
    setHiddenWallets(web3Service.getHiddenWallets())
  }, [])

  useEffect(() => {
    const testnetEnabled = localStorage.getItem('testnetEnabled') === 'true'
    setIsTestnetEnabled(testnetEnabled)
  }, [])

  const handleNetworkSwitch = async (networkName) => {
    try {
      const network = await web3Service.switchNetwork(networkName)
      
      // State güncellemelerini sıralı yapıyoruz
      await Promise.all([
        setCurrentNetwork(network),
        setShowTopNetworkSelector(false),
        setShowBottomNetworkSelector(false),
        setShowNetworkModal(false)
      ])

      // Testnet kontrolü ve showPopularNetworks güncelleme
      if (network.isTestnet) {
        setShowPopularNetworks(false)
      }

      // Bakiye güncelleme
      if (selectedWallet) {
        const balance = await web3Service.getBalance(selectedWallet.address)
        setBalance(balance)
      }
    } catch (error) {
      console.error('Network switch error:', error)
    }
  }

  const handleWalletSelect = async (address) => {
    try {
      setSelectedWallet(address)
      const balance = await web3Service.getBalance(address)
      setBalance(balance)
    } catch (error) {
      console.error('Wallet selection error:', error)
    }
  }

  const handleLogout = () => {
    web3Service.logout() // Clear wallet data and localStorage
    navigate('/')
  }

  const handleHideWallet = (wallet) => {
    web3Service.hideWallet(wallet.address)
    setHiddenWallets(web3Service.getHiddenWallets())
    setShowWalletSettings(null)
  }

  const handleSendClick = (token = null, network = null) => {
    if (token) {
      navigate('/send', { 
        state: { 
          token,
          network: network || currentNetwork 
        }
      })
    } else {
      navigate('/send', { 
        state: { 
          network: currentNetwork,
          token: {
            symbol: currentNetwork.symbol,
            name: currentNetwork.name,
            decimals: 18,
            isNative: true
          }
        }
      })
    }
  }

  const handleShowWallet = (wallet) => {
    web3Service.showWallet(wallet.address)
    setHiddenWallets(web3Service.getHiddenWallets())
    setShowWalletSettings(null)
  }

  return (
    <div className="w-[350px] h-[600px] bg-[#e6f7ef] text-gray-800 relative flex flex-col">
      {/* Header - More minimal */}
      <div className="flex-none p-3">
        <div className="flex items-center mb-2">
          {/* Network Selector - Left */}
          <div className="w-[64px]">
            <button
              onClick={() => setShowNetworkModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/80 rounded-xl border border-[#c5e7d7] hover:bg-white transition-colors"
            >
              <img
                src={currentNetwork?.logo}
                alt={currentNetwork?.name}
                className="w-5 h-5 rounded-full"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Wallet Address - Center */}
          <div className="flex-1 flex justify-center">
            <div className="flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-xl py-2 px-4 border border-[#c5e7d7]">
              {/* Wallet Name Row */}
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-800">{selectedWallet?.accountName || "Address 1"}</span>
                <button onClick={() => setShowWalletModal(true)} className="text-xs opacity-60 hover:opacity-100">▼</button>
              </div>
              
              {/* Address Row */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">
                  {selectedWallet?.address && `${selectedWallet.address.slice(0, 6)}...${selectedWallet.address.slice(-4)}`}
                </span>
                <button 
                  className="hover:text-gray-800 transition-colors"
                  onClick={() => {
                    if (selectedWallet?.address) {
                      navigator.clipboard.writeText(selectedWallet.address)
                      showNotification(translate('notifications.addressCopied'), 'success')
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Connected Dapps - Right */}
          <div className="w-[64px] flex justify-end">
            {connectedDapps.length > 0 ? (
              connectedDapps.map((dapp, index) => (
                <img
                  key={index}
                  src={dapp.icon}
                  alt={dapp.name}
                  className="w-5 h-5 rounded-full border border-[#4caf8e]"
                />
              ))
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center border border-[#c5e7d7]">
                <span className="text-[#4caf8e] text-xs">⚡</span>
              </div>
            )}
          </div>
        </div>

        {/* Balance - More minimal */}
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800">
            {(() => {
              const networkKey = currentNetwork?.name?.toLowerCase()
              const normalizedNetworkKey = networkKey === 'bnb smart chain' ? 'bsc' 
                : networkKey === 'arbitrum one' ? 'arbitrum' 
                : networkKey

              const isPopularNetwork = Object.keys(web3Service.getPopularNetworks())
                .some(key => key === normalizedNetworkKey)

              // Testnet veya custom network kontrolü
              if (currentNetwork?.isTestnet || !isPopularNetwork) {
                const networkData = tokenData[normalizedNetworkKey]
                return (
                  <div className="text-center">
                    <span className="text-lg font-medium">
                      {parseFloat(networkData?.native?.balance || 0).toFixed(4)} {currentNetwork?.symbol || ''}
                    </span>
                  </div>
                )
              }

              // Popular network için toplam değer hesaplama
              const networkData = tokenData[normalizedNetworkKey]
              if (!networkData?.native) return '$ 0.00 USD'

              const nativeValue = (networkData.native.price || 0) * (parseFloat(networkData.native.balance) || 0)
              const tokensValue = (networkData.tokens || []).reduce((acc, token) => 
                acc + ((token.price || 0) * (parseFloat(token.balance) || 0)), 0)
              const totalValue = nativeValue + tokensValue

              // 24 saatlik değişim yüzdesi hesaplama - sadece bakiyesi olan tokenlar için
              let totalWeightedChange = 0
              let totalWeight = 0

              // Native token için değişim hesaplama
              const nativeBalance = parseFloat(networkData.native.balance) || 0
              if (nativeBalance > 0) {
                totalWeightedChange += (networkData.native.priceChangePercentage24h || 0) * nativeValue
                totalWeight += nativeValue
              }

              // Diğer tokenlar için değişim hesaplama
              networkData.tokens?.forEach(token => {
                const tokenBalance = parseFloat(token.balance) || 0
                const tokenValue = (token.price || 0) * tokenBalance
                if (tokenBalance > 0) {
                  totalWeightedChange += (token.priceChangePercentage24h || 0) * tokenValue
                  totalWeight += tokenValue
                }
              })

              // Ağırlıklı ortalama değişim
              const averageChange = totalWeight > 0 ? totalWeightedChange / totalWeight : 0

              const currency = networkData.native.currency || { symbol: '$', code: 'USD' }

              return (
                <div>
                  <div className="text-center">
                    <span className="text-lg font-medium">
                      {currency.symbol}
                      {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {' '}
                      {currency.code.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`text-xs font-normal ${averageChange >= 0 ? 'text-[#4caf8e]' : 'text-red-500'}`}>
                      ({averageChange.toFixed(2)}%)
                    </span>
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault()
                        // Portfolio link işlevi buraya eklenecek
                      }}
                      className="text-xs font-normal text-[#4caf8e] hover:text-[#3d8b71] transition-colors"
                    >
                      View Portfolio
                    </a>
                  </div>
                </div>
              )
            })()}
          </h2>
        </div>
      </div>

      {/* Quick Actions - More compact */}
      <div className="flex-none flex justify-around px-3 py-3">
        {[
          { 
            icon: '+/-', 
            label: translate('dashboard.buy'),
            onClick: () => setShowBuyModal(true)
          },
          { icon: '⇄', label: translate('dashboard.swap') },
          { icon: '⚡', label: translate('dashboard.bridge') },
          { icon: '↗', label: translate('dashboard.send'), onClick: () => handleSendClick() },
          { 
            icon: '⊡', 
            label: translate('dashboard.scan'), 
            onClick: () => {
              if (selectedWallet && currentNetwork?.explorer) {
                window.open(`${currentNetwork.explorer}/address/${selectedWallet.address}`, '_blank')
              }
            }
          }
        ].map((action, index) => (
          <button 
            key={index} 
            className="flex flex-col items-center group"
            onClick={action.onClick}
          >
            <div className="w-10 h-10 rounded-full bg-[#4caf8e] flex items-center justify-center mb-1 shadow-lg shadow-[#4caf8e]/10 group-hover:shadow-[#4caf8e]/20 group-hover:-translate-y-0.5 transition-all">
              <span className="text-sm text-white">{action.icon}</span>
            </div>
            <span className="text-[10px] text-gray-600 group-hover:text-gray-800 transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex-none flex justify-around border-b border-[#c5e7d7] px-4">
        {['tokens', 'nfts', 'activity'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 relative ${
              activeTab === tab 
                ? 'text-[#4caf8e]' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {translate(`dashboard.${tab}`)}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4caf8e]"></div>
            )}
          </button>
        ))}
      </div>

      {/* Content Area - Now has more space */}
      <div className="flex-1 min-h-0">
        <div className="h-full overflow-y-auto p-4 pb-20">
          {/* Network Selection Dropdown */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowBottomNetworkSelector(!showBottomNetworkSelector)}
              className="w-full p-3 bg-[#4caf8e]/10 hover:bg-[#4caf8e]/20 rounded-xl flex items-center justify-between text-gray-800 transition-all duration-200"
            >
              <span className="text-sm font-medium">
                {showPopularNetworks ? 'Popular networks' : 'Current network'}
              </span>
              <span className="text-xs opacity-60">▼</span>
            </button>

            {showBottomNetworkSelector && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-[#4caf8e]/20 overflow-hidden z-10">
                <button
                  onClick={() => {
                    setShowPopularNetworks(true)
                    setShowBottomNetworkSelector(false)
                  }}
                  className={`w-full p-3 text-left hover:bg-[#4caf8e]/10 transition-colors ${
                    showPopularNetworks ? 'bg-[#4caf8e]/5 text-[#4caf8e]' : 'text-gray-800'
                  }`}
                >
                  Popular networks
                </button>
                <button
                  onClick={() => {
                    setShowPopularNetworks(false)
                    setShowBottomNetworkSelector(false)
                  }}
                  className={`w-full p-3 text-left hover:bg-[#4caf8e]/10 transition-colors ${
                    !showPopularNetworks ? 'bg-[#4caf8e]/5 text-[#4caf8e]' : 'text-gray-800'
                  }`}
                >
                  Current network
                </button>
              </div>
            )}
          </div>

          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {/* Network Selection Card */}
              <div className="bg-[#4caf8e]/10 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg">
                <div className="p-4">
                  {showPopularNetworks ? (
                    // Popular Networks Assets
                    <div className="space-y-3">
                      {Object.entries(web3Service.getPopularNetworks()).map(([networkKey, network]) => {
                        const networkData = tokenData[networkKey]
                        const priceData = networkData?.native || {
                          price: 0,
                          priceChange24h: 0,
                          priceChangePercentage24h: 0,
                          balance: '0',
                          currency: { symbol: '$', code: 'USD' }
                        }
                        
                        return (
                          <div key={networkKey}>
                            {/* Native Token */}
                            <div 
                              className="flex items-center justify-between p-3 hover:bg-[#4caf8e]/5 rounded-lg transition-colors cursor-pointer"
                              onClick={() => handleSendClick({
                                symbol: network.symbol,
                                name: network.name,
                                decimals: 18,
                                isNative: true,
                                balance: networkData?.native?.balance || '0'
                              }, network)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <img
                                    src={priceData.image || network.logo}
                                    alt={network.name}
                                    className="w-8 h-8 rounded-full border-2 border-[#4caf8e]/20"
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-[#c5e7d7]">
                                    <img
                                      src={network.logo}
                                      alt={network.name}
                                      className="w-3 h-3 rounded-full"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-800 text-sm font-medium">{network.symbol}</p>
                                  <div className="flex items-center space-x-1">
                                    <p className="text-[#4caf8e] text-xs">
                                      ${priceData.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                    </p>
                                    <p className={`text-xs ${(priceData.priceChangePercentage24h || 0) >= 0 ? 'text-[#4caf8e]' : 'text-red-500'}`}>
                                      ({(priceData.priceChangePercentage24h || 0).toFixed(2)}%)
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-800 text-sm font-medium">
                                  ${((priceData.price || 0) * (parseFloat(priceData.balance) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {parseFloat(priceData.balance || 0).toFixed(4)} {network.symbol}
                                </p>
                              </div>
                            </div>

                            {/* Network Tokens */}
                            {networkData?.tokens?.map((token, tokenIndex) => (
                              <div 
                                key={tokenIndex} 
                                className="ml-6 flex items-center justify-between p-3 hover:bg-[#4caf8e]/5 rounded-lg transition-colors cursor-pointer"
                                onClick={() => handleSendClick(token, network)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="relative">
                                    <img
                                      src={token.image || "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png"}
                                      alt={token.symbol}
                                      className="w-8 h-8 rounded-full border-2 border-[#4caf8e]/20"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-[#c5e7d7]">
                                      <img
                                        src={network.logo}
                                        alt={network.name}
                                        className="w-3 h-3 rounded-full"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-gray-800 text-sm font-medium">{token.name}</p>
                                    <div className="flex items-center space-x-1">
                                      <p className="text-[#4caf8e] text-xs">
                                        {token.currency?.symbol || '$'}
                                        {token.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                      </p>
                                      <p className={`text-xs ${(token.priceChangePercentage24h || 0) >= 0 ? 'text-[#4caf8e]' : 'text-red-500'}`}>
                                        ({(token.priceChangePercentage24h || 0).toFixed(2)}%)
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-800 text-sm font-medium">
                                    {token.currency?.symbol || '$'}
                                    {((token.price || 0) * (parseFloat(token.balance) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {parseFloat(token.balance || 0).toFixed(4)} {token.symbol}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    // Current Network Assets
                    <div className="space-y-3">
                      {/* Native Token */}
                      <div 
                        className="flex items-center justify-between p-3 hover:bg-[#4caf8e]/5 rounded-lg transition-colors cursor-pointer"
                        onClick={() => handleSendClick({
                          symbol: currentNetwork.symbol,
                          name: currentNetwork.name,
                          decimals: 18,
                          isNative: true,
                          balance: tokenData[currentNetwork?.name?.toLowerCase()]?.native?.balance || '0'
                        }, currentNetwork)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={tokenData[currentNetwork?.name?.toLowerCase()]?.native?.image || currentNetwork?.logo}
                              alt={currentNetwork?.symbol}
                              className="w-8 h-8 rounded-full border-2 border-[#4caf8e]/20"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-[#c5e7d7]">
                              <img
                                src={currentNetwork?.logo}
                                alt={currentNetwork?.name}
                                className="w-3 h-3 rounded-full"
                              />
                            </div>
                            {currentNetwork?.isTestnet && (
                              <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-600 text-[8px] rounded-full border border-yellow-200">
                                Testnet
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-800 text-sm font-medium">{currentNetwork?.symbol}</p>
                            <p className="text-xs text-gray-500">{currentNetwork?.name}</p>
                            {(() => {
                              const networkKey = currentNetwork?.name?.toLowerCase()
                              const normalizedNetworkKey = networkKey === 'bnb smart chain' ? 'bsc' 
                                : networkKey === 'arbitrum one' ? 'arbitrum' 
                                : networkKey
                              
                              const isPopularNetwork = Object.keys(web3Service.getPopularNetworks())
                                .some(key => key === normalizedNetworkKey)

                              if (isPopularNetwork && !currentNetwork?.isTestnet) {
                                const priceData = tokenData[normalizedNetworkKey]?.native
                                return (
                                  <div className="flex items-center space-x-1">
                                    <p className="text-[#4caf8e] text-xs">
                                      ${priceData?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                    </p>
                                    <p className={`text-xs ${(priceData?.priceChangePercentage24h || 0) >= 0 ? 'text-[#4caf8e]' : 'text-red-500'}`}>
                                      ({(priceData?.priceChangePercentage24h || 0).toFixed(2)}%)
                                    </p>
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </div>
                        </div>
                        <div className="text-right">
                          {(() => {
                            const networkKey = currentNetwork?.name?.toLowerCase()
                            const normalizedNetworkKey = networkKey === 'bnb smart chain' ? 'bsc' 
                              : networkKey === 'arbitrum one' ? 'arbitrum' 
                              : networkKey
                            
                            const isPopularNetwork = Object.keys(web3Service.getPopularNetworks())
                              .some(key => key === normalizedNetworkKey)

                            if (isPopularNetwork && !currentNetwork?.isTestnet) {
                              const priceData = tokenData[normalizedNetworkKey]?.native
                              return (
                                <>
                                  <p className="text-gray-800 text-sm font-medium">
                                    ${((priceData?.price || 0) * (parseFloat(priceData?.balance) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {parseFloat(priceData?.balance || 0).toFixed(4)} {currentNetwork?.symbol}
                                  </p>
                                </>
                              )
                            }
                            return (
                              <p className="text-gray-800 text-sm font-medium">
                                {parseFloat(tokenData[normalizedNetworkKey]?.native?.balance || 0).toFixed(4)} {currentNetwork?.symbol}
                              </p>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Network Tokens */}
                      {(() => {
                        const networkKey = currentNetwork?.name?.toLowerCase()
                        const normalizedNetworkKey = networkKey === 'bnb smart chain' ? 'bsc' 
                          : networkKey === 'arbitrum one' ? 'arbitrum' 
                          : networkKey

                        return tokenData[normalizedNetworkKey]?.tokens?.map((token, index) => (
                          <div 
                            key={index} 
                            className="ml-6 flex items-center justify-between p-3 hover:bg-[#4caf8e]/5 rounded-lg transition-colors cursor-pointer"
                            onClick={() => handleSendClick(token, currentNetwork)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <img
                                  src={token.image || "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png"}
                                  alt={token.symbol}
                                  className="w-8 h-8 rounded-full border-2 border-[#4caf8e]/20"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-[#c5e7d7]">
                                  <img
                                    src={currentNetwork?.logo}
                                    alt={currentNetwork?.name}
                                    className="w-3 h-3 rounded-full"
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm font-medium">{token.name}</p>
                                {(() => {
                                  const isPopularNetwork = Object.keys(web3Service.getPopularNetworks())
                                    .some(key => key === normalizedNetworkKey)

                                  if (isPopularNetwork) {
                                    return (
                                      <div className="flex items-center space-x-1">
                                        <p className="text-[#4caf8e] text-xs">
                                          {token.currency?.symbol || '$'}
                                          {token.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                        </p>
                                        <p className={`text-xs ${(token.priceChangePercentage24h || 0) >= 0 ? 'text-[#4caf8e]' : 'text-red-500'}`}>
                                          ({(token.priceChangePercentage24h || 0).toFixed(2)}%)
                                        </p>
                                      </div>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            </div>
                            <div className="text-right">
                              {(() => {
                                const isPopularNetwork = Object.keys(web3Service.getPopularNetworks())
                                  .some(key => key === normalizedNetworkKey)

                                if (isPopularNetwork) {
                                  return (
                                    <>
                                      <p className="text-gray-800 text-sm font-medium">
                                        {token.currency?.symbol || '$'}
                                        {((token.price || 0) * (parseFloat(token.balance) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </p>
                                      <p className="text-gray-500 text-xs">
                                        {parseFloat(token.balance || 0).toFixed(4)} {token.symbol}
                                      </p>
                                    </>
                                  )
                                }
                                return (
                                  <p className="text-gray-800 text-sm font-medium">
                                    {parseFloat(token.balance || 0).toFixed(4)} {token.symbol}
                                  </p>
                                )
                              })()}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nfts' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-[#c5e7d7]">
                <span className="text-4xl">🖼️</span>
              </div>
              <p className="text-gray-500">{translate('dashboard.noNFTs')}</p>
              <button className="text-[#4caf8e] hover:text-[#3d8b71] transition-colors">
                {translate('dashboard.learnMore')}
              </button>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="border-b border-[#c5e7d7] pb-4">
                <div className="text-sm text-gray-500 mb-2">Feb 15, 2025</div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#4caf8e] rounded-full flex items-center justify-center shadow-lg shadow-[#4caf8e]/10">
                      <span className="text-white">↗</span>
                    </div>
                    <div>
                      <div className="text-gray-800">USDT Gönder</div>
                      <div className="text-[#4caf8e] text-sm">Onaylandı</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-800">-19.76 USDT</div>
                    <div className="text-gray-500 text-sm">-$19.84 USD</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - More Minimal */}
      <BottomBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Network Modal */}
      <NetworkModal
        showNetworkModal={showNetworkModal}
        setShowNetworkModal={setShowNetworkModal}
        networks={networks}
        currentNetwork={currentNetwork}
        handleNetworkSwitch={handleNetworkSwitch}
        isTestnetEnabled={isTestnetEnabled}
      />

      {/* Wallet Selection Modal */}
      <WalletModal
        showWalletModal={showWalletModal}
        setShowWalletModal={setShowWalletModal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredWallets={filteredWallets}
        selectedWallet={selectedWallet}
        handleWalletSelect={handleWalletSelect}
        showWalletSettings={showWalletSettings}
        setShowWalletSettings={setShowWalletSettings}
        handleHideWallet={handleHideWallet}
        handleShowWallet={handleShowWallet}
        hiddenWallets={hiddenWallets}
        showHiddenWallets={showHiddenWallets}
        setShowHiddenWallets={setShowHiddenWallets}
      />

      {/* Buy Modal */}
      <BuyModal
        show={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        currentNetwork={currentNetwork}
        selectedWallet={selectedWallet}
      />
    </div>
  )
}

export default Dashboard 