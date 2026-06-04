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
  const el = document.documentElement
  if (theme === 'light') {
    el.classList.add('light-theme')
  } else {
    el.classList.remove('light-theme')
  }
}
