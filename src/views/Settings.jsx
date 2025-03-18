import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useLock } from '../contexts/LockContext'
import { useNotification } from '../contexts/NotificationContext'
import web3Service from '../services/web3Service'

const Settings = () => {
  const navigate = useNavigate()
  const { translate, currentLanguage, changeLanguage } = useLanguage()
  const { updateLockTimeout, getLockTimeoutMinutes } = useLock()
  const { showNotification } = useNotification()
  
  const [selectedTimeout, setSelectedTimeout] = useState(getLockTimeoutMinutes)
  const [isTestnetEnabled, setIsTestnetEnabled] = useState(() => 
    localStorage.getItem('testnetEnabled') === 'true'
  )
  const [selectedCurrency, setSelectedCurrency] = useState(() => 
    localStorage.getItem('currency') || 'USD'
  )
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [password, setPassword] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [activeSection, setActiveSection] = useState('general')

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ko', name: '한국어' },
    { code: 'ja', name: '日本語' },
    { code: 'es', name: 'Español' },
    { code: 'it', name: 'Italiano' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'pt', name: 'Português' }
  ]

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ]

  const timeoutOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' }
  ]

  const handleLockTimeoutChange = (minutes) => {
    try {
      setSelectedTimeout(minutes)
      updateLockTimeout(minutes)
      showNotification(translate('notifications.autoLockTimeoutUpdated'), 'success')
    } catch (error) {
      console.error('Auto-lock timeout update error:', error)
      showNotification(translate('notifications.error'), 'error')
    }
  }

  const handleTestnetToggle = () => {
    const newValue = !isTestnetEnabled
    setIsTestnetEnabled(newValue)
    localStorage.setItem('testnetEnabled', newValue)
    showNotification(
      translate(newValue ? 'notifications.testnetEnabled' : 'notifications.testnetDisabled'),
      'success'
    )
  }

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency)
    localStorage.setItem('currency', currency)
    showNotification(translate('notifications.currencyUpdated'), 'success')
  }

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode)
    showNotification('Language updated successfully', 'success')
  }

  const handleLogout = () => {
    web3Service.logout()
    navigate('/')
  }

  const sections = [
    {
      id: 'general',
      title: translate('settings.general'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'account',
      title: translate('settings.account'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'security',
      title: translate('settings.security'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      id: 'networks',
      title: translate('settings.networks'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'about',
      title: translate('settings.about'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  const handleDeleteAccount = () => {
    if (window.confirm(translate('settings.deleteAccountWarning'))) {
      showNotification(translate('settings.deletingAccount'), 'warning', 2000)
      setTimeout(() => {
        web3Service.logout()
        navigate('/')
      }, 1000)
    }
  }

  return (
    <div className="w-[350px] h-[600px] bg-[#e6f7ef] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-[#c5e7d7]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600"
        >
          <span className="text-lg mr-1">←</span>
          <span>{translate('common.back')}</span>
        </button>
        <h1 className="flex-1 text-center text-[15px] font-medium text-gray-700">
          {translate('settings.title')}
        </h1>
        <div className="w-[52px]" />
      </div>

      {/* Navigation */}
      <div className="flex border-b border-[#c5e7d7]">
        <div className="flex-1 overflow-x-auto py-2 px-4">
          <div className="flex space-x-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                  activeSection === section.id
                    ? 'bg-[#4caf8e] text-white'
                    : 'text-gray-600 hover:bg-[#4caf8e]/10'
                }`}
              >
                {section.icon}
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* General Settings */}
        {activeSection === 'general' && (
          <div className="space-y-4">
            {/* Language */}
            <div className="bg-white rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {translate('settings.language')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      currentLanguage === lang.code
                        ? 'border-[#4caf8e] bg-[#4caf8e]/10 text-[#4caf8e]'
                        : 'border-gray-200 text-gray-600 hover:border-[#4caf8e] hover:text-[#4caf8e]'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="bg-white rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {translate('settings.currency')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      selectedCurrency === currency.code
                        ? 'border-[#4caf8e] bg-[#4caf8e]/10 text-[#4caf8e]'
                        : 'border-gray-200 text-gray-600 hover:border-[#4caf8e] hover:text-[#4caf8e]'
                    }`}
                  >
                    {currency.symbol} {currency.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Account Settings */}
        {activeSection === 'account' && (
          <div className="space-y-4">
            {/* Current Wallet */}
            <div className="bg-white rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {translate('settings.currentWallet')}
              </h3>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#4caf8e]/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#4caf8e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {web3Service.getCurrentWallet()?.name || 'Main Wallet'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {web3Service.getCurrentWallet()?.address?.slice(0, 6)}...{web3Service.getCurrentWallet()?.address?.slice(-4)}
                    </p>
                  </div>
                </div>
                <button className="text-xs text-[#4caf8e] font-medium hover:underline">
                  {translate('settings.edit')}
                </button>
              </div>
            </div>

            {/* Wallet Management */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                {translate('settings.manageWallets')}
              </h3>
              
              <button
                onClick={() => navigate('/create-wallet')}
                className="w-full p-3 rounded-xl border border-[#4caf8e] text-[#4caf8e] text-sm font-medium hover:bg-[#4caf8e]/10 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{translate('settings.createNewWallet')}</span>
              </button>

              <button
                onClick={() => navigate('/import-wallet')}
                className="w-full p-3 rounded-xl border border-[#4caf8e] text-[#4caf8e] text-sm font-medium hover:bg-[#4caf8e]/10 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{translate('settings.importAccount')}</span>
              </button>
            </div>

            {/* All Wallets List */}
            <div className="bg-white rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                {translate('settings.allWallets')}
              </h3>
              {web3Service.getAllWallets().map((wallet, index) => (
                <div key={wallet.address} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#4caf8e]/10 rounded-full flex items-center justify-center">
                      <span className="text-sm text-[#4caf8e] font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{wallet.name || `Wallet ${index + 1}`}</p>
                      <p className="text-xs text-gray-500">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => web3Service.selectWallet(wallet.address)}
                      className="text-xs text-[#4caf8e] font-medium hover:underline"
                    >
                      {translate('settings.select')}
                    </button>
                    <button 
                      onClick={() => web3Service.hideWallet(wallet.address)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {web3Service.isWalletHidden(wallet.address) ? translate('settings.show') : translate('settings.hide')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-red-600">
                Danger Zone
              </h3>
              <button
                onClick={handleDeleteAccount}
                className="w-full p-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{translate('common.deleteAccount')}</span>
              </button>
              <p className="text-xs text-gray-500">
                {translate('settings.deleteAccountWarning')}
              </p>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeSection === 'security' && (
          <div className="space-y-4">
            {/* Auto-Lock Timer */}
            <div className="bg-white rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {translate('settings.autoLock')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {timeoutOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleLockTimeoutChange(option.value)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      selectedTimeout === option.value
                        ? 'border-[#4caf8e] bg-[#4caf8e]/10 text-[#4caf8e]'
                        : 'border-gray-200 text-gray-600 hover:border-[#4caf8e] hover:text-[#4caf8e]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Show Private Key & Recovery Phrase */}
            <div className="bg-white rounded-xl p-4 space-y-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full p-3 rounded-xl border border-[#4caf8e] text-[#4caf8e] text-sm font-medium hover:bg-[#4caf8e]/10 transition-colors"
              >
                {translate('settings.privateKey')}
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full p-3 rounded-xl border border-[#4caf8e] text-[#4caf8e] text-sm font-medium hover:bg-[#4caf8e]/10 transition-colors"
              >
                {translate('settings.mnemonic')}
              </button>
            </div>
          </div>
        )}

        {/* Network Settings */}
        {activeSection === 'networks' && (
          <div className="space-y-4">
            {/* Testnet Toggle */}
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">
                    {translate('settings.testnetMode')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {translate('settings.testnetDescription')}
                  </p>
                </div>
                <button
                  onClick={handleTestnetToggle}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isTestnetEnabled ? 'bg-[#4caf8e]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      isTestnetEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Available Networks */}
            <div className="bg-white rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {translate('settings.availableNetworks')}
              </h3>
              <div className="space-y-2">
                {Object.entries(web3Service.getAllNetworks()).map(([key, network]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={network.logo}
                        alt={network.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-700">{network.name}</span>
                    </div>
                    <button className="text-xs text-[#4caf8e] font-medium">
                      {translate('settings.edit')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* About */}
        {activeSection === 'about' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 space-y-4">
              <div className="text-center">
                <img
                  src="/logo.svg"
                  alt="Logo"
                  className="w-16 h-16 mx-auto mb-2"
                />
                <h3 className="text-lg font-medium text-gray-800">
                  Web3 Wallet Extension
                </h3>
                <p className="text-sm text-gray-500">
                  {translate('settings.version')}: 1.0.0
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href="#"
                  className="block w-full p-3 rounded-xl text-center text-sm text-[#4caf8e] hover:bg-[#4caf8e]/10 transition-colors"
                >
                  {translate('settings.privacyPolicy')}
                </a>
                <a
                  href="#"
                  className="block w-full p-3 rounded-xl text-center text-sm text-[#4caf8e] hover:bg-[#4caf8e]/10 transition-colors"
                >
                  {translate('settings.termsOfService')}
                </a>
                <a
                  href="#"
                  className="block w-full p-3 rounded-xl text-center text-sm text-[#4caf8e] hover:bg-[#4caf8e]/10 transition-colors"
                >
                  {translate('settings.contactUs')}
                </a>
                <a
                  href="#"
                  className="block w-full p-3 rounded-xl text-center text-sm text-[#4caf8e] hover:bg-[#4caf8e]/10 transition-colors"
                >
                  {translate('settings.visitWebsite')}
                </a>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full p-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              {translate('common.logout')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings 