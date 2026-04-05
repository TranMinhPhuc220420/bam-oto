import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { resources } from './resources'

const LANGUAGE_DEFAULT = 'vi'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: LANGUAGE_DEFAULT,
    supportedLngs: ['en', 'vi'],
    lng: LANGUAGE_DEFAULT,
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app-language',
    },
  })

const syncDocumentLanguage = (language: string) => {
  document.documentElement.lang = language.startsWith('vi') ? 'vi' : 'en'
}

syncDocumentLanguage(i18n.resolvedLanguage ?? LANGUAGE_DEFAULT)
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
