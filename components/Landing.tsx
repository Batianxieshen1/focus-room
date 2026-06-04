'use client';

import { useEffect, useRef, useCallback } from 'react';
import { t } from '@/lib/i18n';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  const rootRef = useRef<HTMLDivElement>(null);

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
      ref={rootRef}
      className="absolute inset-0 z-10 flex items-center"
    >
      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Brand logo - top left */}
      <div className="absolute left-8 top-8 z-20 flex items-center gap-2.5">
        {/* Book SVG icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/50"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 7h6" />
          <path d="M8 11h4" />
        </svg>
        <span className="text-sm font-light tracking-wide text-white/50">
          Focus Room
        </span>
      </div>

      {/* Center-left content area */}
      <div className="relative z-20 ml-[8vw] mt-[-4vh] max-w-[540px] px-6">
        {/* Tagline */}
        <p
          className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-white/40"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 0.1s both' }}
        >
          {t('landing.tagline')}
        </p>

        {/* Hero title */}
        <h1
          className="mb-6 text-white whitespace-pre-line"
          style={{
            fontSize: 'clamp(3rem, 6vw, 6rem)',
            fontWeight: 200,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            animation: 'fadeSlideUp 0.8s ease-out 0.3s both',
          }}
        >
          {t('landing.title')}
        </h1>

        {/* Subtitle */}
        <p
          className="mb-10 max-w-[480px] text-base font-light leading-relaxed text-white/60"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 0.55s both' }}
        >
          {t('landing.subtitle')}
        </p>

        {/* CTA Button */}
        <div style={{ animation: 'fadeSlideUp 0.8s ease-out 0.8s both' }}>
          <button
            onClick={onStart}
            className="group rounded-full border border-white/15 px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 active:scale-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {t('landing.cta')}
            <span className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </button>
        </div>

        {/* Hint */}
        <p
          className="mt-5 text-[12px] text-white/30"
          style={{ animation: 'fadeSlideUp 0.8s ease-out 1.0s both' }}
        >
          {t('landing.hint')}
        </p>
      </div>

    </div>
  );
}
