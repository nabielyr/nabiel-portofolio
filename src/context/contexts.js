import { createContext, useContext } from 'react'

export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} })
export const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k, pick: (v) => v })

export const useTheme = () => useContext(ThemeContext)
export const useLanguage = () => useContext(LanguageContext)
