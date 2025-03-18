import { ethers } from 'ethers'
import { SignClient } from '@walletconnect/sign-client'
import { WalletConnectModal } from '@walletconnect/modal'

// WalletConnect yapılandırması
const WALLET_CONNECT_PROJECT_ID = '0fb0f3186c37206aac2c9790137ffd07'
const WALLET_CONNECT_METADATA = {
  name: 'Web3 Wallet Extension',
  description: 'A secure Web3 wallet extension',
  url: 'https://walletconnect.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const POPULAR_NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: '0x1',
    rpcUrl: 'https://eth.llamarpc.com',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
  },
  polygon: {
    name: 'Polygon',
    chainId: '0x89',
    rpcUrl: 'https://polygon.llamarpc.com',
    symbol: 'MATIC',
    explorer: 'https://polygonscan.com',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png'
  },
  bsc: {
    name: 'BNB Smart Chain',
    chainId: '0x38',
    rpcUrl: 'https://bsc.publicnode.com',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png'
  },
  optimism: {
    name: 'Optimism',
    chainId: '0xa',
    rpcUrl: 'https://optimism.publicnode.com',
    symbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png'
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: '0xa4b1',
    rpcUrl: 'https://arbitrum.llamarpc.com',
    symbol: 'ETH',
    explorer: 'https://arbiscan.io',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png'
  }
}

const TESTNET_NETWORKS = {
  sepolia: {
    name: 'Sepolia',
    chainId: '0xaa36a7',
    rpcUrl: 'https://rpc.sepolia.org',
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    isTestnet: true
  },
  goerli: {
    name: 'Goerli',
    chainId: '0x5',
    rpcUrl: 'https://goerli.infura.io/v3/',
    symbol: 'ETH',
    explorer: 'https://goerli.etherscan.io',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    isTestnet: true
  },
  mumbai: {
    name: 'Mumbai',
    chainId: '0x13881',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    symbol: 'MATIC',
    explorer: 'https://mumbai.polygonscan.com',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
    isTestnet: true
  },
  'bsc-testnet': {
    name: 'BSC Testnet',
    chainId: '0x61',
    rpcUrl: 'https://bsc-testnet.publicnode.com',
    symbol: 'BNB',
    explorer: 'https://testnet.bscscan.com',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
    isTestnet: true
  },
  'optimism-goerli': {
    name: 'Optimism Goerli',
    chainId: '0x1a4',
    rpcUrl: 'https://goerli.optimism.io',
    symbol: 'ETH',
    explorer: 'https://goerli-optimism.etherscan.io',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    isTestnet: true
  },
  'arbitrum-goerli': {
    name: 'Arbitrum Goerli',
    chainId: '0x66eed',
    rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
    symbol: 'ETH',
    explorer: 'https://goerli.arbiscan.io',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    isTestnet: true
  }
}

// Tüm ağları birleştir / Combine all networks
const NETWORKS = {
  ...POPULAR_NETWORKS,
  ...TESTNET_NETWORKS
}

// Hardware wallet support
const HW_TYPES = {
  LEDGER: 'ledger',
  TREZOR: 'trezor'
}

// Additional encryption layer
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY_LENGTH = 32

// DApp permissions
const DAPP_PERMISSIONS = {
  BASIC: 'basic', // View address
  FULL: 'full',   // Sign transactions
  CUSTOM: 'custom' // Custom permissions
}

// ENS Registry Contract
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const ENS_RESOLVER_INTERFACE = [
  'function name(bytes32 node) view returns (string)',
  'function addr(bytes32 node) view returns (address)',
  'function resolver(bytes32 node) view returns (address)'
]

class Web3Service {
  constructor() {
    this.wallets = new Map()
    this.currentNetwork = 'ethereum'
    this.provider = null
    this.hiddenWallets = new Set()
    this.password = null
    this.eventListeners = new Map()
    this.initFromStorage()
    this.hardwareWallets = new Map()
    this.encryptionKey = null
    this.backupData = null
    this.dappConnections = new Map()
    this.permissionRegistry = new Map()
    this.wcClient = null
    this.wcModal = null
    this.initWalletConnect()
    this.ensCache = new Map()
    this.transactionHistory = new Map()
    this.loadTransactionHistory()
    this.loadDAppConnections() // Load saved DApp connections
  }

  // LocalStorage'den verileri yükle / Load data from localStorage
  initFromStorage() {
    try {
      const walletData = localStorage.getItem('walletData')
      if (walletData) {
        const { mnemonic, accountName, selectedChains, isLoggedIn, password } = JSON.parse(walletData)
        if (isLoggedIn && mnemonic) {
          // Set password
          if (password) {
            this.password = password
          }

          // Ensure selectedChains is an array and has at least one network
          const chains = Array.isArray(selectedChains) && selectedChains.length > 0 
            ? selectedChains 
            : ['ethereum'] // Default to ethereum if no chains selected
          
          this.addWallet(mnemonic, accountName, chains, password)
          
          // Set current network to first selected chain
          this.currentNetwork = chains[0]
          this.provider = new ethers.JsonRpcProvider(NETWORKS[this.currentNetwork].rpcUrl)
        }
      }
    } catch (error) {
      console.error('LocalStorage initialization error:', error)
    }
  }

  // Çıkış yap / Logout
  logout() {
    localStorage.removeItem('walletData')
    this.wallets.clear()
    this.hiddenWallets.clear()
    this.password = null
  }

  // Cüzdanı gizle / Hide wallet
  hideWallet(address) {
    this.hiddenWallets.add(address)
    this.updateLocalStorage()
  }

  // Cüzdanı göster / Show wallet
  showWallet(address) {
    this.hiddenWallets.delete(address)
    this.updateLocalStorage()
  }

  // Cüzdan gizli mi kontrol et / Check if wallet is hidden
  isWalletHidden(address) {
    return this.hiddenWallets.has(address)
  }

  // LocalStorage'i güncelle / Update localStorage
  updateLocalStorage() {
    const walletData = localStorage.getItem('walletData')
    if (walletData) {
      const data = JSON.parse(walletData)
      data.hiddenWallets = Array.from(this.hiddenWallets)
      localStorage.setItem('walletData', JSON.stringify(data))
    }
  }

  // Yeni cüzdan oluştur veya import et / Create or import new wallet
  async addWallet(mnemonic = null, accountName = '', selectedChains = [], password = null) {
    try {
      let wallet
      
      if (mnemonic) {
        // Mnemonic ile import / Import with mnemonic
        wallet = ethers.Wallet.fromPhrase(mnemonic)
      } else {
        // Yeni cüzdan oluştur / Create new wallet
        wallet = ethers.Wallet.createRandom()
      }

      // Set password if provided
      if (password) {
        this.password = password
      }

      // Ensure selectedChains is an array and has at least one network
      const chains = Array.isArray(selectedChains) && selectedChains.length > 0 
        ? selectedChains 
        : ['ethereum'] // Default to ethereum if no chains selected

      // Set provider for first selected chain
      this.currentNetwork = chains[0]
      this.provider = new ethers.JsonRpcProvider(NETWORKS[this.currentNetwork].rpcUrl)
      
      // Connect wallet to provider
      const connectedWallet = wallet.connect(this.provider)
      
      // Cüzdanı kaydet / Save wallet
      this.wallets.set(wallet.address, {
        wallet: connectedWallet,
        accountName,
        selectedChains: chains
      })

      // Save to localStorage with password
      const walletData = {
        mnemonic: wallet.mnemonic?.phrase || mnemonic,
        accountName,
        address: wallet.address,
        privateKey: wallet.privateKey,
        selectedChains: chains,
        isLoggedIn: true,
        password: this.password
      }
      localStorage.setItem('walletData', JSON.stringify(walletData))
      
      return wallet
    } catch (error) {
      console.error('Add wallet error:', error)
      throw error
    }
  }

  // Şifreyi güncelle / Update password
  updatePassword(newPassword) {
    this.password = newPassword
    const walletData = localStorage.getItem('walletData')
    if (walletData) {
      const data = JSON.parse(walletData)
      data.password = newPassword
      localStorage.setItem('walletData', JSON.stringify(data))
    }
  }

  // Şifreyi kontrol et / Check password
  verifyPassword(password) {
    return this.password === password
  }

  // Şifre var mı kontrol et / Check if password exists
  hasPassword() {
    return !!this.password
  }

  // Ağı değiştir / Switch network
  async switchNetwork(networkName) {
    try {
      const network = NETWORKS[networkName.toLowerCase()]
      if (!network) {
        throw new Error('Network not found')
      }

      // Mevcut cüzdanı al
      const currentWallet = Array.from(this.wallets.values())[0]
      if (!currentWallet) {
        throw new Error('No wallet found')
      }

      // selectedChains kontrolü
      if (!Array.isArray(currentWallet.selectedChains)) {
        currentWallet.selectedChains = ['ethereum']
      }

      // Eğer ağ desteklenmiyorsa, selectedChains'e ekle
      if (!currentWallet.selectedChains.includes(networkName.toLowerCase())) {
        currentWallet.selectedChains.push(networkName.toLowerCase())
        // Güncellenmiş wallet bilgisini kaydet
        this.wallets.set(currentWallet.wallet.address, currentWallet)
        
        // LocalStorage'a kaydet
        const walletData = localStorage.getItem('walletData')
        if (walletData) {
          const data = JSON.parse(walletData)
          data.selectedChains = currentWallet.selectedChains
          localStorage.setItem('walletData', JSON.stringify(data))
        }
      }

      // Provider'ı güncelle
      this.provider = new ethers.JsonRpcProvider(network.rpcUrl)
      this.currentNetwork = networkName.toLowerCase()
      localStorage.setItem('currentNetwork', this.currentNetwork)

      return network
    } catch (error) {
      console.error('Switch network error:', error)
      throw error
    }
  }

  // Cüzdan bakiyesini getir / Get wallet balance
  async getBalance(address) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized')
      }

      if (!this.wallets.has(address)) {
        throw new Error('Wallet not found')
      }

      // Cüzdanın desteklediği ağları kontrol et
      const walletData = this.wallets.get(address)
      
      // Eğer selectedChains boşsa veya geçersizse, ethereum'u varsayılan olarak ekle
      if (!Array.isArray(walletData.selectedChains) || walletData.selectedChains.length === 0) {
        walletData.selectedChains = ['ethereum']
      }

      // Mevcut ağın ismini küçük harfe çevir
      const currentNetworkName = this.currentNetwork.toLowerCase()

      // Eğer ağ desteklenmiyorsa, varsayılan olarak ilk desteklenen ağa geç
      if (!walletData.selectedChains.includes(currentNetworkName)) {
        this.currentNetwork = walletData.selectedChains[0]
        this.provider = new ethers.JsonRpcProvider(NETWORKS[this.currentNetwork].rpcUrl)
      }

      // Ethers.js v6 ile balance sorgulama
      const balance = await this.provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Get balance error:', error)
      return '0'
    }
  }

  // Token bakiyesini getir / Get token balance
  async getTokenBalance(address, tokenAddress) {
    const walletData = this.wallets.get(address)
    if (!walletData || !walletData.selectedChains.includes(this.currentNetwork)) {
      throw new Error('Wallet not found or network not supported')
    }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address) view returns (uint256)'],
      walletData.wallet
    )

    const balance = await tokenContract.balanceOf(address)
    return balance.toString()
  }

  // Tüm cüzdanları getir / Get all wallets
  getAllWallets() {
    return Array.from(this.wallets.entries())
      .filter(([address]) => address) // Filter out entries without address
      .map(([address, data]) => ({
        address,
        accountName: data.accountName || 'Unnamed Wallet',
        selectedChains: Array.isArray(data.selectedChains) ? data.selectedChains : ['ethereum'],
        isHidden: this.isWalletHidden(address),
        isSystem: data.accountName === 'Fainera Wallet'
      }))
  }

  // Gizli cüzdanları getir / Get hidden wallets
  getHiddenWallets() {
    return this.getAllWallets().filter(wallet => this.isWalletHidden(wallet.address))
  }

  // Görünür cüzdanları getir / Get visible wallets
  getVisibleWallets() {
    return this.getAllWallets().filter(wallet => !this.isWalletHidden(wallet.address))
  }

  // Aktif ağı getir / Get current network
  getCurrentNetwork() {
    return NETWORKS[this.currentNetwork]
  }

  // Tüm ağları getir / Get all networks
  getAllNetworks() {
    return NETWORKS
  }

  // Popüler ağları getir / Get popular networks
  getPopularNetworks() {
    return POPULAR_NETWORKS
  }

  // Test ağlarını getir / Get testnet networks
  getTestnetNetworks() {
    return TESTNET_NETWORKS
  }

  // Enhanced encryption methods
  async generateEncryptionKey(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )
    
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    return salt
  }

  async encryptData(data) {
    if (!this.encryptionKey) throw new Error('Encryption key not set')
    
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encodedData = new TextEncoder().encode(JSON.stringify(data))
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.encryptionKey,
      encodedData
    )
    
    return {
      data: Array.from(new Uint8Array(encryptedData)),
      iv: Array.from(iv)
    }
  }

  async decryptData(encryptedData, iv) {
    if (!this.encryptionKey) throw new Error('Encryption key not set')
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      this.encryptionKey,
      new Uint8Array(encryptedData)
    )
    
    return JSON.parse(new TextDecoder().decode(decryptedData))
  }

  // Hardware wallet integration
  async connectHardwareWallet(type, path) {
    try {
      let wallet
      
      switch (type) {
        case HW_TYPES.LEDGER:
          // Implement Ledger connection
          wallet = await this.connectLedger(path)
          break
          
        case HW_TYPES.TREZOR:
          // Implement Trezor connection
          wallet = await this.connectTrezor(path)
          break
          
        default:
          throw new Error('Unsupported hardware wallet type')
      }
      
      this.hardwareWallets.set(wallet.address, {
        type,
        wallet,
        path
      })
      
      return wallet
    } catch (error) {
      console.error('Hardware wallet connection error:', error)
      throw error
    }
  }

  // Secure backup system
  async createWalletBackup(password) {
    try {
      const walletData = Array.from(this.wallets.entries()).map(([address, data]) => ({
        address,
        accountName: data.accountName,
        selectedChains: data.selectedChains,
        mnemonic: data.wallet.mnemonic?.phrase,
        privateKey: data.wallet.privateKey
      }))
      
      const salt = await this.generateEncryptionKey(password)
      const encryptedBackup = await this.encryptData(walletData)
      
      this.backupData = {
        ...encryptedBackup,
        salt: Array.from(salt),
        timestamp: Date.now()
      }
      
      return this.backupData
    } catch (error) {
      console.error('Backup creation error:', error)
      throw error
    }
  }

  async restoreWalletBackup(backupData, password) {
    try {
      await this.generateEncryptionKey(password)
      const decryptedData = await this.decryptData(backupData.data, backupData.iv)
      
      // Clear existing wallets
      this.wallets.clear()
      
      // Restore wallets
      for (const walletData of decryptedData) {
        await this.addWallet(
          walletData.mnemonic,
          walletData.accountName,
          walletData.selectedChains,
          password
        )
      }
      
      return Array.from(this.wallets.keys())
    } catch (error) {
      console.error('Backup restoration error:', error)
      throw error
    }
  }

  // EIP-712 implementation
  async signTypedData(domain, types, value) {
    try {
      const currentWallet = Array.from(this.wallets.values())[0]
      if (!currentWallet) {
        throw new Error('No wallet found')
      }

      const wallet = currentWallet.wallet
      
      // Validate domain and types according to EIP-712
      this.validateTypedData(domain, types)
      
      const signature = await wallet.signTypedData(domain, types, value)
      
      // Log signing event
      this.emit('signTypedData', {
        address: wallet.address,
        domain,
        types: Object.keys(types),
        signature
      })
      
      return signature
    } catch (error) {
      console.error('Sign typed data error:', error)
      throw error
    }
  }

  validateTypedData(domain, types) {
    // Domain validation
    const requiredDomainFields = ['name', 'version', 'chainId']
    requiredDomainFields.forEach(field => {
      if (!domain[field]) {
        throw new Error(`Missing required domain field: ${field}`)
      }
    })
    
    // Types validation
    if (!types || typeof types !== 'object') {
      throw new Error('Invalid types object')
    }
    
    Object.entries(types).forEach(([typeName, fields]) => {
      if (!Array.isArray(fields)) {
        throw new Error(`Invalid fields for type: ${typeName}`)
      }
      
      fields.forEach(field => {
        if (!field.name || !field.type) {
          throw new Error(`Invalid field in type ${typeName}`)
        }
      })
    })
  }

  // Initialize WalletConnect
  async initWalletConnect() {
    try {
      if (this.signClient) {
        return this.signClient
      }

      const signClient = await SignClient.init({
        projectId: WALLET_CONNECT_PROJECT_ID,
        metadata: WALLET_CONNECT_METADATA
      })

      this.signClient = signClient

      // Event listeners
      this.signClient.on('session_proposal', this.handleSessionProposal.bind(this))
      this.signClient.on('session_request', this.handleSessionRequest.bind(this))
      this.signClient.on('session_delete', this.handleSessionDelete.bind(this))
      this.signClient.on('session_event', this.handleSessionEvent.bind(this))

      return this.signClient
    } catch (error) {
      console.error('WalletConnect init error:', error)
      throw error
    }
  }

  // Mevcut cüzdanı getir
  getCurrentWallet() {
    const wallets = this.getVisibleWallets()
    return wallets.length > 0 ? this.wallets.get(wallets[0].address) : null
  }

  async handleSessionProposal(proposal) {
    try {
      const currentWallet = this.getCurrentWallet()
      if (!currentWallet) {
        throw new Error('No wallet available')
      }

      console.log('Handling session proposal:', proposal)
      console.log('Current wallet:', currentWallet.wallet.address)

      const { id, params } = proposal
      const { requiredNamespaces, optionalNamespaces } = params

      // Namespace yapılandırması
      const namespaces = {}
      
      // Required namespaces'i işle
      if (Object.keys(requiredNamespaces).length > 0) {
        Object.entries(requiredNamespaces).forEach(([key, requirements]) => {
          if (key.startsWith('eip155')) {
            const accounts = requirements.chains.map(chain => 
              `${chain}:${currentWallet.wallet.address.toLowerCase()}`
            )

            namespaces[key] = {
              accounts,
              methods: requirements.methods || [
                'eth_sendTransaction',
                'eth_signTransaction',
                'eth_sign',
                'personal_sign',
                'eth_signTypedData',
              ],
              events: requirements.events || [
                'chainChanged',
                'accountsChanged'
              ]
            }
          }
        })
      }

      // Optional namespaces'i işle
      if (optionalNamespaces && Object.keys(optionalNamespaces).length > 0) {
        Object.entries(optionalNamespaces).forEach(([key, requirements]) => {
          if (key.startsWith('eip155') && !namespaces[key]) {
            const accounts = requirements.chains.map(chain => 
              `${chain}:${currentWallet.wallet.address.toLowerCase()}`
            )

            namespaces[key] = {
              accounts,
              methods: requirements.methods || [
                'eth_sendTransaction',
                'eth_signTransaction',
                'eth_sign',
                'personal_sign',
                'eth_signTypedData',
              ],
              events: requirements.events || [
                'chainChanged',
                'accountsChanged'
              ]
            }
          }
        })
      }

      // Eğer hiç namespace yoksa, varsayılan olarak eip155:1 ekle
      if (Object.keys(namespaces).length === 0) {
        namespaces['eip155:1'] = {
          accounts: [`eip155:1:${currentWallet.wallet.address.toLowerCase()}`],
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
          ],
          events: [
            'chainChanged',
            'accountsChanged'
          ]
        }
      }

      console.log('Approving session with namespaces:', namespaces)

      // Session'ı onayla
      const { acknowledged } = await this.signClient.approve({
        id,
        namespaces
      })

      // Onaylamayı bekle
      await acknowledged()

      // Session'ı kaydet (metadata kontrolü ile)
      if (params.proposer?.metadata) {
        this.saveDAppConnection({
          peer: params.proposer,
          topic: id,
          namespaces,
          timestamp: Date.now()
        })
      } else {
        console.warn('Session proposer metadata is missing')
      }

      return { success: true }

    } catch (error) {
      console.error('Session proposal handling error:', error)
      
      // Session'ı reddet
      if (proposal?.id) {
        await this.signClient.reject({
          id: proposal.id,
          reason: {
            code: 4001,
            message: error.message
          }
        })
      }
      
      throw error
    }
  }

  async handleSessionRequest(event) {
    try {
      const { topic, params, id } = event
      const { request } = params
      const { method, params: methodParams } = request

      console.log('Session request:', { method, params: methodParams })

      // Mevcut cüzdanı al
      const currentWallet = this.getCurrentWallet()
      if (!currentWallet) {
        throw new Error('No wallet available')
      }

      let result
      switch (method) {
        case 'eth_sendTransaction':
          const tx = methodParams[0]
          // Provider'ı doğru ağa ayarla
          const chainId = await this.provider.getNetwork().then(n => n.chainId)
          if (parseInt(tx.chainId, 16) !== chainId) {
            await this.switchNetwork(Object.keys(NETWORKS).find(key => 
              parseInt(NETWORKS[key].chainId, 16) === parseInt(tx.chainId, 16)
            ))
          }
          result = await currentWallet.wallet.sendTransaction(tx)
          break

        case 'eth_sign':
        case 'personal_sign':
          const message = methodParams[0]
          const address = methodParams[1]?.toLowerCase() || currentWallet.wallet.address.toLowerCase()
          
          if (address !== currentWallet.wallet.address.toLowerCase()) {
            throw new Error('Address mismatch')
          }
          
          result = await currentWallet.wallet.signMessage(
            method === 'personal_sign' ? ethers.getBytes(message) : message
          )
          break

        case 'eth_signTypedData':
        case 'eth_signTypedData_v4':
          const [signerAddress, typedData] = methodParams
          if (signerAddress.toLowerCase() !== currentWallet.wallet.address.toLowerCase()) {
            throw new Error('Address mismatch')
          }
          
          const parsedData = JSON.parse(typedData)
          result = await currentWallet.wallet.signTypedData(
            parsedData.domain,
            parsedData.types,
            parsedData.message
          )
          break

        default:
          throw new Error(`Unsupported method: ${method}`)
      }

      // Sonucu gönder
      await this.signClient.respond({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          result
        }
      })

      console.log('Request completed successfully:', { method, result })
    } catch (error) {
      console.error('Session request error:', error)
      await this.signClient.respond({
        topic: event.topic,
        response: {
          id: event.id,
          jsonrpc: '2.0',
          error: {
            code: 4001,
            message: error.message
          }
        }
      })
    }
  }

  async handleSessionDelete(event) {
    try {
      const { topic } = event
      const session = await this.signClient.session.get(topic)
      
      // DApp bağlantısını kaldır
      this.disconnectDApp(session.peer.metadata.url)
      
      // Event yayınla
      this.emit('session_deleted', {
        origin: session.peer.metadata.url
      })
    } catch (error) {
      console.error('Session delete error:', error)
    }
  }

  async handleSessionEvent(event) {
    try {
      const { topic, params } = event
      const { event: eventName, data } = params
      
      switch (eventName) {
        case 'chainChanged':
          this.emit('chain_changed', data)
          break
        case 'accountsChanged':
          this.emit('accounts_changed', data)
          break
        default:
          console.warn('Unknown session event:', eventName)
      }
    } catch (error) {
      console.error('Session event error:', error)
    }
  }

  async connectToWalletConnect(uri) {
    try {
      console.log('Connecting to WalletConnect with URI:', uri)
      
      if (!uri.startsWith('wc:')) {
        throw new Error('Invalid WalletConnect URI format')
      }

      // Initialize WalletConnect if not already initialized
      if (!this.signClient) {
        await this.initWalletConnect()
      }

      // Get current wallet
      const currentWallet = this.getCurrentWallet()
      if (!currentWallet) {
        throw new Error('No wallet available')
      }

      console.log('Current wallet:', currentWallet.wallet.address)

      // Check if already connected
      const sessions = this.signClient.session.values
      if (sessions.length > 0) {
        console.log('Active sessions found:', sessions)
      }

      // Pair with URI
      console.log('Attempting to pair with URI...')
      const pairResult = await this.signClient.pair({ uri })
      console.log('Pair result:', pairResult)

      return {
        success: true,
        message: 'Successfully initiated WalletConnect pairing'
      }
    } catch (error) {
      console.error('WalletConnect connection error:', error)
      throw new Error(`Connection failed: ${error.message}`)
    }
  }

  // DApp connection management
  async connectDApp(origin, permissions = DAPP_PERMISSIONS.BASIC) {
    try {
      // Check if connection exists
      if (this.dappConnections.has(origin)) {
        return this.dappConnections.get(origin)
      }

      // Create new connection
      const connection = {
        id: Date.now().toString(),
        origin,
        permissions,
        connectedAt: Date.now(),
        lastActive: Date.now()
      }

      // Store connection
      this.dappConnections.set(origin, connection)
      this.saveDAppConnections()

      // Emit connection event
      this.emit('dapp_connected', connection)

      return connection
    } catch (error) {
      console.error('DApp connection error:', error)
      throw error
    }
  }

  async disconnectDApp(origin) {
    try {
      console.log('Disconnecting dApp - Input origin:', origin)

      // Get all active sessions using getAll()
      const sessions = await this.signClient.session.getAll()
      console.log('Active sessions:', sessions)

      let disconnectedAny = false

      for (const session of sessions) {
        console.log('Checking session:', {
          topic: session.topic,
          peer: session.peer,
          expiry: session.expiry
        })

        // Try to match session with origin
        const sessionUrl = session.peer.metadata?.url
        const sessionName = session.peer.metadata?.name

        console.log('Session matching:', {
          sessionUrl,
          sessionName,
          origin,
          isMatch: sessionUrl?.includes(origin) || sessionName?.includes(origin)
        })

        if (sessionUrl?.includes(origin) || sessionName?.includes(origin)) {
          try {
            console.log('Attempting to disconnect session:', session.topic)
            await this.signClient.disconnect({
              topic: session.topic,
              reason: {
                code: 6000,
                message: 'User disconnected'
              }
            })
            console.log('Successfully disconnected session:', session.topic)
            disconnectedAny = true
          } catch (error) {
            console.error('Error disconnecting session:', {
              topic: session.topic,
              error: error.message
            })
          }
        }
      }

      // Remove from dappConnections
      const connections = this.loadDAppConnections()
      if (connections[origin]) {
        console.log('Removing connection from storage:', origin)
        delete connections[origin]
        localStorage.setItem('dappConnections', JSON.stringify(connections))
      }

      if (disconnectedAny) {
        this.emit('dappDisconnected', { origin })
      } else {
        console.log('No matching sessions found for origin:', origin)
      }

      return true
    } catch (error) {
      console.error('Disconnect error:', error)
      throw error
    }
  }

  // Permission management
  hasPermission(origin, permission) {
    const connection = this.dappConnections.get(origin)
    if (!connection) return false

    switch (permission) {
      case DAPP_PERMISSIONS.BASIC:
        return true
      case DAPP_PERMISSIONS.FULL:
        return connection.permissions === DAPP_PERMISSIONS.FULL
      case DAPP_PERMISSIONS.CUSTOM:
        return this.permissionRegistry.has(`${origin}_${permission}`)
      default:
        return false
    }
  }

  async requestPermission(origin, permission, metadata = {}) {
    try {
      const connection = this.dappConnections.get(origin)
      if (!connection) {
        throw new Error('DApp not connected')
      }

      // Create permission request
      const request = {
        id: Date.now().toString(),
        origin,
        permission,
        metadata,
        timestamp: Date.now()
      }

      // Emit permission request event
      this.emit('permission_request', request)

      // Return promise that resolves when user accepts/rejects
      return new Promise((resolve, reject) => {
        this.permissionRegistry.set(request.id, { resolve, reject })
      })
    } catch (error) {
      console.error('Permission request error:', error)
      throw error
    }
  }

  // Save DApp connections to localStorage
  saveDAppConnections() {
    const connections = Array.from(this.dappConnections.entries())
    localStorage.setItem('dappConnections', JSON.stringify(connections))
  }

  // Load DApp connections from localStorage
  loadDAppConnections() {
    try {
      const saved = localStorage.getItem('dappConnections')
      if (saved) {
        const connections = JSON.parse(saved)
        connections.forEach(([origin, data]) => {
          if (origin && data) {
            this.dappConnections.set(origin, {
              ...data,
              lastActive: data.lastActive || Date.now()
            })
          }
        })
      }
    } catch (error) {
      console.error('Load DApp connections error:', error)
    }
  }

  // Enhanced provider request method with DApp permissions
  async request({ method, params = [], origin = null }) {
    try {
      // Check if origin is provided and has necessary permissions
      if (origin) {
        const requiredPermission = this.getRequiredPermissionForMethod(method)
        if (!this.hasPermission(origin, requiredPermission)) {
          throw new Error('Permission denied')
        }
      }

      // Execute request
      switch (method) {
        case 'eth_requestAccounts':
          return [Array.from(this.wallets.values())[0]?.wallet.address]
        
        case 'eth_accounts':
          return this.getAllWallets().map(w => w.address)
        
        case 'eth_chainId':
          return NETWORKS[this.currentNetwork].chainId
        
        case 'eth_signTypedData_v4':
          const [address, typedData] = params
          const { domain, types, value } = JSON.parse(typedData)
          return await this.signTypedData(domain, types, value)
        
        case 'wallet_switchEthereumChain':
          const [{ chainId }] = params
          const network = Object.entries(NETWORKS).find(([_, net]) => net.chainId === chainId)?.[0]
          if (network) {
            await this.switchNetwork(network)
            this.emit('chainChanged', chainId)
            return null
          }
          throw new Error('Unsupported chain')
        
        case 'wallet_addEthereumChain':
          if (!this.hasPermission(origin, DAPP_PERMISSIONS.FULL)) {
            throw new Error('Permission denied')
          }
          return await this.addCustomNetwork(params[0])
        
        case 'wallet_watchAsset':
          if (!this.hasPermission(origin, DAPP_PERMISSIONS.FULL)) {
            throw new Error('Permission denied')
          }
          return await this.addCustomToken(params[0])
        
        case 'wallet_requestPermissions':
          const [permissions] = params
          return await this.requestPermission(origin, permissions.type, permissions.metadata)

        case 'wallet_getPermissions':
          return this.getPermissionsForOrigin(origin)
        
        default:
          throw new Error(`Unsupported method: ${method}`)
      }
    } catch (error) {
      console.error('Provider request error:', error)
      throw error
    }
  }

  // Helper method to determine required permission for each method
  getRequiredPermissionForMethod(method) {
    const fullPermissionMethods = [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'wallet_addEthereumChain',
      'wallet_watchAsset'
    ]

    if (fullPermissionMethods.includes(method)) {
      return DAPP_PERMISSIONS.FULL
    }

    return DAPP_PERMISSIONS.BASIC
  }

  // Get permissions for origin
  getPermissionsForOrigin(origin) {
    const connection = this.dappConnections.get(origin)
    if (!connection) return []

    const permissions = [{ type: DAPP_PERMISSIONS.BASIC }]
    
    if (connection.permissions === DAPP_PERMISSIONS.FULL) {
      permissions.push({ type: DAPP_PERMISSIONS.FULL })
    }

    // Add custom permissions
    Array.from(this.permissionRegistry.entries())
      .filter(([key]) => key.startsWith(origin))
      .forEach(([key]) => {
        const [_, permission] = key.split('_')
        permissions.push({ type: permission })
      })

    return permissions
  }

  // Custom network management (EIP-3085)
  async addCustomNetwork(chainParams) {
    try {
      const {
        chainId,
        chainName,
        rpcUrls,
        nativeCurrency,
        blockExplorerUrls
      } = chainParams
      
      // Validate parameters
      if (!chainId || !chainName || !rpcUrls || !rpcUrls[0]) {
        throw new Error('Invalid chain parameters')
      }
      
      // Add to networks
      const networkKey = chainName.toLowerCase().replace(/\s+/g, '-')
      NETWORKS[networkKey] = {
        name: chainName,
        chainId,
        rpcUrl: rpcUrls[0],
        symbol: nativeCurrency?.symbol || 'ETH',
        explorer: blockExplorerUrls?.[0],
        isCustom: true
      }
      
      // Save to localStorage
      this.saveNetworks()
      
      return true
    } catch (error) {
      console.error('Add custom network error:', error)
      throw error
    }
  }

  // Custom token management (EIP-747)
  async addCustomToken(asset) {
    try {
      const {
        address,
        symbol,
        decimals,
        image
      } = asset
      
      // Validate token contract
      const provider = new ethers.JsonRpcProvider(NETWORKS[this.currentNetwork].rpcUrl)
      const isValid = await this.validateTokenContract(address, provider)
      
      if (!isValid) {
        throw new Error('Invalid token contract')
      }
      
      // Add to token list
      const token = {
        address,
        symbol,
        decimals,
        logo: image,
        network: this.currentNetwork,
        isCustom: true
      }
      
      // Save to localStorage
      this.saveCustomTokens(token)
      
      return true
    } catch (error) {
      console.error('Add custom token error:', error)
      throw error
    }
  }

  // Event handling methods
  on(eventName, handler) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set())
    }
    this.eventListeners.get(eventName).add(handler)
  }

  removeListener(eventName, handler) {
    const listeners = this.eventListeners.get(eventName)
    if (listeners) {
      listeners.delete(handler)
    }
  }

  emit(eventName, data) {
    const listeners = this.eventListeners.get(eventName)
    if (listeners) {
      listeners.forEach(handler => handler(data))
    }
  }

  // ENS Resolution
  async resolveENS(ensName) {
    try {
      // Check cache first
      if (this.ensCache.has(ensName)) {
        const { address, timestamp } = this.ensCache.get(ensName)
        // Cache for 1 hour
        if (Date.now() - timestamp < 3600000) {
          return address
        }
      }

      const provider = new ethers.JsonRpcProvider(NETWORKS.ethereum.rpcUrl)
      const address = await provider.resolveName(ensName)

      if (address) {
        this.ensCache.set(ensName, {
          address,
          timestamp: Date.now()
        })
      }

      return address
    } catch (error) {
      console.error('ENS resolution error:', error)
      return null
    }
  }

  async lookupENS(address) {
    try {
      const provider = new ethers.JsonRpcProvider(NETWORKS.ethereum.rpcUrl)
      const name = await provider.lookupAddress(address)
      
      if (name) {
        this.ensCache.set(address, {
          name,
          timestamp: Date.now()
        })
      }

      return name
    } catch (error) {
      console.error('ENS lookup error:', error)
      return null
    }
  }

  // Transaction History
  async addTransaction(tx) {
    try {
      const walletAddress = tx.from.toLowerCase()
      
      if (!this.transactionHistory.has(walletAddress)) {
        this.transactionHistory.set(walletAddress, [])
      }

      const transactions = this.transactionHistory.get(walletAddress)
      
      // Add network info
      const network = this.getCurrentNetwork()
      tx.network = {
        name: network.name,
        chainId: network.chainId
      }

      // Add ENS names if available
      if (network.name === 'Ethereum') {
        tx.fromENS = await this.lookupENS(tx.from)
        tx.toENS = await this.lookupENS(tx.to)
      }

      // Add timestamp
      tx.timestamp = Date.now()

      // Add to history
      transactions.unshift(tx)

      // Keep only last 100 transactions
      if (transactions.length > 100) {
        transactions.pop()
      }

      this.saveTransactionHistory()
      
      // Emit event
      this.emit('transaction_added', tx)

      return tx
    } catch (error) {
      console.error('Add transaction error:', error)
      throw error
    }
  }

  getTransactionHistory(address, options = {}) {
    try {
      const {
        network = null,
        limit = 50,
        offset = 0,
        type = null // 'sent', 'received', or null for all
      } = options

      const walletAddress = address.toLowerCase()
      let transactions = this.transactionHistory.get(walletAddress) || []

      // Apply filters
      if (network) {
        transactions = transactions.filter(tx => 
          tx.network.name.toLowerCase() === network.toLowerCase()
        )
      }

      if (type === 'sent') {
        transactions = transactions.filter(tx => 
          tx.from.toLowerCase() === walletAddress
        )
      } else if (type === 'received') {
        transactions = transactions.filter(tx => 
          tx.to.toLowerCase() === walletAddress
        )
      }

      // Apply pagination
      return transactions.slice(offset, offset + limit)
    } catch (error) {
      console.error('Get transaction history error:', error)
      return []
    }
  }

  async fetchTransactionHistory(address, network) {
    try {
      const chainConfig = CHAIN_APIS[network.toLowerCase()]
      if (!chainConfig) {
        throw new Error(`API configuration not found for network: ${network}`)
      }
      // ... existing code ...
    } catch (error) {
      console.error('Fetch transaction history error:', error)
      throw error
    }
  }

  loadTransactionHistory() {
    try {
      const saved = localStorage.getItem('transactionHistory')
      if (saved) {
        const transactions = JSON.parse(saved)
        transactions.forEach(([address, txs]) => {
          this.transactionHistory.set(address.toLowerCase(), txs)
        })
      }
    } catch (error) {
      console.error('Load transaction history error:', error)
    }
  }

  saveTransactionHistory() {
    try {
      const transactions = Array.from(this.transactionHistory.entries())
      localStorage.setItem('transactionHistory', JSON.stringify(transactions))
    } catch (error) {
      console.error('Save transaction history error:', error)
    }
  }

  // DApp bağlantı yönetimi metodları
  getConnectedDapps() {
    return Array.from(this.dappConnections.entries()).map(([origin, data]) => ({
      origin,
      ...data,
      isConnected: true
    }))
  }

  saveDAppConnection(connection) {
    try {
      const { peer, topic, namespaces, timestamp } = connection
      const origin = peer.metadata?.url || peer.metadata?.name

      if (!origin) {
        console.warn('DApp connection missing origin:', connection)
        return
      }

      this.dappConnections.set(origin, {
        peer,
        topic,
        namespaces,
        timestamp,
        lastActive: Date.now()
      })

      this.saveDAppConnections()
    } catch (error) {
      console.error('Save DApp connection error:', error)
    }
  }

  updateDAppConnection(origin, data) {
    try {
      const existing = this.dappConnections.get(origin)
      if (existing) {
        this.dappConnections.set(origin, {
          ...existing,
          ...data,
          lastActive: Date.now()
        })
        this.saveDAppConnections()
      }
    } catch (error) {
      console.error('Update DApp connection error:', error)
    }
  }

  getDAppConnection(origin) {
    return this.dappConnections.get(origin)
  }

  // View type kontrolü
  isTabView() {
    try {
      // Yeni pencere kontrolü
      if (window.opener) {
        return true;
      }
      
      // URL parametresi kontrolü
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('view') === 'tab') {
        return true;
      }

      // Genişlik kontrolü
      return window.innerWidth >= 800;
    } catch (error) {
      console.error('isTabView check error:', error);
      return false;
    }
  }
}

// Create and export a single instance
const web3Service = new Web3Service()
export default web3Service