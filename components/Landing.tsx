'use client';

import { useEffect, useCallback } from 'react';
import { t } from '@/lib/i18n';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onStart();
      }
    },
    [onStart],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="absolute inset-0 z-10 flex items-center"
    >
      {/* Dark gradient overlay for text readability — left-heavy so right side stays bright to show video */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 70%, transparent 100%)',
        }}
      />

      {/* Subtle vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Brand logo — top left */}
      <div className="absolute left-5 top-5 z-20 flex items-center gap-2.5 sm:left-8 sm:top-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/60"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="M8 7h6" />
            <path d="M8 11h4" />
          </svg>
        </div>
        <span className="text-[13px] font-light tracking-wide text-white/45">
          Focus Room
        </span>
      </div>

      {/* Content — left 60%, right 40% shows video */}
      <div className="relative z-20 w-full px-6 sm:pl-[8vw] sm:pr-0 lg:w-[60%]">
        <div className="max-w-[560px]">
          {/* Tagline */}
          <p
            className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-white/40"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.1s both' }}
          >
            {t('landing.tagline')}
          </p>

          {/* Hero title — ultra-thin, large, impactful */}
          <h1
            className="mb-5 text-white whitespace-pre-line sm:mb-7"
            style={{
              fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
              fontWeight: 100,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              animation: 'fadeSlideUp 0.8s ease-out 0.3s both',
            }}
          >
            {t('landing.title')}
          </h1>

          {/* Subtitle */}
          <p
            className="mb-8 max-w-[440px] text-base font-light leading-relaxed text-white/50 sm:mb-10 sm:text-lg"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.5s both' }}
          >
            {t('landing.subtitle')}
          </p>

          {/* CTA Button — glass effect with hover glow */}
          <div style={{ animation: 'fadeSlideUp 0.8s ease-out 0.7s both' }}>
            <button
              onClick={onStart}
              className="group relative w-full rounded-full px-10 py-4 text-[15px] font-medium tracking-wide text-white transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10 hover:border-white/30 hover:bg-white/[0.12] active:scale-[0.98] sm:w-auto"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              {t('landing.cta')}
              <span className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>

          {/* Enter hint */}
          <p
            className="mt-5 text-[12px] text-white/25"
            style={{ animation: 'fadeSlideUp 0.8s ease-out 0.9s both' }}
          >
            {t('landing.hint')}
          </p>
        </div>
      </div>
    </div>
  );
}
