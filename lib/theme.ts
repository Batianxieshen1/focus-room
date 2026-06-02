'use client'

export type Theme = 'dark' | 'light'

const THEME_KEY = 'focus-room-theme'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return 'dark'
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {}
  applyThemeClass(theme)
}

export function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return
  if (theme === 'light') {
    document.body.classList.add('light-theme')
  } else {
    document.body.classList.remove('light-theme')
  }
}
