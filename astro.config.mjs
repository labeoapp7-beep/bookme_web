// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://shaghir.zimamak.com',
  integrations: [react()],
  output: 'static' // To make it deployable anywhere (like GoDaddy/Hostinger)
});