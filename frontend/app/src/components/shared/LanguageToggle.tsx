import { useI18n } from '@/i18n'

export function LanguageToggle() {
  const { lang, toggle } = useI18n()

  return (
    <button
      onClick={toggle}
      aria-label={lang === 'uk' ? 'Switch to English' : 'Перейти на українську'}
      title={lang === 'uk' ? 'Switch to English' : 'Перейти на українську'}
      className="flex items-center gap-1 p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-xs font-semibold tracking-wide"
    >
      {lang === 'uk' ? 'EN' : 'UA'}
    </button>
  )
}
