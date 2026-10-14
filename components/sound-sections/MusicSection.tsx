'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAudioContext } from '@/contexts/AudioContext'
import { t } from '@/lib/i18n'
import { EV } from '@/lib/events'
import { getRadioSnapshot, subscribeRadio, startRadio, pauseRadio, resumeRadio, stopRadio, setRadioVolume } from '@/lib/radio'
import { storageGet } from '@/lib/storage'
import { KEYS } from '@/lib/storageKeys'
import { fetchWithProgress } from './shared'

// 24/7 免版权自习电台（2026-10 实测存活流；失败自动跳台见 radioFailed 监听）
const STUDY_RADIOS = [
  { id: 'fip-chill', name: 'FIP Eclectic Chill', descKey: 'radio.fipChillDesc', icon: '🌙', streamUrl: 'https://icecast.radiofrance.fr/fip-midfi.mp3' },
  { id: 'fip-jazz', name: 'FIP Jazz Café', descKey: 'radio.fipJazzDesc', icon: '🎷', streamUrl: 'https://icecast.radiofrance.fr/fipjazz-midfi.mp3' },
  { id: 'fm-classical', name: 'France Musique Classique', descKey: 'radio.classicalDesc', icon: '🎻', streamUrl: 'https://icecast.radiofrance.fr/francemusique-midfi.mp3' },
  { id: 'vapor-night', name: 'Tokyo Nightwave', descKey: 'radio.vaporDesc', icon: '🌆', streamUrl: 'https://radio.plaza.one/mp3' },
] as const

interface Props {
  active: boolean
  showNotification: (msg: string) => void
  activePlaylistId?: string | null
  onPlaylistChange?: (id: string | null) => void
  playerMode?: 'iframe' | 'native'
  onPlayerModeChange?: (mode: 'iframe' | 'native') => void
}

export default function MusicSection({
  active,
  showNotification,
  activePlaylistId,
  onPlaylistChange,
  playerMode = 'iframe',
  onPlayerModeChange,
}: Props) {
  const { addCustomSound } = useAudioContext()

  const [musicSubTab, setMusicSubTab] = useState<'radio' | 'netease' | 'link'>('radio')

  // 电台 —— 播放引擎在 lib/radio.ts（模块单例），这里订阅状态并做互斥协调
  const [radio, setRadio] = useState(() => getRadioSnapshot())
  useEffect(() => subscribeRadio(() => setRadio(getRadioSnapshot())), [])

  const radioFailRef = useRef<{ lastId: string | null; lastAt: number; attempts: number }>({ lastId: null, lastAt: 0, attempts: 0 })
  const resetRadioFails = () => {
    radioFailRef.current = { lastId: null, lastAt: 0, attempts: 0 }
  }

  // 电台流失败（上游下线/断流）：自动跳下一台；整轮全灭则提示
  useEffect(() => {
    const onFailed = (e: Event) => {
      const failedId = (e as CustomEvent<{ stationId?: string | null }>).detail?.stationId ?? null
      const st = radioFailRef.current
      const now = Date.now()
      if (failedId && st.lastId === failedId && now - st.lastAt < 1000) return
      st.lastId = failedId
      st.lastAt = now
      st.attempts += 1
      if (st.attempts > STUDY_RADIOS.length) {
        st.attempts = 0
        showNotification(t('radio.allFailed'))
        return
      }
      const idx = STUDY_RADIOS.findIndex(r => r.id === failedId)
      const next = STUDY_RADIOS[(idx + 1 + STUDY_RADIOS.length) % STUDY_RADIOS.length]
      startRadio(next.id, next.streamUrl)
    }
    window.addEventListener(EV.radioFailed, onFailed)
    return () => window.removeEventListener(EV.radioFailed, onFailed)
  }, [showNotification])

  // 当外部网易云歌单激活时，自动停止自习电台，避免声音打架
  useEffect(() => {
    if (activePlaylistId) stopRadio()
  }, [activePlaylistId])

  const handleToggleRadio = (station: (typeof STUDY_RADIOS)[number]) => {
    resetRadioFails()
    if (radio.stationId === station.id) {
      if (radio.playing) pauseRadio()
      else resumeRadio()
      return
    }
    startRadio(station.id, station.streamUrl).then(ok => {
      if (ok && activePlaylistId) {
        onPlaylistChange?.(null)
      } else if (!ok) {
        showNotification(t('sound.fetchError'))
      }
    })
  }

  const handleStopRadio = useCallback(() => {
    stopRadio()
  }, [])

  const radioPlaying = radio.playing && !!radio.stationId
  const activeRadioId = radio.stationId
  const radioVolume = radio.volume

  const [playlistUrl, setPlaylistUrl] = useState('')

  const PRESET_PLAYLISTS = [
    { id: '459034281', nameKey: 'playlist.deepName', icon: '🧠', descKey: 'playlist.deepDesc' },
    { id: '7722421306', nameKey: 'playlist.ambientName', icon: '🎧', descKey: 'playlist.ambientDesc' },
    { id: '2556149301', nameKey: 'playlist.studyName', icon: '📚', descKey: 'playlist.studyDesc' },
    { id: '2109356424', nameKey: 'playlist.rainName', icon: '🌧', descKey: 'playlist.rainDesc' },
    { id: '2829883282', nameKey: 'playlist.cafeName', icon: '☕', descKey: 'playlist.cafeDesc' },
    { id: '2646741761', nameKey: 'playlist.pianoName', icon: '🎹', descKey: 'playlist.pianoDesc' },
  ] as const

  const extractPlaylistId = (url: string): string | null => {
    const numOnly = url.trim().match(/^(\d{5,})$/)
    if (numOnly) return numOnly[1]
    const match = url.match(/playlist[?&]id=(\d+)/) || url.match(/\/playlist\/(\d+)/)
    return match ? match[1] : null
  }

  const handlePlaylistUrl = () => {
    const id = extractPlaylistId(playlistUrl.trim())
    if (id) {
      handleStopRadio()
      onPlaylistChange?.(id)
      setPlaylistUrl('')
    }
  }

  const [urlInput, setUrlInput] = useState('')
  const [urlName, setUrlName] = useState('')
  const [fetchProgress, setFetchProgress] = useState<number | null>(null)

  const handleAddUrl = async () => {
    const url = urlInput.trim()
    if (!url) return

    setFetchProgress(0)
    try {
      const blob = await fetchWithProgress(url, pct => setFetchProgress(pct))
      const name = urlName.trim() || url.split('/').pop()?.split('?')[0] || 'Untitled'

      const success = await addCustomSound(name, new File([blob], `${name}.mp3`, { type: blob.type || 'audio/mpeg' }))
      if (success) {
        showNotification(t('sound.fetchDone'))
        setUrlInput('')
        setUrlName('')
      } else {
        showNotification(t('sound.maxSizeError'))
      }
    } catch {
      showNotification(t('sound.fetchError'))
    }
    setFetchProgress(null)
  }

  return (
    <div className={active ? '' : 'hidden'}>

        {/* Playback Mode Switcher */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('player.modeLabel')}</span>
          <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => onPlayerModeChange?.('iframe')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                playerMode === 'iframe'
                  ? 'bg-white/[0.14] text-white shadow-sm font-medium'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t('player.modeOfficial')}
            </button>
            <button
              onClick={() => onPlayerModeChange?.('native')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                playerMode === 'native'
                  ? 'bg-white/[0.14] text-white shadow-sm font-medium'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t('player.modeBuiltIn')}
            </button>
          </div>
        </div>

        {/* Active Playlist Status Banner */}
        {activePlaylistId && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-300 font-medium">{t('player.playlistActive')}</span>
            </div>
            <button
              onClick={() => onPlaylistChange?.(null)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.1] text-white/80 text-[11px] hover:bg-white/[0.18] transition-all active:scale-95"
            >
              {t('player.backToAmbient')}
            </button>
          </div>
        )}

        {/* Sub-tabs: Radio Stations vs NetEase vs Web Stream Link */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.04]">
          <button
            onClick={() => setMusicSubTab('radio')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all ${
              musicSubTab === 'radio'
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            📻 {t('sound.radioTitle').slice(5)}
          </button>
          <button
            onClick={() => setMusicSubTab('netease')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all ${
              musicSubTab === 'netease'
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            🎵 {t('sound.tabNetease')}
          </button>
          <button
            onClick={() => setMusicSubTab('link')}
            className={`flex-1 py-1.5 text-[11px] rounded-md transition-all ${
              musicSubTab === 'link'
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            🔗 {t('sound.tabUrl')}
          </button>
        </div>

        {/* 24/7 免版权自习电台 */}
        {musicSubTab === 'radio' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('sound.radioTitle')}</span>
              <span className="text-[10px] text-white/35 leading-tight">{t('sound.radioDesc')}</span>
            </div>

            <div className="flex flex-col gap-2">
              {STUDY_RADIOS.map(station => {
                const isCurrent = activeRadioId === station.id
                return (
                  <div
                    key={station.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      isCurrent && radioPlaying
                        ? 'bg-white/[0.12] border-emerald-400/40 shadow-sm'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.05]'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleRadio(station)}
                      className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.16] flex items-center justify-center text-white/80 active:scale-95 transition-all flex-shrink-0"
                    >
                      {isCurrent && radioPlaying ? (
                        <svg className="w-3.5 h-3.5 text-emerald-300" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-white/80 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{station.icon}</span>
                        <span className="text-xs font-medium text-white/90 truncate">{station.name}</span>
                        {isCurrent && radioPlaying && (
                          <div className="flex items-end gap-[2px] h-3 ml-1">
                            <div className="w-[2px] bg-emerald-400 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
                            <div className="w-[2px] bg-emerald-400 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.15s' }} />
                            <div className="w-[2px] bg-emerald-400 rounded-full animate-[wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 truncate mt-0.5">{t(station.descKey)}</p>
                    </div>

                    {isCurrent && (
                      <button
                        onClick={handleStopRadio}
                        className="text-[11px] text-white/35 hover:text-white/70 px-2 py-1 rounded transition-colors"
                      >
                        停止
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active radio volume control */}
            {activeRadioId && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] mt-1">
                <span className="text-xs text-white/50">📻</span>
                <span className="text-[11px] text-white/70 w-16 truncate">{t('sound.radioVolume')}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={radioVolume}
                  onChange={e => setRadioVolume(Number(e.target.value))}
                  className="flex-1 h-[3px]"
                  style={{
                    background: `linear-gradient(to right, rgba(52,211,153,0.8) ${radioVolume}%, rgba(255,255,255,0.1) ${radioVolume}%)`,
                    borderRadius: '9999px',
                    outline: 'none',
                  }}
                />
                <span className="text-[11px] text-white/40 w-7 text-right tabular-nums">{radioVolume}%</span>
              </div>
            )}
          </div>
        )}

        {musicSubTab === 'netease' && (
          <div className="flex flex-col gap-3">
            {/* VIP Notice Banner */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-200/85 text-[11px] leading-relaxed">
              <span className="text-sm leading-none mt-0.5">💡</span>
              <span>{t('sound.neteaseVipNotice')}</span>
            </div>

            {/* Curated Presets */}
            {/* 内置播放器需要 Meting API 地址 */}
            {playerMode === 'native' && !storageGet<string>(KEYS.metingApi, '') && (
              <div className="text-[10px] text-amber-300/70 bg-amber-500/10 border border-amber-400/20 rounded-lg px-3 py-2 leading-relaxed">
                {t('player.needApi')}
              </div>
            )}

            <div className="text-[10px] text-white/40 tracking-wider uppercase font-medium">{t('sound.neteaseHint')}</div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PLAYLISTS.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => {
                    handleStopRadio()
                    onPlaylistChange?.(pl.id)
                  }}
                  className={`flex flex-col items-start p-3 rounded-xl text-left transition-all duration-200 active:scale-[0.98] border ${
                    activePlaylistId === pl.id
                      ? 'bg-white/[0.14] border-emerald-400/40 shadow-sm'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">{pl.icon}</span>
                    <span className="text-xs font-medium text-white/90 truncate">{t(pl.nameKey)}</span>
                  </div>
                  <span className="text-[10px] text-white/40 leading-tight truncate w-full">{t(pl.descKey)}</span>
                </button>
              ))}
            </div>

            {/* Custom NetEase Playlist Input */}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePlaylistUrl()}
                placeholder={t('sound.neteasePasteUrl')}
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/25"
              />
              <button
                onClick={handlePlaylistUrl}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                  playlistUrl.trim()
                    ? 'bg-white/[0.14] text-white hover:bg-white/[0.2]'
                    : 'bg-white/[0.04] text-white/30'
                }`}
              >
                {t('sound.neteaseSearchBtn')}
              </button>
            </div>
          </div>
        )}


        {musicSubTab === 'link' && (
          <div className="flex flex-col gap-2.5">
            <div className="text-[10px] text-white/35 leading-relaxed">
              {t('sound.linkHint')}
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder={t('sound.pasteUrl')}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/25"
            />
            <input
              type="text"
              value={urlName}
              onChange={e => setUrlName(e.target.value)}
              placeholder={t('sound.urlName')}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-white/25"
            />
            <button
              onClick={handleAddUrl}
              disabled={!urlInput.trim() || fetchProgress !== null}
              className={`w-full py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98] ${
                fetchProgress !== null
                  ? 'bg-amber-500/20 text-amber-300/80 cursor-wait'
                  : urlInput.trim()
                    ? 'bg-white/[0.14] text-white hover:bg-white/[0.2]'
                    : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
              }`}
            >
              {fetchProgress !== null ? t('sound.fetching') : t('sound.addUrl')}
            </button>

            {fetchProgress !== null && (
              <div className="flex flex-col gap-1">
                <div className="w-full h-[3px] rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${fetchProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/40 text-center tabular-nums">{fetchProgress}%</span>
              </div>
            )}
          </div>
        )}
      
{/* ===== NetEase Official Iframe Element (Persistent in DOM, never unmounted) ===== */}
      {activePlaylistId && playerMode === 'iframe' && (
        <div
          className={`transition-all duration-200 ${
            active
              ? 'block rounded-xl overflow-hidden border border-white/[0.1] shadow-2xl mt-2'
              : 'fixed -left-[9999px] top-0 opacity-0 pointer-events-none w-[1px] h-[1px]'
          }`}
          aria-hidden={!active}
        >
          <iframe
            src={`https://music.163.com/outchain/player?type=0&id=${activePlaylistId}&auto=0&height=430`}
            className="w-full bg-black"
            style={{ height: '390px' }}
            frameBorder="no"
            title="NetEase Cloud Music"
          />
        </div>
      )}

      {/* Toast Notification */}
          </div>
  )
}
