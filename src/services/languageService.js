export const SUPPORTED_LANGUAGES = {
  en: {
    name: 'English',
    nativeName: 'English'
  },
  tr: {
    name: 'Turkish',
    nativeName: 'Türkçe'
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文'
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語'
  },
  ko: {
    name: 'Korean',
    nativeName: '한국어'
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español'
  },
  fr: {
    name: 'French',
    nativeName: 'Français'
  },
  pt: {
    name: 'Portuguese',
    nativeName: 'Português'
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch'
  }
}

class LanguageService {
  constructor() {
    this.currentLanguage = localStorage.getItem('preferredLanguage') || 'en'
  }

  getCurrentLanguage() {
    return this.currentLanguage
  }

  setLanguage(languageCode) {
    if (SUPPORTED_LANGUAGES[languageCode]) {
      this.currentLanguage = languageCode
      localStorage.setItem('preferredLanguage', languageCode)
    }
  }

  getAllLanguages() {
    return SUPPORTED_LANGUAGES
  }
}

export default new LanguageService() 