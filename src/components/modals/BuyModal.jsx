import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import buyService from '../../services/buyService'
import web3Service from '../../services/web3Service'

const BuyModal = ({ show, onClose, currentNetwork, selectedWallet }) => {
  const { translate } = useLanguage()
  const { showNotification } = useNotification()
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [email, setEmail] = useState('')
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFiat, setSelectedFiat] = useState('USD')

  useEffect(() => {
    if (show) {
      setStep(1)
      setAmount('')
      setEmail('')
      setQuote(null)
      setError('')
    }
  }, [show])

  const handleGetQuote = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!amount || isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      // Set current network and crypto
      buyService.setNetwork(currentNetwork.name)
      buyService.setCrypto(currentNetwork.symbol)

      const newQuote = await buyService.getQuote(
        parseFloat(amount),
        selectedFiat,
        currentNetwork.symbol,
        currentNetwork.name
      )

      setQuote(newQuote)
      setStep(2)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    try {
      setLoading(true)
      setError('')

      if (!email) {
        throw new Error('Please enter your email')
      }

      const purchase = await buyService.initiatePurchase(
        parseFloat(amount),
        selectedWallet.address,
        email
      )

      // Yeni pencerede aç
      const width = 500
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      window.open(
        purchase.paymentUrl,
        'Buy Crypto',
        `width=${width},height=${height},left=${left},top=${top}`
      )
      
      showNotification(translate('notifications.purchaseInitiated'), 'success')
      onClose()
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[400px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              {translate('buy.title')}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 1 && (
            <div className="space-y-4">
              {/* Network Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <img
                  src={currentNetwork.logo}
                  alt={currentNetwork.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{currentNetwork.name}</p>
                  <p className="text-xs text-gray-500">{currentNetwork.symbol}</p>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translate('buy.amount')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4caf8e] text-gray-800"
                  />
                  <select
                    value={selectedFiat}
                    onChange={(e) => setSelectedFiat(e.target.value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent text-gray-500 focus:outline-none"
                  >
                    {buyService.supportedFiat.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handleGetQuote}
                disabled={loading}
                className="w-full py-3 bg-[#4caf8e] text-white rounded-xl hover:bg-[#3d8b71] transition-colors disabled:opacity-50"
              >
                {loading ? translate('common.loading') : translate('buy.getQuote')}
              </button>
            </div>
          )}

          {step === 2 && quote && (
            <div className="space-y-4">
              {/* Quote Details */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{translate('buy.amount')}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {quote.fiatAmount} {quote.fiatCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{translate('buy.fee')}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {quote.fee} {quote.fiatCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{translate('buy.total')}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {quote.total} {quote.fiatCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{translate('buy.estimatedAmount')}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {quote.estimatedCryptoAmount} {quote.cryptoCurrency}
                  </span>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {translate('buy.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4caf8e] text-gray-800"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-[#4caf8e] text-[#4caf8e] rounded-xl hover:bg-[#4caf8e]/5 transition-colors"
                >
                  {translate('common.back')}
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={loading}
                  className="flex-1 py-3 bg-[#4caf8e] text-white rounded-xl hover:bg-[#3d8b71] transition-colors disabled:opacity-50"
                >
                  {loading ? translate('common.loading') : translate('buy.proceed')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuyModal 