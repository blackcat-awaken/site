/** 全站核心資料 — 改這裡即全站更新 */

export const site = {
  /** 品牌 */
  brand: '黑貓神話',
  title: '闇鴉武士',
  titleEn: 'Samurai Crow',
  version: '14.1',
  chronicle: 'L2J Mobius 14.1',
  protocol: 542,
  slogan: '刀起墨落，鴉羽蔽月',
  description:
    '黑貓神話・闇鴉武士 — 天堂II 14.1 經典私服。10 倍經驗、組隊 30 倍、VIP 尊榮系統、重生系統全新登場，專業雲端主機長期穩定經營。',
  keywords:
    '天堂2, 天堂II, Lineage 2, 私人伺服器, 私服, 闇鴉武士, Samurai Crow, 黑貓神話, 天2, 天堂二, 繁體中文',

  /** 社群與外部連結 */
  links: {
    discord: 'https://discord.gg/SBJRFznp8m',
    facebook: 'https://www.facebook.com/groups/2428872250922458',
    guideVideo: 'https://www.youtube-nocookie.com/embed/FZGmMxhMYLo',
  },

  /** 下載（版本號更新改這裡） */
  downloads: {
    client: {
      name: '完整遊戲客戶端',
      version: '14.1 闇鴉武士',
      size: '約 15 GB',
      url: 'https://huggingface.co/bcat-legend/lineage-2-client/resolve/main/Lineage2.rar',
      mirror: 'https://drive.google.com/drive/folders/1QK3OH4UsjHz9-rZyOMLNIIdJAYk--i0x',
    },
    patch: {
      name: '最新登錄補丁',
      version: '2026904',
      size: '約 200 MB',
      url: 'https://huggingface.co/bcat-legend/lineage-2-client/resolve/main/System_tw.rar',
      mirror: 'https://drive.google.com/file/d/1Nn8RnLNuULJaS1E8exqsk7dQbdgVH9_B/view?usp=sharing',
    },
  },

  /** 倍率與規格（已對照 14.1 設定檔驗證） */
  stats: {
    rates: [
      { value: 10, suffix: 'x', label: '經驗倍率' },
      { value: 10, suffix: 'x', label: 'SP 倍率' },
      { value: 30, suffix: 'x', label: '組隊加成' },
      { value: 10, suffix: 'x', label: '金幣掉落' },
      { value: 135, suffix: '', label: '等級上限' },
      { value: 1000, suffix: '+', label: '承載人數' },
    ],
    specs: [
      ['伺服器版本', '14.1 闇鴉武士（Samurai Crow）'],
      ['協定版本', 'Protocol 542'],
      ['經驗 / SP', '10x　｜　組隊 30x'],
      ['金幣掉落', '10x（VIP 雙倍）'],
      ['等級上限', 'Lv. 135'],
      ['起始資金', '1 億天幣'],
      ['多開限制', '每台電腦最多 5 開'],
      ['角色數量', '每帳號 7 角色'],
      ['維護時段', '每週一 / 四 / 六 17:50（約 2–5 分鐘）'],
      ['主機方案', '專業雲端主機，全球連線'],
    ] as [string, string][],
  },

  /** 導覽（順序即顯示順序） */
  nav: [
    { href: '/site/', label: '首頁' },
    { href: '/site/events', label: '最新活動' },
    { href: '/site/features', label: '特色系統' },
    { href: '/site/guide', label: '加入教學' },
    { href: '/site/download', label: '下載專區' },
    { href: '/site/contact', label: '聯絡我們' },
  ],
} as const;

export type Site = typeof site;
