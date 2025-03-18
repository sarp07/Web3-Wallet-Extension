import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import web3Service from '../services/web3Service'
import { ethers } from 'ethers'
import { useLanguage } from '../contexts/LanguageContext'

/**
 * Cüzdan İçe Aktarma Bileşeni
 * Import Wallet Component
 */
const ImportWallet = () => {
  const navigate = useNavigate()
  const { translate } = useLanguage()
  const [importType, setImportType] = useState('mnemonic')
  const [mnemonic, setMnemonic] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [selectedChains, setSelectedChains] = useState(['ethereum'])

  const handleImport = async () => {
    try {
      setError('')

      // Şifre kontrolü / Password validation
      if (password !== confirmPassword) {
        throw new Error(translate('auth.wordsNotMatch'))
      }

      let wallet
      if (importType === 'mnemonic') {
        // Mnemonic'i temizle ve kontrol et / Clean and validate mnemonic
        const cleanMnemonic = mnemonic.trim().toLowerCase()
        const words = cleanMnemonic.split(/\s+/)
        
        if (words.length !== 12 && words.length !== 24) {
          throw new Error(translate('auth.invalidMnemonicLength'))
        }

        // Cüzdanı import et / Import wallet
        wallet = await web3Service.addWallet(cleanMnemonic, 'Imported Wallet', selectedChains, password)
      } else {
        // Private key formatını kontrol et / Validate private key format
        if (!privateKey.match(/^(0x)?[0-9a-fA-F]{64}$/)) {
          throw new Error(translate('auth.invalidPrivateKey'))
        }

        // Private key'i normalize et / Normalize private key
        const normalizedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
        
        // Cüzdanı import et / Import wallet
        wallet = new ethers.Wallet(normalizedKey)
        await web3Service.addWallet(wallet.mnemonic.phrase, 'Imported Wallet', selectedChains, password)
      }

      // Save complete wallet data to localStorage
      localStorage.setItem('walletData', JSON.stringify({
        mnemonic: importType === 'mnemonic' ? mnemonic : wallet.mnemonic.phrase,
        accountName: 'Imported Wallet',
        address: wallet.address,
        privateKey: wallet.privateKey,
        selectedChains,
        isLoggedIn: true,
        password
      }))

      // Import işlemi başarılı olduğunda
      if (web3Service.isTabView()) {
        // Tab view'daysa, pencereyi kapat ve popup'a dön
        window.close();
      } else {
        // Normal popup view'daysa dashboard'a yönlendir
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="w-[360px] h-[600px] bg-gradient-to-br from-green-50 via-green-100 to-emerald-50">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center p-4 border-b border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← {translate('common.back')}
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm text-gray-600">
              {translate('auth.importWallet')}
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-4">
          {/* Import type selector */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setImportType('mnemonic')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all duration-200 ${
                importType === 'mnemonic'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-500'
              }`}
            >
              {translate('auth.mnemonicPhrase')}
            </button>
            <button
              onClick={() => setImportType('privateKey')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all duration-200 ${
                importType === 'privateKey'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-500'
              }`}
            >
              {translate('auth.privateKey')}
            </button>
          </div>

          {/* Mnemonic or Private Key input */}
          {importType === 'mnemonic' ? (
            <div className="space-y-2">
              <label className="text-sm text-gray-600">
                {translate('auth.enterSeedPhrase')}
              </label>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={translate('auth.mnemonicPlaceholder')}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm text-gray-600">
                {translate('auth.enterPrivateKey')}
              </label>
              <input
                type="text"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0x..."
              />
            </div>
          )}

          {/* Password inputs */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600">
              {translate('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">
              {translate('auth.confirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 font-medium">{error}</p>
          )}

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={
              !password ||
              !confirmPassword ||
              (importType === 'mnemonic' ? !mnemonic : !privateKey)
            }
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            {translate('auth.importWallet')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportWallet 