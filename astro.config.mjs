// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';

import { validateData } from './src/integrations/validate-data.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://sf6-combo.example.com',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [preact(), validateData()],
});
