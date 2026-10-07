/**
 * gen-sounds.js — 程序化合成三个室内学习白噪音（零版权风险，CC0 等效）
 *
 *   clock.wav     老式摆钟滴答（2s 无缝循环）
 *   keyboard.wav  轻柔键盘敲击（10s 循环）
 *   page-turn.wav 翻书沙沙声（10s 循环）
 *
 * 纯 Node 实现，无第三方依赖：16-bit PCM 单声道 32kHz WAV。
 * 循环无缝：所有事件都安排在 [0.05s, dur-0.3s] 区间内完成，首尾静音衔接。
 *
 * 运行：node scripts/gen-sounds.js
 */
const fs = require('fs')
const path = require('path')

const SAMPLE_RATE = 32000
const OUT_DIR = path.join(__dirname, '..', 'public', 'sounds')

// 确定性伪随机（可复现构建）
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createBuffer(durationSec) {
  const n = Math.round(durationSec * SAMPLE_RATE)
  return new Float64Array(n)
}

function writeWav(filename, samples) {
  const n = samples.length
  const dataSize = n * 2
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)       // PCM
  buf.writeUInt16LE(1, 22)       // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24)
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  for (let i = 0; i < n; i++) {
    let v = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
  }
  fs.writeFileSync(path.join(OUT_DIR, filename), buf)
  console.log(`  ${filename}: ${(buf.length / 1024).toFixed(0)} KB, ${(n / SAMPLE_RATE).toFixed(1)}s`)
}

// 一阶低通（α 由截止频率决定）
function lowpassAlpha(cutoffHz) {
  return 1 - Math.exp((-2 * Math.PI * cutoffHz) / SAMPLE_RATE)
}

/** 摆钟：tick(2100Hz) + tock(1600Hz)，各 45ms 指数衰减，附一点机械噪声 */
function genClock() {
  const dur = 2
  const buf = createBuffer(dur)
  const rand = mulberry32(20261005)

  const tick = (startSec, freq, gain) => {
    const start = Math.round(startSec * SAMPLE_RATE)
    const len = Math.round(0.045 * SAMPLE_RATE)
    const decay = 1 / (0.012 * SAMPLE_RATE) // 12ms 衰减常数
    const lp = lowpassAlpha(6000)
    let lpState = 0
    for (let i = 0; i < len && start + i < buf.length; i++) {
      const t = i / SAMPLE_RATE
      const env = Math.exp(-i * decay)
      const tone = Math.sin(2 * Math.PI * freq * t) * 0.8
      const noise = (rand() * 2 - 1) * 0.35
      lpState += lp * ((tone + noise) - lpState)
      buf[start + i] += lpState * env * gain
    }
  }

  tick(0.0, 2100, 0.5)
  tick(1.0, 1600, 0.42)
  writeWav('clock.wav', buf)
}

/** 键盘：随机节奏的"嗒"声 = 低频琴腔体正弦 + 高频噪声瞬态 */
function genKeyboard() {
  const dur = 10
  const buf = createBuffer(dur)
  const rand = mulberry32(777)

  let t = 0.08
  while (t < dur - 0.35) {
    const gain = 0.3 + rand() * 0.4
    const bodyFreq = 140 + rand() * 120 // 键体共振
    const clickStart = Math.round(t * SAMPLE_RATE)
    const bodyLen = Math.round(0.06 * SAMPLE_RATE)
    const clickLen = Math.round(0.012 * SAMPLE_RATE)
    const bodyDecay = 1 / (0.018 * SAMPLE_RATE)

    // 低频腔体
    for (let i = 0; i < bodyLen && clickStart + i < buf.length; i++) {
      const env = Math.exp(-i * bodyDecay)
      buf[clickStart + i] += Math.sin(2 * Math.PI * bodyFreq * (i / SAMPLE_RATE)) * env * gain * 0.7
    }
    // 高频瞬态（白噪经一阶高通）
    const hpAlpha = lowpassAlpha(2500)
    let lpState = 0
    for (let i = 0; i < clickLen && clickStart + i < buf.length; i++) {
      const x = rand() * 2 - 1
      lpState += hpAlpha * (x - lpState)
      const hp = x - lpState
      buf[clickStart + i] += hp * gain * 0.5
    }

    // 打字节奏：短促连击与停顿混合
    const gap = rand() < 0.25 ? 0.18 + rand() * 0.5 : 0.085 + rand() * 0.14
    t += gap
  }

  // 轻微整体动态起伏，避免机械感
  for (let i = 0; i < buf.length; i++) {
    const sway = 0.9 + 0.1 * Math.sin((2 * Math.PI * i) / SAMPLE_RATE / 5.3)
    buf[i] *= sway
  }
  writeWav('keyboard.wav', buf)
}

/** 翻书：纸页摩擦 = 截止频率扫动的噪声 + 稀疏纸张脆响 */
function genPageTurn() {
  const dur = 10
  const buf = createBuffer(dur)
  const rand = mulberry32(424242)

  const swish = (startSec, gain) => {
    const start = Math.round(startSec * SAMPLE_RATE)
    const len = Math.round(0.55 * SAMPLE_RATE)
    let lpState = 0
    for (let i = 0; i < len && start + i < buf.length; i++) {
      const p = i / len // 0..1
      // 包络：快起慢落
      const env = p < 0.15 ? p / 0.15 : Math.exp(-((p - 0.15) / 0.5) * 2.2)
      // 截止频率先升后降：纸张加速摩擦
      const cutoff = 900 + 2600 * Math.sin(Math.PI * p)
      const alpha = lowpassAlpha(cutoff)
      const x = rand() * 2 - 1
      lpState += alpha * (x - lpState)
      buf[start + i] += lpState * env * gain
    }
    // 几粒纸张脆响点缀
    const crackles = 3 + Math.floor(rand() * 4)
    for (let c = 0; c < crackles; c++) {
      const cp = start + Math.round((0.1 + rand() * 0.4) * len)
      const cl = Math.round(0.004 * SAMPLE_RATE)
      const cAlpha = lowpassAlpha(4000)
      let clp = 0
      for (let i = 0; i < cl && cp + i < buf.length; i++) {
        const x = rand() * 2 - 1
        clp += cAlpha * (x - clp)
        buf[cp + i] += (x - clp) * gain * 0.25 * Math.exp(-i / (0.001 * SAMPLE_RATE))
      }
    }
  }

  swish(0.6, 0.5)
  swish(3.9, 0.42)
  swish(7.1, 0.48)
  writeWav('page-turn.wav', buf)
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
console.log('Generating sounds...')
genClock()
genKeyboard()
genPageTurn()
console.log('Done.')
