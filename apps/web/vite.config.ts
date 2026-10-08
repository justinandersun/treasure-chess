import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Replaces %SITE_URL% in index.html with the production origin, so link-preview tags get the
 * absolute URLs that scrapers require. Vercel provides the domain at build time; elsewhere the
 * placeholder becomes empty and URLs stay relative.
 */
function siteUrl(): Plugin {
  const domain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const origin = domain ? `https://${domain}` : '';
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', origin),
  };
}

export default defineConfig({
  plugins: [react(), siteUrl()],
});
