// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

import { validateData } from './src/integrations/validate-data.ts';

// canonical / sitemap / OGP が参照する公開 URL。Cloudflare Workers の custom domain。
export default defineConfig({
  site: 'https://sf6.amanohashi.date',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    preact(),
    validateData(),
    sitemap({ filter: (page) => !page.includes('/preview') }),
  ],
});
