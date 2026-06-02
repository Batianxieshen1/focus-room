'use client'

export type Locale = 'zh' | 'en'

const translations = {
  zh: {
    // Tab names / toolbar
    'sound.title': '白噪音',
    'sound.muteAll': '全部静音',
    'sound.restore': '恢复',
    'scene.title': '场景',
    'stats.title': '学习统计',
    'settings.title': '设置',
    'calendar.title': '学习日历',

    // Stats
    'stats.weekStudy': '本周学习',
    'stats.completedPomodoros': '完成番茄',
    'stats.last7Days': '近 7 天',
    'stats.history': '历史记录',
    'stats.trend': '趋势',
    'stats.last4Weeks': '近 4 周',
    'stats.exportData': '导出数据',
    'stats.importData': '导入数据',
    'stats.importSuccess': '数据导入成功！',
    'stats.importError': '导入数据格式无效',
    'stats.importSizeError': '文件大小超过限制（5MB）',
    'stats.weekChange': '周环比',
    'stats.increase': '增长',
    'stats.decrease': '下降',
    'stats.noChange': '无变化',

    // Calendar
    'calendar.monthTotal': '本月学习',
    'calendar.weekdays': '日,一,二,三,四,五,六',
    'calendar.noData': '暂无数据',
    'calendar.minutes': '分钟',
    'calendar.hours': '小时',

    // Settings
    'settings.pomodoro': '番茄钟时长',
    'settings.shortBreak': '短休息时长',
    'settings.longBreak': '长休息时长',
    'settings.longBreakInterval': '长休息间隔（每 N 个番茄）',
    'settings.shortcuts': '快捷键',
    'settings.startPause': '开始/暂停',
    'settings.reset': '重置',
    'settings.switchMode': '切换模式',
    'settings.mute': '静音',
    'settings.focusMode': '专注模式',
    'settings.exitFocus': '退出专注',
    'settings.save': '保存设置',
    'settings.language': '语言',
    'settings.chinese': '中文',
    'settings.english': 'English',
    'settings.theme': '主题',
    'settings.dark': '深色',
    'settings.light': '浅色',

    // Daily goal
    'goal.title': '每日目标',

    // Notifications
    'notify.pomodoroDone': '番茄钟结束，休息一下吧！',
    'notify.breakDone': '休息结束，继续加油！',
    'notify.timerDone': '计时结束！',

    // Focus mode
    'focus.hint': '双击屏幕 · 按 Esc 退出专注模式',

    // Custom sounds
    'sound.addCustom': '添加',
    'sound.removeCustom': '移除',
    'sound.customSound': '自定义',
    'sound.maxSizeError': '音频文件不能超过 5MB',
    'sound.totalSizeError': '自定义音效总大小不能超过 5MB',
    'sound.formatError': '不支持的音频格式',
    'shortcut.dismiss': '不再显示',
  },
  en: {
    // Tab names / toolbar
    'sound.title': 'WHITE NOISE',
    'sound.muteAll': 'Mute All',
    'sound.restore': 'Restore',
    'scene.title': 'SCENE',
    'stats.title': 'Statistics',
    'settings.title': 'Settings',
    'calendar.title': 'Study Calendar',

    // Stats
    'stats.weekStudy': 'This Week',
    'stats.completedPomodoros': 'Pomodoros',
    'stats.last7Days': 'Last 7 Days',
    'stats.history': 'History',
    'stats.trend': 'Trend',
    'stats.last4Weeks': 'Last 4 Weeks',
    'stats.exportData': 'Export Data',
    'stats.importData': 'Import Data',
    'stats.importSuccess': 'Data imported successfully!',
    'stats.importError': 'Invalid import file format',
    'stats.importSizeError': 'File size exceeds limit (5MB)',
    'stats.weekChange': 'WoW',
    'stats.increase': 'up',
    'stats.decrease': 'down',
    'stats.noChange': 'no change',

    // Calendar
    'calendar.monthTotal': 'This Month',
    'calendar.weekdays': 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
    'calendar.noData': 'No data',
    'calendar.minutes': 'min',
    'calendar.hours': 'hours',

    // Settings
    'settings.pomodoro': 'Pomodoro Duration',
    'settings.shortBreak': 'Short Break',
    'settings.longBreak': 'Long Break',
    'settings.longBreakInterval': 'Long Break Interval (every N pomodoros)',
    'settings.shortcuts': 'Shortcuts',
    'settings.startPause': 'Start/Pause',
    'settings.reset': 'Reset',
    'settings.switchMode': 'Switch Mode',
    'settings.mute': 'Mute',
    'settings.focusMode': 'Focus Mode',
    'settings.exitFocus': 'Exit Focus',
    'settings.save': 'Save Settings',
    'settings.language': 'Language',
    'settings.chinese': '中文',
    'settings.english': 'English',
    'settings.theme': 'Theme',
    'settings.dark': 'Dark',
    'settings.light': 'Light',

    // Daily goal
    'goal.title': 'Daily Goal',

    // Notifications
    'notify.pomodoroDone': 'Pomodoro done, take a break!',
    'notify.breakDone': 'Break over, keep going!',
    'notify.timerDone': 'Timer done!',

    // Focus mode
    'focus.hint': 'Double-click screen · Press Esc to exit focus mode',

    // Custom sounds
    'sound.addCustom': 'Add',
    'sound.removeCustom': 'Remove',
    'sound.customSound': 'Custom',
    'sound.maxSizeError': 'Audio file must be under 5MB',
    'sound.totalSizeError': 'Total custom sounds must be under 5MB',
    'sound.formatError': 'Unsupported audio format',
    'shortcut.dismiss': 'Don\'t show again',
  },
} as const

type TranslationKey = keyof typeof translations.zh

let currentLocale: Locale = 'zh'

function getSavedLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  try {
    const saved = localStorage.getItem('focus-room-locale')
    if (saved === 'zh' || saved === 'en') return saved
  } catch {}
  return 'zh'
}

export function initLocale() {
  currentLocale = getSavedLocale()
}

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale) {
  currentLocale = locale
  try {
    localStorage.setItem('focus-room-locale', locale)
  } catch {}
}

export function t(key: TranslationKey, fallback?: string): string {
  return translations[currentLocale][key] || translations['zh'][key] || fallback || key
}

export function useTranslation() {
  return { t, getLocale, setLocale }
}
