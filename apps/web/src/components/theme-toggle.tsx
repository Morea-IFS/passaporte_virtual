'use client'

import { iconButtonClass } from '@/components/ui/button'
import { MoonIcon, SunIcon } from '@/components/ui/icons'
import { THEME_STORAGE_KEY } from '@/lib/theme'

function currentTheme() {
  const explicit = document.documentElement.dataset.theme
  if (explicit === 'light' || explicit === 'dark') return explicit
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Alterna entre claro e escuro. O ícone muda só por CSS (variante dark:),
 * então servidor e cliente renderizam igual.
 */
export function ThemeToggle() {
  function toggle() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Sem localStorage (navegação privada): vale só nesta página
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Alternar tema claro/escuro"
      className={iconButtonClass()}
    >
      <span className="sr-only">Alternar tema claro/escuro</span>
      <MoonIcon className="size-5 dark:hidden" />
      <SunIcon className="hidden size-5 dark:block" />
    </button>
  )
}
