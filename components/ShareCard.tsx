'use client'

import { useEffect, useRef, useState } from 'react'
import { t, useTranslation } from '@/lib/i18n'
import { POSTER_SOURCES } from './VideoBackground'
import { formatMinutes } from '@/lib/format'

interface Props {
  pomodoros: number
  studyMinutes: number
  sceneName: string
  sceneId: string
  onClose: () => void
}

const CANVAS_W = 1080
const CANVAS_H = 1440 // 3:4，适配手机壁纸与社交分享

interface DrawOptions {
  pomodoros: number
  studyMinutes: number
  sceneName: string
  dateText: string
  poster: HTMLImageElement | null
}

function drawCard(canvas: HTMLCanvasElement, opts: DrawOptions) {
  const { pomodoros, studyMinutes, sceneName, dateText, poster } = opts
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height

  // --- 背景：真实场景海报（cover 裁切），失败则回退渐变 ---
  if (poster && poster.naturalWidth > 0) {
    const scale = Math.max(W / poster.naturalWidth, H / poster.naturalHeight)
    const dw = poster.naturalWidth * scale
    const dh = poster.naturalHeight * scale
    ctx.drawImage(poster, (W - dw) / 2, (H - dh) / 2, dw, dh)

    // 暗色玻璃层：保证文字可读，同时透出场景氛围
    const veil = ctx.createLinearGradient(0, 0, 0, H)
    veil.addColorStop(0, 'rgba(5,5,16,0.72)')
    veil.addColorStop(0.5, 'rgba(8,8,24,0.6)')
    veil.addColorStop(1, 'rgba(2,2,10,0.8)')
    ctx.fillStyle = veil
    ctx.fillRect(0, 0, W, H)
  } else {
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#0f0f1a')
    bg.addColorStop(0.5, '#141428')
    bg.addColorStop(1, '#1a0a2e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
  }

  // --- 装饰圆 ---
  const drawCircle = (x: number, y: number, r: number, color: string) => {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
  drawCircle(W * 0.15, H * 0.2, 200, 'rgba(139,92,246,0.07)')
  drawCircle(W * 0.85, H * 0.75, 160, 'rgba(236,72,153,0.05)')
  drawCircle(W * 0.7, H * 0.12, 100, 'rgba(59,130,246,0.05)')

  // --- 顶部品牌 ---
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '500 26px -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif'
  try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '6px' } catch {}
  ctx.fillText(t('share.brand'), W / 2, 84)
  try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px' } catch {}

  const lineGrad = ctx.createLinearGradient(W / 2 - 120, 0, W / 2 + 120, 0)
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)')
  lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.25)')
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = lineGrad
  ctx.fillRect(W / 2 - 120, 124, 240, 2)

  // --- 主标题 ---
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 76px -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif'
  ctx.fillText(`🍅 ${t('share.complete')}`, W / 2, 260)

  // --- 日期 ---
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '400 30px -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif'
  ctx.fillText(dateText, W / 2, 340)

  // --- 统计卡片 ---
  const cardW = 320
  const cardH = 200
  const cardY = 440
  const gap = 60
  const leftCardX = W / 2 - cardW - gap / 2
  const rightCardX = W / 2 + gap / 2

  const drawStatCard = (x: number, y: number, value: string, label: string) => {
    const cardBg = ctx.createLinearGradient(x, y, x, y + cardH)
    cardBg.addColorStop(0, 'rgba(255,255,255,0.1)')
    cardBg.addColorStop(1, 'rgba(255,255,255,0.03)')
    ctx.fillStyle = cardBg

    const radius = 28
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

    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 84px -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif'
    ctx.fillText(value, x + cardW / 2, y + 88)

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '400 26px -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif'
    ctx.fillText(label, x + cardW / 2, y + 152)
  }

  drawStatCard(leftCardX, cardY, String(pomodoros), t('share.pomodoros'))

  drawStatCard(rightCardX, cardY, formatMinutes(studyMinutes), t('share.study'))

  // --- 场景信息 ---
  const bottomY = H - 200
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '400 34px -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif'
  try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '2px' } catch {}
  ctx.fillText(`✦  ${sceneName}`, W / 2, bottomY)
  try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px' } catch {}

  ctx.fillStyle = lineGrad
  ctx.fillRect(W / 2 - 80, bottomY + 40, 160, 1.5)

  // --- 底部水印点缀 ---
  drawCircle(W * 0.08, H - 60, 5, 'rgba(139,92,246,0.25)')
  drawCircle(W * 0.12, H - 52, 3, 'rgba(236,72,153,0.18)')
  drawCircle(W * 0.88, H - 60, 4, 'rgba(59,130,246,0.22)')
  drawCircle(W * 0.92, H - 50, 3, 'rgba(251,191,36,0.18)')
}

export default function ShareCard({ pomodoros, studyMinutes, sceneName, sceneId, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share)
  const { locale } = useTranslation()

  const dateText = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    const render = (poster: HTMLImageElement | null) => {
      if (cancelled) return
      drawCard(canvas, { pomodoros, studyMinutes, sceneName, dateText, poster })
      setImgSrc(canvas.toDataURL('image/png'))
    }

    // 海报图与页面同源（public/posters/），Canvas 不会被污染，可正常导出
    const posterSrc = POSTER_SOURCES[sceneId]
    if (posterSrc) {
      const img = new Image()
      img.onload = () => render(img)
      img.onerror = () => render(null)
      img.src = posterSrc
    } else {
      render(null)
    }

    return () => { cancelled = true }
  }, [pomodoros, studyMinutes, sceneName, sceneId, dateText])

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
      <div className="glass-strong rounded-2xl p-6 max-w-[440px] w-full max-h-[92vh] overflow-y-auto scrollbar-thin animate-scale-in shadow-2xl">
        {/* Hidden canvas for rendering */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="hidden"
        />

        {/* Preview */}
        {imgSrc && (
          <div className="rounded-xl overflow-hidden mb-4 border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
