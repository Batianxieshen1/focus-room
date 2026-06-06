'use client'

import { useEffect, useRef, useState } from 'react'
import { t } from '@/lib/i18n'

interface Props {
  pomodoros: number
  studyMinutes: number
  sceneName: string
  onClose: () => void
}

function drawCard(
  canvas: HTMLCanvasElement,
  pomodoros: number,
  studyMinutes: number,
  sceneName: string,
) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height

  // --- Background gradient ---
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0f0f1a')
  bg.addColorStop(0.5, '#141428')
  bg.addColorStop(1, '#1a0a2e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // --- Subtle decorative circles ---
  const drawCircle = (x: number, y: number, r: number, color: string) => {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }

  drawCircle(W * 0.15, H * 0.2, 180, 'rgba(139,92,246,0.06)')
  drawCircle(W * 0.85, H * 0.75, 140, 'rgba(236,72,153,0.05)')
  drawCircle(W * 0.7, H * 0.15, 90, 'rgba(59,130,246,0.04)')
  drawCircle(W * 0.25, H * 0.85, 70, 'rgba(251,191,36,0.04)')

  // --- Subtle grid dots ---
  ctx.fillStyle = 'rgba(255,255,255,0.015)'
  for (let x = 40; x < W; x += 48) {
    for (let y = 40; y < H; y += 48) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // --- Top accent line ---
  const accentGrad = ctx.createLinearGradient(W * 0.3, 0, W * 0.7, 0)
  accentGrad.addColorStop(0, 'rgba(139,92,246,0)')
  accentGrad.addColorStop(0.5, 'rgba(139,92,246,0.6)')
  accentGrad.addColorStop(1, 'rgba(139,92,246,0)')
  ctx.fillStyle = accentGrad
  ctx.fillRect(W * 0.3, 0, W * 0.4, 2)

  // --- Brand text ---
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '500 16px -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillText(t('share.brand'), W / 2, 50)

  // --- Decorative line under brand ---
  const lineGrad = ctx.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0)
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)')
  lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)')
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = lineGrad
  ctx.fillRect(W / 2 - 80, 72, 160, 1)

  // --- Main title ---
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 48px -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif'
  ctx.fillText(`🍅 ${t('share.complete')}`, W / 2, 140)

  // --- Stat cards ---
  const cardW = 180
  const cardH = 120
  const cardY = 195
  const gap = 40
  const leftCardX = W / 2 - cardW - gap / 2
  const rightCardX = W / 2 + gap / 2

  const drawStatCard = (x: number, y: number, value: string, label: string) => {
    // Card background
    const cardBg = ctx.createLinearGradient(x, y, x, y + cardH)
    cardBg.addColorStop(0, 'rgba(255,255,255,0.06)')
    cardBg.addColorStop(1, 'rgba(255,255,255,0.02)')
    ctx.fillStyle = cardBg

    // Rounded rect
    const radius = 16
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + cardW - radius, y)
    ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + radius)
    ctx.lineTo(x + cardW, y + cardH - radius)
    ctx.quadraticCurveTo(x + cardW, y + cardH, x + cardW - radius, y + cardH)
    ctx.lineTo(x + radius, y + cardH)
    ctx.quadraticCurveTo(x, y + cardH, x, y + cardH - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()

    // Card border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Value
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 44px -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif'
    ctx.fillText(value, x + cardW / 2, y + 52)

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '400 14px -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif'
    ctx.fillText(label, x + cardW / 2, y + 92)
  }

  drawStatCard(leftCardX, cardY, String(pomodoros), t('share.pomodoros'))

  const formatMinutes = (m: number) => {
    if (m >= 60) {
      const h = Math.floor(m / 60)
      const min = m % 60
      return min > 0 ? `${h}h${min}` : `${h}h`
    }
    return `${m}`
  }
  drawStatCard(rightCardX, cardY, formatMinutes(studyMinutes), t('share.study'))

  // --- Scene info at bottom ---
  const bottomY = H - 100

  // Scene icon + name
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '400 18px -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif'
  ctx.fillText(`✦  ${sceneName}`, W / 2, bottomY)

  // Bottom decorative line
  ctx.fillStyle = lineGrad
  ctx.fillRect(W / 2 - 60, bottomY + 20, 120, 1)

  // --- Subtle watermark-style circles at bottom ---
  drawCircle(W * 0.08, H - 40, 4, 'rgba(139,92,246,0.2)')
  drawCircle(W * 0.12, H - 35, 2, 'rgba(236,72,153,0.15)')
  drawCircle(W * 0.88, H - 40, 3, 'rgba(59,130,246,0.18)')
  drawCircle(W * 0.92, H - 32, 2, 'rgba(251,191,36,0.15)')
}

export default function ShareCard({ pomodoros, studyMinutes, sceneName, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(!!navigator.share)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawCard(canvas, pomodoros, studyMinutes, sceneName)
    setImgSrc(canvas.toDataURL('image/png'))
  }, [pomodoros, studyMinutes, sceneName])

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `focus-room-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handleShare = async () => {
    const canvas = canvasRef.current
    if (!canvas || !navigator.share) return
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'focus-room.png', { type: 'image/png' })
        await navigator.share({
          title: t('share.title'),
          text: t('share.brand'),
          files: [file],
        })
      }, 'image/png')
    } catch {
      // user cancelled or share failed
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="glass-strong rounded-2xl p-6 max-w-[440px] w-full animate-scale-in shadow-2xl">
        {/* Hidden canvas for rendering */}
        <canvas
          ref={canvasRef}
          width={1080}
          height={1080}
          className="hidden"
        />

        {/* Preview */}
        {imgSrc && (
          <div className="rounded-xl overflow-hidden mb-4 border border-white/10">
            <img
              src={imgSrc}
              alt="Share card"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            {t('share.save')}
          </button>
          {canShare && (
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 text-white transition-colors"
            >
              {t('share.share')}
            </button>
          )}
        </div>

        {/* Close hint */}
        <div className="text-center mt-3">
          <button
            onClick={onClose}
            className="text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            {t('report.clickToDismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
