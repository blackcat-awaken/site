/** 活動資料（對齊舊站 events.html 內容） */

export const dragonTrial = {
  badge: '週末限定副本',
  name: '龍之試煉・絕',
  subtitle: '四大龍王極限討伐',
  intro:
    '挑戰四大龍王安塔瑞斯、巴拉卡斯、林德拜爾、法利昂。必須掌握時間倒數與血量控場機制，四隻全滅並打破龍之靈魂結晶方能成功通關！',
  limits: {
    schedule: '每週六 18:00 ～ 週一 03:00',
    scheduleNote: '每週僅能成功攻略一次',
    iron1: '首隻死亡後 10 分鐘內必須擊殺其餘所有龍王',
    iron2: '任一龍王 60 秒未受傷害即高速回血',
  },
  bosses: [
    { name: '安塔瑞斯', title: '地龍', color: '#c9a45c' },
    { name: '法利昂', title: '水龍', color: '#5b9bd5' },
    { name: '巴拉卡斯', title: '火龍', color: '#e0463c' },
    { name: '林德拜爾', title: '風龍', color: '#7bc47f' },
  ] as const,
  mechanics: [
    {
      number: '01',
      title: '10 分鐘狂怒倒數',
      desc: '當第一隻龍王死亡後，全隊必須在 10 分鐘內將其餘三隻全部擊殺，否則所有已陣亡或殘血的龍王將瞬間滿血復活！',
    },
    {
      number: '02',
      title: '60 秒回血懲罰',
      desc: '若任一龍王在 60 秒內未受到任何攻擊傷害，將觸發高速回血機制，戰力分配與持續輸出至關重要。',
    },
    {
      number: '03',
      title: '四龍全滅才算成功',
      desc: '四大巨龍必須全數殲滅並打破「龍之靈魂結晶」才算討伐成功。靠近彼此時能力會大幅增強（可疊加）。',
    },
  ] as const,
  tactics: [
    {
      letter: 'A',
      title: '各個擊破',
      desc: '集中戰力逐一擊破，挑戰在 10 分鐘內收掉剩餘的三隻。',
    },
    {
      letter: 'B',
      title: '隊伍輪換',
      desc: '各隊將龍王打到殘血後由中堅隊控血，四龍全壓殘血後同時收頭！',
    },
    {
      letter: 'C',
      title: '正面突破',
      desc: '四龍拉至同一區域大混戰，刺激度滿分，適合頂尖高玩隊伍。',
    },
  ] as const,
  drops: [
    '+30克里修納武器',
    '一階龍武（地／火／風／水）',
    '+20利維坦套裝',
    '傳說英雄斗篷',
    '諸神首飾（階段4）',
    '龍之首飾系列',
    '金幣20億禮盒',
    '閃耀格蘭肯卷軸',
    'L級強化卷軸',
    '龍爪與精煉石',
  ] as const,
  dropsTip: '建議自備補師與祝福羽毛（雜貨店可買），死亡可復活繼續戰鬥！',
  map: '/site/assets/img/map.png',
  video: '/site/assets/video/dragon.mp4',
  poster: '/site/assets/img/poster-dragon.webp',
} as const;

export const clanRally = {
  badge: '新系統上線',
  name: '血盟集結令',
  intro: '揪朋友入盟、壯大血盟，就能一起獲得殷海薩金幣。達標後獎勵會自動透過遊戲內郵件寄送。',
  tableNote: '同帳號多角色只計 1 人，需達 Lv.120。',
  table: [
    { members: 10, leader: 100, member: 100 },
    { members: 20, leader: 100, member: 150 },
    { members: 30, leader: 100, member: 200 },
    { members: 50, leader: 100, member: 300 },
    { members: 70, leader: 100, member: 500 },
    { members: 100, leader: 100, member: 700 },
  ] as const,
  rules: [
    '每個門檻每個血盟只會觸發一次，先到先得不回溯。',
    '同帳號多角色只算 1 人，系統自動取等級最高的角色。',
    '每個帳號在同一門檻只能領取一次，跨血盟亦同。',
    '盟主與成員獎勵分開計算，盟主也有份。',
    '加入血盟後立即觸發檢查；重新登入也會自動補檢。',
    '加入時血盟已達標的門檻不補發獎勵。',
  ] as const,
  strategyLabel: '最佳策略',
  strategy:
    '想拿完整獎勵，就趁血盟還小的時候加入。血盟已有 20 人時才加入，10 人與 20 人獎勵不會補發。',
} as const;
