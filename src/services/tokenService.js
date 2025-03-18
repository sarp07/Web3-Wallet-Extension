import web3Service from './web3Service'
import priceService from './priceService'
import { ethers } from 'ethers'

// Chain API Configurations
const CHAIN_APIS = {
  ethereum: {
    endpoint: 'https://api.etherscan.io/api',
    key: '6PCUJXG5WNEFKQKT8872NYBTWY6R3EFDZM',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'ethereum'
  },
  polygon: {
    endpoint: 'https://api.polygonscan.com/api',
    key: 'HXI3K1I3TU7PRGY1ZDGDU942WQHXI3UQ69',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'polygon'
  },
  'bnb smart chain': {
    endpoint: 'https://api.bscscan.com/api',
    key: 'URU44GDP45ITXGKAYSR7JXSCVD62QZQP47',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'bsc'
  },
  optimism: {
    endpoint: 'https://api-optimistic.etherscan.io/api',
    key: 'Q4WUBUBY6FBVNW5FVC1IUUWBB11ISC3FC8',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'optimism'
  },
  'arbitrum one': {
    endpoint: 'https://api.arbiscan.io/api',
    key: '7QK7W45VM3YQ1WS36HP3NIGV3GG3NYGFTB',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'arbitrum'
  },
  // Testnet API configurations
  sepolia: {
    endpoint: 'https://api-sepolia.etherscan.io/api',
    key: '6PCUJXG5WNEFKQKT8872NYBTWY6R3EFDZM',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'sepolia',
    isTestnet: true
  },
  goerli: {
    endpoint: 'https://api-goerli.etherscan.io/api',
    key: '6PCUJXG5WNEFKQKT8872NYBTWY6R3EFDZM',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'goerli',
    isTestnet: true
  },
  mumbai: {
    endpoint: 'https://api-testnet.polygonscan.com/api',
    key: 'HXI3K1I3TU7PRGY1ZDGDU942WQHXI3UQ69',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'mumbai',
    isTestnet: true
  },
  'bsc-testnet': {
    endpoint: 'https://api-testnet.bscscan.com/api',
    key: 'URU44GDP45ITXGKAYSR7JXSCVD62QZQP47',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'bsc-testnet',
    isTestnet: true
  },
  'optimism-goerli': {
    endpoint: 'https://api-goerli-optimistic.etherscan.io/api',
    key: 'Q4WUBUBY6FBVNW5FVC1IUUWBB11ISC3FC8',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'optimism-goerli',
    isTestnet: true
  },
  'arbitrum-goerli': {
    endpoint: 'https://api-goerli.arbiscan.io/api',
    key: '7QK7W45VM3YQ1WS36HP3NIGV3GG3NYGFTB',
    tokenListEndpoint: 'tokentx',
    tokenBalanceEndpoint: 'tokenbalance',
    name: 'arbitrum-goerli',
    isTestnet: true
  }
}

// Moralis API for backup/alternative
const MORALIS_API = {
  endpoint: 'https://deep-index.moralis.io/api/v2',
  key: 'YOUR_MORALIS_API_KEY'
}

// Covalent API for additional data
const COVALENT_API = {
  endpoint: 'https://api.covalenthq.com/v1',
  key: 'YOUR_COVALENT_API_KEY'
}

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// ERC20 Token ABI
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
]

// NFT ABI definitions
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
]

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function uri(uint256 id) view returns (string)'
]

// NFT Event Interface
const NFT_EVENTS = [
  'Transfer(address,address,uint256)',
  'TransferSingle(address,address,address,uint256,uint256)',
  'TransferBatch(address,address,address,uint256[],uint256[])'
]

// NFT Metadata Standards
const METADATA_STANDARDS = {
  ERC721: {
    name: 'function name() view returns (string)',
    symbol: 'function symbol() view returns (string)',
    tokenURI: 'function tokenURI(uint256) view returns (string)',
    ownerOf: 'function ownerOf(uint256) view returns (address)'
  },
  ERC1155: {
    uri: 'function uri(uint256) view returns (string)',
    balanceOf: 'function balanceOf(address,uint256) view returns (uint256)',
    balanceOfBatch: 'function balanceOfBatch(address[],uint256[]) view returns (uint256[])'
  }
}

class TokenService {
  constructor() {
    this.tokenCache = new Map()
    this.scanInProgress = new Map()
    this.nftCache = new Map()
    this.nftContracts = new Map()
    this.nftTransferListeners = new Map()
  }

  // Cache key oluştur
  createCacheKey(network, address) {
    return `${network}_${address}`
  }

  // Token bilgilerini cache'den al
  getCachedTokens(network, address) {
    const key = this.createCacheKey(network, address)
    const cached = this.tokenCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.tokens
    }
    return null
  }

  // Token bilgilerini cache'e kaydet
  setCachedTokens(network, address, tokens) {
    const key = this.createCacheKey(network, address)
    this.tokenCache.set(key, {
      tokens,
      timestamp: Date.now()
    })
  }

  // Token contract'ını doğrula
  async validateTokenContract(tokenAddress, provider) {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ])
      return true
    } catch (error) {
      return false
    }
  }

  // Token bilgilerini getir
  async getTokenInfo(tokenAddress, provider) {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ])
      return { name, symbol, decimals }
    } catch (error) {
      console.error('Token info fetch error:', error)
      return null
    }
  }

  // Belirli bir ağdaki tokenleri tara
  async scanNetworkTokens(walletAddress, network) {
    if (this.scanInProgress.get(network)) {
      return null
    }

    this.scanInProgress.set(network, true)
    
    try {
      // Önce cache'i kontrol et
      const cachedTokens = this.getCachedTokens(network, walletAddress)
      if (cachedTokens) {
        return cachedTokens
      }

      const chainConfig = CHAIN_APIS[network.toLowerCase()]
      
      if (!chainConfig) {
        console.warn(`No API configuration found for network: ${network}`)
        return []
      }

      // Testnet kontrolü
      if (chainConfig.isTestnet) {
        console.log(`Skipping price data for testnet: ${network}`)
        const tokens = [] // Testnet için sadece token listesi, fiyat bilgisi olmadan
        this.setCachedTokens(network, walletAddress, tokens)
        return tokens
      }

      // Chain explorer API'den token listesini çek
      const tokenListUrl = `${chainConfig.endpoint}?module=account&action=${chainConfig.tokenListEndpoint}&address=${walletAddress}&startblock=0&endblock=latest&sort=desc&apikey=${chainConfig.key}`
      
      console.log('Fetching tokens from:', tokenListUrl)
      const response = await fetch(tokenListUrl)
      const data = await response.json()
      
      if (data.status !== '1' && data.status !== '0') {
        throw new Error(`API Error: ${data.message || 'Unknown error'}`)
      }

      // Token adresleri kümesi oluştur (tekrarları önlemek için)
      const tokenAddresses = new Set()
      if (data.result && Array.isArray(data.result)) {
        data.result.forEach(tx => tokenAddresses.add(tx.contractAddress))
      }

      // RPC provider oluştur
      const provider = new ethers.JsonRpcProvider(web3Service.getAllNetworks()[chainConfig.name].rpcUrl)

      // Her token için detaylı bilgi topla
      const tokenPromises = Array.from(tokenAddresses).map(async (tokenAddress) => {
        try {
          // Token contract'ını doğrula
          const isValid = await this.validateTokenContract(tokenAddress, provider)
          if (!isValid) return null

          // Token bilgilerini al
          const tokenInfo = await this.getTokenInfo(tokenAddress, provider)
          if (!tokenInfo) return null

          // Token bakiyesini al
          const balance = await web3Service.getTokenBalance(walletAddress, tokenAddress)
          if (balance === '0') return null // Sıfır bakiyeli tokenleri gösterme

          // Testnet'lerde fiyat bilgisi almıyoruz
          let priceData = {
            price: 0,
            priceChange24h: 0,
            lastUpdated: null,
            image: null
          }

          // Sadece mainnet'lerde fiyat bilgisi al
          if (!chainConfig.isTestnet) {
            priceData = await priceService.getTokenPrice(tokenAddress, chainConfig)
          }

          return {
            address: tokenAddress,
            ...tokenInfo,
            balance: ethers.formatUnits(balance, tokenInfo.decimals),
            ...priceData
          }
        } catch (error) {
          console.error(`Error fetching token details (${tokenAddress}):`, error)
          return null
        }
      })

      // Null olmayan token bilgilerini filtrele
      const tokens = (await Promise.all(tokenPromises)).filter(token => token !== null)

      // Sonuçları cache'e kaydet
      this.setCachedTokens(network, walletAddress, tokens)

      return tokens
    } catch (error) {
      console.error('Token scan error:', error)
      return []
    } finally {
      this.scanInProgress.set(network, false)
    }
  }

  // Tüm ağlardaki tokenleri tara
  async scanAllNetworks(walletAddress) {
    const networks = web3Service.getAllNetworks()
    const scanPromises = Object.keys(networks).map(async (networkName) => {
      const tokens = await this.scanNetworkTokens(walletAddress, networkName)
      return [networkName, tokens]
    })

    const results = await Promise.all(scanPromises)
    return Object.fromEntries(results)
  }

  // Token listesini güncelle (manuel token ekleme için)
  async addCustomToken(walletAddress, network, tokenAddress) {
    try {
      const chainConfig = CHAIN_APIS[network.toLowerCase()]
      if (!chainConfig) {
        throw new Error(`No API configuration for network: ${network}`)
      }

      const provider = new ethers.JsonRpcProvider(web3Service.getAllNetworks()[chainConfig.name].rpcUrl)
      
      // Token contract'ını doğrula
      const isValid = await this.validateTokenContract(tokenAddress, provider)
      if (!isValid) {
        throw new Error('Invalid token contract')
      }

      // Token bilgilerini al
      const tokenInfo = await this.getTokenInfo(tokenAddress, provider)
      if (!tokenInfo) {
        throw new Error('Could not fetch token info')
      }

      // Balance ve fiyat bilgisini al
      const balance = await web3Service.getTokenBalance(walletAddress, tokenAddress)
      const priceData = await priceService.getTokenPrice(tokenAddress, chainConfig)

      // Cache'i güncelle
      const cachedTokens = this.getCachedTokens(network, walletAddress) || []
      const updatedTokens = [...cachedTokens, {
        address: tokenAddress,
        ...tokenInfo,
        balance: ethers.formatUnits(balance, tokenInfo.decimals),
        ...priceData
      }]

      this.setCachedTokens(network, walletAddress, updatedTokens)
      return updatedTokens
    } catch (error) {
      console.error('Add custom token error:', error)
      throw error
    }
  }

  // Enhanced NFT contract validation
  async validateNFTContract(contractAddress, provider) {
    try {
      // Try ERC721 first
      const erc721Contract = new ethers.Contract(
        contractAddress,
        [...Object.values(METADATA_STANDARDS.ERC721)],
        provider
      )
      
      try {
        await Promise.all([
          erc721Contract.name(),
          erc721Contract.symbol()
        ])
        return { isValid: true, standard: 'ERC721' }
      } catch {
        // Try ERC1155
        const erc1155Contract = new ethers.Contract(
          contractAddress,
          [...Object.values(METADATA_STANDARDS.ERC1155)],
          provider
        )
        
        try {
          await erc1155Contract.uri(0)
          return { isValid: true, standard: 'ERC1155' }
        } catch {
          return { isValid: false }
        }
      }
    } catch (error) {
      console.error('NFT validation error:', error)
      return { isValid: false }
    }
  }

  // Enhanced NFT metadata fetching
  async getNFTMetadata(tokenURI, tokenId) {
    try {
      // Handle IPFS URIs
      if (tokenURI.startsWith('ipfs://')) {
        tokenURI = `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
      }
      
      // Handle base64 encoded URIs
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.split(',')[1]
        const decodedData = atob(base64Data)
        return JSON.parse(decodedData)
      }
      
      // Handle templated URIs (replace {id} with actual token ID)
      tokenURI = tokenURI.replace(/{id}/, tokenId.toString().padStart(64, '0'))
      
      const response = await fetch(tokenURI)
      if (!response.ok) throw new Error('Metadata fetch failed')
      
      const metadata = await response.json()
      
      // Normalize metadata
      return this.normalizeNFTMetadata(metadata)
    } catch (error) {
      console.error('NFT metadata fetch error:', error)
      return null
    }
  }

  // Normalize NFT metadata to standard format
  normalizeNFTMetadata(metadata) {
    return {
      name: metadata.name || 'Unnamed NFT',
      description: metadata.description || '',
      image: this.normalizeNFTImage(metadata.image || metadata.image_url),
      attributes: this.normalizeNFTAttributes(metadata.attributes || metadata.traits || []),
      external_url: metadata.external_url || '',
      animation_url: metadata.animation_url || metadata.video || '',
      background_color: metadata.background_color || ''
    }
  }

  // Normalize NFT image URL
  normalizeNFTImage(imageUrl) {
    if (!imageUrl) return ''
    
    if (imageUrl.startsWith('ipfs://')) {
      return `https://ipfs.io/ipfs/${imageUrl.slice(7)}`
    }
    
    if (imageUrl.startsWith('ar://')) {
      return `https://arweave.net/${imageUrl.slice(5)}`
    }
    
    return imageUrl
  }

  // Normalize NFT attributes
  normalizeNFTAttributes(attributes) {
    return attributes.map(attr => ({
      trait_type: attr.trait_type || attr.key || '',
      value: attr.value || '',
      display_type: attr.display_type || null,
      max_value: attr.max_value || null
    }))
  }

  // Enhanced NFT scanning with collection support
  async scanNFTs(walletAddress, network) {
    const cacheKey = `nft_${network}_${walletAddress}`
    const cached = this.nftCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.nfts
    }

    try {
      const chainConfig = CHAIN_APIS[network.toLowerCase()]
      if (!chainConfig) {
        throw new Error(`No API configuration for network: ${network}`)
      }

      const provider = new ethers.JsonRpcProvider(web3Service.getAllNetworks()[chainConfig.name].rpcUrl)
      
      // Get NFT transfers
      const nftTransfers = await this.getNFTTransfers(walletAddress, chainConfig)
      
      // Group transfers by contract to identify collections
      const collections = new Map()
      
      for (const transfer of nftTransfers) {
        const contractAddress = transfer.contractAddress
        
        if (!collections.has(contractAddress)) {
          // Validate contract and determine standard
          const validation = await this.validateNFTContract(contractAddress, provider)
          if (!validation.isValid) continue
          
          collections.set(contractAddress, {
            standard: validation.standard,
            tokens: new Set()
          })
        }
        
        collections.get(contractAddress).tokens.add(transfer.tokenId)
      }

      // Fetch collection and token details
      const nfts = []
      
      for (const [contractAddress, collection] of collections) {
        try {
          const contract = new ethers.Contract(
            contractAddress,
            collection.standard === 'ERC721' 
              ? Object.values(METADATA_STANDARDS.ERC721)
              : Object.values(METADATA_STANDARDS.ERC1155),
            provider
          )

          // Get collection info
          const collectionInfo = await this.getCollectionInfo(contract, collection.standard)
          
          // Get token details
          for (const tokenId of collection.tokens) {
            try {
              // Check current ownership
              if (collection.standard === 'ERC721') {
                const owner = await contract.ownerOf(tokenId)
                if (owner.toLowerCase() !== walletAddress.toLowerCase()) continue
              } else {
                const balance = await contract.balanceOf(walletAddress, tokenId)
                if (balance.isZero()) continue
              }
              
              // Get token metadata
              const tokenURI = collection.standard === 'ERC721'
                ? await contract.tokenURI(tokenId)
                : await contract.uri(tokenId)
              
              const metadata = await this.getNFTMetadata(tokenURI, tokenId)
              
              if (metadata) {
                nfts.push({
                  contractAddress,
                  tokenId: tokenId.toString(),
                  standard: collection.standard,
                  collection: collectionInfo,
                  metadata,
                  network: chainConfig.name
                })
              }
            } catch (error) {
              console.error(`Error fetching token ${tokenId} details:`, error)
            }
          }
        } catch (error) {
          console.error(`Error processing collection ${contractAddress}:`, error)
        }
      }

      // Cache results
      this.nftCache.set(cacheKey, {
        nfts,
        timestamp: Date.now()
      })

      return nfts
    } catch (error) {
      console.error('NFT scan error:', error)
      return []
    }
  }

  // Get collection information
  async getCollectionInfo(contract, standard) {
    try {
      if (standard === 'ERC721') {
        const [name, symbol] = await Promise.all([
          contract.name(),
          contract.symbol()
        ])
        
        return { name, symbol }
      }
      
      // For ERC1155, try to get collection info from token URI
      const baseURI = await contract.uri(0)
      if (baseURI) {
        try {
          const metadata = await this.getNFTMetadata(baseURI, 0)
          return {
            name: metadata.name || 'Unknown Collection',
            symbol: ''
          }
        } catch {
          return {
            name: 'Unknown Collection',
            symbol: ''
          }
        }
      }
      
      return {
        name: 'Unknown Collection',
        symbol: ''
      }
    } catch (error) {
      console.error('Collection info fetch error:', error)
      return {
        name: 'Unknown Collection',
        symbol: ''
      }
    }
  }

  // Get NFT transfer events
  async getNFTTransfers(walletAddress, chainConfig) {
    try {
      const url = `${chainConfig.endpoint}?module=account&action=tokennfttx&address=${walletAddress}&startblock=0&endblock=latest&sort=desc&apikey=${chainConfig.key}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.status !== '1' && data.status !== '0') {
        throw new Error(`API Error: ${data.message || 'Unknown error'}`)
      }
      
      return Array.isArray(data.result) ? data.result : []
    } catch (error) {
      console.error('NFT transfers fetch error:', error)
      return []
    }
  }

  // NFT Transfer
  async transferNFT(fromAddress, toAddress, contractAddress, tokenId, amount = 1) {
    try {
      const network = web3Service.getCurrentNetwork()
      const provider = new ethers.JsonRpcProvider(network.rpcUrl)
      
      // Validate NFT contract
      const validation = await this.validateNFTContract(contractAddress, provider)
      if (!validation.isValid) {
        throw new Error('Invalid NFT contract')
      }
      
      const wallet = web3Service.getWalletByAddress(fromAddress)
      if (!wallet) {
        throw new Error('Wallet not found')
      }
      
      const contract = new ethers.Contract(
        contractAddress,
        validation.standard === 'ERC721' 
          ? [
              'function transferFrom(address from, address to, uint256 tokenId)',
              'function safeTransferFrom(address from, address to, uint256 tokenId)'
            ]
          : [
              'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)'
            ],
        wallet
      )
      
      let tx
      if (validation.standard === 'ERC721') {
        tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId)
      } else {
        tx = await contract.safeTransferFrom(
          fromAddress,
          toAddress,
          tokenId,
          amount,
          '0x'
        )
      }
      
      const receipt = await tx.wait()
      return receipt
    } catch (error) {
      console.error('NFT transfer error:', error)
      throw error
    }
  }
}

export default new TokenService() 