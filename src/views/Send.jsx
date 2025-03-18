import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ethers } from 'ethers'
import web3Service from '../services/web3Service'
import { useLanguage } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'

const calculateTransactionComplexity = (selectedToken, amount) => {
  let complexity = 1 // Base complexity

  // Token type complexity
  if (!selectedToken?.isNative) {
    complexity += 0.5 // ERC20 transactions are more complex
  }

  // Amount complexity (larger amounts might need more gas)
  const amountValue = parseFloat(amount)
  if (amountValue > 1000) {
    complexity += 0.2
  }

  return complexity
}

const handleGasEstimationError = (error) => {
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return 'Transaction may fail - contract execution error'
  }
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds for gas'
  }
  return error.message
}

const Send = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { translate } = useLanguage()
  const { showNotification } = useNotification()
  
  // Token ve ağ durumu
  const [selectedToken, setSelectedToken] = useState(null)
  const [currentNetwork, setCurrentNetwork] = useState(null)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [balance, setBalance] = useState('0')
  
  // Gönderim detayları
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [gasPrice, setGasPrice] = useState({
    slow: { gasPrice: 0, isEIP1559: false },
    normal: { gasPrice: 0, isEIP1559: false },
    fast: { gasPrice: 0, isEIP1559: false }
  })
  const [estimatedGas, setEstimatedGas] = useState(null)
  const [speedOption, setSpeedOption] = useState('normal')
  const [customGasPrice, setCustomGasPrice] = useState({ gasPrice: 0, isEIP1559: false })
  
  // UI durumları
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Gas fiyatlarını güncelle
  const updateGasPrices = async () => {
    try {
      if (!currentNetwork) {
        console.log('Network not initialized yet')
        return
      }

      const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl)
      const feeData = await provider.getFeeData()
      
      // EIP-1559 destekli ağlar için maxFeePerGas kullan
      const isEIP1559 = feeData.maxFeePerGas !== null && feeData.maxPriorityFeePerGas !== null

      if (isEIP1559) {
        // EIP-1559 için fee hesaplama
        const maxFeePerGas = feeData.maxFeePerGas
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas

        const newGasPrice = {
          slow: {
            maxFeePerGas: Number(ethers.formatUnits(maxFeePerGas * BigInt(80) / BigInt(100), 'gwei')),
            maxPriorityFeePerGas: Number(ethers.formatUnits(maxPriorityFeePerGas * BigInt(80) / BigInt(100), 'gwei')),
            isEIP1559: true
          },
          normal: {
            maxFeePerGas: Number(ethers.formatUnits(maxFeePerGas, 'gwei')),
            maxPriorityFeePerGas: Number(ethers.formatUnits(maxPriorityFeePerGas, 'gwei')),
            isEIP1559: true
          },
          fast: {
            maxFeePerGas: Number(ethers.formatUnits(maxFeePerGas * BigInt(120) / BigInt(100), 'gwei')),
            maxPriorityFeePerGas: Number(ethers.formatUnits(maxPriorityFeePerGas * BigInt(120) / BigInt(100), 'gwei')),
            isEIP1559: true
          }
        }
        
        setGasPrice(newGasPrice)
        setCustomGasPrice(newGasPrice.normal)
      } else {
        // Legacy gas fiyatlandırması
        const baseGasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei') // Varsayılan 50 gwei

        const newGasPrice = {
          slow: {
            gasPrice: Number(ethers.formatUnits(baseGasPrice * BigInt(80) / BigInt(100), 'gwei')),
            isEIP1559: false
          },
          normal: {
            gasPrice: Number(ethers.formatUnits(baseGasPrice, 'gwei')),
            isEIP1559: false
          },
          fast: {
            gasPrice: Number(ethers.formatUnits(baseGasPrice * BigInt(120) / BigInt(100), 'gwei')),
            isEIP1559: false
          }
        }
        
        setGasPrice(newGasPrice)
        setCustomGasPrice(newGasPrice.normal)
      }

      // Gas limitini tahmin et
      await estimateGasLimit()
    } catch (error) {
      console.error('Gas price update error:', error)
      showNotification(translate('notifications.gasPriceError'), 'error')
      
      // Hata durumunda varsayılan değerler (Gwei cinsinden)
      const defaultGasPrice = {
        slow: { gasPrice: 40, isEIP1559: false },
        normal: { gasPrice: 50, isEIP1559: false },
        fast: { gasPrice: 60, isEIP1559: false }
      }
      setGasPrice(defaultGasPrice)
      setCustomGasPrice(defaultGasPrice.normal)
    }
  }

  useEffect(() => {
    const initSendPage = async () => {
      try {
        // Mevcut ağ ve cüzdan bilgilerini al
        const network = web3Service.getCurrentNetwork()
        const wallets = web3Service.getVisibleWallets()
        const currentWallet = wallets[0]

        // Location state'den token ve network bilgisini al
        const stateToken = location.state?.token
        const stateNetwork = location.state?.network

        // Eğer state'den gelen network varsa onu kullan, yoksa mevcut ağı kullan
        const targetNetwork = stateNetwork || network
        setCurrentNetwork(targetNetwork)

        if (currentWallet) {
          setSelectedWallet(currentWallet)
          
          // Eğer state'den gelen token varsa onu kullan
          if (stateToken) {
            setSelectedToken(stateToken)
            if (stateToken.isNative) {
              const nativeBalance = await web3Service.getBalance(currentWallet.address)
              setBalance(nativeBalance)
            } else {
              const tokenBalance = await web3Service.getTokenBalance(
                currentWallet.address,
                stateToken.address
              )
              setBalance(tokenBalance)
            }
          } else {
            // Varsayılan olarak native token'ı kullan
            const nativeBalance = await web3Service.getBalance(currentWallet.address)
            setBalance(nativeBalance)
            setSelectedToken({
              symbol: targetNetwork.symbol,
              name: targetNetwork.name,
              decimals: 18,
              isNative: true
            })
          }
        }

        // Gas fiyatlarını al
        await updateGasPrices()
      } catch (error) {
        console.error('Send page initialization error:', error)
        showNotification(translate('notifications.initError'), 'error')
      }
    }

    initSendPage()
  }, [location.state])

  // Eğer gerekli veriler yüklenmediyse loading göster
  if (!currentNetwork || !selectedToken) {
    return (
      <div className="w-[350px] h-[600px] bg-[#e6f7ef] text-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4caf8e] mx-auto mb-4"></div>
          <p className="text-gray-600">{translate('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Gas limitini tahmin et
  const estimateGasLimit = async () => {
    try {
      if (!recipientAddress || !amount || !currentNetwork || !selectedToken || !selectedWallet) {
        // Varsayılan gas limitleri
        const defaultGasLimit = selectedToken?.isNative ? '21000' : '65000'
        setEstimatedGas(ethers.getBigInt(defaultGasLimit))
        return
      }

      const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl)
      
      let gasEstimate
      if (selectedToken.isNative) {
        gasEstimate = await provider.estimateGas({
          from: selectedWallet.address,
          to: recipientAddress,
          value: ethers.parseEther(amount)
        })
      } else {
        const tokenContract = new ethers.Contract(
          selectedToken.address,
          ['function transfer(address to, uint256 amount)'],
          provider
        )
        
        const value = ethers.parseUnits(amount, selectedToken.decimals)
        gasEstimate = await tokenContract.estimateGas.transfer(
          recipientAddress,
          value
        )
      }
      
      // Akıllı buffer hesaplama
      const complexity = calculateTransactionComplexity(selectedToken, amount)
      const bufferPercentage = Math.floor(10 + (complexity * 5)) // 10% - 25% arası buffer
      const gasWithBuffer = (gasEstimate * BigInt(100 + bufferPercentage)) / BigInt(100)
      
      setEstimatedGas(gasWithBuffer)
    } catch (error) {
      console.error('Gas estimation error:', error)
      const errorMessage = handleGasEstimationError(error)
      showNotification(errorMessage, 'error')
      
      // Hata durumunda varsayılan gas limitleri
      const defaultGasLimit = selectedToken?.isNative ? '21000' : '65000'
      setEstimatedGas(ethers.getBigInt(defaultGasLimit))
    }
  }

  // Calculate total fee
  const calculateTotalFee = () => {
    if (!customGasPrice || !estimatedGas) return '0'

    const gasLimit = estimatedGas || ethers.getBigInt('21000')
    
    if (customGasPrice.isEIP1559) {
      // EIP-1559 fee hesaplama
      const maxFee = (customGasPrice.maxFeePerGas * Number(gasLimit)) / 10**9
      return maxFee.toFixed(6)
    } else {
      // Legacy fee hesaplama
      const fee = (customGasPrice.gasPrice * Number(gasLimit)) / 10**9
      return fee.toFixed(6)
    }
  }

  // Speed seçimi değiştiğinde
  const handleSpeedChange = (speed) => {
    if (!gasPrice || !gasPrice[speed]) return
    
    setSpeedOption(speed)
    setCustomGasPrice(gasPrice[speed])
    estimateGasLimit()
  }

  // Maximum miktar ayarla
  const handleSetMaxAmount = async () => {
    try {
      if (!selectedToken || !balance) return

      if (selectedToken.isNative) {
        // Native token için gas ücretini düş
        const gasCost = (customGasPrice * 21000) / 10**9 // Gwei to ETH
        const maxAmount = parseFloat(balance) - gasCost
        setAmount(maxAmount > 0 ? maxAmount.toString() : '0')
      } else {
        setAmount(balance)
      }
    } catch (error) {
      console.error('Set max amount error:', error)
      showNotification(translate('notifications.maxAmountError'), 'error')
    }
  }

  // Gönderimi gerçekleştir
  const handleSend = async () => {
    try {
      if (!selectedWallet || !currentNetwork || !selectedToken) {
        throw new Error('Wallet, network or token not initialized')
      }

      setIsLoading(true)
      setError(null)

      // Input validation
      if (!recipientAddress || !amount) {
        throw new Error(translate('send.fillAllFields'))
      }

      if (!ethers.isAddress(recipientAddress)) {
        throw new Error(translate('send.invalidAddress'))
      }

      // Amount validation
      const amountValue = parseFloat(amount)
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error(translate('send.invalidAmount'))
      }

      // Balance check
      const balanceValue = parseFloat(balance)
      if (amountValue > balanceValue) {
        throw new Error(translate('send.insufficientBalance'))
      }

      const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl)
      const wallet = new ethers.Wallet(selectedWallet.privateKey, provider)

      // Transaction parameters
      const txParams = selectedToken.isNative
        ? {
            to: recipientAddress,
            value: ethers.parseEther(amount)
          }
        : {
            to: selectedToken.address,
            data: new ethers.Interface(['function transfer(address to, uint256 amount)'])
              .encodeFunctionData('transfer', [
                recipientAddress,
                ethers.parseUnits(amount, selectedToken.decimals)
              ])
          }

      // Add gas parameters
      if (customGasPrice.isEIP1559) {
        txParams.maxFeePerGas = ethers.parseUnits(customGasPrice.maxFeePerGas.toString(), 'gwei')
        txParams.maxPriorityFeePerGas = ethers.parseUnits(customGasPrice.maxPriorityFeePerGas.toString(), 'gwei')
      } else {
        txParams.gasPrice = ethers.parseUnits(customGasPrice.gasPrice.toString(), 'gwei')
      }

      // Add estimated gas limit
      txParams.gasLimit = estimatedGas || ethers.getBigInt('21000')

      // Send transaction
      const tx = await wallet.sendTransaction(txParams)
      
      // Wait for confirmation
      showNotification(translate('send.transactionSent'), 'info')
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        showNotification(translate('send.success'), 'success')
        navigate('/dashboard')
      } else {
        throw new Error(translate('send.transactionFailed'))
      }
    } catch (error) {
      console.error('Send transaction error:', error)
      setError(error.message)
      showNotification(translate('send.error'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-[350px] h-[600px] bg-[#e6f7ef] text-gray-800 relative flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-[#c5e7d7]">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-800"
        >
          ← {translate('common.back')}
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">
          {translate('send.title')}
        </h1>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Token Selection */}
        <div className="mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#c5e7d7]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={selectedToken?.logo || currentNetwork?.logo}
                alt={selectedToken?.symbol}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <h3 className="font-medium">{selectedToken?.symbol}</h3>
                <p className="text-sm text-gray-500">
                  {translate('send.balance')}: {balance} {selectedToken?.symbol}
                </p>
              </div>
            </div>
            <button
              onClick={() => {/* Token seçim modalını aç */}}
              className="text-[#4caf8e] hover:text-[#3d8b71] text-sm"
            >
              {translate('send.change')}
            </button>
          </div>
        </div>

        {/* Recipient Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {translate('send.recipient')}
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full px-4 py-3 bg-white/80 border border-[#c5e7d7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4caf8e]"
            placeholder="0x..."
          />
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {translate('send.amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border border-[#c5e7d7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4caf8e]"
              placeholder="0.0"
            />
            <button
              onClick={handleSetMaxAmount}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm text-[#4caf8e] hover:text-[#3d8b71]"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Gas Speed Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {translate('send.transactionSpeed')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['slow', 'normal', 'fast'].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`p-3 rounded-xl text-sm font-medium transition-all
                  ${speedOption === speed
                    ? 'bg-[#4caf8e] text-white'
                    : 'bg-white/80 text-gray-600 hover:bg-[#4caf8e]/10'
                  }`}
              >
                {translate(`send.${speed}`)}
                <div className="text-xs mt-1">
                  {gasPrice && gasPrice[speed]?.isEIP1559 
                    ? `${gasPrice[speed]?.maxFeePerGas?.toFixed(1) || '0'} Gwei`
                    : `${gasPrice[speed]?.gasPrice?.toFixed(1) || '0'} Gwei`
                  }
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fee Details */}
        <div className="mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#c5e7d7]">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {translate('send.feeDetails')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{translate('send.gasPrice')}</span>
              <span>
                {customGasPrice?.isEIP1559 
                  ? `${customGasPrice.maxFeePerGas?.toFixed(1)} Gwei`
                  : `${customGasPrice?.gasPrice?.toFixed(1)} Gwei`
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{translate('send.gasLimit')}</span>
              <span>{estimatedGas?.toString() || '21000'}</span>
            </div>
            {customGasPrice?.isEIP1559 && (
              <div className="flex justify-between">
                <span className="text-gray-600">{translate('send.maxPriorityFee')}</span>
                <span>{customGasPrice.maxPriorityFeePerGas?.toFixed(1)} Gwei</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-[#c5e7d7]">
              <span>{translate('send.totalFee')}</span>
              <span>
                {calculateTotalFee()} {currentNetwork.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Send Button */}
      <div className="p-4 border-t border-[#c5e7d7]">
        <button
          onClick={handleSend}
          disabled={isLoading || !amount || !recipientAddress}
          className="w-full py-3 bg-[#4caf8e] text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3d8b71] transition-colors"
        >
          {isLoading ? translate('send.sending') : translate('send.send')}
        </button>
      </div>
    </div>
  )
}

export default Send 