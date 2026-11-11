/**
 * 黑貓神話攻略百科 — 前端程式（官網整合版）
 * 改寫自伺服器專案 wiki/src/app/app.js。文章已改為建置時產生的靜態頁，這裡負責：
 *  - 全站搜尋面板：攻略頁、道具、怪物、職業（按 / 或 Ctrl+K）
 *  - 道具／怪物／技能連結的浮動提示
 *  - 資料庫頁（/site/wiki/db#...）：路由與九種資料表
 *  - 文章頁：本頁目錄高亮、連到折疊區段落時自動展開
 */
import { wikiIcons as IC } from '../../data/wikiIcons';

const BASE = '/site/wiki';
const DB = BASE + '/db';
const DATA = BASE + '/data/';
const SITE_TITLE = '黑貓神話 闇鴉武士';

// ------------------------------------------------------------------
// 資料載入：data/*.js 會呼叫 WIKI.put(name, data)
// ------------------------------------------------------------------
const store = Object.create(null);
const waiting = Object.create(null);
const W = (window.WIKI = window.WIKI || {});
W.put = function (name, data) {
  store[name] = data;
  const list = waiting[name];
  if (list) {
    delete waiting[name];
    list.forEach((f) => f[0](data));
  }
};

function need(name) {
  if (store[name]) return Promise.resolve(store[name]);
  return new Promise((resolve, reject) => {
    (waiting[name] = waiting[name] || []).push([resolve, reject]);
    if (!document.querySelector('script[data-n="' + name + '"]')) {
      const s = document.createElement('script');
      s.src = DATA + name + '.js' + (window.WIKI_V ? '?v=' + window.WIKI_V : '');
      s.async = true;
      s.dataset.n = name;
      s.onerror = () => {
        const l = waiting[name] || [];
        delete waiting[name];
        s.remove();
        l.forEach((f) => f[1](new Error('無法載入資料檔：' + name)));
      };
      document.head.appendChild(s);
    }
  });
}

// ------------------------------------------------------------------
// 小工具
// ------------------------------------------------------------------
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
const fmt = (n) => (n == null || n === '' ? '' : Number(n).toLocaleString('en-US'));
function fmtPct(p) {
  if (p == null) return '';
  const v = Number(p);
  if (v >= 100) return '100%';
  if (v >= 10) return v.toFixed(1).replace(/\.0$/, '') + '%';
  if (v >= 1) return v.toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + '%';
  if (v >= 0.01) return v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '%';
  if (v <= 0) return '0%';
  return v.toPrecision(2) + '%';
}
const pctCls = (p) => (p >= 30 ? 'pct hi' : p < 0.1 ? 'pct lo' : 'pct');
function range(a, b) {
  a = Number(a);
  b = Number(b);
  return a === b || !b ? fmt(a) : fmt(a) + '～' + fmt(b);
}
function debounce(fn, ms) {
  let t;
  return function () {
    const a = arguments;
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, a), ms);
  };
}
const ico = (n, cls) => '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || IC.info) + '</svg>';
const setTitle = (t) => (document.title = t + ' - ' + SITE_TITLE);
const lenis = () => window.__lenis || null;
const headerH = () => (document.querySelector('body > header') || document.querySelector('header'))?.getBoundingClientRect().height || 72;
function scrollToEl(el) {
  const off = -(headerH() + 18);
  const l = lenis();
  if (l) l.scrollTo(el, { offset: off });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + off, behavior: 'smooth' });
}
function scrollTop() {
  const l = lenis();
  if (l) l.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}
/** 攻略頁網址 */
const pageHref = (id, anchor) => (id.startsWith('db-') ? DB + '#' + id : BASE + '/' + id + (anchor ? '#' + anchor : ''));
const pageLink = (id, text) => (PAGE[id] ? '<a href="' + pageHref(id) + '">' + esc(text || PAGE[id].title) + '</a>' : esc(text || id));
const normPath = (p) => p.replace(/\/+$/, '');

// ------------------------------------------------------------------
// 中文標籤
// ------------------------------------------------------------------
const SLOT = {
  '1h': '單手武器', '2h': '雙手武器', shield: '盾牌', sigil: '印記', head: '頭盔', chest: '上衣', legs: '下衣', gloves: '手套', feet: '靴子', full: '連身衣', shirt: '內衣',
  ear: '耳環', ring: '戒指', neck: '項鍊', hair: '髮飾', hair2: '髮飾（第二欄）', hairall: '頭飾', cloak: '斗篷', belt: '腰帶', agbr: '壺精手鐲', talbr: '護身符手鐲', tali: '護身符',
  brooch: '胸針', jewel: '胸針寶石', artifact: '聖紋石', artbook: '聖紋石書', agathion: '壺精',
};
const WTYPE = {
  SWORD: '劍', BLUNT: '鈍器', DAGGER: '匕首', BOW: '弓', POLE: '長槍', FIST: '拳套', DUALFIST: '拳套', DUAL: '雙刀', DUALDAGGER: '雙匕首', DUALBLUNT: '雙鈍器',
  ANCIENTSWORD: '古代劍', CROSSBOW: '十字弓', TWOHANDCROSSBOW: '雙手十字弓', RAPIER: '細劍', ETC: '其他', FISHINGROD: '釣竿', PISTOLS: '雙槍',
};
const ATYPE = { HEAVY: '重裝', LIGHT: '輕裝', MAGIC: '長袍', SIGIL: '印記', NONE: '' };
const ETYPE = {
  SCROLL: '卷軸', POTION: '藥水', MATERIAL: '材料', RECIPE: '配方', ARROW: '箭', BOLT: '箭矢', SOULSHOT: '靈魂彈／魔力彈', ELIXIR: '靈藥', SEED: '種子', SEED2: '種子', CROP: '作物', MATURECROP: '成熟作物',
  LURE: '魚餌', PET_COLLAR: '寵物項圈', CASTLE_GUARD: '傭兵契約', DYE: '刻印染料', ENSOUL_STONE: '靈魂結晶', CARD_EVENT: '活動卡片', RUNE: '符文', RUNE_SELECT: '符文',
  ENCHT_WP: '武器強化卷軸', ENCHT_AM: '防具強化卷軸', BLESS_ENCHT_WP: '祝福武器強化卷軸', BLESS_ENCHT_AM: '祝福防具強化卷軸', GIANT_ENCHT_WP: '巨人武器強化卷軸', GIANT_ENCHT_AM: '巨人防具強化卷軸',
  ENCHT_ATTR: '屬性石／屬性水晶', ENCHT_ATTR_CURSED: '屬性道具', ENCHT_ATTR_RUNE: '屬性符文', ENCHT_ATTRT_RUNE_SELECT: '屬性符文',
  ENCHT_ATTR_INC_PROP_ENCHT_WP: '武器強化輔助', ENCHT_ATTR_INC_PROP_ENCHT_AM: '防具強化輔助', ENCHT_ATTR_ANCIENT_CRYSTAL_ENCHANT_WP: '古代武器強化卷軸', ENCHT_ATTR_ANCIENT_CRYSTAL_ENCHANT_AM: '古代防具強化卷軸',
  SHAPE_SHIFTING_WP: '外型變更', SHAPE_SHIFTING_AM: '外型變更', SHAPE_SHIFTING_WP_FIXED: '外型變更', SHAPE_SHIFTING_AM_FIXED: '外型變更', SHAPE_SHIFTING_HAIRACC: '外型變更', SHAPE_SHIFTING_HAIRACC_FIXED: '外型變更',
  BLESS_SHAPE_SHIFTING_WP: '外型變更', BLESS_SHAPE_SHIFTING_AM: '外型變更', RESTORE_SHAPE_SHIFTING_ALLITEM: '外型還原', BOX: '箱子／禮盒', HERB: '藥草', QUEST: '任務道具', LOTTO: '彩券', RACE_TICKET: '賽跑券',
};
const NTYPE = {
  Monster: '一般怪物', RaidBoss: '團隊首領', GrandBoss: '世界首領', FestivalMonster: '活動怪物', FeedableBeast: '野獸', Chest: '寶箱', TamedBeast: '馴服野獸',
  Merchant: '商人', Folk: 'NPC', Teleporter: '傳送師', Warehouse: '倉庫', VillageMaster: '職業導師', Guard: '守衛', Defender: '守城衛兵', Fisherman: '釣魚商人', ClanHallManager: '血盟根據地管理員',
  Doorman: '守門人', FriendlyNpc: '友好 NPC', Trainer: '訓練師', Adventurer: '冒險家公會', FortCommander: '要塞指揮官', FortManager: '要塞管理員',
};
const RACE = {
  UNDEAD: '不死系', HUMANOID: '人型', BEAST: '野獸', ANIMAL: '動物', PLANT: '植物', BUG: '昆蟲', DEMONIC: '惡魔', DRAGON: '龍族', GIANT: '巨人', CONSTRUCT: '人造物',
  ELEMENTAL: '元素', FAIRY: '妖精', ANGEL: '天使', DIVINE: '神族', ETC: '其他', HUMAN: '人類', ELF: '精靈', DARK_ELF: '黑暗精靈', ORC: '半獸人', DWARF: '矮人', KAMAEL: '闇天使',
  MERCENARY: '傭兵', CASTLE_GUARD: '城堡守衛', SIEGE_WEAPON: '攻城兵器', NONE: '其他', CREATURE: '生物', ERTHEIA: '艾特爾',
};
const ELEM = { FIRE: '火', WATER: '水', WIND: '風', EARTH: '地', HOLY: '聖', DARK: '暗' };
const ELEM_ORDER = ['FIRE', 'WATER', 'WIND', 'EARTH', 'HOLY', 'DARK'];
const ELEM_COLOR = { FIRE: '#e0613a', WATER: '#3a8fe0', WIND: '#3fb39a', EARTH: '#a7803a', HOLY: '#d6b23a', DARK: '#7a5ac8' };
const STAT = {
  pAtk: '物理攻擊力', mAtk: '魔法攻擊力', pDef: '物理防禦力', mDef: '魔法防禦力', critRate: '致命攻擊率', pAtkSpd: '攻擊速度', mCritRate: '魔法致命率', pAtkRange: '攻擊距離', randomDamage: '傷害浮動',
  accCombat: '命中', accMagic: '魔法命中', rEvas: '迴避', mEvas: '魔法迴避', rShld: '盾牌防禦率', sDef: '盾牌防禦力', maxMp: '最大 MP', maxHp: '最大 HP', moveSpeed: '移動速度',
  firePower: '火屬性攻擊', waterPower: '水屬性攻擊', windPower: '風屬性攻擊', earthPower: '地屬性攻擊', holyPower: '聖屬性攻擊', darkPower: '暗屬性攻擊',
  fireRes: '火屬性防禦', waterRes: '水屬性防禦', windRes: '風屬性防禦', earthRes: '地屬性防禦', holyRes: '聖屬性防禦', darkRes: '暗屬性防禦', magicSuccRes: '魔法抗性',
};
const GRADES = ['L', 'R110', 'R99', 'R95', 'R', 'S80', 'S', 'A', 'B', 'C', 'D'];
const gradeTag = (g) => (g && g !== 'NONE' ? '<span class="tag g-' + esc(g) + '">' + esc(g) + '</span>' : '');

function glyphOf(row) {
  const cat = row[3], slot = row[4], sub = row[6];
  if (cat === 'w') {
    if (/BOW/.test(sub)) return 'bow';
    if (/DAGGER/.test(sub)) return 'dagger';
    if (sub === 'POLE') return 'spear';
    if (/FIST/.test(sub)) return 'fist';
    if (/BLUNT/.test(sub)) return 'mace';
    return 'sword';
  }
  switch (slot) {
    case 'shield':
    case 'sigil':
      return 'shield';
    case 'head':
      return 'helm';
    case 'chest':
    case 'full':
    case 'shirt':
      return 'armor';
    case 'legs':
      return 'pants';
    case 'gloves':
      return 'glove';
    case 'feet':
      return 'boot';
    case 'ear':
      return 'ear';
    case 'ring':
      return 'ring';
    case 'neck':
      return 'neck';
    case 'hair':
    case 'hair2':
    case 'hairall':
      return 'mask';
    case 'cloak':
      return 'cloak';
    case 'belt':
      return 'belt';
    case 'agbr':
    case 'talbr':
    case 'tali':
      return 'sparkle';
    case 'brooch':
    case 'jewel':
      return 'gem';
    case 'artifact':
    case 'artbook':
      return 'book';
    case 'agathion':
      return 'lamp';
  }
  if (/ENCHT|SCROLL/.test(sub)) return 'scroll';
  if (/POTION|ELIXIR|HERB/.test(sub)) return 'potion';
  if (sub === 'RECIPE') return 'recipe';
  if (sub === 'BOX') return 'gift';
  if (/ARROW|BOLT/.test(sub)) return 'arrow';
  if (sub === 'DYE') return 'dye';
  if (sub === 'SOULSHOT') return 'bolt';
  if (sub === 'ENSOUL_STONE' || sub === 'MATERIAL') return 'gem';
  if (row[0] === 57) return 'coin';
  return 'box';
}
function iicon(row, size) {
  const g = row && row[5] && row[5] !== 'NONE' ? row[5] : 'none';
  return '<span class="iicon' + (size ? ' ' + size : '') + ' g-' + esc(g) + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[row ? glyphOf(row) : 'box'] || IC.box) + '</svg></span>';
}
function itemKind(row) {
  const cat = row[3], slot = row[4], sub = row[6];
  if (cat === 'w') {
    let t = WTYPE[sub] || '武器';
    if (slot === '2h' && (sub === 'SWORD' || sub === 'BLUNT')) t = '雙手' + t;
    return t;
  }
  if (cat === 'a') return (ATYPE[sub] ? ATYPE[sub] + ' · ' : '') + (SLOT[slot] || '防具');
  if (cat === 'j' || cat === 'x') return SLOT[slot] || '飾品';
  return ETYPE[sub] || (sub ? sub : '道具');
}

// ------------------------------------------------------------------
// 資料索引
// ------------------------------------------------------------------
let ITEMS = null, NPCS = null;
function itemIndex() {
  if (ITEMS) return Promise.resolve(ITEMS);
  return need('items-index').then((rows) => {
    ITEMS = new Map();
    rows.forEach((r) => ITEMS.set(r[0], r));
    ITEMS.rows = rows;
    return ITEMS;
  });
}
function npcIndex() {
  if (NPCS) return Promise.resolve(NPCS);
  return need('npcs-index').then((rows) => {
    NPCS = new Map();
    rows.forEach((r) => NPCS.set(r[0], r));
    NPCS.rows = rows;
    return NPCS;
  });
}
const itemDetail = (id) => need('meta').then((m) => need('items-' + Math.floor(id / m.bucketItem))).then((b) => b[id] || {});
const npcDetail = (id) => need('meta').then((m) => need('npcs-' + Math.floor(id / m.bucketNpc))).then((b) => b[id] || {});

function iname(id) {
  const r = ITEMS && ITEMS.get(id);
  if (id === -100) return 'PC 點數';
  if (id === -200) return '血盟名聲';
  if (id === -300) return '名聲';
  return r ? r[1] : '道具 #' + id;
}
function ilink(id, cnt, extra) {
  const r = ITEMS && ITEMS.get(id);
  if (!r) return '<span>' + esc(iname(id)) + (cnt != null && cnt !== 1 ? ' <span class="x">×' + fmt(cnt) + '</span>' : '') + '</span>';
  return '<span><a class="ilink" data-id="' + id + '" href="' + DB + '#item-' + id + '">' + esc(r[1]) + (r[2] ? ' <small>' + esc(r[2]) + '</small>' : '') + '</a>' + (extra || '') + (cnt != null && cnt !== 1 ? ' <span class="x">×' + fmt(cnt) + '</span>' : '') + '</span>';
}
function nlink(id) {
  const r = NPCS && NPCS.get(id);
  if (!r) return '<span class="muted">NPC #' + id + '</span>';
  return '<a class="nlink" data-id="' + id + '" href="' + DB + '#npc-' + id + '">' + esc(r[1]) + '</a>';
}

// ------------------------------------------------------------------
// 頁面清單（搜尋與連結用）
// ------------------------------------------------------------------
const DB_PAGES = [
  { id: 'db-items', title: '道具資料庫', icon: 'box', summary: '搜尋所有道具的能力、說明與取得途徑。', order: 10 },
  { id: 'db-npcs', title: '怪物資料庫', icon: 'skull', summary: '怪物等級、能力、出沒地點與掉落。', order: 20 },
  { id: 'db-bosses', title: 'BOSS 資料庫', icon: 'crown', summary: '團隊首領與世界首領一覽：等級、地點、重生時間。', order: 30 },
  { id: 'db-zones', title: '獵場資料庫', icon: 'map', summary: '各獵場推薦等級與出沒怪物。', order: 40 },
  { id: 'db-sets', title: '套裝資料庫', icon: 'armor', summary: '防具套裝部件與套裝效果。', order: 50 },
  { id: 'db-skills', title: '職業技能', icon: 'bolt', summary: '各職業可學習的技能、等級與說明。', order: 60 },
  { id: 'db-collections', title: '收藏資料庫', icon: 'star', summary: '收藏所需道具、強化值與效果。', order: 70 },
  { id: 'db-agathions', title: '壺精資料庫', icon: 'lamp', summary: '壺精的主／副技能與各強化等級效果。', order: 80 },
  { id: 'db-shops', title: '商店兌換表', icon: 'bag', summary: '布告欄與 NPC 的兌換清單內容。', order: 90 },
];
let PAGES = [];
const PAGE = Object.create(null);
DB_PAGES.forEach((p) => (PAGE[p.id] = Object.assign({ nav: 'db', db: true, keywords: '', text: '', heads: [] }, p)));
let pagesReady = null;
function loadPages() {
  if (!pagesReady) {
    pagesReady = need('pages').then((list) => {
      PAGES = list.filter((p) => p.id !== 'home').concat(DB_PAGES.map((p) => PAGE[p.id]));
      list.forEach((p) => (PAGE[p.id] = p));
      return PAGES;
    });
  }
  return pagesReady;
}

// ==================================================================
// 資料庫頁
// ==================================================================
const ENTITY_RE = /^(item|npc|set|class|shop|buy|col|zone|agathion)-(-?\d+)$/;
const ENTITY_DB = { item: 'db-items', npc: 'db-npcs', set: 'db-sets', class: 'db-skills', shop: 'db-shops', buy: 'db-shops', col: 'db-collections', zone: 'db-zones', agathion: 'db-agathions' };
const crumbs = () => '<div class="crumbs"><a href="' + BASE + '">攻略百科</a><span>／</span><a href="' + DB + '">資料庫</a></div>';
const backLink = (id, text) => '<a class="back-link" href="' + DB + '#' + id + '">' + ico('arrowL') + esc(text) + '</a>';

function currentDbId() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  const m = h.match(ENTITY_RE);
  if (m) return ENTITY_DB[m[1]];
  return h.split('--')[0] || '';
}
function syncDbNav() {
  const cur = currentDbId();
  $$('[data-db-link]').forEach((a) => {
    const on = a.dataset.dbLink === cur;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

let routeToken = 0;
function route() {
  const token = ++routeToken;
  closePalette();
  hideTip();
  closeSide();
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  const main = $('#wikiDb');
  if (!main) return;
  const done = (html, after) => {
    if (token !== routeToken) return;
    main.innerHTML = html;
    scrollTop();
    if (after) after(main);
    syncDbNav();
  };
  const fail = (e) => done('<div class="article"><h1 class="page-h1">載入失敗</h1><p>' + esc(e && e.message ? e.message : e) + '</p><p><a href="' + DB + '">回資料庫首頁</a></p></div>');
  main.innerHTML = '<div class="loading">載入中…</div>';
  const m = h.match(ENTITY_RE);
  if (m) {
    const id = parseInt(m[2], 10);
    const fn = { item: viewItem, npc: viewNpc, set: viewSet, class: viewClass, shop: viewShop, buy: viewBuy, col: viewCollection, zone: viewZone, agathion: viewAgathion }[m[1]];
    setTitle(PAGE[ENTITY_DB[m[1]]].title);
    fn(id).then((r) => done(r.html, r.after)).catch(fail);
    return;
  }
  if (!h) {
    setTitle('資料庫');
    done(viewDbHome());
    return;
  }
  const parts = h.split('--');
  const pid = parts[0];
  const views = { 'db-items': dbItems, 'db-npcs': dbNpcs, 'db-bosses': dbBosses, 'db-zones': dbZones, 'db-sets': dbSets, 'db-skills': dbSkills, 'db-collections': dbCollections, 'db-agathions': dbAgathions, 'db-shops': dbShops };
  const fn = views[pid];
  if (!fn) {
    // 舊版 wiki 的文章網址（#enchant、#enchant--rates）→ 轉到文章頁
    if (PAGE[pid] && !PAGE[pid].db) {
      location.replace(pageHref(pid, parts[1]));
      return;
    }
    setTitle('找不到頁面');
    done('<div class="article">' + crumbs() + '<h1 class="page-h1">找不到這個頁面</h1><p>連結可能已更名。試試上方的搜尋，或<a href="' + DB + '">回資料庫首頁</a>。</p></div>');
    return;
  }
  setTitle(PAGE[pid].title);
  fn().then((r) => done(r.html, r.after)).catch(fail);
}

function viewDbHome() {
  const m = store.meta || {};
  const counts = { 'db-items': [m.items, '件'], 'db-npcs': [m.mobs, '種'], 'db-sets': [m.sets, '套'], 'db-collections': [m.collections, '個'], 'db-agathions': [m.agathions, '種'], 'db-shops': [m.multisells, '張'] };
  let html = '<div class="article"><div class="crumbs"><a href="' + BASE + '">攻略百科</a><span>／</span><span>資料庫</span></div>';
  html += '<h1 class="page-h1">資料庫</h1><p class="page-sum">道具、怪物、掉落、商店……全部取自伺服器實際資料。不知道從哪查？按 <kbd>/</kbd> 直接搜尋。</p>';
  html += '<div class="db-home-grid">' + DB_PAGES.map((p) => {
    const c = counts[p.id];
    return '<a href="' + DB + '#' + p.id + '">' + ico(p.icon) + '<b>' + esc(p.title) + '</b><span>' + esc(p.summary) + '</span>' + (c && c[0] ? '<em>' + fmt(c[0]) + ' ' + c[1] + '</em>' : '') + '</a>';
  }).join('') + '</div>';
  html += '<p class="foot-note">資料版本 ' + esc(m.built || '') + '。數值都取自本伺服器，可能和官方版本不同。</p></div>';
  return html;
}

// ------------------------------------------------------------------
// 道具資料庫
// ------------------------------------------------------------------
const dbState = { items: { q: '', cat: '', grade: '', slot: '', src: false, n: 120 }, npcs: { q: '', type: 'mob', lv: '', aggro: false, n: 120 } };

function dbItems() {
  return itemIndex().then(() => {
    const st = dbState.items;
    const html = '<div class="article">' + crumbs() +
      '<h1 class="page-h1">道具資料庫</h1><p class="page-sum">收錄 ' + fmt(ITEMS.rows.length) + ' 件道具。點進去看能力和取得方式。</p>' +
      '<div class="db-tools">' +
      '<label class="db-search">' + ico('search') + '<input id="dbq" type="search" placeholder="輸入道具名稱，例如：卡拉護身符、強化卷軸、龍" autocomplete="off" value="' + esc(st.q) + '" aria-label="搜尋道具"></label>' +
      '<div class="chips" data-k="cat"><span class="chips-label">類別</span>' + chipsHtml([['', '全部'], ['w', '武器'], ['a', '防具'], ['j', '首飾'], ['x', '飾品'], ['e', '其他道具']], st.cat) + '</div>' +
      '<div class="chips" data-k="grade"><span class="chips-label">等級</span>' + chipsHtml([['', '全部']].concat(GRADES.slice(0, 6).map((g) => [g, g])).concat([['low', 'A 以下'], ['none', '無等級']]), st.grade) + '</div>' +
      '<div class="chips"><span class="chips-label">部位</span><select class="sel" id="dbslot" aria-label="部位"><option value="">全部部位</option>' + Object.keys(SLOT).map((k) => '<option value="' + k + '"' + (st.slot === k ? ' selected' : '') + '>' + esc(SLOT[k]) + '</option>').join('') + '</select>' +
      '<button class="chip' + (st.src ? ' on' : '') + '" id="dbsrc" type="button">只看有取得途徑的</button></div>' +
      '</div><div class="db-count" id="dbcount"></div><div id="dbres"></div></div>';
    return { html: html, after: bindItemsDb };
  });
}
function chipsHtml(opts, cur) {
  return opts.map((o) => '<button type="button" class="chip' + (o[0] === cur ? ' on' : '') + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>').join('');
}
function bindChips(root, state, rerender) {
  $$('.chips[data-k]', root).forEach((c) => {
    c.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      state[c.dataset.k] = b.dataset.v;
      state.n = 120;
      $$('.chip', c).forEach((x) => x.classList.toggle('on', x === b));
      rerender();
    });
  });
}
function bindChipGroup(root, sel, setter, render) {
  $(sel, root).addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    setter(b.dataset.v);
    $$('.chip', $(sel, root)).forEach((x) => x.classList.toggle('on', x === b));
    render();
  });
}
function matchQ(name, q) {
  return !q || name.toLowerCase().indexOf(q) >= 0;
}
function scoreName(name, q) {
  if (!q) return 0;
  const n = name.toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  return 2 + n.indexOf(q) / 100;
}
function bindItemsDb(root) {
  const st = dbState.items;
  const res = $('#dbres', root), cnt = $('#dbcount', root);
  function render() {
    const q = st.q.trim().toLowerCase();
    const idq = /^#?\d+$/.test(q) ? parseInt(q.replace('#', ''), 10) : -1;
    let list = ITEMS.rows.filter((r) => {
      if (idq >= 0) return r[0] === idq;
      if (q && !matchQ(r[1] + ' ' + r[2], q)) return false;
      if (st.cat && r[3] !== st.cat) return false;
      if (st.grade) {
        if (st.grade === 'low') {
          if (['A', 'B', 'C', 'D'].indexOf(r[5]) < 0) return false;
        } else if (st.grade === 'none') {
          if (r[5] && r[5] !== 'NONE') return false;
        } else if (r[5] !== st.grade) {
          return false;
        }
      }
      if (st.slot && r[4] !== st.slot) return false;
      if (st.src && !(r[7] & 4)) return false;
      return true;
    });
    if (q) {
      list = list.map((r) => [scoreName(r[1], q) - (r[7] & 4 ? 0.6 : 0), r]).sort((a, b) => a[0] - b[0] || b[1][0] - a[1][0]).map((x) => x[1]);
    } else {
      list = list.slice();
      list.sort((a, b) => {
        const ga = GRADES.indexOf(a[5]), gb = GRADES.indexOf(b[5]);
        return (ga < 0 ? 99 : ga) - (gb < 0 ? 99 : gb) || b[0] - a[0];
      });
    }
    cnt.textContent = '找到 ' + fmt(list.length) + ' 件道具' + (list.length > st.n ? '，顯示前 ' + fmt(st.n) + ' 件' : '');
    if (!list.length) {
      res.innerHTML = '<div class="rows"><div class="empty">沒有符合的道具。試試更短的關鍵字，或清除篩選條件。</div></div>';
      return;
    }
    let html = '<div class="rows">';
    list.slice(0, st.n).forEach((r) => {
      html += '<a class="row" href="' + DB + '#item-' + r[0] + '">' + iicon(r) + '<div class="row-main"><div class="row-title">' + esc(r[1]) + (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</div><div class="row-sub">' + esc(itemKind(r)) + ' · ID ' + r[0] + (r[7] & 1 ? ' · 不可交易' : '') + '</div></div><div class="row-side">' + gradeTag(r[5]) + (r[7] & 4 ? '' : '<span class="tag">無已知來源</span>') + '</div></a>';
    });
    if (list.length > st.n) html += '<button class="more-btn" type="button" id="more">顯示更多（還有 ' + fmt(list.length - st.n) + ' 件）</button>';
    html += '</div>';
    res.innerHTML = html;
    const more = $('#more', res);
    if (more) {
      more.onclick = () => {
        st.n += 240;
        render();
      };
    }
  }
  $('#dbq', root).addEventListener('input', debounce((e) => {
    st.q = e.target.value;
    st.n = 120;
    render();
  }, 160));
  $('#dbslot', root).addEventListener('change', (e) => {
    st.slot = e.target.value;
    st.n = 120;
    render();
  });
  $('#dbsrc', root).addEventListener('click', (e) => {
    st.src = !st.src;
    e.currentTarget.classList.toggle('on', st.src);
    render();
  });
  bindChips(root, st, render);
  render();
  if (!st.q && window.matchMedia('(pointer: fine)').matches) $('#dbq', root).focus({ preventScroll: true });
}

// ------------------------------------------------------------------
// 道具詳細
// ------------------------------------------------------------------
function viewItem(id) {
  return Promise.all([itemIndex(), npcIndex(), need('ms-op')]).then(() => itemDetail(id)).then((d) => {
    const r = ITEMS.get(id);
    if (!r) return { html: '<div class="article">' + backLink('db-items', '道具資料庫') + '<h1 class="page-h1">找不到道具 #' + id + '</h1><p>這個道具可能未在本伺服器使用。</p></div>' };
    setTitle(r[1] + '｜道具');
    let html = '<div class="article">' + backLink('db-items', '道具資料庫');
    html += '<div class="ent-head">' + iicon(r, 'lg') + '<div><h1>' + esc(r[1]) + (r[2] ? ' <small class="muted">' + esc(r[2]) + '</small>' : '') + '</h1><div class="tags">' + gradeTag(r[5]) + '<span class="tag">' + esc(itemKind(r)) + '</span>' + (r[7] & 1 ? '<span class="tag">不可交易</span>' : '') + (r[7] & 2 ? '<span class="tag">不可丟棄</span>' : '') + (r[7] & 8 ? '<span class="tag t-weekly">限時道具</span>' : '') + '<span class="tag mono">ID ' + id + '</span></div></div></div>';
    html += '<div class="ent-grid"><div>';
    if (d.d) html += '<div class="panel"><h2>道具說明</h2><div class="panel-body desc">' + esc(d.d) + '</div></div>';
    if (d.sk && d.sk.length) html += '<div class="panel"><h2>裝備效果</h2>' + d.sk.map((s) => '<div class="skill-row"><b>' + esc(s[2] || '技能 #' + s[0]) + ' <span class="tag">Lv ' + s[1] + '</span></b>' + (s[3] ? '<p>' + esc(s[3]) + '</p>' : '') + '</div>').join('') + '</div>';
    if (d.box && d.box.length) {
      html += '<div class="panel"><h2>打開後可獲得 <small>' + d.box.length + ' 種</small></h2><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>內容物</th><th class="r">數量</th><th class="r">機率</th></tr></thead><tbody>' +
        d.box.map((b) => '<tr><td>' + ilink(b[0], null, b[4] ? ' <span class="tag">+' + b[4] + '</span>' : '') + '</td><td class="r num">' + range(b[1], b[2]) + '</td><td class="r"><span class="' + pctCls(b[3]) + '">' + fmtPct(b[3]) + '</span></td></tr>').join('') + '</tbody></table></div></div>';
    }
    html += renderSources(d.src || [], id);
    html += renderUses(d, id);
    html += '</div><div>';
    if (d.st) html += '<div class="panel"><h2>基本能力</h2><div class="stats">' + Object.keys(d.st).map((k) => '<div class="stat"><b>' + fmt(d.st[k]) + '</b><span>' + esc(STAT[k] || k) + '</span></div>').join('') + '</div></div>';
    html += '<div class="panel"><h2>道具資訊</h2><div class="panel-body"><dl class="kv" style="border:0;padding:0;margin:0;">' + itemProps(r, d) + '</dl></div></div>';
    html += '<div id="setbox"></div>';
    if (d.es && d.es.length) html += '<div class="panel"><h2>可使用的強化卷軸</h2><div class="panel-body"><div class="ing" style="flex-direction:column;gap:6px;">' + d.es.map((x) => ilink(x)).join('') + '</div></div></div>';
    html += '</div></div></div>';
    return {
      html: html,
      after: (root) => {
        if (d.set != null) {
          need('sets').then((sets) => {
            const s = sets.find((x) => x.id === d.set);
            const box = $('#setbox', root);
            if (s && box) box.innerHTML = setPanel(s, id);
          });
        }
      },
    };
  });
}
function itemProps(r, d) {
  const p = d.p || {};
  const rows = [];
  rows.push(['類型', itemKind(r)]);
  if (p.weight) rows.push(['重量', fmt(p.weight)]);
  if (p.price && p.price !== '0') rows.push(['商店基準價', fmt(p.price) + ' 金幣']);
  if (p.soulshots) rows.push(['靈魂彈消耗', p.soulshots + (p.spiritshots ? ' ／ 魔力彈 ' + p.spiritshots : '')]);
  if (p.is_stackable === 'true') rows.push(['可堆疊', '是']);
  rows.push(['交易', r[7] & 1 ? '不可交易' : '可交易']);
  if (p.is_depositable === 'false') rows.push(['倉庫', '不可存放']);
  if (p.is_sellable === 'false') rows.push(['販賣給商店', '不可']);
  if (p.time || p.duration) rows.push(['使用期限', p.time ? fmt(p.time) + ' 分鐘' : fmt(p.duration) + ' 分鐘']);
  if (p.enchant_limit) rows.push(['強化上限', '+' + p.enchant_limit]);
  if (p.is_oly_restricted === 'true') rows.push(['奧林匹亞', '不可使用']);
  return rows.map((x) => '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>').join('');
}
function setPanel(s, curId) {
  let html = '<div class="panel"><h2>套裝 <small><a href="' + DB + '#set-' + s.id + '">查看套裝</a></small></h2><div class="panel-body"><div class="ing" style="flex-direction:column;gap:4px;">';
  s.req.forEach((x) => {
    html += x === curId ? '<span><b>' + esc(iname(x)) + '</b>（本件）</span>' : ilink(x);
  });
  html += '</div></div>';
  s.sk.slice(0, 6).forEach((k) => {
    html += '<div class="skill-row"><b>' + esc(k[5] || '套裝效果') + ' ' + (k[2] ? '<span class="tag">' + k[2] + ' 件</span>' : '') + (k[3] ? '<span class="tag">全部 +' + k[3] + '</span>' : '') + (k[4] ? '<span class="tag">搭配盾牌／印記</span>' : '') + '</b>' + (k[6] ? '<p>' + esc(k[6]) + '</p>' : '') + '</div>';
  });
  return html + '</div>';
}

// 來源類型
const SRC_ORDER = ['init', 'ms', 'buy', 'lshop', 'lcraft', 'craft', 'upg', 'comb', 'box', 'script', 'cfg', 'daily', 'attend', 'hpass', 'bossx', 'drop', 'ltd', 'spoil'];
const SRC_NAME = {
  init: ['gift', '新角色初始道具'], ms: ['bag', '商店兌換'], buy: ['coin', 'NPC 商店購買'], lshop: ['bag', '百貨小舖（殷海薩金幣商城）'], lcraft: ['sparkle', '特殊製作'], craft: ['recipe', '製作'],
  upg: ['layers', '裝備升級'], comb: ['repeat', '合成'], box: ['gift', '打開箱子／禮盒'], script: ['scroll', '任務・副本・活動・NPC 獎勵'], cfg: ['trophy', '排名・競賽・轉生獎勵'], daily: ['calendar', '每日任務獎勵'], attend: ['calendar', '出席簽到獎勵'],
  hpass: ['trophy', '狩獵通行證獎勵'], bossx: ['crown', '首領額外掉落'], drop: ['skull', '怪物掉落'], ltd: ['clock', '每日限量掉落'], spoil: ['key', '回收（屍體回收）'],
};
const SCRIPT_KIND = { quest: '任務', inst: '副本', event: '活動', boss: '首領', custom: '本服客製', npc: 'NPC', area: '地區', item: '道具', sys: '系統' };
const BOSS_FOLDER = {};
const EVENT_FOLDER = {};
const INST_FOLDER = {};
const CUSTOM_FOLDER = {};

function openerLabel(op) {
  if (op[0] === 'n') {
    const nid = parseInt(op.slice(1), 10);
    const r = NPCS && NPCS.get(nid);
    return nlink(nid) + (r && r[5] ? ' <span class="muted">（' + esc(r[5]) + '）</span>' : '');
  }
  if (op[0] === 'i') return '<span class="tag">雙擊道具</span> ' + ilink(parseInt(op.slice(1), 10));
  return '<span class="tag t-new">布告欄</span> ' + esc(boardPageName(op.slice(1)));
}
function boardPageName(page) {
  const map = {
    'merchant/weapons': '商店 › 武器', 'merchant/armor': '商店 › 防具', 'merchant/jewels': '商店 › 飾品', 'merchant/main': '商店', 'blacksmith/main': '鐵匠', 'einhasad/main': '殷海薩商店',
    'grocery/main': '雜貨', 'premium/main': '高級會員', 'buffer/main': '輔助', 'gatekeeper/main': '傳送',
  };
  const k = page.replace(/^Custom\//, '').replace(/\.html?$/, '');
  return map[k] || k;
}
const msOpeners = (listId) => (store['ms-op'] && store['ms-op'].ms[listId]) || [];

function renderSources(src, selfId) {
  if (!src.length) return '<div class="panel"><h2>取得途徑</h2><div class="panel-body muted">目前查不到取得方式，可能是活動道具或尚未開放。</div></div>';
  const by = {};
  src.forEach((s) => (by[s[0]] = by[s[0]] || []).push(s));
  let html = '<div class="panel"><h2>取得途徑 <small>' + src.length + ' 筆</small></h2>';
  SRC_ORDER.forEach((t) => {
    const l = by[t];
    if (!l) return;
    const nm = SRC_NAME[t];
    html += '<div class="src-sec"><div class="src-title">' + ico(nm[0]) + esc(nm[1]) + ' <span class="muted">（' + l.length + '）</span></div>';
    if (t === 'drop' || t === 'spoil' || t === 'ltd') {
      const LIM = 25;
      html += '<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>怪物</th><th class="r">等級</th><th>地點</th><th class="r">數量</th><th class="r">機率</th>' + (t === 'ltd' ? '<th class="r">每日上限</th>' : '') + '</tr></thead><tbody>';
      l.slice(0, LIM).forEach((s) => {
        const n = NPCS.get(s[1]);
        html += '<tr><td>' + nlink(s[1]) + (n && (n[4] === 'RaidBoss' || n[4] === 'GrandBoss') ? ' <span class="tag t-cc">首領</span>' : '') + '</td><td class="r num">' + (n ? n[3] : '') + '</td><td>' + esc(n ? n[5] || '—' : '—') + '</td><td class="r num">' + range(s[3], s[4]) + '</td><td class="r"><span class="' + pctCls(s[2]) + '">' + fmtPct(s[2]) + '</span></td>' + (t === 'ltd' ? '<td class="r num">' + fmt(s[5]) + '</td>' : '') + '</tr>';
      });
      html += '</tbody></table></div>';
      if (l.length > LIM) html += '<div class="note">另有 ' + (l.length - LIM) + ' 種怪物也會掉落（只列機率最高的 ' + LIM + ' 種）。</div>';
      if (t === 'drop') html += '<div class="note">一般怪物每次最多掉 2 樣。你比怪物高 15 級以上，掉落率會變低。</div>';
      if (t === 'spoil') html += '<div class="note">先對怪物用回收技能（Spoil），擊殺後回收屍體才拿得到。</div>';
    } else {
      html += '<ul class="src-list">';
      const LIM = 30;
      l.slice(0, LIM).forEach((s) => {
        html += '<li>' + srcLine(t, s, selfId) + '</li>';
      });
      html += '</ul>';
      if (l.length > LIM) html += '<div class="note">另有 ' + (l.length - LIM) + ' 筆未列出。</div>';
    }
    html += '</div>';
  });
  return html + '</div>';
}
function ingList(ing) {
  return '<span class="ing">' + ing.map((x) => ilink(x[0], x[1], x[2] ? ' <span class="tag">+' + x[2] + '</span>' : '')).join('') + '</span>';
}
function srcLine(t, s) {
  switch (t) {
    case 'ms': {
      const ops = msOpeners(s[1]);
      return '<div>' + (ops.length ? ops.slice(0, 3).map(openerLabel).join('、') : '<span class="muted">兌換清單</span>') + ' <a class="muted" href="' + DB + '#shop-' + s[1] + '">（清單 ' + s[1] + '）</a></div><div>用 ' + ingList(s[2]) + ' 換得 <b class="num">' + fmt(s[3]) + '</b> 個' + (s[4] ? '（+' + s[4] + '）' : '') + (s[5] != null ? '，機率 ' + fmtPct(s[5]) : '') + '</div>';
    }
    case 'buy': {
      const npcsL = (store['ms-op'] && store['ms-op'].bl[s[1]]) || [];
      return '<div>' + (npcsL.length ? npcsL.slice(0, 4).map((n) => (n < 0 ? '<span class="tag t-new">布告欄</span> 商店' : openerLabel('n' + n))).join('、') : 'NPC 商店') + '</div><div>價格 <b class="num">' + fmt(s[2]) + '</b> 金幣（另依城堡稅率調整）<a class="muted" href="' + DB + '#buy-' + s[1] + '">（清單 ' + s[1] + '）</a></div>';
    }
    case 'craft':
      return '<div>使用配方 ' + ilink(s[1]) + '，成功率 ' + s[2] + '%' + (s[5] != null && s[5] < 100 ? '（產出機率 ' + fmtPct(s[5]) + '）' : '') + '，產出 ' + fmt(s[4]) + ' 個</div><div class="muted">材料：</div>' + ingList(s[3]);
    case 'upg':
      return '<div>' + ilink(s[1], null, s[2] ? ' <span class="tag">+' + s[2] + '</span>' : '') + ' 升級為本道具' + (s[3] ? ' <span class="tag">+' + s[3] + '</span>' : '') + '</div><div class="muted">材料：</div>' + ingList(s[4]) + (s[5] ? '<div>手續費 <b class="num">' + fmt(s[5]) + '</b> 金幣</div>' : '');
    case 'comb':
      return '<div>' + ilink(s[1]) + ' ＋ ' + ilink(s[2]) + '</div><div>成功率 <b>' + s[3] + '%</b>' + (s[4] ? '，手續費 ' + fmt(s[4]) + ' 金幣' : '') + (s[5] ? '；失敗時得到 ' + ilink(s[5]) : '') + '</div>';
    case 'box':
      return '<div>打開 ' + ilink(s[1]) + ' 獲得 ' + range(s[2], s[3]) + ' 個' + (s[5] ? ' <span class="tag">+' + s[5] + '</span>' : '') + '，機率 <span class="' + pctCls(s[4]) + '">' + fmtPct(s[4]) + '</span></div>';
    case 'lshop':
    case 'lcraft':
      return '<div>用 ' + ingList(s[2]) + ' 換得 ' + fmt(s[3]) + ' 個' + (s[4] != null && s[4] < 100 ? '，機率 ' + fmtPct(s[4]) : '') + (s[5] ? ' <span class="tag t-weekly">' + esc(s[5]) + '</span>' : '') + '</div>';
    case 'script': {
      const kind = SCRIPT_KIND[s[1]] || '腳本';
      const parts = String(s[2]).split('|');
      let label = parts[1] || parts[0];
      if (s[1] === 'quest') label = parts[1] || '任務 ' + parts[0];
      else if (s[1] === 'boss') label = BOSS_FOLDER[parts[0]] || parts[0];
      else if (s[1] === 'event') label = EVENT_FOLDER[parts[0]] || parts[0];
      else if (s[1] === 'inst') label = parts[1] || INST_FOLDER[parts[0]] || parts[0];
      else if (s[1] === 'custom') label = CUSTOM_FOLDER[parts[0]] || parts[0];
      // 道具處理器：雙擊這些道具時取得
      else if (s[1] === 'item') return '<span class="tag">' + esc(kind) + '</span> 雙擊 ' + String(s[2]).split(',').map((x) => ilink(parseInt(x, 10))).join('、');
      const tag = '<span class="tag">' + esc(kind) + '</span> ';
      // 對應的 NPC：對話 NPC 直接列出位置；首領與地區則把說明放在括號
      if (s[3]) return s[1] === 'npc' ? tag + openerLabel('n' + s[3]) : tag + nlink(s[3]) + ' <span class="muted">（' + esc(label) + '）</span>';
      return tag + esc(label);
    }
    case 'cfg':
      return esc(s[1]) + ' ×' + fmt(s[2]) + (s[3] != null ? '，機率 ' + fmtPct(s[3]) : '');
    case 'daily':
      return '每日任務獎勵 ×' + fmt(s[2]) + ' <a class="muted" href="' + pageHref('daily') + '">（每日待辦）</a>';
    case 'attend':
      return '出席簽到獎勵 ×' + fmt(s[1]);
    case 'hpass':
      return '狩獵通行證' + (s[2] ? '（高級）' : '（免費）') + '獎勵 ×' + fmt(s[1]);
    case 'bossx':
      return 'Lv ' + s[4] + ' 以上的首領額外掉落 ' + range(s[1], s[2]) + ' 個，機率 ' + fmtPct(s[3]);
    case 'init':
      return '新創角色身上就有 ×' + fmt(s[1]) + ' <a class="muted" href="' + pageHref('newbie') + '">（新手第一天）</a>';
  }
  return esc(JSON.stringify(s));
}

function renderUses(d) {
  const u = d.use || [];
  if (!u.length) return '';
  const by = {};
  u.forEach((s) => (by[s[0]] = by[s[0]] || []).push(s));
  const NAMES = { col: ['star', '可登錄的收藏'], ms: ['bag', '可以拿去兌換'], craft: ['recipe', '製作材料'], upg: ['layers', '可升級為'], comb: ['repeat', '合成材料'], lshop: ['bag', '百貨小舖可兌換'], lcraft: ['sparkle', '特殊製作材料'], ench: ['scroll', '可強化的裝備'] };
  let html = '<div class="panel"><h2>用途 <small>' + (u.length + (d.useMore || 0)) + ' 筆</small></h2>';
  ['col', 'upg', 'ms', 'craft', 'comb', 'lshop', 'lcraft', 'ench'].forEach((t) => {
    const l = by[t];
    if (!l) return;
    html += '<div class="src-sec"><div class="src-title">' + ico(NAMES[t][0]) + esc(NAMES[t][1]) + ' <span class="muted">（' + l.length + '）</span></div><ul class="src-list">';
    const LIM = t === 'ench' ? 40 : 30;
    l.slice(0, LIM).forEach((s) => {
      let line = '';
      switch (t) {
        case 'col':
          line = '<a href="' + DB + '#col-' + s[1] + '">' + esc(colName(s[1])) + '</a>';
          break;
        case 'upg':
          line = (s[2] ? '<span class="tag">+' + s[2] + '</span> ' : '') + '可升級為 ' + ilink(s[1], null, s[3] ? ' <span class="tag">+' + s[3] + '</span>' : '');
          break;
        case 'ms': {
          const ops = msOpeners(s[2]);
          line = '換 ' + ilink(s[1]) + ' <span class="muted">— ' + (ops.length ? ops.slice(0, 2).map(openerLabel).join('、') : '兌換清單') + '</span> <a class="muted" href="' + DB + '#shop-' + s[2] + '">（清單 ' + s[2] + '）</a>';
          break;
        }
        case 'craft':
          line = '製作 ' + ilink(s[1]) + ' <span class="muted">（配方：' + esc(iname(s[2])) + '）</span>';
          break;
        case 'comb':
          line = '與 ' + ilink(s[2]) + ' 合成 ' + ilink(s[1]) + '，成功率 ' + s[3] + '%';
          break;
        case 'lshop':
        case 'lcraft':
          line = '可換 ' + ilink(s[1]);
          break;
        case 'ench':
          line = ilink(s[1]);
          break;
      }
      html += '<li>' + line + '</li>';
    });
    html += '</ul>' + (l.length > LIM ? '<div class="note">另有 ' + (l.length - LIM) + ' 筆未列出。</div>' : '') + '</div>';
  });
  if (d.useMore) html += '<div class="note">還有 ' + d.useMore + ' 筆用途（多為兌換清單）未列出。</div>';
  return html + '</div>';
}
let COLS = null;
function colName(id) {
  const c = COLS && COLS.get(id);
  if (!c) return '收藏 #' + id;
  return c.n || c.en || '收藏 #' + id;
}

// ------------------------------------------------------------------
// 怪物資料庫
// ------------------------------------------------------------------
function dbNpcs() {
  return npcIndex().then(() => {
    const st = dbState.npcs;
    const html = '<div class="article">' + crumbs() +
      '<h1 class="page-h1">怪物資料庫</h1><p class="page-sum">怪物的等級、能力、地點與掉落（已套用本服的怪物強度）。</p>' +
      '<div class="db-tools"><label class="db-search">' + ico('search') + '<input id="dbq" type="search" placeholder="輸入怪物名稱或地點，例如：奧比斯、刑場、安塔瑞斯" autocomplete="off" value="' + esc(st.q) + '" aria-label="搜尋怪物"></label>' +
      '<div class="chips" data-k="type"><span class="chips-label">種類</span>' + chipsHtml([['mob', '全部怪物'], ['Monster', '一般怪物'], ['boss', '首領'], ['npc', '一般 NPC']], st.type) + '</div>' +
      '<div class="chips" data-k="lv"><span class="chips-label">等級</span>' + chipsHtml([['', '全部'], ['85-99', '85～99'], ['100-109', '100～109'], ['110-119', '110～119'], ['120-125', '120～125'], ['126-130', '126～130'], ['131-140', '131 以上']], st.lv) + '</div>' +
      '<div class="chips"><span class="chips-label">其他</span><button class="chip' + (st.aggro ? ' on' : '') + '" id="dbag" type="button">只看主動攻擊</button></div>' +
      '</div><div class="db-count" id="dbcount"></div><div id="dbres"></div></div>';
    return { html: html, after: bindNpcsDb };
  });
}
function bindNpcsDb(root) {
  const st = dbState.npcs;
  const res = $('#dbres', root), cnt = $('#dbcount', root);
  function render() {
    const q = st.q.trim().toLowerCase();
    const idq = /^#?\d+$/.test(q) ? parseInt(q.replace('#', ''), 10) : -1;
    let lo = 0, hi = 999;
    if (st.lv) {
      const p = st.lv.split('-');
      lo = +p[0];
      hi = +p[1];
    }
    let list = NPCS.rows.filter((r) => {
      if (idq >= 0) return r[0] === idq;
      if (st.type === 'mob' && !r[6]) return false;
      if (st.type === 'Monster' && r[4] !== 'Monster') return false;
      if (st.type === 'boss' && r[4] !== 'RaidBoss' && r[4] !== 'GrandBoss') return false;
      if (st.type === 'npc' && r[6]) return false;
      if (st.type !== 'npc' && (r[3] < lo || r[3] > hi)) return false;
      if (st.aggro && !r[7]) return false;
      if (q && !matchQ(r[1] + ' ' + r[2] + ' ' + r[5], q)) return false;
      return true;
    });
    if (q) list = list.map((r) => [Math.min(scoreName(r[1], q), 3 + scoreName(r[5], q)), r]).sort((a, b) => a[0] - b[0] || b[1][3] - a[1][3]).map((x) => x[1]);
    else list = list.slice().sort((a, b) => b[3] - a[3] || a[0] - b[0]);
    cnt.textContent = '找到 ' + fmt(list.length) + ' 筆' + (list.length > st.n ? '，顯示前 ' + fmt(st.n) + ' 筆' : '');
    if (!list.length) {
      res.innerHTML = '<div class="rows"><div class="empty">沒有符合的結果。</div></div>';
      return;
    }
    let html = '<div class="rows">';
    list.slice(0, st.n).forEach((r) => {
      html += npcRow(r);
    });
    if (list.length > st.n) html += '<button class="more-btn" type="button" id="more">顯示更多（還有 ' + fmt(list.length - st.n) + ' 筆）</button>';
    res.innerHTML = html + '</div>';
    const more = $('#more', res);
    if (more) {
      more.onclick = () => {
        st.n += 240;
        render();
      };
    }
  }
  $('#dbq', root).addEventListener('input', debounce((e) => {
    st.q = e.target.value;
    st.n = 120;
    render();
  }, 160));
  $('#dbag', root).addEventListener('click', (e) => {
    st.aggro = !st.aggro;
    e.currentTarget.classList.toggle('on', st.aggro);
    render();
  });
  bindChips(root, st, render);
  render();
}
function npcIcon(r, size) {
  const boss = r[4] === 'RaidBoss' || r[4] === 'GrandBoss';
  const g = r[4] === 'GrandBoss' ? 'L' : r[4] === 'RaidBoss' ? 'R' : r[6] ? 'none' : 'B';
  return '<span class="iicon' + (size ? ' ' + size : '') + ' g-' + g + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC[boss ? 'crown' : r[6] ? 'skull' : 'user'] + '</svg></span>';
}
function npcRow(r) {
  return '<a class="row" href="' + DB + '#npc-' + r[0] + '">' + npcIcon(r) + '<div class="row-main"><div class="row-title">' + esc(r[1]) + (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</div><div class="row-sub">' + esc(NTYPE[r[4]] || r[4]) + (r[5] ? ' · ' + esc(r[5]) : '') + '</div></div><div class="row-side">' + (r[6] ? '<span class="tag num">Lv ' + r[3] + '</span>' : '') + (r[7] ? '<span class="tag t-pvp">主動</span>' : '') + (r[8] ? '' : r[6] ? '<span class="tag">無掉落</span>' : '') + '</div></a>';
}

// ------------------------------------------------------------------
// 怪物詳細
// ------------------------------------------------------------------
function viewNpc(id) {
  return Promise.all([itemIndex(), npcIndex(), need('ms-op')]).then(() => npcDetail(id)).then((d) => {
    const r = NPCS.get(id);
    if (!r) return { html: '<div class="article">' + backLink('db-npcs', '怪物資料庫') + '<h1 class="page-h1">找不到 NPC #' + id + '</h1></div>' };
    setTitle(r[1] + '｜怪物');
    const mob = !!r[6];
    let html = '<div class="article">' + backLink('db-npcs', '怪物資料庫');
    html += '<div class="ent-head">' + npcIcon(r, 'lg') + '<div><h1>' + esc(r[1]) + (r[2] ? ' <small class="muted">' + esc(r[2]) + '</small>' : '') + '</h1><div class="tags">' + (mob ? '<span class="tag num">Lv ' + r[3] + '</span>' : '') + '<span class="tag">' + esc(NTYPE[r[4]] || r[4]) + '</span>' + (d.race ? '<span class="tag">' + esc(RACE[d.race] || d.race) + '</span>' : '') + (r[7] ? '<span class="tag t-pvp">主動攻擊</span>' : mob ? '<span class="tag t-party">被動</span>' : '') + '<span class="tag mono">ID ' + id + '</span></div></div></div>';
    html += '<div class="ent-grid"><div>';
    if (mob) {
      html += '<div class="panel"><h2>能力</h2><div class="stats">' +
        [['HP', d.hp], ['經驗值', d.exp], ['SP', d.sp], ['物理攻擊', d.patk], ['魔法攻擊', d.matk], ['物理防禦', d.pdef], ['魔法防禦', d.mdef], ['攻擊速度', d.aspd], ['跑速', d.run]]
          .map((x) => '<div class="stat"><b>' + fmt(x[1]) + '</b><span>' + x[0] + '</span></div>').join('') + '</div>' +
        '<div class="note" style="padding-top:10px;">經驗值為原始值；本服經驗 10 倍、組隊 30 倍、活力與會員另有加成。' + (d.atype ? '攻擊方式：' + esc(WTYPE[d.atype] || d.atype) + (d.range > 100 ? '（遠距離 ' + d.range + '）' : '（近戰）') + '。' : '') + (d.aggro ? '主動攻擊範圍 ' + d.aggro + '。' : '') + '</div></div>';
      html += dropPanels(d);
    }
    if (d.shops && d.shops.length) html += '<div class="panel"><h2>這個 NPC 的商店 <small>' + d.shops.length + ' 個</small></h2><ul class="src-list" style="padding-top:8px;">' + d.shops.map((s) => '<li>' + (s > 0 ? '<a href="' + DB + '#shop-' + s + '">兌換清單 ' + s + '</a>' : '<a href="' + DB + '#buy-' + -s + '">購買清單 ' + -s + '</a>') + '</li>').join('') + '</ul></div>';
    html += '</div><div>';
    if (d.loc) {
      const loc = d.loc;
      html += '<div class="panel"><h2>出沒地點</h2><ul class="src-list" style="padding-top:8px;">' + loc[0].map((l) => '<li>' + (l[2] ? '<a href="' + DB + '#zone-' + l[2] + '">' + esc(l[0]) + '</a>' : esc(l[0])) + ' <span class="x">×' + l[1] + '</span></li>').join('') + '</ul>' + (loc[1] ? '<div class="note">重生時間：' + esc(respawnText(loc[1], loc[2])) + '</div>' : '') + '</div>';
    } else if (mob) {
      html += '<div class="panel"><h2>出沒地點</h2><div class="panel-body muted">野外沒有固定出現，可能在副本、任務、活動中出現或被召喚。</div></div>';
    }
    if (mob && d.de) {
      const max = Math.max(1, ...d.de);
      html += '<div class="panel"><h2>屬性</h2><div class="panel-body">' + (d.ae ? '<p style="margin:0 0 10px;">攻擊屬性：<b style="color:' + ELEM_COLOR[d.ae[0]] + '">' + esc(ELEM[d.ae[0]] || d.ae[0]) + ' ' + d.ae[1] + '</b></p>' : '<p class="muted" style="margin:0 0 10px;">無攻擊屬性</p>') +
        '<div class="attr-bars">' + ELEM_ORDER.map((e, i) => '<div class="attr-bar"><span>' + ELEM[e] + '防</span><i style="--w:' + Math.round((d.de[i] / max) * 100) + '%;--ac:' + ELEM_COLOR[e] + '"></i><span class="num r">' + d.de[i] + '</span></div>').join('') + '</div>' +
        '<p class="muted" style="font-size:12.5px;margin:10px 0 0;">防禦值越低的屬性，用該屬性攻擊越有效。</p></div></div>';
    }
    html += '</div></div></div>';
    return { html: html };
  });
}
function respawnText(t, rnd) {
  const conv = (s) => String(s).replace(/(\d+)\s*hour/i, '$1 小時').replace(/(\d+)\s*min/i, '$1 分').replace(/(\d+)\s*sec/i, '$1 秒').replace(/(\d+)\s*day/i, '$1 天').replace(/^(\d+)$/, '$1 秒');
  return conv(t) + (rnd && !/^0/.test(rnd) ? '（±' + conv(rnd) + '）' : '');
}
function dropPanels(d) {
  let html = '';
  if ((d.dg && d.dg.length) || (d.dr && d.dr.length)) {
    html += '<div class="panel"><h2>掉落</h2>';
    (d.dg || []).forEach((g, gi) => {
      html += '<div class="src-sec"><div class="src-title">' + ico('layers') + '群組 ' + (gi + 1) + '：機率 ' + fmtPct(g[0]) + '<span class="muted">（成功後從下列抽 1 樣）</span></div><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>道具</th><th class="r">數量</th><th class="r">群組內</th><th class="r">實際機率</th></tr></thead><tbody>';
      g[1].slice().sort((a, b) => b[4] - a[4]).forEach((x) => {
        html += '<tr><td>' + ilink(x[0]) + '</td><td class="r num">' + range(x[1], x[2]) + '</td><td class="r num">' + fmtPct(x[3]) + '</td><td class="r"><span class="' + pctCls(x[4]) + '">' + fmtPct(x[4]) + '</span></td></tr>';
      });
      html += '</tbody></table></div></div>';
    });
    if (d.dr && d.dr.length) {
      html += '<div class="src-sec"><div class="src-title">' + ico('list') + '獨立掉落<span class="muted">（每樣各自判定）</span></div><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>道具</th><th class="r">數量</th><th class="r">機率</th></tr></thead><tbody>' + d.dr.map((x) => '<tr><td>' + ilink(x[0]) + (x[4] ? ' <span class="tag t-new">本服額外</span>' : '') + '</td><td class="r num">' + range(x[1], x[2]) + '</td><td class="r"><span class="' + pctCls(x[3]) + '">' + fmtPct(x[3]) + '</span></td></tr>').join('') + '</tbody></table></div></div>';
    }
    html += '<div class="note">金幣數量已含本服 10 倍倍率。高級會員金幣與掉落數量再 ×2。</div></div>';
  }
  if (d.ld && d.ld.length) {
    html += '<div class="panel"><h2>每日限量掉落</h2><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>道具</th><th class="r">數量</th><th class="r">機率</th><th class="r">每日上限</th><th class="r">適用等級</th></tr></thead><tbody>' + d.ld.map((x) => '<tr><td>' + ilink(x[0]) + '</td><td class="r num">' + range(x[1], x[2]) + '</td><td class="r"><span class="' + pctCls(x[3]) + '">' + fmtPct(x[3]) + '</span></td><td class="r num">' + fmt(x[4]) + '</td><td class="r num">' + (x[5] || x[6] ? (x[5] || 1) + '～' + (x[6] || '') : '—') + '</td></tr>').join('') + '</tbody></table></div><div class="note">每天能拿的數量有上限，拿滿當天就不再掉。</div></div>';
  }
  if (d.sp2 && d.sp2.length) {
    html += '<div class="panel"><h2>回收（屍體回收）</h2><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>道具</th><th class="r">數量</th><th class="r">機率</th></tr></thead><tbody>' + d.sp2.map((x) => '<tr><td>' + ilink(x[0]) + '</td><td class="r num">' + range(x[1], x[2]) + '</td><td class="r"><span class="' + pctCls(x[3]) + '">' + fmtPct(x[3]) + '</span></td></tr>').join('') + '</tbody></table></div></div>';
  }
  if (!html) html = '<div class="panel"><h2>掉落</h2><div class="panel-body muted">沒有掉落資料。</div></div>';
  return html;
}

// ------------------------------------------------------------------
// BOSS 資料庫
// ------------------------------------------------------------------
function dbBosses() {
  return npcIndex().then(() => {
    const rows = NPCS.rows.filter((r) => (r[4] === 'RaidBoss' || r[4] === 'GrandBoss') && r[3] >= 76).sort((a, b) => b[3] - a[3] || a[0] - b[0]);
    const html = '<div class="article">' + crumbs() + '<h1 class="page-h1">BOSS 資料庫</h1>' +
      '<p class="page-sum">76 級以上的團隊與世界首領。打法看 ' + pageLink('bosses', 'BOSS 攻略') + '，副本首領看 ' + pageLink('instances', '副本攻略') + '。</p>' +
      '<div class="db-tools"><label class="db-search">' + ico('search') + '<input id="bq" type="search" placeholder="搜尋首領名稱或地點" autocomplete="off" aria-label="搜尋首領"></label>' +
      '<div class="chips" id="bt"><span class="chips-label">種類</span>' + chipsHtml([['', '全部'], ['GrandBoss', '世界首領'], ['RaidBoss', '團隊首領'], ['field', '只看野外']], '') + '</div></div>' +
      '<div class="db-count" id="bc"></div><div id="br"></div></div>';
    return {
      html: html,
      after: (root) => {
        let t = '';
        const render = () => {
          const q = $('#bq', root).value.trim().toLowerCase();
          const list = rows.filter((r) => (!t || (t === 'field' ? r[5] && !/^副本/.test(r[5]) : r[4] === t)) && (!q || matchQ(r[1] + ' ' + r[5], q)));
          $('#bc', root).textContent = '共 ' + list.length + ' 隻';
          let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>首領</th><th class="r">等級</th><th>種類</th><th>地點</th></tr></thead><tbody>';
          list.forEach((r) => {
            h += '<tr><td>' + nlink(r[0]) + (r[2] ? ' <span class="muted">' + esc(r[2]) + '</span>' : '') + '</td><td class="r num">' + r[3] + '</td><td>' + (r[4] === 'GrandBoss' ? '<span class="tag g-L">世界首領</span>' : '<span class="tag g-R">團隊首領</span>') + '</td><td>' + esc(r[5] || '由腳本召喚') + '</td></tr>';
          });
          $('#br', root).innerHTML = h + '</tbody></table></div>';
        };
        $('#bq', root).addEventListener('input', debounce(render, 150));
        bindChipGroup(root, '#bt', (v) => (t = v), render);
        render();
      },
    };
  });
}

// ------------------------------------------------------------------
// 獵場
// ------------------------------------------------------------------
const ZTYPE = { 1: '推薦獵場（單人）', 2: '推薦獵場（組隊）', 11: '野外獵場', 3: '單人副本', 4: '組隊副本', 12: '指揮頻道副本', 5: '特殊區域', 6: '城鎮', 7: '其他地點', 8: '城堡', 9: '要塞', 0: '領地' };
function dbZones() {
  return Promise.all([need('zones'), npcIndex()]).then((res) => {
    const zones = res[0].filter((z) => [1, 2, 11, 3, 4, 12].indexOf(z[1]) >= 0 && (z[9].length || z[3] > 0));
    const html = '<div class="article">' + crumbs() + '<h1 class="page-h1">獵場資料庫</h1>' +
      '<p class="page-sum">各獵場的等級與怪物。練功建議看 ' + pageLink('zones', '練功地圖') + '。</p>' +
      '<div class="db-tools"><label class="db-search">' + ico('search') + '<input id="zq" type="search" placeholder="搜尋獵場名稱" autocomplete="off" aria-label="搜尋獵場"></label>' +
      '<div class="chips" id="zt"><span class="chips-label">等級</span>' + chipsHtml([['', '全部'], ['85-109', '85～109'], ['110-119', '110～119'], ['120-125', '120～125'], ['126-130', '126～130'], ['131-140', '131 以上']], '') + '</div>' +
      '<div class="chips" id="zk"><span class="chips-label">類型</span>' + chipsHtml([['', '全部'], ['field', '野外獵場'], ['inst', '副本']], '') + '</div></div><div id="zr"></div></div>';
    return {
      html: html,
      after: (root) => {
        let lv = '', kind = '';
        const render = () => {
          const q = $('#zq', root).value.trim().toLowerCase();
          let lo = 0, hi = 999;
          if (lv) {
            const p = lv.split('-');
            lo = +p[0];
            hi = +p[1];
          }
          const list = zones.filter((z) => {
            const isInst = [3, 4, 12].indexOf(z[1]) >= 0;
            if (kind === 'field' && isInst) return false;
            if (kind === 'inst' && !isInst) return false;
            const zl = z[3] || 0;
            if (lv && (zl < lo || zl > hi)) return false;
            return !q || matchQ(z[2] + ' ' + z[5], q);
          }).sort((a, b) => b[3] - a[3]);
          let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>獵場</th><th class="r">推薦等級</th><th>類型</th><th>所在領地</th><th class="r">怪物種類</th></tr></thead><tbody>';
          list.forEach((z) => {
            h += '<tr><td><a href="' + DB + '#zone-' + z[0] + '">' + esc(z[2]) + '</a></td><td class="r num">' + (z[3] ? z[3] + (z[4] && z[4] !== z[3] ? '～' + z[4] : '') : '—') + '</td><td>' + esc(ZTYPE[z[1]] || '') + '</td><td>' + esc(z[5] || '') + '</td><td class="r num">' + (z[9].length || '—') + '</td></tr>';
          });
          $('#zr', root).innerHTML = h + '</tbody></table></div>';
        };
        $('#zq', root).addEventListener('input', debounce(render, 150));
        bindChipGroup(root, '#zt', (v) => (lv = v), render);
        bindChipGroup(root, '#zk', (v) => (kind = v), render);
        render();
      },
    };
  });
}
function viewZone(id) {
  return Promise.all([need('zones'), npcIndex(), itemIndex()]).then((res) => {
    const z = res[0].find((x) => x[0] === id);
    if (!z) return { html: '<div class="article">' + backLink('db-zones', '獵場資料庫') + '<h1 class="page-h1">找不到獵場</h1></div>' };
    setTitle(z[2] + '｜獵場');
    let html = '<div class="article">' + backLink('db-zones', '獵場資料庫');
    html += '<div class="ent-head"><span class="iicon lg g-B"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.map + '</svg></span><div><h1>' + esc(z[2]) + '</h1><div class="tags"><span class="tag">' + esc(ZTYPE[z[1]] || '') + '</span>' + (z[3] ? '<span class="tag num">推薦 Lv ' + z[3] + (z[4] && z[4] !== z[3] ? '～' + z[4] : '') + '</span>' : '') + (z[5] ? '<span class="tag">' + esc(z[5]) + '</span>' : '') + '</div></div></div>';
    if (z[6]) html += '<p class="page-sum">' + esc(z[6]) + '</p>';
    if (z[7]) html += '<p>入場／接待 NPC：' + nlink(z[7]) + '</p>';
    const mobs = z[9];
    if (mobs.length) {
      html += '<div class="panel"><h2>出沒怪物 <small>' + mobs.length + ' 種</small></h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>怪物</th><th class="r">等級</th><th>種類</th><th class="r">數量</th></tr></thead><tbody>';
      mobs.map((m) => [m, NPCS.get(m[0])]).filter((x) => x[1]).sort((a, b) => b[1][3] - a[1][3]).forEach((x) => {
        const r = x[1];
        html += '<tr><td>' + nlink(r[0]) + (r[7] ? ' <span class="tag t-pvp">主動</span>' : '') + '</td><td class="r num">' + r[3] + '</td><td>' + esc(NTYPE[r[4]] || r[4]) + '</td><td class="r num">' + x[0][1] + '</td></tr>';
      });
      html += '</tbody></table></div><div class="note">數量為生成設定中的隻數，用來判斷這個獵場哪種怪最多。</div></div>';
    } else {
      html += '<div class="panel"><h2>出沒怪物</h2><div class="panel-body muted">這裡沒有固定出現的怪物。</div></div>';
    }
    html += '</div>';
    return { html: html };
  });
}

// ------------------------------------------------------------------
// 套裝
// ------------------------------------------------------------------
function dbSets() {
  return Promise.all([need('sets'), itemIndex()]).then((res) => {
    const sets = res[0];
    const gradeOf = (s) => (ITEMS.get(s.req[0]) || [])[5] || '';
    const html = '<div class="article">' + crumbs() + '<h1 class="page-h1">套裝資料庫</h1><p class="page-sum">穿滿指定件數就有套裝效果，部分套裝強化後還有加成。</p>' +
      '<div class="db-tools"><label class="db-search">' + ico('search') + '<input id="sq" type="search" placeholder="搜尋套裝部件名稱" autocomplete="off" aria-label="搜尋套裝"></label><div class="chips" id="sg"><span class="chips-label">等級</span>' + chipsHtml([['hi', 'R 以上'], ['', '全部']].concat(['L', 'R110', 'R99', 'R95', 'R', 'S80', 'S'].map((g) => [g, g])), 'hi') + '</div></div><div class="db-count" id="sc"></div><div id="sr"></div></div>';
    return {
      html: html,
      after: (root) => {
        let g = 'hi';
        const render = () => {
          const q = $('#sq', root).value.trim().toLowerCase();
          const list = sets.filter((s) => {
            const gr = gradeOf(s);
            if (g === 'hi' && ['R', 'R95', 'R99', 'R110', 'L'].indexOf(gr) < 0) return false;
            if (g && g !== 'hi' && gr !== g) return false;
            return !q || s.req.concat(s.opt || []).some((x) => matchQ(iname(x), q));
          }).sort((a, b) => GRADES.indexOf(gradeOf(a)) - GRADES.indexOf(gradeOf(b)) || b.id - a.id);
          $('#sc', root).textContent = '共 ' + list.length + ' 套' + (list.length > 200 ? '，顯示前 200 套' : '');
          let h = '<div class="rows">';
          list.slice(0, 200).forEach((s) => {
            const first = ITEMS.get(s.req[0]);
            h += '<a class="row" href="' + DB + '#set-' + s.id + '">' + iicon(first) + '<div class="row-main"><div class="row-title">' + esc(setName(s)) + '</div><div class="row-sub">' + s.req.length + ' 件 · ' + esc(s.sk.map((k) => k[5]).filter(Boolean).slice(0, 3).join('、')) + '</div></div><div class="row-side">' + gradeTag(gradeOf(s)) + '</div></a>';
          });
          $('#sr', root).innerHTML = h + '</div>';
        };
        $('#sq', root).addEventListener('input', debounce(render, 150));
        bindChipGroup(root, '#sg', (v) => (g = v), render);
        render();
      },
    };
  });
}
/** 以胸甲（或第一件）名稱推測套裝名 */
function setName(s) {
  const names = s.req.map(iname);
  const chest = s.req.find((x) => {
    const r = ITEMS.get(x);
    return r && (r[4] === 'chest' || r[4] === 'full');
  });
  const base = chest ? iname(chest) : names[0];
  const add = chest ? (ITEMS.get(chest) || [])[2] : '';
  return base + (add ? '（' + add + '）' : '') + ' 套裝';
}
function viewSet(id) {
  return Promise.all([need('sets'), itemIndex()]).then((res) => {
    const s = res[0].find((x) => x.id === id);
    if (!s) return { html: '<div class="article">' + backLink('db-sets', '套裝資料庫') + '<h1 class="page-h1">找不到套裝</h1></div>' };
    const first = ITEMS.get(s.req[0]);
    setTitle(setName(s));
    let html = '<div class="article">' + backLink('db-sets', '套裝資料庫');
    html += '<div class="ent-head">' + iicon(first, 'lg') + '<div><h1>' + esc(setName(s)) + '</h1><div class="tags">' + gradeTag(first && first[5]) + '<span class="tag">' + s.req.length + ' 件套</span></div></div></div>';
    html += '<div class="panel"><h2>部件</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>道具</th><th>部位</th></tr></thead><tbody>' + s.req.concat(s.opt || []).map((x) => {
      const r = ITEMS.get(x);
      return '<tr><td>' + ilink(x) + ((s.opt || []).indexOf(x) >= 0 ? ' <span class="tag">選配</span>' : '') + '</td><td>' + esc(r ? itemKind(r) : '') + '</td></tr>';
    }).join('') + '</tbody></table></div></div>';
    html += '<div class="panel"><h2>套裝效果</h2>' + (s.sk.length ? s.sk.map((k) => '<div class="skill-row"><b>' + esc(k[5] || '技能 #' + k[0]) + (k[2] ? ' <span class="tag">穿 ' + k[2] + ' 件</span>' : '') + (k[3] ? ' <span class="tag t-new">全部強化 +' + k[3] + '</span>' : '') + (k[4] ? ' <span class="tag">搭配盾牌／印記</span>' : '') + '</b>' + (k[6] ? '<p>' + esc(k[6]) + '</p>' : '') + '</div>').join('') : '<div class="panel-body muted">無資料</div>') + '</div>';
    html += '</div>';
    return { html: html };
  });
}
// ------------------------------------------------------------------
// 職業技能
// ------------------------------------------------------------------
function dbSkills() {
  return need('classes').then((c) => {
    const list = c.list.filter((x) => x[3]);
    const byId = new Map(c.list.map((x) => [x[0], x]));
    const hasChild = new Set(c.list.map((x) => x[2]));
    const leaf = (x) => !hasChild.has(x[0]);
    const short = (s) => (s || '').split(/[。]/)[0];
    let html = '<div class="article">' + crumbs() + '<h1 class="page-h1">職業技能</h1><p class="page-sum">點職業看技能與學習等級，85 級以上看覺醒職業。選職業建議看 ' + pageLink('classes', '職業總覽與選擇') + '。</p>';
    const grp = (title, arr) => {
      if (!arr.length) return '';
      return '<div class="sec-h"><h2>' + esc(title) + '</h2><span>' + arr.length + ' 個職業</span></div><div class="cards">' + arr.map((x) => '<a class="card" href="' + DB + '#class-' + x[0] + '"><b>' + ico('bolt') + esc(x[1]) + '</b><span>' + esc(short(x[4]) || (byId.get(x[2]) ? '由「' + byId.get(x[2])[1] + '」轉職' : '基礎職業')) + '</span></a>').join('') + '</div>';
    };
    const AW = [['席格爾騎士（坦克）', 148, 151], ['提爾鬥士（近戰）', 152, 157], ['歐瑟遊俠（刺客）', 158, 161], ['尤爾弓手（遠程）', 162, 165], ['菲歐巫師（法師）', 166, 170], ['伊斯法師（輔助）', 171, 175], ['維因召喚士（召喚）', 176, 178], ['艾羅牧師（治療）', 179, 181]];
    AW.forEach((g) => {
      html += grp('覺醒・' + g[0], list.filter((x) => x[0] >= g[1] && x[0] <= g[2]));
    });
    html += grp('特殊職業（最終階段）', list.filter((x) => x[0] > 181 && leaf(x)));
    html += '<details class="fold"><summary>覺醒前與特殊職業前期階段（共 ' + list.filter((x) => x[0] < 148 || (x[0] > 181 && !leaf(x))).length + ' 個）</summary>' + grp('前期職業', list.filter((x) => x[0] < 148 || (x[0] > 181 && !leaf(x)))) + '</details>';
    html += '</div>';
    return { html: html };
  });
}
function viewClass(id) {
  return Promise.all([need('classes'), need('skills'), itemIndex()]).then((res) => {
    const c = res[0], sk = res[1];
    const cl = c.list.find((x) => x[0] === id);
    if (!cl) return { html: '<div class="article">' + backLink('db-skills', '職業技能') + '<h1 class="page-h1">找不到職業</h1></div>' };
    setTitle(cl[1] + '｜職業技能');
    const rows = (sk[id] || []).slice();
    const parent = c.list.find((x) => x[0] === cl[2]);
    const OP = { A1: '主動', A2: '主動（持續）', A3: '主動', A4: '主動', A5: '主動', A6: '主動', CA1: '蓄力', CA2: '蓄力', CA5: '蓄力', DA1: '衝刺', DA2: '衝刺', DA3: '衝刺', DA4: '衝刺', DA5: '衝刺', P: '被動', T: '切換', TG: '切換', AU: '光環' };
    const kind = (op) => (op === 'P' ? 'p' : op === 'T' || op === 'TG' || op === 'AU' ? 't' : 'a');
    let html = '<div class="article">' + backLink('db-skills', '職業技能');
    html += '<div class="ent-head"><span class="iicon lg g-R99"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.bolt + '</svg></span><div><h1>' + esc(cl[1]) + '</h1><div class="tags"><span class="tag">' + rows.length + ' 個技能</span>' + (parent ? '<a class="tag" href="' + DB + '#class-' + parent[0] + '">前置職業：' + esc(parent[1]) + '</a>' : '') + '<span class="tag mono">classId ' + id + '</span></div></div></div>';
    if (cl[4] || cl[5]) html += '<div class="callout info"><b>職業定位</b>' + esc(cl[4]) + (cl[5] ? '<br><span class="muted">招牌能力：</span>' + esc(cl[5]) : '') + '</div>';
    html += '<div class="db-tools"><label class="db-search">' + ico('search') + '<input id="kq" type="search" placeholder="搜尋技能名稱或說明" autocomplete="off" aria-label="搜尋技能"></label><div class="chips" id="kk"><span class="chips-label">類型</span>' + chipsHtml([['', '全部'], ['a', '主動'], ['p', '被動'], ['t', '切換／光環']], '') + '</div></div><div id="kr"></div></div>';
    return {
      html: html,
      after: (root) => {
        let k = '';
        const render = () => {
          const q = $('#kq', root).value.trim().toLowerCase();
          const list = rows.filter((r) => (!k || kind(r[6]) === k) && (!q || matchQ(r[1] + ' ' + r[7], q))).sort((a, b) => a[4] - b[4] || kind(a[6]).localeCompare(kind(b[6])));
          if (!list.length) {
            $('#kr', root).innerHTML = '<div class="rows"><div class="empty">沒有符合的技能。</div></div>';
            return;
          }
          let h = '<div class="panel">';
          list.forEach((r) => {
            const books = r[11] || [];
            h += '<div class="skill-row" id="sk-' + r[0] + '"><b>' + esc(r[1]) + ' <span class="tag">' + esc(OP[r[6]] || (r[6] ? r[6] : '技能')) + '</span><span class="tag num">Lv ' + (r[2] === r[3] ? r[3] : r[2] + '～' + r[3]) + '</span><span class="tag num">' + (r[4] === r[5] ? r[4] : r[4] + '～' + r[5]) + ' 級學習</span>' + (r[9] ? '<span class="tag t-party">自動習得</span>' : '') + (r[10] ? '<span class="tag t-new">雙職業 ' + r[10] + ' 級</span>' : '') + '</b>' + (r[7] ? '<p>' + esc(r[7]) + '</p>' : '') + (books.length ? '<p class="muted">需要：' + books.map((b) => ilink(b[0], b[1])).join('、') + '</p>' : '') + '</div>';
          });
          $('#kr', root).innerHTML = h + '</div><p class="foot-note">說明為可學到的最高等級；種族技能與覺醒保留的技能沒有列出。</p>';
        };
        $('#kq', root).addEventListener('input', debounce(render, 150));
        bindChipGroup(root, '#kk', (v) => (k = v), render);
        render();
      },
    };
  });
}

// ------------------------------------------------------------------
// 收藏
// ------------------------------------------------------------------
function loadCols() {
  return need('collections').then((c) => {
    if (!COLS) COLS = new Map(c.list.map((x) => [x.id, x]));
    return c;
  });
}
function dbCollections() {
  return Promise.all([loadCols(), itemIndex()]).then((res) => {
    const c = res[0];
    const cats = c.cats || {};
    const catIds = Array.from(new Set(c.list.map((x) => x.cat))).sort((a, b) => a - b);
    const html = '<div class="article">' + crumbs() + '<h1 class="page-h1">收藏資料庫</h1><p class="page-sum">共 ' + c.list.length + ' 個收藏。登錄道具就永久獲得效果，可搜尋名稱、效果或道具。說明看 ' + pageLink('collection', '收藏系統') + '。</p>' +
      '<div class="db-tools"><label class="db-search">' + ico('search') + '<input id="cq" type="search" placeholder="搜尋收藏名稱、效果（例如：物理攻擊力）或道具" autocomplete="off" aria-label="搜尋收藏"></label>' +
      '<div class="chips" id="cc"><span class="chips-label">分類</span>' + chipsHtml([['', '全部']].concat(catIds.map((x) => [String(x), cats[x] || '分類 ' + x])), '') + '</div></div><div class="db-count" id="ccount"></div><div id="cr"></div></div>';
    return {
      html: html,
      after: (root) => {
        let cat = '';
        const render = () => {
          const q = $('#cq', root).value.trim().toLowerCase();
          const list = c.list.filter((x) => (!cat || String(x.cat) === cat) && (!q || matchQ((x.n || '') + ' ' + x.en + ' ' + x.fx, q) || x.i.some((it) => matchQ(iname(it[0]), q))));
          $('#ccount', root).textContent = '找到 ' + list.length + ' 個收藏';
          let h = '<div class="rows">';
          list.slice(0, 300).forEach((x) => {
            h += '<a class="row" href="' + DB + '#col-' + x.id + '"><span class="iicon g-L"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.star + '</svg></span><div class="row-main"><div class="row-title">' + esc(x.n || x.en) + '</div><div class="row-sub">' + esc(x.fx || '') + '</div></div><div class="row-side"><span class="tag">' + esc(cats[x.cat] || '分類 ' + x.cat) + '</span><span class="tag num">' + x.need + ' 格</span></div></a>';
          });
          if (list.length > 300) h += '<div class="empty">還有 ' + (list.length - 300) + ' 個，請輸入關鍵字縮小範圍。</div>';
          $('#cr', root).innerHTML = h + '</div>';
        };
        $('#cq', root).addEventListener('input', debounce(render, 150));
        bindChipGroup(root, '#cc', (v) => (cat = v), render);
        render();
      },
    };
  });
}
function viewCollection(id) {
  return Promise.all([loadCols(), itemIndex()]).then((res) => {
    const c = res[0];
    const x = COLS.get(id);
    if (!x) return { html: '<div class="article">' + backLink('db-collections', '收藏資料庫') + '<h1 class="page-h1">找不到收藏</h1></div>' };
    setTitle((x.n || x.en) + '｜收藏');
    const cats = c.cats || {};
    const slots = {};
    x.i.forEach((it) => (slots[it[3]] = slots[it[3]] || []).push(it));
    let html = '<div class="article">' + backLink('db-collections', '收藏資料庫');
    html += '<div class="ent-head"><span class="iicon lg g-L"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.star + '</svg></span><div><h1>' + esc(x.n || x.en) + '</h1><div class="tags"><span class="tag">' + esc(cats[x.cat] || '分類 ' + x.cat) + '</span><span class="tag num">需要 ' + x.need + ' 格</span>' + (x.n && x.en ? '<span class="tag">' + esc(x.en) + '</span>' : '') + '</div></div></div>';
    html += '<div class="callout tip"><b>完成效果</b>' + esc(x.fx || '（無說明）') + '</div>';
    html += '<div class="panel"><h2>需要登錄的道具</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th class="c">格子</th><th>道具（任一即可）</th><th class="r">數量</th><th class="r">強化值</th></tr></thead><tbody>';
    Object.keys(slots).sort((a, b) => a - b).forEach((k) => {
      const l = slots[k];
      html += '<tr><td class="c num">' + (parseInt(k, 10) + 1) + '</td><td><div class="ing" style="flex-direction:column;gap:2px;">' + l.map((it) => ilink(it[0])).join('') + '</div></td><td class="r num">' + fmt(l[0][1]) + '</td><td class="r num">' + (l[0][2] ? '+' + l[0][2] : '—') + '</td></tr>';
    });
    html += '</tbody></table></div><div class="note">同一格的道具擇一登錄即可，登錄後道具會被收走。</div></div></div>';
    return { html: html };
  });
}

// ------------------------------------------------------------------
// 壺精
// ------------------------------------------------------------------
function dbAgathions() {
  return Promise.all([need('agathions'), itemIndex()]).then((res) => {
    const list = res[0].filter((a) => ITEMS.get(a.id));
    const html = '<div class="article">' + crumbs() + '<h1 class="page-h1">壺精資料庫</h1><p class="page-sum">共 ' + list.length + ' 種壺精。點進去看每個強化等級的主技能與副技能。系統說明請看 ' + pageLink('agathion', '壺精') + '。</p>' +
      '<div class="db-tools"><label class="db-search">' + ico('search') + '<input id="aq" type="search" placeholder="搜尋壺精名稱或效果" autocomplete="off" aria-label="搜尋壺精"></label></div><div class="db-count" id="ac"></div><div id="ar"></div></div>';
    return {
      html: html,
      after: (root) => {
        const render = () => {
          const q = $('#aq', root).value.trim().toLowerCase();
          const l = list.filter((a) => {
            if (!q) return true;
            const top = a.lv[a.lv.length - 1];
            return matchQ(iname(a.id), q) || top[1].concat(top[2]).some((s) => matchQ(s[2] + ' ' + s[3], q));
          }).sort((a, b) => b.id - a.id);
          $('#ac', root).textContent = '找到 ' + l.length + ' 種';
          let h = '<div class="rows">';
          l.slice(0, 300).forEach((a) => {
            const r = ITEMS.get(a.id);
            const top = a.lv[a.lv.length - 1];
            h += '<a class="row" href="' + DB + '#agathion-' + a.id + '">' + iicon(r) + '<div class="row-main"><div class="row-title">' + esc(r[1]) + (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</div><div class="row-sub">' + esc(top[1].concat(top[2]).map((s) => s[2]).filter(Boolean).slice(0, 3).join('、')) + '</div></div><div class="row-side"><span class="tag num">最高 +' + top[0] + '</span></div></a>';
          });
          $('#ar', root).innerHTML = h + '</div>';
        };
        $('#aq', root).addEventListener('input', debounce(render, 150));
        render();
      },
    };
  });
}
function viewAgathion(id) {
  return Promise.all([need('agathions'), itemIndex()]).then((res) => {
    const a = res[0].find((x) => x.id === id);
    const r = ITEMS.get(id);
    if (!a || !r) return { html: '<div class="article">' + backLink('db-agathions', '壺精資料庫') + '<h1 class="page-h1">找不到壺精</h1></div>' };
    setTitle(r[1] + '｜壺精');
    let html = '<div class="article">' + backLink('db-agathions', '壺精資料庫');
    html += '<div class="ent-head">' + iicon(r, 'lg') + '<div><h1>' + esc(r[1]) + '</h1><div class="tags">' + gradeTag(r[5]) + '<span class="tag">壺精</span><a class="tag" href="' + DB + '#item-' + id + '">道具頁與取得途徑</a></div></div></div>';
    a.lv.forEach((l) => {
      html += '<div class="panel"><h2>+' + l[0] + '</h2>' + l[1].map((s) => '<div class="skill-row"><b>主技能：' + esc(s[2] || '#' + s[0]) + ' <span class="tag">Lv ' + s[1] + '</span></b>' + (s[3] ? '<p>' + esc(s[3]) + '</p>' : '') + '</div>').join('') + l[2].map((s) => '<div class="skill-row"><b>副技能：' + esc(s[2] || '#' + s[0]) + ' <span class="tag">Lv ' + s[1] + '</span></b>' + (s[3] ? '<p>' + esc(s[3]) + '</p>' : '') + '</div>').join('') + '</div>';
    });
    html += '</div>';
    return { html: html };
  });
}

// ------------------------------------------------------------------
// 商店兌換
// ------------------------------------------------------------------
function dbShops() {
  return Promise.all([need('ms-op'), npcIndex(), itemIndex()]).then((res) => {
    const op = res[0];
    const board = {}, npcShops = {}, coupons = {};
    Object.keys(op.ms).forEach((id) => {
      op.ms[id].forEach((o) => {
        if (o[0] === 'b') {
          (board[o.slice(1)] = board[o.slice(1)] || []).push(+id);
        } else if (o[0] === 'i') {
          const it = parseInt(o.slice(1), 10);
          (coupons[it] = coupons[it] || []).push(+id);
        } else {
          const n = parseInt(o.slice(1), 10);
          (npcShops[n] = npcShops[n] || []).push(+id);
        }
      });
    });
    let html = '<div class="article">' + crumbs() + '<h1 class="page-h1">商店兌換表</h1><p class="page-sum">布告欄（<kbd>Alt</kbd>+<kbd>B</kbd>）、NPC 與雙擊兌換券的兌換清單。想找某樣東西，到 <a href="' + DB + '#db-items">道具資料庫</a> 查最快。</p>';
    html += '<div class="sec-h"><h2>布告欄商店</h2><span>Alt+B</span></div><div class="cards">';
    Object.keys(board).sort().forEach((p) => {
      html += '<div class="card"><b>' + ico('bag') + esc(boardPageName(p)) + '</b><span>' + board[p].map((id) => '<a href="' + DB + '#shop-' + id + '">' + id + '</a>').join('、') + '</span></div>';
    });
    html += '</div>';
    const cids = Object.keys(coupons).map(Number).sort((a, b) => a - b);
    if (cids.length) {
      html += '<div class="sec-h"><h2>雙擊兌換券</h2><span>' + cids.length + ' 種道具</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>雙擊這個道具</th><th>兌換清單</th></tr></thead><tbody>';
      cids.forEach((it) => {
        html += '<tr><td>' + ilink(it) + '</td><td>' + coupons[it].map((id) => '<a href="' + DB + '#shop-' + id + '">' + id + '</a>').join('、') + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '<div class="sec-h"><h2>NPC 兌換</h2><span>' + Object.keys(npcShops).length + ' 位 NPC</span></div><div class="db-tools"><label class="db-search">' + ico('search') + '<input id="shq" type="search" placeholder="搜尋 NPC 名稱或地點" autocomplete="off" aria-label="搜尋 NPC"></label></div><div id="shr"></div></div>';
    return {
      html: html,
      after: (root) => {
        const ids = Object.keys(npcShops).map(Number).filter((n) => NPCS.get(n));
        const render = () => {
          const q = $('#shq', root).value.trim().toLowerCase();
          const l = ids.filter((n) => {
            const r = NPCS.get(n);
            return !q || matchQ(r[1] + ' ' + r[2] + ' ' + r[5], q);
          }).sort((a, b) => (NPCS.get(a)[5] || '').localeCompare(NPCS.get(b)[5] || '') || a - b);
          let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>NPC</th><th>地點</th><th>兌換清單</th></tr></thead><tbody>';
          l.forEach((n) => {
            const r = NPCS.get(n);
            h += '<tr><td>' + nlink(n) + (r[2] ? ' <span class="muted">' + esc(r[2]) + '</span>' : '') + '</td><td>' + esc(r[5] || '') + '</td><td>' + npcShops[n].map((id) => '<a href="' + DB + '#shop-' + id + '">' + id + '</a>').join('、') + '</td></tr>';
          });
          $('#shr', root).innerHTML = h + '</tbody></table></div>';
        };
        $('#shq', root).addEventListener('input', debounce(render, 150));
        render();
      },
    };
  });
}
function viewShop(id) {
  return Promise.all([need('shops'), itemIndex(), npcIndex(), need('ms-op')]).then((res) => {
    const s = res[0].ms[id];
    if (!s) return { html: '<div class="article">' + backLink('db-shops', '商店兌換表') + '<h1 class="page-h1">找不到兌換清單 ' + id + '</h1></div>' };
    setTitle('兌換清單 ' + id);
    let html = '<div class="article">' + backLink('db-shops', '商店兌換表');
    html += '<div class="ent-head"><span class="iicon lg g-S"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.bag + '</svg></span><div><h1>兌換清單 ' + id + '</h1><div class="tags"><span class="tag">' + s.e.length + ' 個品項</span>' + (s.chance ? '<span class="tag t-weekly">機率兌換</span>' : '') + '</div></div></div>';
    html += '<p>入口：' + (s.op || []).map(openerLabel).join('、') + '</p>';
    html += '<div class="db-tools"><label class="db-search">' + ico('search') + '<input id="mq" type="search" placeholder="在清單中搜尋道具" autocomplete="off" aria-label="搜尋清單內道具"></label></div><div id="mr"></div></div>';
    return {
      html: html,
      after: (root) => {
        const render = () => {
          const q = $('#mq', root).value.trim().toLowerCase();
          const l = s.e.filter((e) => !q || e[1].concat(e[0]).some((x) => matchQ(iname(x[0]), q)));
          let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>可獲得</th><th>需要</th></tr></thead><tbody>';
          l.slice(0, 600).forEach((e) => {
            h += '<tr><td>' + e[1].map((p) => ilink(p[0], p[1], p[2] ? ' <span class="tag">+' + p[2] + '</span>' : '') + (p[3] != null ? ' <span class="pct">' + fmtPct(p[3]) + '</span>' : '')).join('<br>') + '</td><td>' + ingList(e[0]) + '</td></tr>';
          });
          $('#mr', root).innerHTML = h + '</tbody></table></div>' + (l.length > 600 ? '<p class="muted">只顯示前 600 項，請用搜尋縮小範圍。</p>' : '');
        };
        $('#mq', root).addEventListener('input', debounce(render, 150));
        render();
      },
    };
  });
}
function viewBuy(id) {
  return Promise.all([need('shops'), itemIndex(), npcIndex()]).then((res) => {
    const b = res[0].bl[id];
    if (!b) return { html: '<div class="article">' + backLink('db-shops', '商店兌換表') + '<h1 class="page-h1">找不到購買清單 ' + id + '</h1></div>' };
    setTitle('購買清單 ' + id);
    let html = '<div class="article">' + backLink('db-shops', '商店兌換表');
    html += '<div class="ent-head"><span class="iicon lg g-C"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.coin + '</svg></span><div><h1>購買清單 ' + id + '</h1><div class="tags"><span class="tag">' + b.i.length + ' 個品項</span></div></div></div>';
    html += '<p>販售 NPC：' + (b.npcs.length ? b.npcs.map((n) => (n < 0 ? '布告欄' : openerLabel('n' + n))).join('、') : '—') + '</p>';
    html += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>道具</th><th class="r">價格（金幣）</th></tr></thead><tbody>' + b.i.map((x) => '<tr><td>' + ilink(x[0]) + '</td><td class="r num">' + fmt(x[1]) + '</td></tr>').join('') + '</tbody></table></div></div>';
    return { html: html };
  });
}

// ==================================================================
// 全站搜尋
// ==================================================================
let palSel = 0;
function openPalette(q) {
  const p = $('#wikiPalette');
  if (!p) return;
  p.hidden = false;
  document.body.classList.add('overflow-hidden');
  lenis()?.stop();
  const inp = $('#wikiPalQ');
  inp.value = q || '';
  inp.focus();
  renderPalette();
  // 攻略頁清單先到先顯示；道具／怪物索引較大，載完再補上結果
  loadPages().then(renderPalette).catch(() => {});
  Promise.all([itemIndex(), npcIndex()]).then(renderPalette).catch(() => {});
  need('classes').then(renderPalette).catch(() => {});
}
function closePalette() {
  const p = $('#wikiPalette');
  if (p && !p.hidden) {
    p.hidden = true;
    document.body.classList.remove('overflow-hidden');
    lenis()?.start();
  }
}
function renderPalette() {
  const p = $('#wikiPalette');
  if (!p || p.hidden) return;
  const q = $('#wikiPalQ').value.trim().toLowerCase();
  const box = $('#wikiPalRes');
  if (!q) {
    const common = ['newbie', 'enchant', 'instances', 'bosses', 'zones', 'gear', 'board', 'roadmap', 'daily', 'db-items', 'db-npcs', 'collection'];
    box.innerHTML = '<div class="pal-sec">常用</div><div class="pal-chips">' + common.filter((id) => PAGE[id]).map((id) => '<a class="chip" href="' + pageHref(id) + '">' + esc(PAGE[id].title) + '</a>').join('') + '</div><div class="pal-hint">可以搜尋攻略頁、道具、怪物與職業。輸入數字可直接查道具／怪物 ID。</div>';
    return;
  }
  const res = [];
  const pages = PAGES.map((pg) => {
    let s = -1;
    const t = pg.title.toLowerCase();
    if (t === q) s = 100;
    else if (t.indexOf(q) >= 0) s = 80;
    else if ((pg.keywords || '').toLowerCase().indexOf(q) >= 0) s = 60;
    else if ((pg.summary || '').toLowerCase().indexOf(q) >= 0) s = 50;
    else if ((pg.heads || []).some((h) => h.toLowerCase().indexOf(q) >= 0)) s = 40;
    else if ((pg.text || '').toLowerCase().indexOf(q) >= 0) s = 20;
    return [s, pg];
  }).filter((x) => x[0] >= 0).sort((a, b) => b[0] - a[0]).slice(0, 7);
  if (pages.length) {
    res.push('<div class="pal-sec">攻略頁面</div>');
    pages.forEach((x) => {
      const pg = x[1];
      const head = (pg.heads || []).find((h) => h.toLowerCase().indexOf(q) >= 0);
      res.push('<a class="pal-item" href="' + pageHref(pg.id) + '"><span class="iicon sm g-none"><svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[pg.icon] || IC.book) + '</svg></span><div class="row-main"><div class="row-title">' + esc(pg.title) + '</div><div class="row-sub">' + esc(head ? '段落：' + head : pg.summary || '') + '</div></div></a>');
    });
  }
  const idq = /^#?\d+$/.test(q) ? parseInt(q.replace('#', ''), 10) : -1;
  if (ITEMS) {
    let items;
    if (idq >= 0) {
      items = ITEMS.get(idq) ? [ITEMS.get(idq)] : [];
    } else {
      items = [];
      for (const r of ITEMS.rows) {
        if (r[1].toLowerCase().indexOf(q) >= 0) {
          items.push(r);
          if (items.length > 400) break;
        }
      }
      items = items.map((r) => [scoreName(r[1], q) - (r[7] & 4 ? 0.5 : 0) + (r[5] && ['L', 'R110', 'R99', 'R95', 'R'].indexOf(r[5]) >= 0 ? -0.3 : 0), r]).sort((a, b) => a[0] - b[0] || b[1][0] - a[1][0]).slice(0, 10).map((x) => x[1]);
    }
    if (items.length) {
      res.push('<div class="pal-sec">道具</div>');
      items.forEach((r) => res.push('<a class="pal-item" href="' + DB + '#item-' + r[0] + '">' + iicon(r, 'sm') + '<div class="row-main"><div class="row-title">' + esc(r[1]) + (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</div><div class="row-sub">' + esc(itemKind(r)) + '</div></div>' + gradeTag(r[5]) + '</a>'));
    }
  }
  if (NPCS) {
    let npcs;
    if (idq >= 0) npcs = NPCS.get(idq) ? [NPCS.get(idq)] : [];
    else npcs = NPCS.rows.filter((r) => r[1].toLowerCase().indexOf(q) >= 0).map((r) => [scoreName(r[1], q) - (r[6] ? 0.2 : 0), r]).sort((a, b) => a[0] - b[0] || b[1][3] - a[1][3]).slice(0, 8).map((x) => x[1]);
    if (npcs.length) {
      res.push('<div class="pal-sec">怪物與 NPC</div>');
      npcs.forEach((r) => res.push('<a class="pal-item" href="' + DB + '#npc-' + r[0] + '">' + npcIcon(r, 'sm') + '<div class="row-main"><div class="row-title">' + esc(r[1]) + (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</div><div class="row-sub">' + esc((NTYPE[r[4]] || r[4]) + (r[5] ? ' · ' + r[5] : '')) + '</div></div>' + (r[6] ? '<span class="tag num">Lv ' + r[3] + '</span>' : '') + '</a>'));
    }
  } else {
    res.push('<div class="loading">正在載入資料庫…</div>');
  }
  if (store.classes) {
    const cls = store.classes.list.filter((c) => c[3] && c[1].toLowerCase().indexOf(q) >= 0).slice(0, 5);
    if (cls.length) {
      res.push('<div class="pal-sec">職業</div>');
      cls.forEach((c) => res.push('<a class="pal-item" href="' + DB + '#class-' + c[0] + '"><span class="iicon sm g-R99"><svg viewBox="0 0 24 24" aria-hidden="true">' + IC.bolt + '</svg></span><div class="row-main"><div class="row-title">' + esc(c[1]) + '</div><div class="row-sub">職業技能</div></div></a>'));
    }
  }
  box.innerHTML = res.length ? res.join('') : '<div class="empty">找不到「' + esc(q) + '」。試試其他關鍵字，或到道具／怪物資料庫用篩選。</div>';
  palSel = 0;
  markPal();
}
function markPal() {
  const items = $$('.pal-item', $('#wikiPalRes'));
  items.forEach((a, i) => a.classList.toggle('sel-on', i === palSel));
  if (items[palSel]) items[palSel].scrollIntoView({ block: 'nearest' });
}

/** 前往網址：同一頁只差 # 時不重新載入 */
function go(href) {
  const url = new URL(href, location.href);
  if (url.origin === location.origin && normPath(url.pathname) === normPath(location.pathname) && url.hash) {
    if (location.hash !== url.hash) location.hash = url.hash;
    else if (MODE === 'db') route();
    return true;
  }
  location.href = url.href;
  return false;
}

// ==================================================================
// 浮動提示（道具／NPC／技能連結）
// ==================================================================
let tipTimer = 0, tipFor = null;
function hideTip() {
  clearTimeout(tipTimer);
  tipFor = null;
  const t = $('#wikiTip');
  if (t) t.hidden = true;
}
function placeTip(a) {
  const t = $('#wikiTip');
  const r = a.getBoundingClientRect();
  const w = t.offsetWidth, h = t.offsetHeight;
  const x = Math.min(window.innerWidth - w - 12, Math.max(12, r.left));
  let y = r.bottom + 8;
  if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 8);
  t.style.left = x + 'px';
  t.style.top = y + 'px';
}
function showTip(a) {
  const t = $('#wikiTip');
  if (!t) return;
  const id = parseInt(a.dataset.id, 10);
  const kind = a.classList.contains('ilink') ? 'i' : a.classList.contains('nlink') ? 'n' : 's';
  tipFor = a;
  if (kind === 's') {
    t.innerHTML = '<div class="tp-h"><b>' + esc(a.textContent) + '</b></div><div class="tp-d">' + esc(a.dataset.tip || '') + '</div>';
    t.hidden = false;
    placeTip(a);
    return;
  }
  if (kind === 'i') {
    itemIndex().then(() => itemDetail(id)).then((d) => {
      if (tipFor !== a) return;
      const r = ITEMS.get(id);
      if (!r) return;
      let s = '';
      if (d.st) s = Object.keys(d.st).filter((k) => ['pAtk', 'mAtk', 'pDef', 'mDef', 'critRate', 'pAtkSpd'].indexOf(k) >= 0).map((k) => (STAT[k] || k) + ' ' + fmt(d.st[k])).join('・');
      const srcN = (d.src || []).length;
      t.innerHTML = '<div class="tp-h">' + iicon(r, 'sm') + '<b>' + esc(r[1]) + (r[2] ? ' <small class="muted">' + esc(r[2]) + '</small>' : '') + '</b>' + gradeTag(r[5]) + '</div>' + (d.d ? '<div class="tp-d">' + esc(d.d) + '</div>' : '') + '<div class="tp-s">' + esc(itemKind(r)) + (s ? '｜' + esc(s) : '') + (srcN ? '｜' + srcN + ' 種取得途徑' : '') + '</div>';
      t.hidden = false;
      placeTip(a);
    }).catch(() => {});
  } else {
    npcIndex().then(() => {
      if (tipFor !== a) return;
      const r = NPCS.get(id);
      if (!r) return;
      t.innerHTML = '<div class="tp-h">' + npcIcon(r, 'sm') + '<b>' + esc(r[1]) + (r[2] ? ' <small class="muted">' + esc(r[2]) + '</small>' : '') + '</b>' + (r[6] ? '<span class="tag num">Lv ' + r[3] + '</span>' : '') + '</div><div class="tp-s">' + esc(NTYPE[r[4]] || r[4]) + (r[5] ? '｜' + esc(r[5]) : '') + (r[7] ? '｜主動攻擊' : '') + '</div>';
      t.hidden = false;
      placeTip(a);
    }).catch(() => {});
  }
}

// ==================================================================
// 側欄（窄螢幕抽屜）
// ==================================================================
function closeSide() {
  const s = $('#wikiSide');
  if (s) s.classList.remove('is-open');
}

// ==================================================================
// 文章頁：本頁目錄高亮、錨點展開折疊
// ==================================================================
function bindToc() {
  const links = $$('.wa-toc a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map();
  links.forEach((a) => {
    const t = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    if (t) map.set(t, a);
  });
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (en.isIntersecting) {
        const cur = map.get(en.target);
        links.forEach((a) => a.classList.toggle('is-active', a === cur));
      }
    });
  }, { rootMargin: '-' + Math.round(headerH() + 24) + 'px 0px -68% 0px' });
  map.forEach((a, t) => io.observe(t));
}
function revealHash(scroll) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const t = document.getElementById(id);
  if (!t) return;
  let opened = false;
  if (t.tagName === 'DETAILS' && !t.open) {
    t.open = true;
    opened = true;
  }
  for (let d = t.parentElement && t.parentElement.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) {
    if (!d.open) {
      d.open = true;
      opened = true;
    }
  }
  if (opened || scroll) setTimeout(() => scrollToEl(t), 60);
}

// ==================================================================
// 啟動
// ==================================================================
let MODE = 'page';
export function initWiki() {
  const root = document.querySelector('[data-wiki-mode]');
  MODE = (root && root.dataset.wikiMode) || 'page';

  // 搜尋面板
  const pal = $('#wikiPalette');
  $$('[data-wiki-search]').forEach((b) => b.addEventListener('click', () => openPalette('')));
  if (pal) {
    $('#wikiPalClose').addEventListener('click', closePalette);
    pal.addEventListener('click', (e) => {
      if (e.target === pal) closePalette();
      const a = e.target.closest && e.target.closest('#wikiPalRes a[href]');
      if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
        e.preventDefault();
        closePalette();
        go(a.getAttribute('href'));
      }
    });
    $('#wikiPalQ').addEventListener('input', debounce(renderPalette, 90));
    $('#wikiPalQ').addEventListener('keydown', (e) => {
      const items = $$('.pal-item', $('#wikiPalRes'));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        palSel = Math.min(items.length - 1, palSel + 1);
        markPal();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        palSel = Math.max(0, palSel - 1);
        markPal();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[palSel]) {
          closePalette();
          go(items[palSel].getAttribute('href'));
        }
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      openPalette('');
    } else if (e.key === 'Escape') {
      closePalette();
      hideTip();
      closeSide();
    }
  });

  // 浮動提示
  const hoverable = window.matchMedia('(hover: hover)').matches;
  if (hoverable) {
    document.addEventListener('mouseover', (e) => {
      const a = e.target.closest && e.target.closest('a.ilink, a.nlink, a.slink');
      if (!a || a === tipFor) return;
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => showTip(a), 260);
    });
    document.addEventListener('mouseout', (e) => {
      const a = e.target.closest && e.target.closest('a.ilink, a.nlink, a.slink');
      if (a && (!e.relatedTarget || !a.contains(e.relatedTarget))) hideTip();
    });
  }
  window.addEventListener('scroll', () => {
    if (tipFor) hideTip();
  }, { passive: true });

  // 連結：技能說明、同頁錨點（含折疊區）、資料庫頁內切換
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const sl = e.target.closest && e.target.closest('a.slink');
    if (sl) {
      e.preventDefault();
      if (!hoverable) tipFor === sl ? hideTip() : showTip(sl);
      return;
    }
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.closest('#wikiPalette')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || normPath(url.pathname) !== normPath(location.pathname) || !url.hash) return;
    e.preventDefault();
    closeSide();
    if (MODE === 'db') {
      if (location.hash !== url.hash) location.hash = url.hash;
      else route();
      return;
    }
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) {
      history.pushState(null, '', url.hash);
      revealHash(true);
    }
  });

  // 窄螢幕側欄抽屜
  const toggle = $('[data-wiki-side-toggle]');
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      $('#wikiSide')?.classList.toggle('is-open');
    });
    document.addEventListener('click', (e) => {
      const s = $('#wikiSide');
      if (s && s.classList.contains('is-open') && !s.contains(e.target)) closeSide();
    });
  }

  // 目前文章若在側欄可視範圍外，捲到看得見的位置
  const active = $('.wiki-side .ws-link.is-active');
  const side = $('#wikiSide');
  if (active && side && active.offsetTop + active.offsetHeight > side.clientHeight - 48) {
    side.scrollTop = active.offsetTop - side.clientHeight / 2;
  }

  if (MODE === 'page') {
    bindToc();
    revealHash(false);
    window.addEventListener('hashchange', () => revealHash(true));
  }

  if (MODE === 'db') {
    window.addEventListener('hashchange', route);
    Promise.all([need('meta'), loadPages()]).then((res) => {
      const m = res[0];
      Object.assign(INST_FOLDER, m.instFolders || {});
      Object.assign(BOSS_FOLDER, m.bossFolders || {});
      Object.assign(EVENT_FOLDER, m.eventFolders || {});
      Object.assign(CUSTOM_FOLDER, m.customFolders || {});
      route();
      need('classes').catch(() => {});
    }).catch((e) => {
      const main = $('#wikiDb');
      if (main) main.innerHTML = '<div class="article"><h1 class="page-h1">無法載入資料</h1><p>' + esc(e.message) + '</p><p>請重新整理頁面再試一次。</p></div>';
    });
  }
  // 文章頁與攻略首頁不預先載入任何資料：打開搜尋、滑過道具連結時才按需下載
}
