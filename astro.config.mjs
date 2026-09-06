import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages 部署設定：
// - 若部署至 https://<user>.github.io/<repo>/ → site 填完整網址，base 填 '/<repo>'
// - 若使用自訂網域（CNAME）→ site 填網域，base 保持 '/'
export default defineConfig({
  site: 'https://blackcat-awaken.github.io',
  base: '/site',
  output: 'static',
  trailingSlash: 'never',
  vite: {
    plugins: [tailwindcss()],
  },
});
