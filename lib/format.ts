// lib/format.ts — 时间格式化唯一真源
/** 秒 → "mm:ss" 或 "h:mm:ss"（满 1 小时进位），tabular 场景通用 */
export function formatClock(totalSecs: number): string {
  const s = Math.max(0, Math.floor(totalSecs))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** 分钟 → "45" / "1h05" / "2h"（分享卡统计用） */
export function formatMinutes(mins: number): string {
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h${m}` : `${h}h`
  }
  return `${mins}`
}

/** Date → "YYYY-MM-DD" 本地日期键（存储/历史索引用） */
export function formatDateKey(d?: Date): string {
  const dt = d || new Date()
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
