import { ethers } from 'ethers'

const ALCHEMY_CONFIG = {
  sandbox: {
    baseUrl: "https://ramptest.alchemypay.org",
    appId: import.meta.env.VITE_ALCHEMY_PAY_TEST_APPID
  },
  production: {
    baseUrl: "https://ramp.alchemypay.org", 
    appId: import.meta.env.VITE_ALCHEMY_PAY_PROD_APPID
  }
}

class BuyService {
  constructor() {
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    this.supportedFiat = ['USD', 'EUR', 'GBP']
    this.currentNetwork = null
    this.currentCrypto = null
  }

  setNetwork(network) {
    this.currentNetwork = network
  }

  setCrypto(crypto) {
    this.currentCrypto = crypto
  }

  async getQuote(amount, fiatCurrency, cryptoCurrency, chain) {
    try {
      if (!this.supportedFiat.includes(fiatCurrency)) {
        throw new Error(`${fiatCurrency} is not supported`)
      }

      const quote = {
        fiatAmount: amount,
        fiatCurrency,
        cryptoCurrency,
        chain,
        estimatedCryptoAmount: amount / this.getCurrentRate(cryptoCurrency),
        fee: amount * 0.03,
        total: amount * 1.03,
        timestamp: Date.now()
      }

      return quote
    } catch (error) {
      console.error('Get quote error:', error)
      throw error
    }
  }

  async initiatePurchase(amount, walletAddress, email) {
    try {
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address')
      }

      if (!email || !email.includes('@')) {
        throw new Error('Valid email is required')
      }

      const config = ALCHEMY_CONFIG[this.environment]
      
      // Alchemy Pay URL parametreleri
      const params = new URLSearchParams({
        appId: config.appId,
        network: this.currentNetwork,
        crypto: this.currentCrypto,
        amount: amount,
        address: walletAddress,
        email: email,
        redirectUrl: window.location.origin,
        theme: 'light',
        language: document.documentElement.lang || 'en'
      })

      const paymentUrl = `${config.baseUrl}/?${params.toString()}`

      return {
        id: `PUR${Date.now()}`,
        status: 'PENDING',
        walletAddress,
        email,
        paymentUrl
      }
    } catch (error) {
      console.error('Purchase initiation error:', error)
      throw error
    }
  }

  getCurrentRate(cryptoCurrency) {
    const rates = {
      ETH: 2200,
      BNB: 300,
      MATIC: 0.8,
      ARBITRUM: 1.5
    }
    return rates[cryptoCurrency] || 1
  }

  async checkStatus(purchaseId) {
    try {
      return {
        id: purchaseId,
        status: 'COMPLETED',
        txHash: `0x${purchaseId}`,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Status check error:', error)
      throw error
    }
  }
}

const buyService = new BuyService()
export default buyService 