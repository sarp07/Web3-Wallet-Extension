import React from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const Container = ({ children, showBackButton = false, title = '', onBack }) => {
  const { translate } = useLanguage()
  
  return (
    <div className="w-[350px] h-[600px] bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 text-gray-800 overflow-hidden flex flex-col">
      {/* Header - Only show if title or back button is needed */}
      {(showBackButton || title) && (
        <div className="flex items-center p-4 border-b border-[#c5e7d7] bg-white/80 backdrop-blur-sm">
          {showBackButton && (
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 transition-colors duration-300 flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>{translate('common.back')}</span>
            </button>
          )}
          {title && (
            <h1 className={`text-lg font-semibold ${showBackButton ? 'flex-1 text-center' : ''}`}>
              {title}
            </h1>
          )}
          {showBackButton && <div className="w-8" />}
        </div>
      )}

      {/* Content - With improved scrolling */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default Container 