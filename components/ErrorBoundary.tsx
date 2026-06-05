'use client'

import { Component, ReactNode } from 'react'
import { t } from '@/lib/i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[FocusRoom] Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1040 50%, #0d1520 100%)',
            color: '#fff',
          }}
        >
          <div className="text-center animate-fade-in">
            <div className="text-5xl mb-4">🌧</div>
            <p className="text-white/60 text-sm mb-6">{t('error.title')}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="px-6 py-2.5 rounded-full bg-white/[0.12] text-white/80 text-sm hover:bg-white/[0.18] transition-all duration-200 active:scale-95"
            >
              {t('error.retry')}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
