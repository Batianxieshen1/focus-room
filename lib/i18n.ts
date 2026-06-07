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
    'sound.maxSizeError': '音频文件不能超过 50MB',
    'sound.totalSizeError': '自定义音效总大小不能超过 5MB',
    'sound.formatError': '不支持的音频格式',
    'sound.importLocal': '导入本地音乐',
    'sound.importSuccess': '导入成功',
    'sound.importError': '文件格式不支持',
    'sound.importSizeError': '文件太大（最大 50MB）',
    'sound.searchOnline': '搜索在线音乐',
    'sound.searchPlaceholder': '搜索歌曲或艺术家...',
    'sound.searching': '搜索中...',
    'sound.noResults': '未找到结果',
    'shortcut.dismiss': '不再显示',

    // TopNav
    'nav.backToScenes': '返回场景',
    'nav.tools': '专注工具',
    'nav.memo': '备忘录',
    'nav.stats': '学习统计',
    'nav.calendar': '学习日历',
    'nav.music': '纯音乐',
    'nav.contact': '联系我们',
    'nav.clearScreen': '清屏',

    // BottomBar
    'bar.scene': '场景',
    'bar.sound': '声音',
    'bar.mute': '静音',
    'bar.unmute': '取消静音',
    'bar.settings': '设置',
    'bar.fullscreen': '全屏',
    'bar.prevScene': '上一个场景',
    'bar.nextScene': '下一个场景',
    'bar.sleepTimer': '睡眠定时',
    'bar.soundMixer': '音效面板',
    'bar.sleepOff': '关闭',
    'bar.sleep30': '30 分钟',
    'bar.sleep60': '60 分钟',
    'bar.sleep90': '90 分钟',

    // FocusView
    'focus.step03': 'STEP 03 · POMODORO',
    'focus.clearHint': '双击屏幕或按 Esc 退出清屏',

    // Timer
    'timer.pomodoro': '番茄钟',
    'timer.stopwatch': '计时器',
    'timer.countdown': '倒计时',
    'timer.focusing': '📚 专注中',
    'timer.longBreak': '🌿 长休息',
    'timer.shortBreak': '☕ 短休息',
    'timer.completed': '已完成',
    'timer.pomodoroCount': '个番茄',
    'timer.todayStudy': '今日已学习',
    'timer.pageTitle': 'Focus Room | 沉浸式自习室',

    // Focus completion report
    'report.title': '🍅 专注完成！',
    'report.todayPomodoros': '今日已完成 X 个番茄',
    'report.todayStudy': '今日累计学习 XX:XX',
    'report.clickToDismiss': '点击关闭',

    // Video
    'video.retry': '重新加载',

    // ScenePicker
    'picker.backToCover': '返回封面',
    'picker.chooseWindow': 'CHOOSE YOUR WINDOW',
    'picker.step02': 'STEP 02 · 选一扇窗',
    'picker.findPlace': '找一个\n此刻想停留的地方',
    'picker.sceneTip': '每扇窗外都有不同的光。选好之后，剩下的交给时间。',
    'picker.start': '就这里，开始专注 →',
    'picker.music': '音乐',

    // Landing
    'landing.tagline': 'BREATHE · FOCUS · FLOW',
    'landing.title': '世界很吵\n给自己一间安静的房间',
    'landing.subtitle': '选一扇窗，调一盏灯，放一段属于此刻的声音。时间是你的，节奏也是。',
    'landing.cta': '选一扇窗',
    'landing.hint': '按 Enter 也可以',

    // FocusTools
    'tools.title': 'Focus Tools',
    'tools.sectionTitle': '常用学习入口',
    'tools.sectionDesc': '保存课程、笔记、词典、资料站。',
    'tools.namePlaceholder': '名称',
    'tools.urlPlaceholder': '链接',
    'tools.add': '添加',
    'tools.nameAndUrlRequired': '名称和链接都不能为空',
    'tools.urlInvalid': '链接必须以 http:// 或 https:// 开头',

    // MemoPanel
    'memo.title': 'Notes',
    'memo.heading': 'To do list',
    'memo.newReminder': 'New reminder...',
    'memo.writeHint': 'Write down the next thing to finish.',
    'memo.clearCompleted': 'Clear completed',
    'memo.emptyDone': 'No completed tasks yet.',
    'memo.emptyActive': 'All done! Nothing active.',
    'memo.emptyAll': 'Add a reminder to get started.',
    'memo.activeCount': 'active',
    'memo.completedCount': 'completed',

    // DailyGoal
    'goal.dailyTarget': '每日目标',

    // Sound mixer
    'sound.category': '白噪音',
    'sound.tabSearch': '搜索',
    'sound.tabUrl': '链接',
    'sound.pasteUrl': '粘贴音频链接（mp3/wav/ogg）',
    'sound.urlName': '曲目名称（可选）',
    'sound.addUrl': '添加',
    'sound.fetching': '下载中...',
    'sound.fetchDone': '添加成功',
    'sound.fetchError': '下载失败',
    'sound.preview': '试听',
    'sound.addFull': '添加',
    'sound.duration': '时长',
    'sound.myMusic': '我的音乐',
    'sound.searchAndAdd': '搜索与添加',
    'sound.localImport': '导入本地',
    'sound.buffering': '加载中...',
    'sound.linkHint': '支持 MP3、WAV、OGG 格式的直链',
    'sound.guide': '教程',
    'sound.guideDesc': '使用教程',
    'sound.guideStep1': '1. 在音乐网站找到歌曲',
    'sound.guideStep2': '2. 右键点击 → 复制音频地址',
    'sound.guideStep3': '3. 粘贴到「链接」输入框',
    'sound.guideSource': '推荐：Pixabay Music、Free Music Archive',
    'sound.tabYoutube': 'YouTube',
    'sound.ytSearch': '搜索歌曲或艺术家...',
    'sound.ytSearchBtn': '搜索',
    'sound.ytClose': '关闭播放器',
    'sound.ytHint': '推荐氛围音乐',

    // Onboarding
    'onboard.step1': '选择一个窗外场景',
    'onboard.step1desc': '每个场景都有独特的光线和氛围',
    'onboard.step2': '打开你喜欢的白噪音',
    'onboard.step2desc': '雨声、海浪、森林...找到属于你的声音',
    'onboard.step3': '开始你的专注时间',
    'onboard.step3desc': '番茄钟、正计时或倒计时，自由选择',
    'onboard.next': '下一步',
    'onboard.start': '开始吧',

    // Calendar active days
    'calendar.activeDays': '天',

    // Calendar months
    'calendar.months': '1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月',

    // ErrorBoundary
    'error.title': '页面出了点问题',
    'error.retry': '刷新重试',

    // StudyStats
    'stats.thisWeek': '本周',
    'stats.weeksAgo': '周前',

    // DailyGoal labels
    'goal.30m': '30分钟',
    'goal.1h': '1小时',
    'goal.1.5h': '1.5小时',
    'goal.2h': '2小时',
    'goal.3h': '3小时',
    'goal.4h': '4小时',

    // ShortcutToast
    'shortcut.title': '快捷键',
    'shortcut.startPause': '开始/暂停',
    'shortcut.reset': '重置',
    'shortcut.switchMode': '切换模式',
    'shortcut.muteAll': '全部静音',

    // InstallPrompt
    'install.title': '安装到桌面',
    'install.desc': '像原生 App 一样使用',
    'install.button': '安装',

    // Scene names
    'scene.mountainLakeName': '高山湖泊',
    'scene.mountainLakeDesc': '水面如镜，远山含雪。安静得只听得见自己的呼吸。',
    'scene.seasideName': '海边小屋',
    'scene.seasideDesc': '潮水轻拍岸边，节奏像呼吸一样自然。思绪随浪花散开。',
    'scene.forestName': '林间小路',
    'scene.forestDesc': '阳光穿过树梢，光影缓缓移动。空气里有泥土和叶子的味道。',
    'scene.starrySkyName': '星河夜空',
    'scene.starrySkyDesc': '满天星斗缓缓转动，夜色温柔得像一首低声哼的歌。',
    'scene.rainyCafeName': '雨天窗边',
    'scene.rainyCafeDesc': '雨敲玻璃，世界被水声隔在外面。适合一个人安静待着。',
    'scene.snowyWindowName': '雪落无声',
    'scene.snowyWindowDesc': '雪花慢慢落下来，世界变得很轻。适合不被打扰的午后。',
    'scene.campfireName': '篝火夜话',
    'scene.campfireDesc': '火焰噼啪声，温暖的光在黑暗中跳动。适合夜晚的深度思考。',
    'scene.cityNightName': '城市夜景',
    'scene.cityNightDesc': '远处的灯火像星星一样闪烁，城市的节奏在窗外流淌。',
    'scene.starryTentName': '星空帐篷',
    'scene.starryTentDesc': '帐篷外是银河，帐篷内是温暖的角落。天地之间只有你。',

    // Scene recommendation hint
    'scene.recommendHint': '推荐搭配「{name}」白噪音',

    // Sound names
    'sound.rain': '雨声',
    'sound.ocean': '海浪',
    'sound.forest': '森林',
    'sound.fire': '壁炉',
    'sound.cafe': '咖啡馆',
    'sound.wind': '风声',
    'sound.night': '夏夜',
    'sound.whitenoise': '白噪音',

    // StudyStats
    'stats.startFirstFocus': '🎯 开始你的第一次专注吧！',

    // Memo confirm
    'memo.confirmClear': '确定要清空所有已完成的任务吗？',

    // FocusTools confirm
    'tools.confirmDelete': '确定要删除这个链接吗？',

    // Share card
    'share.title': '分享成就',
    'share.save': '保存图片',
    'share.share': '分享',
    'share.complete': '专注完成',
    'share.pomodoros': '个番茄',
    'share.study': '分钟学习',
    'share.brand': 'Focus Room · 沉浸式自习室',
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
    'sound.maxSizeError': 'Audio file must be under 50MB',
    'sound.totalSizeError': 'Total custom sounds must be under 5MB',
    'sound.formatError': 'Unsupported audio format',
    'sound.importLocal': 'Import Local Music',
    'sound.importSuccess': 'Import successful',
    'sound.importError': 'File format not supported',
    'sound.importSizeError': 'File too large (max 50MB)',
    'sound.searchOnline': 'Search Online Music',
    'sound.searchPlaceholder': 'Search songs or artists...',
    'sound.searching': 'Searching...',
    'sound.noResults': 'No results found',
    'shortcut.dismiss': 'Don\'t show again',

    // TopNav
    'nav.backToScenes': 'Back to Scenes',
    'nav.tools': 'Tools',
    'nav.memo': 'Notes',
    'nav.stats': 'Statistics',
    'nav.calendar': 'Calendar',
    'nav.music': 'Music',
    'nav.contact': 'Contact',
    'nav.clearScreen': 'Clear Screen',

    // BottomBar
    'bar.scene': 'SCENE',
    'bar.sound': 'SOUND',
    'bar.mute': 'Mute',
    'bar.unmute': 'Unmute',
    'bar.settings': 'Settings',
    'bar.fullscreen': 'Fullscreen',
    'bar.prevScene': 'Previous scene',
    'bar.nextScene': 'Next scene',
    'bar.sleepTimer': 'Sleep Timer',
    'bar.soundMixer': 'Sound Mixer',
    'bar.sleepOff': 'Off',
    'bar.sleep30': '30 min',
    'bar.sleep60': '60 min',
    'bar.sleep90': '90 min',

    // FocusView
    'focus.step03': 'STEP 03 · POMODORO',
    'focus.clearHint': 'Double-click or press Esc to exit clear screen',

    // Timer
    'timer.pomodoro': 'Pomodoro',
    'timer.stopwatch': 'Stopwatch',
    'timer.countdown': 'Countdown',
    'timer.focusing': '📚 Focusing',
    'timer.longBreak': '🌿 Long Break',
    'timer.shortBreak': '☕ Short Break',
    'timer.completed': 'completed',
    'timer.pomodoroCount': 'pomodoros',
    'timer.todayStudy': 'Today\'s study',
    'timer.pageTitle': 'Focus Room | Immersive Study',

    // Focus completion report
    'report.title': '🍅 Focus Complete!',
    'report.todayPomodoros': 'Today: X pomodoros completed',
    'report.todayStudy': 'Total study today: XX:XX',
    'report.clickToDismiss': 'Click to dismiss',

    // Video
    'video.retry': 'Retry',

    // ScenePicker
    'picker.backToCover': 'Back to Cover',
    'picker.chooseWindow': 'CHOOSE YOUR WINDOW',
    'picker.step02': 'STEP 02 · Choose a Window',
    'picker.findPlace': 'Find a place\nyou want to stay',
    'picker.sceneTip': 'Each window offers a different light. Choose, and leave the rest to time.',
    'picker.start': 'This one, let\'s focus →',
    'picker.music': 'Music',

    // Landing
    'landing.tagline': 'BREATHE · FOCUS · FLOW',
    'landing.title': 'The world is noisy\nGive yourself a quiet room',
    'landing.subtitle': 'Pick a window, adjust the light, play a sound that belongs to this moment. Time is yours, so is the rhythm.',
    'landing.cta': 'Pick a window',
    'landing.hint': 'Press Enter to start',

    // FocusTools
    'tools.title': 'Focus Tools',
    'tools.sectionTitle': 'Quick Links',
    'tools.sectionDesc': 'Save courses, notes, dictionaries, and resources.',
    'tools.namePlaceholder': 'Name',
    'tools.urlPlaceholder': 'URL',
    'tools.add': 'Add',
    'tools.nameAndUrlRequired': 'Name and URL are required',
    'tools.urlInvalid': 'URL must start with http:// or https://',

    // MemoPanel
    'memo.title': 'Notes',
    'memo.heading': 'To do list',
    'memo.newReminder': 'New reminder...',
    'memo.writeHint': 'Write down the next thing to finish.',
    'memo.clearCompleted': 'Clear completed',
    'memo.emptyDone': 'No completed tasks yet.',
    'memo.emptyActive': 'All done! Nothing active.',
    'memo.emptyAll': 'Add a reminder to get started.',
    'memo.activeCount': 'active',
    'memo.completedCount': 'completed',

    // DailyGoal
    'goal.dailyTarget': 'Daily Goal',

    // Sound mixer
    'sound.category': 'White Noise',
    'sound.tabSearch': 'Search',
    'sound.tabUrl': 'URL',
    'sound.pasteUrl': 'Paste audio URL (mp3/wav/ogg)',
    'sound.urlName': 'Track name (optional)',
    'sound.addUrl': 'Add',
    'sound.fetching': 'Downloading...',
    'sound.fetchDone': 'Added successfully',
    'sound.fetchError': 'Download failed',
    'sound.preview': 'Preview',
    'sound.addFull': 'Add',
    'sound.duration': 'Duration',
    'sound.myMusic': 'MY MUSIC',
    'sound.searchAndAdd': 'SEARCH & ADD',
    'sound.localImport': 'Import',
    'sound.buffering': 'Loading...',
    'sound.linkHint': 'Direct links to MP3, WAV, or OGG files',
    'sound.guide': 'Guide',
    'sound.guideDesc': 'How to get audio links',
    'sound.guideStep1': '1. Find a song on a music website',
    'sound.guideStep2': '2. Right-click -> Copy audio address',
    'sound.guideStep3': '3. Paste into the URL input above',
    'sound.guideSource': 'Recommended: Pixabay Music, Free Music Archive',
    'sound.tabYoutube': 'YouTube',
    'sound.ytSearch': 'Search songs or artists...',
    'sound.ytSearchBtn': 'Search',
    'sound.ytClose': 'Close Player',
    'sound.ytHint': 'Ambient playlists',

    // Onboarding
    'onboard.step1': 'Choose a window scene',
    'onboard.step1desc': 'Each scene has unique light and atmosphere',
    'onboard.step2': 'Turn on your favorite white noise',
    'onboard.step2desc': 'Rain, ocean waves, forest... find your sound',
    'onboard.step3': 'Start your focus time',
    'onboard.step3desc': 'Pomodoro, stopwatch, or countdown, your choice',
    'onboard.next': 'Next',
    'onboard.start': 'Let\'s go',

    // Calendar active days
    'calendar.activeDays': 'days',

    // Calendar months
    'calendar.months': 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',

    // ErrorBoundary
    'error.title': 'Something went wrong',
    'error.retry': 'Try Again',

    // StudyStats
    'stats.thisWeek': 'This week',
    'stats.weeksAgo': 'weeks ago',

    // DailyGoal labels
    'goal.30m': '30min',
    'goal.1h': '1 hour',
    'goal.1.5h': '1.5 hours',
    'goal.2h': '2 hours',
    'goal.3h': '3 hours',
    'goal.4h': '4 hours',

    // ShortcutToast
    'shortcut.title': 'Shortcuts',
    'shortcut.startPause': 'Start/Pause',
    'shortcut.reset': 'Reset',
    'shortcut.switchMode': 'Switch Mode',
    'shortcut.muteAll': 'Mute All',

    // InstallPrompt
    'install.title': 'Install to Desktop',
    'install.desc': 'Use like a native app',
    'install.button': 'Install',

    // Scene names
    'scene.mountainLakeName': 'Mountain Lake',
    'scene.mountainLakeDesc': 'Still water mirrors the snow-capped peaks. Quiet enough to hear your own breath.',
    'scene.seasideName': 'Seaside Cottage',
    'scene.seasideDesc': 'Waves gently lap the shore in a rhythm as natural as breathing.',
    'scene.forestName': 'Forest Path',
    'scene.forestDesc': 'Sunlight filters through the canopy. The air smells of earth and leaves.',
    'scene.starrySkyName': 'Starry Sky',
    'scene.starrySkyDesc': 'Stars turn slowly overhead. The night is soft as a hummed lullaby.',
    'scene.rainyCafeName': 'Rainy Window',
    'scene.rainyCafeDesc': 'Rain taps the glass, sealing the world outside. Perfect for quiet solitude.',
    'scene.snowyWindowName': 'Silent Snow',
    'scene.snowyWindowDesc': 'Snowflakes drift down, making the world feel light and hushed.',
    'scene.campfireName': 'Campfire Night',
    'scene.campfireDesc': 'Crackling flames and warm glow dancing in the dark. For deep nighttime thoughts.',
    'scene.cityNightName': 'City Lights',
    'scene.cityNightDesc': 'Distant lights twinkle like stars, the city\'s rhythm flowing outside the window.',
    'scene.starryTentName': 'Stargazer Tent',
    'scene.starryTentDesc': 'The Milky Way outside, warmth inside. Just you between heaven and earth.',

    // Scene recommendation hint
    'scene.recommendHint': 'Try {name} ambient sound',

    // Sound names
    'sound.rain': 'Rain',
    'sound.ocean': 'Ocean',
    'sound.forest': 'Forest',
    'sound.fire': 'Fireplace',
    'sound.cafe': 'Cafe',
    'sound.wind': 'Wind',
    'sound.night': 'Summer Night',
    'sound.whitenoise': 'White Noise',

    // StudyStats
    'stats.startFirstFocus': '🎯 Start your first focus session!',

    // Memo confirm
    'memo.confirmClear': 'Clear all completed tasks?',

    // FocusTools confirm
    'tools.confirmDelete': 'Delete this link?',

    // Share card
    'share.title': 'Share Achievement',
    'share.save': 'Save Image',
    'share.share': 'Share',
    'share.complete': 'Focus Complete',
    'share.pomodoros': 'pomodoros',
    'share.study': 'minutes studied',
    'share.brand': 'Focus Room · Immersive Study',
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
