import { createContext, useContext, useState, type ReactNode } from 'react'
import { uk } from './uk'
import { en } from './en'
import type { Translations } from './uk'

type Lang = 'uk' | 'en'

const LOCALES: Record<Lang, Translations> = { uk, en }

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'uk'
  const stored = localStorage.getItem('lang')
  if (stored === 'uk' || stored === 'en') return stored
  return 'uk'
}

interface I18nContextValue {
  lang: Lang
  t: Translations
  setLang: (lang: Lang) => void
  toggle: () => void
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'uk',
  t: uk,
  setLang: () => {},
  toggle: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
    document.documentElement.lang = l
  }

  const toggle = () => setLang(lang === 'uk' ? 'en' : 'uk')

  return (
    <I18nContext.Provider value={{ lang, t: LOCALES[lang], setLang, toggle }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
