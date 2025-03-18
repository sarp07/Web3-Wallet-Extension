import React, { createContext, useContext, useState, useCallback } from 'react'
import { translations } from '../locales/translations'
import languageService from '../services/languageService'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => 
    languageService.getCurrentLanguage()
  )

  const translate = useCallback((key) => {
    try {
      const keys = key.split('.')
      let result = translations[currentLanguage]
      
      for (const k of keys) {
        if (!result || !result[k]) {
          console.warn(`Translation not found for key: ${key}`)
          return key
        }
        result = result[k]
      }
      
      return result
    } catch (error) {
      console.error('Translation error:', error)
      return key
    }
  }, [currentLanguage])

  const changeLanguage = useCallback((languageCode) => {
    try {
      languageService.setLanguage(languageCode)
      setCurrentLanguage(languageCode)
    } catch (error) {
      console.error('Language change error:', error)
    }
  }, [])

  const value = {
    currentLanguage,
    translate,
    changeLanguage
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 