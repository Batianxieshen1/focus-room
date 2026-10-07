'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { storageGet, storageSet } from '@/lib/storage'
import RangeSlider from './ui/RangeSlider'

interface Settings {
  pomodoroMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
  soundEnabled?: boolean
  autoStart?: boolean
  wakeLock?: boolean
}

const DEFAULT_SETTINGS: Settings = {
  pomodoroMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  autoStart: false,
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: Settings) => void
}

export default function Settings({ isOpen, onClose, onSettingsChange }: Props) {
  const { t, locale, setLocale } = useTranslation()
  const [settings, setSettings] = useState<Settings>(() => storageGet('focus-room-settings', DEFAULT_SETTINGS))
  const [metingApi, setMetingApi] = useState<string>(() => storageGet('focus-room-meting-api', ''))

  // 保存设置
  const handleSave = () => {
    storageSet('focus-room-settings', settings)
    storageSet('focus-room-meting-api', metingApi.trim())
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

      <div className="glass-strong rounded-3xl p-8 w-full max-w-[400px] relative animate-scale-in mx-4"
        onClick={e => e.stopPropagation()}>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all duration-200 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 className="text-lg font-medium text-white mb-6">{t('settings.title')}</h2>

        {/* 番茄时长预设组：一键套用成组配置（FocusTide 风格） */}
        <div className="mb-5">
          <label className="text-sm text-white/70 mb-2 block">{t('settings.presets')}</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'settings.presetClassic', label: '25 / 5 · 15×4', v: { pomodoroMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4 } },
              { key: 'settings.presetDeep', label: '50 / 10 · 30×2', v: { pomodoroMinutes: 50, breakMinutes: 10, longBreakMinutes: 30, longBreakInterval: 2 } },
              { key: 'settings.presetSprint', label: '15 / 3 · 10×4', v: { pomodoroMinutes: 15, breakMinutes: 3, longBreakMinutes: 10, longBreakInterval: 4 } },
            ] as const).map(p => {
              const active = (['pomodoroMinutes', 'breakMinutes', 'longBreakMinutes', 'longBreakInterval'] as const).every(k => settings[k] === p.v[k])
              return (
                <button
                  key={p.key}
                  onClick={() => setSettings(prev => ({ ...prev, ...p.v }))}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200 active:scale-95 border ${
                    active
                      ? 'bg-white/[0.15] border-white/30 text-white'
                      : 'bg-white/[0.04] border-white/[0.06] text-white/55 hover:bg-white/[0.08] hover:text-white/85'
                  }`}
                >
                  <span className="text-[11px] font-medium">{t(p.key)}</span>
                  <span className="text-[9px] tabular-nums opacity-70">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-5">
          <RangeSlider label={t('settings.pomodoro')} value={settings.pomodoroMinutes} min={5} max={60} step={5} unit="m" onChange={v => updateSetting('pomodoroMinutes', v)} />
          <RangeSlider label={t('settings.shortBreak')} value={settings.breakMinutes} min={1} max={15} unit="m" onChange={v => updateSetting('breakMinutes', v)} />
          <RangeSlider label={t('settings.longBreak')} value={settings.longBreakMinutes} min={10} max={30} step={5} unit="m" onChange={v => updateSetting('longBreakMinutes', v)} />
          <RangeSlider label={t('settings.longBreakInterval')} value={settings.longBreakInterval} min={2} max={6} onChange={v => updateSetting('longBreakInterval', v)} />

          {/* Sound enabled toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">{t('settings.soundEnabled')}</label>
            <button
              onClick={() => updateSetting('soundEnabled', settings.soundEnabled === false ? true : false)}
              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                settings.soundEnabled !== false ? 'bg-white/20' : 'bg-white/[0.06]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                  settings.soundEnabled !== false
                    ? 'left-5.5 bg-white/90'
                    : 'left-0.5 bg-white/40'
                }`}
                style={{ left: settings.soundEnabled !== false ? '22px' : '2px' }}
              />
            </button>
          </div>

          {/* Auto-start toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">{t('settings.autoStart')}</label>
            <button
              onClick={() => updateSetting('autoStart', settings.autoStart === true ? false : true)}
              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                settings.autoStart ? 'bg-white/20' : 'bg-white/[0.06]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200`}
                style={{ left: settings.autoStart ? '22px' : '2px', backgroundColor: settings.autoStart ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }}
              />
            </button>
          </div>

          {/* Wake Lock toggle — 平板桌搭模式防息屏 */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">{t('settings.wakeLock')}</label>
            <button
              onClick={() => updateSetting('wakeLock', settings.wakeLock === true ? false : true)}
              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                settings.wakeLock ? 'bg-white/20' : 'bg-white/[0.06]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200`}
                style={{ left: settings.wakeLock ? '22px' : '2px', backgroundColor: settings.wakeLock ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)' }}
              />
            </button>
          </div>

          {/* Meting API 地址（内置音乐播放器数据源） */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">{t('settings.metingApi')}</label>
            <input
              type="text"
              value={metingApi}
              onChange={e => setMetingApi(e.target.value)}
              placeholder="https://<envId>.service.tcloudbase.com/meting"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/20"
            />
            <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed">{t('settings.metingApiHint')}</p>
          </div>

          {/* Language toggle */}
          <div>
            <label className="text-sm text-white/70 mb-2 block">{t('settings.language')}</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocale('zh')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  locale === 'zh'
                    ? 'bg-white/[0.15] text-white'
                    : 'bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                }`}
              >
                {t('settings.chinese')}
              </button>
              <button
                onClick={() => setLocale('en')}
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
          className="w-full mt-6 py-3 rounded-xl bg-white/[0.12] text-white/90 font-medium hover:bg-white/[0.18] transition-all duration-200 active:scale-[0.97]"
        >
          {t('settings.save')}
        </button>
      </div>
    </div>
  )
}
