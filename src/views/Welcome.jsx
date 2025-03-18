import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import web3Service from '../services/web3Service';

const Welcome = () => {
  const navigate = useNavigate();
  const { translate } = useLanguage();

  const handleGetStarted = () => {
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

      if (chrome?.runtime?.getURL) {
        // Extension ortamında
        const extensionUrl = chrome.runtime.getURL('index.html');
        window.open(`${extensionUrl}#/get-started?view=tab`, '_blank', features);
      } else {
        // Development ortamında
        const baseUrl = window.location.origin;
        const newWindow = window.open(`${baseUrl}/#/get-started?view=tab`, '_blank', features);
        
        if (!newWindow) {
          console.warn('Popup was blocked - falling back to direct navigation');
          navigate('/get-started');
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      navigate('/get-started');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-[#e6f7ef]">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {translate('common.welcome')}
        </h1>
        <p className="text-gray-600">
          {translate('common.manageAssets')}
        </p>
      </div>

      <div className="space-y-4 w-full max-w-sm">
        <button
          onClick={handleGetStarted}
          className="w-full py-3 bg-[#4caf8e] text-white rounded-xl hover:bg-[#3d8b71] transition-colors"
        >
          {translate('auth.getStarted')}
        </button>
      </div>
    </div>
  );
};

export default Welcome; 