// lib/events.ts — 全局事件名常量表（唯一真源，杜绝字面量散落）
export const EV = {
  /** 全局母线音量/静音广播：detail { volume: 0~100, isMuted: boolean } */
  master: 'focusroom:master',
  /** 睡眠定时到点：无 detail */
  sleepExpired: 'focusroom:sleep-expired',
  /** 请求打开声音工作台抽屉：detail { tab: 'ambient' | 'music' | 'presets' } */
  openDrawer: 'focusroom:open-drawer',
  /** 电台流加载失败：detail { stationId: string } */
  radioFailed: 'focusroom:radio-failed',
} as const
