// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

import { validateData } from './src/integrations/validate-data.ts';

// site は公開サブドメイン確定後に差し替える（C-2）。canonical / sitemap / OGP が参照する。
export default defineConfig({
  site: 'https://sf6-combo.example.com',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    preact(),
    validateData(),
    sitemap({ filter: (page) => !page.includes('/manon/preview') }),
  ],
});
