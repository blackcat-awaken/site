/** 特色系統資料 — 依分類組織，features 頁與首頁預覽共用 */

export interface Feature {
  icon: string; // 內嵌 SVG 路徑 key（見 Icon.astro）
  title: string;
  desc: string;
  tag?: string;
}

export const newSystems141: Feature[] = [
  {
    icon: 'phoenix',
    title: '重生系統',
    desc: '14.1 全新登場。達成條件後可重置角色再臨世間，獲得專屬加成，一次又一次超越自我極限。',
    tag: '全新',
  },
  {
    icon: 'rune',
    title: '附魔挑戰',
    desc: 'Enchant Challenge 點數系統上線，強化之路多了策略抉擇，衝裝不再只是機率的賭局。',
    tag: '全新',
  },
  {
    icon: 'dragon',
    title: '龍之試煉',
    desc: '四大龍王極限討伐副本降臨。掌握時限倒數與控場機制，爭奪傳說級戰利品。',
    tag: '限定副本',
  },
  {
    icon: 'blade',
    title: '戰鬥公式革新',
    desc: 'HP 百分比傷害與統一傷害計算導入，職業克制更清晰，高端對局更有深度。',
    tag: '平衡',
  },
];

export const privilegeFeatures: Feature[] = [
  {
    icon: 'crown',
    title: 'VIP 尊榮系統',
    desc: '經驗 / SP / 掉落全面雙倍加成，使用銀色席琳即可啟動，每日僅需 10 金幣。',
    tag: 'Premium',
  },
  {
    icon: 'coin',
    title: '一億起始資金',
    desc: '創角即贈 100,000,000 天幣，新手站穩腳步，直接體驗遊戲核心內容。',
  },
  {
    icon: 'book',
    title: '自動學習技能',
    desc: '升級自動習得所有職業技能，無需尋找導師，省時省力專注戰鬥。',
  },
  {
    icon: 'hand',
    title: '自動拾取道具',
    desc: '擊殺怪物自動撿取金幣與道具，練功流暢不中斷。',
  },
  {
    icon: 'weight',
    title: '四倍負重・240 格背包',
    desc: '負重上限提升至 4 倍，一般角色 240 格 / 矮人 260 格背包，長征無壓力。',
  },
];

export const convenienceFeatures: Feature[] = [
  {
    icon: 'flask',
    title: '自動喝水系統',
    desc: 'HP / MP / CP 低於 70% 自動使用藥水，PvP 激戰中不再手忙腳亂。',
    tag: '熱門',
  },
  {
    icon: 'board',
    title: '社群面板',
    desc: 'Alt+B 一鍵開啟：免費傳送、全套 Buff、治療恢復、VIP 購買，一站式操作。',
    tag: '熱門',
  },
  {
    icon: 'wand',
    title: '方案輔助魔法',
    desc: '自訂個人化 Buff 方案，每 Buff 僅 1 天幣，一鍵快速套用整套輔助。',
  },
  {
    icon: 'music',
    title: '離線保留歌舞',
    desc: '舞蹈 / 歌曲效果離線自動保留，重上線無需重唱，節奏不中斷。',
  },
  {
    icon: 'bank',
    title: '銀行金幣兌換',
    desc: '大額金幣兌換高面額道具，方便攜帶與交易，支援雙向兌換。',
  },
  {
    icon: 'shop',
    title: '販售 Buff',
    desc: '直接向 NPC 購買高階輔助魔法，隨時備戰，無需四處尋找輔助職業。',
  },
];

export const gameplayFeatures: Feature[] = [
  {
    icon: 'moon',
    title: '離線擺攤',
    desc: '離線擺攤自動恢復，24 小時不間斷營業，市場經濟永不停歇。',
    tag: '熱門',
  },
  {
    icon: 'skull',
    title: '冠軍怪物系統',
    desc: '隨機生成的強化冠軍怪，更高血量與傷害，擊敗掉落稀有寶物與大量經驗。',
    tag: '挑戰',
  },
  {
    icon: 'horn',
    title: '首領擊殺公告',
    desc: '全服廣播首領擊殺訊息，讓所有玩家見證你的輝煌戰績。',
  },
  {
    icon: 'mask',
    title: '外觀變更系統',
    desc: '自由變更裝備外觀，保留屬性同時展現獨特造型，打造個人風格。',
  },
  {
    icon: 'scale',
    title: '職業平衡調整',
    desc: '針對各職業技能數值精心調整，PvP 與 PvE 公平競技，每種職業都有舞台。',
  },
  {
    icon: 'flag',
    title: '自訂出生點',
    desc: '新角色直接出生於亞丁大陸核心區域，省去長途跋涉，立即投入冒險。',
  },
];

export const pvpFeatures: Feature[] = [
  {
    icon: 'trophy',
    title: 'PvP 獎勵系統',
    desc: '擊殺敵對玩家獲得專屬獎勵道具，每一次對戰都有實質回報。',
    tag: '獎勵',
  },
  {
    icon: 'horn',
    title: 'PvP 擊殺廣播',
    desc: '全服廣播擊殺訊息，讓對手銘記你的大名。',
    tag: '競技',
  },
  {
    icon: 'palette',
    title: 'PvP 稱號染色',
    desc: '依擊殺數動態變更稱號顏色，從青銅到傳說，稱號就是你的勳章。',
  },
  {
    icon: 'stun',
    title: '無法取消暈眩',
    desc: 'PvP 中暈眩無法自行取消，更考驗反應、預判與裝備搭配。',
    tag: '硬核',
  },
];
