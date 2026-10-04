import { useCallback, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './contexts'
import en from '../i18n/en'
import id from '../i18n/id'

const dictionaries = { en, id }

function getInitialLang() {
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'id') return saved
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = dictionaries[lang].meta.title
    try {
      localStorage.setItem('lang', lang)
    } catch {
      /* storage unavailable */
    }
  }, [lang])

  /** t('hero.greeting') → string / array from the active dictionary */
  const t = useCallback(
    (path) => path.split('.').reduce((obj, key) => obj?.[key], dictionaries[lang]) ?? path,
    [lang],
  )

  /** pick({ en: '...', id: '...' }) → value for active language; passes through plain values */
  const pick = useCallback(
    (value) => {
      if (value && typeof value === 'object' && !Array.isArray(value) && 'en' in value) {
        return value[lang] ?? value.en
      }
      return value
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t, pick }), [lang, t, pick])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
