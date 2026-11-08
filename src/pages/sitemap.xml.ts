/**
 * 網站地圖：建置時產生（攻略百科新增文章後自動列入）
 * 隱藏流量看板 /crow-eye-ls7oho 不列入
 */
import type { APIRoute } from 'astro';
import { wikiArticles, wikiBuiltDate } from '../data/wiki';

const SITE = 'https://blackcat-awaken.github.io';

const pages: { path: string; lastmod: string; changefreq: string; priority: string }[] = [
  { path: '/site/', lastmod: '2026-09-06', changefreq: 'weekly', priority: '1.0' },
  { path: '/site/events', lastmod: '2026-09-06', changefreq: 'weekly', priority: '0.9' },
  { path: '/site/features', lastmod: '2026-09-06', changefreq: 'monthly', priority: '0.8' },
  { path: '/site/guide', lastmod: '2026-09-06', changefreq: 'monthly', priority: '0.8' },
  { path: '/site/wiki', lastmod: wikiBuiltDate, changefreq: 'weekly', priority: '0.9' },
  { path: '/site/wiki/db', lastmod: wikiBuiltDate, changefreq: 'weekly', priority: '0.7' },
  ...wikiArticles.map((p) => ({ path: `/site/wiki/${p.id}`, lastmod: wikiBuiltDate, changefreq: 'monthly', priority: '0.7' })),
  { path: '/site/download', lastmod: '2026-09-06', changefreq: 'weekly', priority: '0.9' },
  { path: '/site/contact', lastmod: '2026-09-06', changefreq: 'monthly', priority: '0.5' },
];

export const GET: APIRoute = () => {
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages
      .map(
        (p) =>
          `  <url>\n    <loc>${SITE}${p.path}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
      )
      .join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
