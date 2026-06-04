'use client'

import { useState, useEffect } from 'react'
import { t, getLocale, setLocale, Locale } from '@/lib/i18n'
import { getTheme, setTheme, Theme } from '@/lib/theme'
import RangeSlider from './ui/RangeSlider'

interface Settings {
  pomodoroMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
}

const DEFAULT_SETTINGS: Settings = {
  pomodoroMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: Settings) => void
}

export default function Settings({ isOpen, onClose, onSettingsChange }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [locale, setLocaleState] = useState<Locale>(getLocale())
  const [theme, setThemeState] = useState<Theme>(getTheme())

  // 加载保存的设置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('focus-room-settings')
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch {}
  }, [isOpen])

  // 保存设置
  const handleSave = () => {
    localStorage.setItem('focus-room-settings', JSON.stringify(settings))
    setLocale(locale)
    setTheme(theme)
    onSettingsChange(settings)
    onClose()
  }

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="glass-strong rounded-3xl p-8 w-[400px] relative animate-scale-in"
        onClick={e => e.stopPropagation()}>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 className="text-lg font-medium text-white mb-6">{t('settings.title')}</h2>

        <div className="space-y-5">
          <RangeSlider label={t('settings.pomodoro')} value={settings.pomodoroMinutes} min={5} max={60} step={5} unit="m" onChange={v => updateSetting('pomodoroMinutes', v)} />
          <RangeSlider label={t('settings.shortBreak')} value={settings.breakMinutes} min={1} max={15} unit="m" onChange={v => updateSetting('breakMinutes', v)} />
          <RangeSlider label={t('settings.longBreak')} value={settings.longBreakMinutes} min={10} max={30} step={5} unit="m" onChange={v => updateSetting('longBreakMinutes', v)} />
          <RangeSlider label={t('settings.longBreakInterval')} value={settings.longBreakInterval} min={2} max={6} onChange={v => updateSetting('longBreakInterval', v)} />

          {/* Language toggle */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">{t('settings.language')}</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocaleState('zh')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  locale === 'zh'
                    ? 'bg-white/[0.15] text-white'
                    : 'bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                }`}
              >
                {t('settings.chinese')}
              </button>
              <button
                onClick={() => setLocaleState('en')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  locale === 'en'
                    ? 'bg-white/[0.15] text-white'
                    : 'bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                }`}
              >
                {t('settings.english')}
              </button>
            </div>
          </div>

          {/* Theme toggle */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">{t('settings.theme', '主题')}</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setThemeState('dark')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  theme === 'dark'
                    ? 'bg-white/[0.15] text-white'
                    : 'bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                {t('settings.dark', '深色')}
              </button>
              <button
                onClick={() => setThemeState('light')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  theme === 'light'
                    ? 'bg-white/[0.15] text-white'
                    : 'bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                {t('settings.light', '浅色')}
              </button>
            </div>
          </div>
        </div>

        {/* 快捷键提示 */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="text-xs text-white/40 mb-3">{t('settings.shortcuts')}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">Space</kbd>
              <span className="text-white/50">{t('settings.startPause')}</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">R</kbd>
              <span className="text-white/50">{t('settings.reset')}</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">1 2 3</kbd>
              <span className="text-white/50">{t('settings.switchMode')}</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">M</kbd>
              <span className="text-white/50">{t('settings.mute')}</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">{locale === 'zh' ? '双击' : 'dbl-click'}</kbd>
              <span className="text-white/50">{t('settings.focusMode')}</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">Esc</kbd>
              <span className="text-white/50">{t('settings.exitFocus')}</span>
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className="w-full mt-6 py-3 rounded-xl bg-white/[0.12] text-white/90 font-medium hover:bg-white/[0.18] transition-all duration-200"
        >
          {t('settings.save')}
        </button>
      </div>
    </div>
  )
}
