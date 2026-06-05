'use client'

import { useState, useEffect, useRef } from 'react'
import { t } from '@/lib/i18n'

interface Link {
  id: string
  name: string
  url: string
}

interface Props {
  onClose: () => void
}

const DEFAULT_LINKS: Link[] = [
  { id: 'bilibili', name: 'Bilibili', url: 'https://www.bilibili.com' },
  { id: 'notion', name: 'Notion', url: 'https://www.notion.so' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com' },
  { id: 'mooc', name: '中国大学MOOC', url: 'https://www.icourse163.org' },
  { id: 'xuetangx', name: '学堂在线', url: 'https://www.xuetangx.com' },
  { id: 'translate', name: '翻译', url: 'https://translate.google.com' },
]

const STORAGE_KEY = 'focus-room-tools'

function loadCustomLinks(): Link[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

function saveCustomLinks(links: Link[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  } catch {}
}

export default function FocusTools({ onClose }: Props) {
  const [customLinks, setCustomLinks] = useState<Link[]>([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCustomLinks(loadCustomLinks())
  }, [])

  useEffect(() => {
    // Focus the name input when panel opens
    const timer = setTimeout(() => nameRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  const isValidUrl = (str: string) => {
    return str.startsWith('http://') || str.startsWith('https://')
  }

  const handleAdd = () => {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    if (!trimmedName || !trimmedUrl) {
      setError(t('tools.nameAndUrlRequired'))
      return
    }

    if (!isValidUrl(trimmedUrl)) {
      setError(t('tools.urlInvalid'))
      return
    }

    const newLink: Link = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      url: trimmedUrl,
    }

    const updated = [...customLinks, newLink]
    setCustomLinks(updated)
    saveCustomLinks(updated)
    setName('')
    setUrl('')
    setError('')
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('tools.confirmDelete'))) {
      const updated = customLinks.filter(l => l.id !== id)
      setCustomLinks(updated)
      saveCustomLinks(updated)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* macOS Window */}
      <div
        className="relative w-full max-w-[520px] mx-4 glass-strong rounded-3xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/[0.08]">
          {/* Traffic light dots */}
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={onClose}
              className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70 hover:bg-[#ff5f57] transition-colors group"
            >
              <svg
                className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                viewBox="0 0 12 12"
                fill="none"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <line x1="3" y1="3" x2="9" y2="9" />
                <line x1="9" y1="3" x2="3" y2="9" />
              </svg>
            </button>
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/50" />
          </div>

          {/* Title */}
          <span className="text-sm font-medium text-white/60 flex-1 text-center select-none">
            {t('tools.title')}
          </span>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-150 active:scale-95"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Section header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-400/80"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <h3 className="text-base font-semibold text-white/80">{t('tools.sectionTitle')}</h3>
            </div>
            <p className="text-xs text-white/30 ml-7">{t('tools.sectionDesc')}</p>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {DEFAULT_LINKS.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-white/[0.06] hover:bg-blue-500/10 border border-white/[0.06] hover:border-blue-400/20 transition-all duration-200"
              >
                <span className="text-sm text-white/70 group-hover:text-blue-300 truncate flex-1">
                  {link.name}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/20 group-hover:text-blue-400 flex-shrink-0 transition-colors"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}

            {/* Custom links */}
            {customLinks.map(link => (
              <div
                key={link.id}
                className="group relative flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-white/[0.06] hover:bg-blue-500/10 border border-white/[0.06] hover:border-blue-400/20 transition-all duration-200"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 group-hover:text-blue-300 truncate flex-1"
                >
                  {link.name}
                </a>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/20 group-hover:text-blue-400 flex-shrink-0 transition-colors"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                {/* Delete button — visible on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(link.id)
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/10 hover:bg-red-400 text-white/40 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm active:scale-95"
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Add custom link form */}
          <div className="pt-4 border-t border-white/[0.08]">
            <div className="flex gap-2.5 mb-2">
              <input
                ref={nameRef}
                type="text"
                placeholder={t('tools.namePlaceholder')}
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                className="flex-1 px-3.5 py-2.5 text-sm rounded-lg bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10 transition-all"
              />
              <input
                type="url"
                placeholder={t('tools.urlPlaceholder')}
                value={url}
                onChange={e => { setUrl(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                className="flex-[1.5] px-3.5 py-2.5 text-sm rounded-lg bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/10 transition-all"
              />
              <button
                onClick={handleAdd}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-150 shadow-sm flex-shrink-0 active:scale-95"
              >
                {t('tools.add')}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 ml-0.5 animate-fade-in">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
