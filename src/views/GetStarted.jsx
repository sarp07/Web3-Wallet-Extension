import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import web3Service from '../services/web3Service';

/**
 * Başlangıç sayfası bileşeni
 * Get started page component
 */
const GetStarted = () => {
  const navigate = useNavigate();
  const { translate } = useLanguage();

  // Tab view kontrolü
  useEffect(() => {
    if (!web3Service.isTabView()) {
      window.close();
    }
  }, []);

  const handleCreateWallet = () => {
    try {
      // Yeni pencere özellikleri
      const windowFeatures = {
        width: 800,
        height: 600,
        left: (window.screen.width - 800) / 2,
        top: (window.screen.height - 600) / 2,
      };

      const features = Object.entries(windowFeatures)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');

      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        // Extension ortamında
        const extensionUrl = chrome.runtime.getURL('index.html');
        window.open(`${extensionUrl}#/create-wallet?view=tab`, '_blank', features);
      } else {
        // Development ortamında
        const baseUrl = window.location.origin;
        const newWindow = window.open(`${baseUrl}/#/create-wallet?view=tab`, '_blank', features);
        
        if (!newWindow) {
          console.warn('Popup was blocked - falling back to direct navigation');
          navigate('/create-wallet');
        }
      }

      // Mevcut tab'i kapat
      window.close();
    } catch (error) {
      console.error('Navigation error:', error);
      navigate('/create-wallet');
    }
  };

  const handleImportWallet = () => {
    try {
      // Yeni pencere özellikleri
      const windowFeatures = {
        width: 800,
        height: 600,
        left: (window.screen.width - 800) / 2,
        top: (window.screen.height - 600) / 2,
      };

      const features = Object.entries(windowFeatures)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');

      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        // Extension ortamında
        const extensionUrl = chrome.runtime.getURL('index.html');
        window.open(`${extensionUrl}#/import-wallet?view=tab`, '_blank', features);
      } else {
        // Development ortamında
        const baseUrl = window.location.origin;
        const newWindow = window.open(`${baseUrl}/#/import-wallet?view=tab`, '_blank', features);
        
        if (!newWindow) {
          console.warn('Popup was blocked - falling back to direct navigation');
          navigate('/import-wallet');
        }
      }

      // Mevcut tab'i kapat
      window.close();
    } catch (error) {
      console.error('Navigation error:', error);
      navigate('/import-wallet');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#e6f7ef]">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {translate('auth.getStarted')}
        </h1>
        <p className="text-xl text-gray-600">
          {translate('common.chooseOption')}
        </p>
      </div>

      <div className="space-y-6 w-full max-w-md">
        <button
          onClick={handleCreateWallet}
          className="w-full py-4 bg-[#4caf8e] text-white text-lg rounded-xl hover:bg-[#3d8b71] transition-colors"
        >
          {translate('auth.createWallet')}
        </button>

        <button
          onClick={handleImportWallet}
          className="w-full py-4 border-2 border-[#4caf8e] text-[#4caf8e] text-lg rounded-xl hover:bg-[#4caf8e]/5 transition-colors"
        >
          {translate('auth.importWallet')}
        </button>
      </div>
    </div>
  );
};

export default GetStarted; 