import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ethers } from 'ethers'
import web3Service from '../services/web3Service'
import { useLanguage } from '../contexts/LanguageContext'

const HD_PATHS = {
  ethereum: "m/44'/60'/0'/0/0",
  bsc: "m/44'/60'/0'/0/0",
  polygon: "m/44'/60'/0'/0/0",
  optimism: "m/44'/60'/0'/0/0",
  arbitrum: "m/44'/60'/0'/0/0"
}

/**
 * Yeni Cüzdan Oluşturma Bileşeni
 * Create New Wallet Component
 */
const CreateWallet = () => {
  const navigate = useNavigate()
  const { translate } = useLanguage()
  const [step, setStep] = useState(1)
  const [accountName, setAccountName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [hdPath, setHdPath] = useState(HD_PATHS.ethereum)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [verificationWords, setVerificationWords] = useState([])
  const [selectedWords, setSelectedWords] = useState([])
  const [selectedChains, setSelectedChains] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Yeni mnemonic oluştur / Generate new mnemonic
  useEffect(() => {
    const wallet = ethers.Wallet.createRandom()
    setMnemonic(wallet.mnemonic.phrase)
  }, [])

  // Doğrulama için kelimeleri karıştır / Shuffle words for verification
  useEffect(() => {
    if (step === 5) {
      const words = mnemonic.split(' ')
      const selectedIndexes = []
      
      // 12 kelimeden rastgele 4 tanesini seç / Select 4 random words from 12 words
      while (selectedIndexes.length < 4) {
        const index = Math.floor(Math.random() * words.length)
        if (!selectedIndexes.includes(index)) {
          selectedIndexes.push(index)
        }
      }
      
      // Seçilen kelimeleri sırala / Sort selected words by index
      const sortedIndexes = selectedIndexes.sort((a, b) => a - b)
      setVerificationWords(sortedIndexes.map(index => ({
        word: words[index],
        index: index
      })))
      setSelectedWords(new Array(4).fill(''))
      setError('')
    }
  }, [step, mnemonic])

  // Kelimeleri kopyala / Copy words
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const verifyWords = () => {
    const isCorrect = verificationWords.every((item, index) => 
      item.word.toLowerCase() === selectedWords[index].toLowerCase().trim()
    )

    if (!isCorrect) {
      setError(translate('auth.wordsNotMatch'))
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 5 && !verifyWords()) return
    if (step === 6) {
      saveWallet()
      return
    }
    setStep(step + 1)
  }

  const saveWallet = async () => {
    try {
      // Ensure at least one chain is selected
      if (selectedChains.length === 0) {
        setSelectedChains(['ethereum']) // Default to ethereum if no chains selected
      }

      // Create wallet instance
      const wallet = await web3Service.addWallet(mnemonic, accountName, selectedChains, password)
      
      // Save complete wallet data to localStorage with all necessary information
      const walletData = {
        mnemonic: wallet.mnemonic?.phrase || mnemonic,
        accountName,
        address: wallet.address,
        privateKey: wallet.privateKey,
        selectedChains,
        isLoggedIn: true,
        password,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        hdPath,
        walletType: 'hd', // HD Wallet type
        networks: selectedChains.reduce((acc, chain) => {
          acc[chain] = {
            ...HD_PATHS[chain],
            isActive: true,
            addedAt: Date.now()
          }
          return acc
        }, {}),
        settings: {
          autoLockTimeout: 60 * 60 * 1000, // 1 saat (default)
          language: localStorage.getItem('language') || 'en',
          currency: localStorage.getItem('currency') || 'USD'
        }
      }

      localStorage.setItem('walletData', JSON.stringify(walletData))
      console.log('Wallet created and saved successfully:', {
        address: wallet.address,
        chains: selectedChains,
        accountName
      })
      
      if (web3Service.isTabView()) {
        window.close()
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Wallet creation error:', err)
      setError(err.message)
    }
  }

  return (
    <div className="w-[360px] h-[600px] bg-gradient-to-br from-green-50 via-green-100 to-emerald-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-gray-600 hover:text-gray-800"
            >
              ← {translate('common.back')}
            </button>
          )}
          <div className="flex-1 flex justify-center">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full ${
                    s === step ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Step 1: Account Name */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {translate('auth.accountName')}
              </h2>
              <p className="text-sm text-gray-600">
                {translate('auth.enterAccountName')}
              </p>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={translate('auth.accountName')}
              />
            </div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {translate('auth.createPassword')}
              </h2>
              <p className="text-sm text-gray-600">
                {translate('auth.setPassword')}
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={translate('auth.password')}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={translate('auth.confirmPassword')}
              />
            </div>
          )}

          {/* Step 3: Mnemonic Display */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {translate('auth.mnemonicPhrase')}
              </h2>
              <p className="text-sm text-red-500 font-medium">
                {translate('auth.writeMnemonic')}
              </p>
              <div className="relative">
                <div className={`w-full p-4 bg-gray-50 rounded-lg ${!showMnemonic && 'blur-sm'}`}>
                  <div className="grid grid-cols-3 gap-3">
                    {mnemonic.split(' ').map((word, index) => (
                      <div key={index} className="text-sm text-gray-800">
                        {index + 1}. {word}
                      </div>
                    ))}
                  </div>
                </div>
                {!showMnemonic && (
                  <button
                    onClick={() => setShowMnemonic(true)}
                    className="absolute inset-0 w-full h-full bg-black/50 text-white rounded-lg"
                  >
                    {translate('auth.showPhrase')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: HD Path */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {translate('auth.hdPathTitle')}
              </h2>
              <p className="text-sm text-gray-600">
                {translate('auth.hdPathDesc')}
              </p>
              <div className="space-y-2">
                {Object.entries(HD_PATHS).map(([chain, path]) => (
                  <div key={chain} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-gray-800 capitalize">{chain}</span>
                    <span className="text-gray-600">{path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Verify Mnemonic */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {translate('auth.verifyPhrase')}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {translate('auth.enterSeedPhrase')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {verificationWords.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-semibold">
                      {item.index + 1}
                    </div>
                    <input
                      type="text"
                      value={selectedWords[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase()
                        if (/^[a-z]*$/.test(value)) {
                          const newWords = [...selectedWords]
                          newWords[index] = value
                          setSelectedWords(newWords)
                        }
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={translate('auth.enterWord')}
                    />
                  </div>
                ))}
              </div>
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
            </div>
          )}

          {/* Step 6: Select Chains */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {translate('auth.selectChains')}
              </h2>
              <p className="text-sm text-gray-600">
                {translate('auth.selectChainsDesc')}
              </p>
              <div className="space-y-2">
                {Object.keys(HD_PATHS).map((chain) => (
                  <div
                    key={chain}
                    onClick={() => {
                      setSelectedChains(prev =>
                        prev.includes(chain)
                          ? prev.filter(c => c !== chain)
                          : [...prev, chain]
                      )
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transform hover:-translate-y-0.5 transition-all duration-200
                      ${selectedChains.includes(chain) ? 'bg-emerald-50 border-2 border-emerald-500' : 'bg-white border border-gray-200'}`}
                  >
                    <span className="text-gray-800 capitalize">{chain}</span>
                    <div className={`w-5 h-5 rounded-full border-2 
                      ${selectedChains.includes(chain)
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-gray-300'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleNext}
            disabled={
              (step === 1 && !accountName) ||
              (step === 2 && (!password || password !== confirmPassword)) ||
              (step === 3 && !showMnemonic) ||
              (step === 5 && (selectedWords.length !== verificationWords.length || selectedWords.includes(''))) ||
              (step === 6 && selectedChains.length === 0)
            }
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            {step === 6 ? translate('common.complete') : translate('common.next')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateWallet 