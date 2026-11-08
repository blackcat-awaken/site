/**
 * 攻略百科 — 分類、首頁內容與文章處理
 * 文章與資料版本由 `npm run sync-wiki` 從伺服器專案的 wiki 同步而來（src/data/wiki/*.json）
 */
import pagesJson from './wiki/pages.json';
import metaJson from './wiki/meta.json';

export const WIKI_BASE = '/site/wiki';
export const WIKI_DB = `${WIKI_BASE}/db`;
export const WIKI_DATA = `${WIKI_BASE}/data/`;

export interface WikiArticle {
  id: string;
  title: string;
  nav: string;
  order: number;
  icon: string;
  summary: string;
  keywords: string;
  heads: string[];
  html: string;
}

export interface WikiCategory {
  id: string;
  name: string;
  en: string;
  /** 章節漢字序號 */
  no: string;
  icon: string;
}

/** 分類（順序即顯示順序） */
export const wikiCategories: WikiCategory[] = [
  { id: 'start', name: '新手入門', en: 'BEGINNER', no: '壹', icon: 'rocket' },
  { id: 'char', name: '角色養成', en: 'CHARACTER', no: '貳', icon: 'user' },
  { id: 'gear', name: '裝備與強化', en: 'GEAR', no: '參', icon: 'shield' },
  { id: 'content', name: '冒險內容', en: 'ADVENTURE', no: '肆', icon: 'map' },
  { id: 'social', name: 'PvP・血盟・活動', en: 'PVP & CLAN', no: '伍', icon: 'flag' },
  { id: 'economy', name: '經濟與日常', en: 'DAILY', no: '陸', icon: 'coin' },
];
export const dbCategory: WikiCategory = { id: 'db', name: '資料庫', en: 'DATABASE', no: '典', icon: 'grid' };

type MetaKey = keyof typeof metaJson;
export interface WikiDbPage {
  id: string;
  title: string;
  icon: string;
  summary: string;
  /** 對應 meta.json 的筆數欄位 */
  count?: MetaKey;
  unit?: string;
}

/** 資料庫頁（對應 /site/wiki/db#<id>） */
export const wikiDbPages: WikiDbPage[] = [
  { id: 'db-items', title: '道具資料庫', icon: 'box', summary: '能力、說明與取得途徑', count: 'items', unit: '件' },
  { id: 'db-npcs', title: '怪物資料庫', icon: 'skull', summary: '等級、地點與掉落', count: 'mobs', unit: '種' },
  { id: 'db-bosses', title: 'BOSS 資料庫', icon: 'crown', summary: '首領等級、地點與重生' },
  { id: 'db-zones', title: '獵場資料庫', icon: 'map', summary: '推薦等級與出沒怪物' },
  { id: 'db-sets', title: '套裝資料庫', icon: 'armor', summary: '部件與套裝效果', count: 'sets', unit: '套' },
  { id: 'db-skills', title: '職業技能', icon: 'bolt', summary: '技能、學習等級與說明' },
  { id: 'db-collections', title: '收藏資料庫', icon: 'star', summary: '所需道具與完成效果', count: 'collections', unit: '個' },
  { id: 'db-agathions', title: '壺精資料庫', icon: 'lamp', summary: '各強化等級的技能', count: 'agathions', unit: '種' },
  { id: 'db-shops', title: '商店兌換表', icon: 'bag', summary: '布告欄與 NPC 兌換清單', count: 'multisells', unit: '張' },
];

export const wikiMeta = metaJson;
/** 資料版本日期（2026-11-08） */
export const wikiBuiltDate = String(metaJson.built).slice(0, 10);
/** 資料檔快取版本號 */
export const wikiDataVersion = String(metaJson.built).replace(/\D/g, '');

const catIndex = (nav: string) => {
  const i = wikiCategories.findIndex((c) => c.id === nav);
  return i < 0 ? 99 : i;
};

/** 依分類 → 排序 → 標題排列的文章清單 */
export const wikiArticles: WikiArticle[] = (pagesJson as WikiArticle[])
  .filter((p) => p.id !== 'home')
  .slice()
  .sort((a, b) => catIndex(a.nav) - catIndex(b.nav) || (a.order || 99) - (b.order || 99) || a.title.localeCompare(b.title));

const articleIds = new Set(wikiArticles.map((p) => p.id));

export const categoryOf = (nav: string) => wikiCategories.find((c) => c.id === nav);
export const articlesIn = (nav: string) => wikiArticles.filter((p) => p.nav === nav);

/** 攻略頁網址：pageUrl('enchant', 'rates') → /site/wiki/enchant#rates */
export function pageUrl(id: string, anchor?: string) {
  if (id.startsWith('db-')) return `${WIKI_DB}#${id}`;
  return `${WIKI_BASE}/${id}${anchor ? `#${anchor}` : ''}`;
}

/** wiki 內部連結（#enchant--rates、#item-57、#db-items…）→ 官網網址 */
export function resolveWikiHref(hash: string) {
  const h = hash.replace(/^#/, '');
  if (!h) return WIKI_BASE;
  if (/^(item|npc|set|class|shop|buy|col|zone|agathion)-(-?\d+)$/.test(h) || h.startsWith('db-')) return `${WIKI_DB}#${h}`;
  const [pid, anchor] = h.split('--');
  if (articleIds.has(pid)) return pageUrl(pid, anchor);
  return `${WIKI_BASE}#${h}`;
}

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'wbr', 'source', 'col']);

/**
 * 文章 HTML 處理：
 * - 連結改為官網網址（文章頁、資料庫頁）
 * - 沒有 id 的標題補上 id
 * - 擷取本頁目錄（不含折疊區、提示框裡的標題）
 */
export function prepareArticle(p: WikiArticle) {
  let html = p.html.replace(/href="(#[^"]*)"/g, (_m, hash: string) => {
    // 技能連結（slink）沒有目的地，保留 # 由前端顯示說明
    if (hash === '#') return 'href="#" role="button"';
    return `href="${resolveWikiHref(hash)}"`;
  });

  const toc: TocEntry[] = [];
  const stack: { tag: string; skip: boolean }[] = [];
  let auto = 0;
  let out = '';
  let last = 0;
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [full, close, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (VOID_TAGS.has(tag) || attrs.endsWith('/')) continue;
    if (close) {
      // 從堆疊找到對應開頭標籤
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const insideSkip = stack.some((s) => s.skip);
    const skip = tag === 'details' || /\b(tldr|callout|card|keys)\b/.test(cls);
    if ((tag === 'h2' || tag === 'h3') && !insideSkip) {
      const end = html.indexOf(`</${tag}>`, m.index);
      const text = html.slice(m.index + full.length, end).replace(/<[^>]+>/g, '').trim();
      let id = /\sid="([^"]+)"/.exec(attrs)?.[1];
      if (!id) {
        id = `sec-${++auto}`;
        out += html.slice(last, m.index) + `<${rawTag} id="${id}"${attrs}>`;
        last = m.index + full.length;
      }
      toc.push({ id, text, level: tag === 'h2' ? 2 : 3 });
    }
    stack.push({ tag, skip });
  }
  html = out + html.slice(last);

  // 機率表：純百分比的數值格加上細比例條，一眼比較高低（同一張表至少 4 格才套用）
  const pctCell = /<td class="r">(\d+(?:\.\d+)?)%<\/td>/g;
  html = html.replace(/<table class="tbl[^"]*">[\s\S]*?<\/table>/g, (table) => {
    if ((table.match(pctCell) || []).length < 4) return table;
    return table.replace(pctCell, (_m, v: string) => `<td class="r has-bar" style="--p:${Math.min(100, Number(v))}">${v}%</td>`);
  });

  const i = wikiArticles.findIndex((x) => x.id === p.id);
  return {
    html,
    toc,
    prev: i > 0 ? wikiArticles[i - 1] : undefined,
    next: i < wikiArticles.length - 1 ? wikiArticles[i + 1] : undefined,
  };
}

/* ------------------------------------------------------------------
 * 攻略首頁內容
 * ------------------------------------------------------------------ */

/** 固定時間行事曆（伺服器時間）：[時間, 內容, 連結] */
export const wikiSchedule = {
  daily: [
    ['06:30', '每日重置：簽到、副本次數、限時獵場時間', 'daily--reset-table'],
    ['12:00・19:00・23:00', '怪物入侵：悲鳴的沼澤、掠奪的荒野', 'zones'],
    ['13:00・16:00・20:00', '野外首領：突變的司塔卡拓克洛庫、巨大渾沌高崙', 'bosses--schedule'],
    ['14:00・18:00', '野外首領：渾沌高崙 17 號、18 號', 'bosses--schedule'],
    ['21:00', 'TvT 隊伍對抗賽（亞丁報名 10 分鐘）', 'pvp--tvt'],
    ['21:30～23:30', '奧林匹亞', 'pvp--olympiad'],
  ],
  weekly: [
    ['週一 20:00', '世界王：巨蟻女王', 'bosses--schedule'],
    ['週二～四 18:00', '渾沌祭典（至 24:00）', 'pvp--coc'],
    ['週二 21:00・週六 16:00', '世界王：亞納解封', 'bosses--schedule'],
    ['週三 06:30', '每週重置：活力全滿、每週副本與限購', 'daily--reset-table'],
    ['週三・週六 18:00', '龍之試煉・絕（四隻絕龍同場）', 'bosses'],
    ['週三 21:00～23:00', '世界王：巴溫（傲慢之塔）', 'bosses--schedule'],
    ['週四 21:00', '世界王：奧爾芬', 'bosses--schedule'],
    ['週六 20:00', '世界王：莉莉絲', 'bosses--schedule'],
    ['週日 16:00・20:00', '攻城戰', 'pvp--siege'],
  ],
  note: '迪斯倫（征服戰）：週一～四 10:00～12:00、22:00～24:00；週五～日 20:00～翌日 01:00。',
} as const;
