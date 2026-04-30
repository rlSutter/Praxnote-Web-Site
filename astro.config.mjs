import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://praxnote.com',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  compressHTML: true,
  integrations: [sitemap()],
});
