#!/usr/bin/env node
/**
 * 攻略百科資料同步
 * ------------------------------------------------------------------
 * 從伺服器專案的 wiki 建置結果（wiki/site/data/*.js）複製資料到官網：
 *   - src/data/wiki/pages.json   攻略文章（建置時產生靜態頁面用）
 *   - src/data/wiki/meta.json    資料版本與筆數（攻略首頁顯示用）
 *   - public/wiki/data/*.js      道具、怪物、商店…資料庫（瀏覽器端按需載入）
 *
 * 用法（在官網專案根目錄）：
 *   npm run sync-wiki
 *   npm run sync-wiki -- --from "E:/其他路徑/L2J_Mobius_14.1/wiki"
 *
 * 伺服器資料或攻略文章有更新時：
 *   1. 在伺服器專案先跑 wiki 建置（java wiki/tools/BuildData.java、java wiki/tools/BuildPages.java）
 *   2. 回到這裡執行 npm run sync-wiki，再 commit 推送即可
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argFrom = process.argv.indexOf('--from');
const wikiDir = path.resolve(
  argFrom > -1 ? process.argv[argFrom + 1] : process.env.WIKI_DIR || 'D:/L2J_Mobius_14.1/wiki',
);
const srcData = path.join(wikiDir, 'site', 'data');
const outJson = path.join(root, 'src', 'data', 'wiki');
const outPublic = path.join(root, 'public', 'wiki', 'data');

if (!fs.existsSync(path.join(srcData, 'pages.js'))) {
  console.error(`找不到 wiki 資料：${srcData}\n請確認路徑，或用 --from 指定 wiki 資料夾。`);
  process.exit(1);
}

/** 解析 `WIKI.put("name", <json>);` 格式的資料檔 */
function readPut(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^\s*WIKI\.put\(\s*"([^"]+)"\s*,/);
  if (!m) throw new Error(`無法解析資料檔格式：${file}`);
  const body = text.slice(m[0].length).replace(/\)\s*;?\s*$/, '');
  return { name: m[1], data: JSON.parse(body) };
}
const put = (name, data) => `WIKI.put(${JSON.stringify(name)},${JSON.stringify(data)});\n`;

fs.mkdirSync(outJson, { recursive: true });
fs.mkdirSync(outPublic, { recursive: true });

// 1. 攻略文章 → src/data/wiki/pages.json（含 HTML）；public 只留搜尋用的純文字索引
const { data: pages } = readPut(path.join(srcData, 'pages.js'));
const articles = pages.map(({ id, title, nav, order, icon, summary, keywords, heads, html }) => ({
  id, title, nav, order, icon, summary, keywords, heads, html,
}));
fs.writeFileSync(path.join(outJson, 'pages.json'), JSON.stringify(articles));
const searchIndex = pages.map(({ id, title, nav, order, icon, summary, keywords, heads, text }) => ({
  id, title, nav, order, icon, summary, keywords, heads, text,
}));

// 2. 資料版本 → src/data/wiki/meta.json（只留首頁需要的欄位）
const { data: meta } = readPut(path.join(srcData, 'meta.js'));
const pick = ['built', 'items', 'npcs', 'mobs', 'multisells', 'sets', 'collections', 'agathions'];
fs.writeFileSync(
  path.join(outJson, 'meta.json'),
  JSON.stringify(Object.fromEntries(pick.map((k) => [k, meta[k]])), null, 2) + '\n',
);

// 3. 資料庫檔 → public/wiki/data（先清掉舊檔，避免殘留已刪除的分桶）
for (const f of fs.readdirSync(outPublic)) {
  if (f.endsWith('.js')) fs.rmSync(path.join(outPublic, f));
}
let bytes = 0;
let count = 0;
for (const f of fs.readdirSync(srcData)) {
  if (!f.endsWith('.js') || f === 'pages.js') continue;
  fs.copyFileSync(path.join(srcData, f), path.join(outPublic, f));
  bytes += fs.statSync(path.join(outPublic, f)).size;
  count++;
}
const idx = put('pages', searchIndex);
fs.writeFileSync(path.join(outPublic, 'pages.js'), idx);
bytes += Buffer.byteLength(idx);
count++;

console.log(`攻略百科已同步（資料版本 ${meta.built}）`);
console.log(`  攻略文章 ${articles.length} 篇 → src/data/wiki/pages.json`);
console.log(`  資料庫檔 ${count} 個，共 ${(bytes / 1024 / 1024).toFixed(1)} MB → public/wiki/data/`);
