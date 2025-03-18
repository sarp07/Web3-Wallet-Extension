import web3Service from './web3Service'

// API URL ve key
const COINGECKO_API = 'https://api.coingecko.com/api/v3'
const COINGECKO_API_KEY = 'CG-ENuVdQ2McReJqWGp1YH7Ggix'

// Cache süresi (5 dakika)
const CACHE_DURATION = 5 * 60 * 1000
// API çağrıları arası minimum bekleme süresi (2 saniye)
const API_CALL_DELAY = 2000

// Desteklenen para birimleri
const SUPPORTED_CURRENCIES = {
  usd: { symbol: '$', name: 'US Dollar' },
  eur: { symbol: '€', name: 'Euro' },
  try: { symbol: '₺', name: 'Turkish Lira' },
  gbp: { symbol: '£', name: 'British Pound' },
  jpy: { symbol: '¥', name: 'Japanese Yen' },
  cny: { symbol: '¥', name: 'Chinese Yuan' }
}

class PriceService {
  constructor() {
    this.priceCache = new Map()
    this.lastApiCall = 0
    this.currentCurrency = localStorage.getItem('preferredCurrency') || 'usd'
  }

  // Para birimini değiştir
  setCurrency(currency) {
    if (SUPPORTED_CURRENCIES[currency]) {
      this.currentCurrency = currency
      localStorage.setItem('preferredCurrency', currency)
      // Cache'i temizle
      this.priceCache.clear()
    }
  }

  // Mevcut para birimini al
  getCurrentCurrency() {
    return {
      code: this.currentCurrency,
      ...SUPPORTED_CURRENCIES[this.currentCurrency]
    }
  }

  // Tüm desteklenen para birimlerini al
  getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES
  }

  // Desteklenen ağlar için CoinGecko coin ID'leri
  networkToCoinId = {
    'ethereum': 'ethereum',
    'polygon': 'matic-network',
    'bsc': 'binancecoin',
    'optimism': 'ethereum',
    'arbitrum': 'ethereum'
  }

  // CoinGecko'dan tüm coinlerin listesini al ve doğru ID'leri kontrol et
  async verifyCoinIds() {
    try {
      const options = {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-cg-demo-api-key': COINGECKO_API_KEY
        }
      }

      const response = await fetch('https://api.coingecko.com/api/v3/coins/list', options)
      const coins = await response.json()

      // Bizim aradığımız coinler
      const searchFor = {
        'ethereum': ['ethereum', 'eth'],
        'polygon': ['polygon', 'matic'],
        'bsc': ['bnb', 'binance'],
        'optimism': ['ethereum', 'eth'],
        'arbitrum': ['ethereum', 'eth']
      }

      // Her network için eşleşen coinleri bul
      Object.entries(searchFor).forEach(([network, keywords]) => {
        const matches = coins.filter(coin => 
          keywords.some(keyword => 
            coin.id.toLowerCase().includes(keyword) || 
            coin.symbol.toLowerCase().includes(keyword) ||
            coin.name.toLowerCase().includes(keyword)
          )
        )
        console.log(`Matches for ${network}:`, matches)
      })
    } catch (error) {
      console.error('Coin list fetch error:', error)
    }
  }

  // API çağrıları arasında delay ekleyen yardımcı fonksiyon
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Cache'den veri alma
  getCachedPrice(cacheKey) {
    const cachedData = this.priceCache.get(cacheKey)
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data
    }
    return null
  }

  // Cache'e veri kaydetme
  setCachedPrice(cacheKey, data) {
    this.priceCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }

  // CoinGecko'dan fiyat bilgisi al
  async getTokenPrice(tokenAddress, network, currency = null) {
    try {
      // Network key'ini direkt olarak kullan
      const networkKey = network?.key?.toLowerCase() || network?.name?.toLowerCase()
      
      // Testnet kontrolü
      if (network?.isTestnet) {
        return { price: 0, priceChange24h: 0, lastUpdated: null, image: null }
      }

      // Network key'i düzelt
      const normalizedNetworkKey = networkKey === 'bnb smart chain' ? 'bsc' 
        : networkKey === 'arbitrum one' ? 'arbitrum' 
        : networkKey

      const coinId = this.networkToCoinId[normalizedNetworkKey]
      const selectedCurrency = currency || this.currentCurrency
      const cacheKey = `${coinId}_${tokenAddress}_${selectedCurrency}`

      console.log('Fetching price for network:', {
        networkKey,
        normalizedNetworkKey,
        coinId,
        selectedCurrency
      })

      // Önce cache'i kontrol et
      const cachedPrice = this.getCachedPrice(cacheKey)
      if (cachedPrice) {
        console.log('Using cached price for:', normalizedNetworkKey)
        return cachedPrice
      }

      // API çağrıları arası minimum süreyi kontrol et
      const timeSinceLastCall = Date.now() - this.lastApiCall
      if (timeSinceLastCall < API_CALL_DELAY) {
        await this.delay(API_CALL_DELAY - timeSinceLastCall)
      }

      if (!coinId) {
        console.warn('Unsupported network:', normalizedNetworkKey)
        return { price: 0, priceChange24h: 0, lastUpdated: null, image: null }
      }

      // CoinGecko API'den fiyat bilgisi al
      const options = {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-cg-demo-api-key': COINGECKO_API_KEY
        }
      }

      // Markets endpoint'i kullan (daha detaylı veri için)
      const url = `${COINGECKO_API}/coins/markets?vs_currency=${selectedCurrency}&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
      
      console.log('Fetching from URL:', url)
      
      const response = await fetch(url, options)
      this.lastApiCall = Date.now()

      if (!response.ok) {
        const errorData = await response.json()
        console.error('CoinGecko API Error:', errorData)
        
        if (response.status === 429) {
          console.warn('Rate limit exceeded, using cached data if available...')
          return cachedPrice || { price: 0, priceChange24h: 0, lastUpdated: null, image: null }
        }
        
        return { price: 0, priceChange24h: 0, lastUpdated: null, image: null }
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      if (!data || data.length === 0) {
        console.warn(`No price data found for ${normalizedNetworkKey} (CoinID: ${coinId})`)
        return { price: 0, priceChange24h: 0, lastUpdated: null, image: null }
      }

      const coinData = data[0]
      const result = {
        price: coinData.current_price || 0,
        priceChange24h: coinData.price_change_24h || 0,
        priceChangePercentage24h: coinData.price_change_percentage_24h || 0,
        lastUpdated: coinData.last_updated,
        image: coinData.image,
        currency: {
          code: selectedCurrency,
          ...SUPPORTED_CURRENCIES[selectedCurrency]
        }
      }

      // Sonucu cache'e kaydet
      this.setCachedPrice(cacheKey, result)
      
      console.log(`Price data for ${normalizedNetworkKey}:`, result)

      return result
    } catch (error) {
      console.error('Price fetch error:', error)
      return { price: 0, priceChange24h: 0, lastUpdated: null, image: null }
    }
  }

  async getTokenBalanceAndPrice(address, tokenAddress, network) {
    try {
      let balance
      
      // Native token veya ERC20 token bakiyesini al
      if (tokenAddress === null) {
        // Native token bakiyesi
        balance = await web3Service.getBalance(address)
      } else {
        // ERC20 token bakiyesi
        balance = await web3Service.getTokenBalance(address, tokenAddress)
      }

      // Fiyat bilgisini al
      const priceData = await this.getTokenPrice(tokenAddress, network)

      return {
        balance: parseFloat(balance),
        ...priceData
      }
    } catch (error) {
      console.error('Token data fetch error:', error.message)
      return { 
        balance: 0, 
        price: 0, 
        priceChange24h: 0,
        lastUpdated: null,
        image: null
      }
    }
  }
}

export default new PriceService() 