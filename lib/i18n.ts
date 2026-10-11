'use client'

import { useSyncExternalStore, useCallback } from 'react'
import { storageGet, storageSet } from './storage'

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
    'focus.todayStudy': '今日学习',
    'focus.weekStudy': '本周学习',
    'focus.activeDays': '天',

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
    'timer.bgPromptTitle': '离开时间较长',
    'timer.bgPromptDesc': '检测到离开后台 {min} 分钟，是否将这段时间计入本次学习？',
    'timer.bgPromptResume': '继续计时（计入时间）',
    'timer.bgPromptDiscard': '结束本次（不计入）',
    'timer.collapse': '折叠为胶囊',
    'timer.expand': '展开仪表盘',
    'timer.breatheGuide': '4-7-8 呼吸放松 (吸4s · 屏7s · 呼8s)',
    'sound.catAll': '全部',
    'sound.catNature': '天籁自然',
    'sound.catSpace': '空间生活',
    'sound.catFocus': '专注调频',
    'sound.drawerTitle': '声音工作台',
    'sound.tabs.ambient': '白噪音',
    'sound.tabs.music': '自习电台',
    'sound.tabs.presets': '混音配方',

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
    'sound.tabNetease': '音乐',
    'sound.neteasePasteUrl': '粘贴网易云歌单链接...',
    'sound.neteaseSearchBtn': '打开',
    'sound.neteaseHint': '推荐歌单',
    'sound.neteaseNoResults': '选择一个歌单或粘贴链接',

    // Onboarding
    'onboard.step1': '选择一个窗外场景',
    'onboard.step1desc': '每个场景都有独特的光线和氛围',
    'onboard.step2': '打开你喜欢的白噪音',
    'onboard.step2desc': '雨声、海浪、森林...找到属于你的声音',
    'onboard.step3': '开始你的专注时间',
    'onboard.step3desc': '番茄钟、正计时或倒计时，自由选择',
    'onboard.step1Title': '选一扇窗',
    'onboard.step1Desc': '点击底部栏的左右箭头切换场景',
    'onboard.step2Title': '放一首歌',
    'onboard.step2Desc': '点击底部 🎵 按钮打开白噪音面板',
    'onboard.step3Title': '开始专注',
    'onboard.step3Desc': '设置时间并开始',
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
    'scene.studyDeskName': '雨夜人间',
    'scene.studyDeskDesc': '雨幕里对楼的灯火次第亮起，你在窗前苦读，人间烟火与你隔雨相望。',
    'scene.milkyWayName': '银河旷野',
    'scene.milkyWayDesc': '远离城市的旷野上，银河横贯天际，时间在星光里静止。',
    'scene.mountainStreamName': '山涧溪流',
    'scene.mountainStreamDesc': '清泉漫过卵石，绿意环绕，水声带走一切浮躁。',

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
    'stats.streak': '连续学习',
    'stats.streakUnit': '天',

    // Settings - new
    'settings.soundEnabled': '番茄钟完成音效',
    'settings.autoStart': '选场景后自动开始计时',

    // Landing - resume
    'landing.resume': '继续上次',

    // Focus - sitting reminder
    'focus.sittingReminder': '站起来活动一下吧 🧘',

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

    // ===== 新增音效 =====
    'sound.keyboard': '键盘声',
    'sound.pageturn': '翻书声',
    'sound.clock': '钟摆滴答',

    // ===== 混音预设 =====
    'mix.title': '混音预设',
    'mix.studyNight': '深夜书房',
    'mix.streetCafe': '街角咖啡馆',
    'mix.meadowBreeze': '旷野微风',
    'mix.saveMine': '存为我的',
    'mix.saveBtn': '保存',
    'mix.namePlaceholder': '配方名称…',
    'mix.defaultName': '我的配方',
    'mix.saved': '配方已保存',
    'mix.applied': '已应用混音配方',
    'mix.delete': '删除配方',
    'mix.emptyMix': '请先播放至少一个音效',
    'mix.share': '分享',
    'mix.shareCopied': '分享链接已复制，发给朋友吧',
    'mix.shareFailed': '复制失败，请手动复制',

    // ===== 计时器 =====
    'timer.skipBreak': '跳过休息',
    'timer.zenRemaining': '剩余时间',

    // ===== Zen 清屏时钟 =====
    'zen.quote1': '保持专注，世界会为你让路。',
    'zen.quote2': '每一次专注，都是给未来的礼物。',
    'zen.quote3': '慢慢来，反而快。',
    'sound.radioTitle': '24/7 免版权自习电台',
    'sound.radioDesc': '精选高质量免版权纯音乐与 Lo-Fi 电台，即开即播，永不中断',
    'sound.neteaseVipNotice': '提示：若歌单内含较多 VIP 歌曲，建议使用「官方外链」模式',

    // ===== 底栏 =====
    'bar.masterVolume': '总音量',
    'bar.iframeMini': '官方外链播放器',

    // ===== 视觉氛围 =====
    'atm.title': '视觉氛围',
    'atm.brightness': '遮光',
    'atm.blur': '背景虚化',
    'atm.warmth': '护眼暖色',
    'atm.reset': '恢复默认',

    // ===== 设置 =====
    'settings.wakeLock': '屏幕常亮（自习 / 平板桌搭防息屏）',
    'settings.metingApi': 'Meting API 地址（内置播放器）',
    'settings.metingApiHint': '内置网易云播放器的数据源。可在腾讯云开发免费部署内置云函数，方法见项目 docs/meting-deploy.md；留空则仅支持官方外链播放。',

    // ===== 内置音乐播放器 =====
    'player.modeLabel': '播放方式',
    'player.modeOfficial': '官方外链',
    'player.modeBuiltIn': '内置播放器',
    'player.playlistActive': '正在播放歌单',
    'player.backToAmbient': '返回白噪音',
    'player.closePlayer': '关闭播放器',
    'player.tapToExpand': '点击展开',
    'player.needApi': '内置播放器需要先在「设置」中配置 Meting API 地址（部署方法见项目 docs/meting-deploy.md）',
    'player.loading': '正在获取歌单…',
    'player.loadFailed': '歌单获取失败，请检查 API 地址',
    'player.empty': '歌单为空或不可访问',
    'player.trackUnavailable': '该曲目暂不可用，已自动跳过',
    'player.allFailed': '歌单内暂无可播放曲目',
    'player.play': '播放',
    'player.pause': '暂停',
    'player.prev': '上一曲',
    'player.next': '下一曲',

    // ===== 音效收藏 =====
    'sound.favOnly': '只看收藏',
    'sound.fav': '收藏',
    'sound.unfav': '取消收藏',
    'sound.mixAdjust': '混音调节',

    // ===== 双耳节拍 =====
    'binaural.title': '双耳节拍',
    'binaural.delta': '深睡 δ',
    'binaural.theta': '冥想 θ',
    'binaural.alpha': '放松 α',
    'binaural.beta': '专注 β',
    'binaural.hint': '🎧 请佩戴耳机：左右声道频率差诱导脑波同步',

    // ===== 番茄预设组 =====
    'settings.presets': '时长预设',
    'settings.presetClassic': '经典',
    'settings.presetDeep': '深度',
    'settings.presetSprint': '冲刺',
    'radio.lofiDesc': '经典柔和低保真节拍 · 慢节奏专注',
    'radio.jazzDesc': '雨夜都市爵士萨克斯 · 惬意咖啡厅',
    'radio.alphaDesc': '双耳节律与环境空间声学 · 深度心流',
    'radio.vaporDesc': '复古合成器波与夜色律动 · 编程沉浸',
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
    'focus.todayStudy': 'Today',
    'focus.weekStudy': 'This week',
    'focus.activeDays': 'days',

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
    'timer.bgPromptTitle': 'Away for a while',
    'timer.bgPromptDesc': 'Detected away for {min} minutes. Keep this study time?',
    'timer.bgPromptResume': 'Resume (keep time)',
    'timer.bgPromptDiscard': 'End session (discard)',
    'timer.collapse': 'Collapse to capsule',
    'timer.expand': 'Expand dashboard',
    'timer.breatheGuide': '4-7-8 Relaxing Breath (In 4s · Hold 7s · Out 8s)',
    'sound.catAll': 'All',
    'sound.catNature': 'Nature',
    'sound.catSpace': 'Space & Life',
    'sound.catFocus': 'Brainwaves',
    'sound.drawerTitle': 'Sound Studio',
    'sound.tabs.ambient': 'Ambient',
    'sound.tabs.music': 'Music',
    'sound.tabs.presets': 'Mixes',

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
    'sound.tabNetease': 'Music',
    'sound.neteasePasteUrl': 'Paste NetEase playlist URL...',
    'sound.neteaseSearchBtn': 'Open',
    'sound.neteaseHint': 'Preset Playlists',
    'sound.neteaseNoResults': 'Select a playlist or paste a URL',

    // Onboarding
    'onboard.step1': 'Choose a window scene',
    'onboard.step1desc': 'Each scene has unique light and atmosphere',
    'onboard.step2': 'Turn on your favorite white noise',
    'onboard.step2desc': 'Rain, ocean waves, forest... find your sound',
    'onboard.step3': 'Start your focus time',
    'onboard.step3desc': 'Pomodoro, stopwatch, or countdown, your choice',
    'onboard.step1Title': 'Choose a Scene',
    'onboard.step1Desc': 'Use the arrows at the bottom to switch scenes',
    'onboard.step2Title': 'Play a Sound',
    'onboard.step2Desc': 'Tap the 🎵 button to open the sound mixer',
    'onboard.step3Title': 'Start Focusing',
    'onboard.step3Desc': 'Set a timer and begin',
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
    'scene.studyDeskName': 'Rainy Nights',
    'scene.studyDeskDesc': 'Rain streaks the glass while warm windows glow across the street — the world at arm\'s length.',
    'scene.milkyWayName': 'Milky Way Field',
    'scene.milkyWayDesc': 'Far from the city, the galaxy arches overhead — time stands still in starlight.',
    'scene.mountainStreamName': 'Mountain Stream',
    'scene.mountainStreamDesc': 'Clear water over pebbles, wrapped in green. Let the stream carry restlessness away.',

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
    'stats.streak': 'Study Streak',
    'stats.streakUnit': 'days',

    // Settings - new
    'settings.soundEnabled': 'Pomodoro completion sound',
    'settings.autoStart': 'Auto-start timer after scene selection',

    // Landing - resume
    'landing.resume': 'Resume last session',

    // Focus - sitting reminder
    'focus.sittingReminder': 'Take a break and stretch 🧘',

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

    // ===== New sounds =====
    'sound.keyboard': 'Keyboard',
    'sound.pageturn': 'Page Turn',
    'sound.clock': 'Clock Tick',

    // ===== Mix presets =====
    'mix.title': 'MIX PRESETS',
    'mix.studyNight': 'Night Study',
    'mix.streetCafe': 'Street Cafe',
    'mix.meadowBreeze': 'Meadow Breeze',
    'mix.saveMine': 'Save Mine',
    'mix.saveBtn': 'Save',
    'mix.namePlaceholder': 'Preset name…',
    'mix.defaultName': 'My Mix',
    'mix.saved': 'Preset saved',
    'mix.applied': 'Mix preset applied',
    'mix.delete': 'Delete preset',
    'mix.emptyMix': 'Play at least one sound first',
    'mix.share': 'Share',
    'mix.shareCopied': 'Share link copied',
    'mix.shareFailed': 'Copy failed',

    // ===== Timer =====
    'timer.skipBreak': 'Skip Break',
    'timer.zenRemaining': 'Time Remaining',

    // ===== Zen clock =====
    'zen.quote1': 'Stay focused, and the world makes way.',
    'zen.quote2': 'Every focused hour is a gift to your future self.',
    'zen.quote3': 'Slow is smooth, smooth is fast.',
    'sound.radioTitle': '24/7 Royalty-Free Study Radio',
    'sound.radioDesc': 'Curated high-fidelity Lo-Fi & ambient radio streams. Instant play, zero interruption.',
    'sound.neteaseVipNotice': 'Note: If the playlist contains VIP tracks, Official Embed mode is recommended.',

    // ===== Bottom bar =====
    'bar.masterVolume': 'Master Volume',
    'bar.iframeMini': 'Official player running',

    // ===== Atmosphere =====
    'atm.title': 'ATMOSPHERE',
    'atm.brightness': 'Dimmer',
    'atm.blur': 'Blur',
    'atm.warmth': 'Warmth',
    'atm.reset': 'Reset',

    // ===== Settings =====
    'settings.wakeLock': 'Keep screen awake (study / tablet desk mode)',
    'settings.metingApi': 'Meting API URL (built-in player)',
    'settings.metingApiHint': 'Data source for the built-in NetEase player. Deploy the bundled zero-dependency cloud function to Tencent CloudBase for free — see docs/meting-deploy.md. Leave empty to use the official embed player only.',

    // ===== Built-in music player =====
    'player.modeLabel': 'Player',
    'player.modeOfficial': 'Official',
    'player.modeBuiltIn': 'Built-in',
    'player.playlistActive': 'Playlist active',
    'player.backToAmbient': 'Back to ambient',
    'player.closePlayer': 'Close player',
    'player.tapToExpand': 'Tap to expand',
    'player.needApi': 'Configure the Meting API URL in Settings first (see docs/meting-deploy.md)',
    'player.loading': 'Loading playlist…',
    'player.loadFailed': 'Failed to load playlist, check the API URL',
    'player.empty': 'Playlist is empty or inaccessible',
    'player.trackUnavailable': 'Track unavailable, skipped',
    'player.allFailed': 'No playable tracks in this playlist',
    'player.play': 'Play',
    'player.pause': 'Pause',
    'player.prev': 'Previous',
    'player.next': 'Next',

    // ===== Sound favorites =====
    'sound.favOnly': 'Favorites',
    'sound.fav': 'Favorite',
    'sound.unfav': 'Unfavorite',
    'sound.mixAdjust': 'Mix Levels',

    // ===== Binaural beats =====
    'binaural.title': 'Binaural Beats',
    'binaural.delta': 'Delta δ',
    'binaural.theta': 'Theta θ',
    'binaural.alpha': 'Alpha α',
    'binaural.beta': 'Beta β',
    'binaural.hint': '🎧 Wear headphones — the frequency gap between ears entrains brainwaves',

    // ===== Pomodoro presets =====
    'settings.presets': 'Duration Presets',
    'settings.presetClassic': 'Classic',
    'settings.presetDeep': 'Deep',
    'settings.presetSprint': 'Sprint',
    'radio.lofiDesc': 'Mellow chillhop classics · slow-tempo focus',
    'radio.jazzDesc': 'Rainy-night city jazz sax · cozy cafe',
    'radio.alphaDesc': 'Binaural rhythms & spatial ambience · deep flow',
    'radio.vaporDesc': 'Retro synthwaves & night pulse · coding immersion',
  },
} as const

export type TranslationKey = keyof typeof translations.zh

let currentLocale: Locale = 'zh'
const listeners = new Set<() => void>()

function getSavedLocale(): Locale {
  const saved = storageGet<string>('focus-room-locale', 'zh')
  if (saved === 'zh' || saved === 'en') return saved
  return 'zh'
}

export function initLocale() {
  currentLocale = getSavedLocale()
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined' && currentLocale === 'zh') {
    currentLocale = getSavedLocale()
  }
  return currentLocale
}

export function subscribeLocale(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function setLocale(locale: Locale) {
  if (currentLocale !== locale) {
    currentLocale = locale
    storageSet('focus-room-locale', locale)
    listeners.forEach(fn => fn())
  }
}

export function t(key: TranslationKey, fallback?: string): string {
  return translations[currentLocale][key] || translations['zh'][key] || fallback || key
}

export function useTranslation() {
  const locale = useSyncExternalStore<Locale>(subscribeLocale, getLocale, () => 'zh')
  const translate = useCallback((key: TranslationKey, fallback?: string): string => {
    return translations[locale][key] || translations['zh'][key] || fallback || key
  }, [locale])

  return {
    t: translate,
    locale,
    setLocale,
  }
}
