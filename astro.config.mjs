import { defineConfig } from 'astro/config';

// Static output — fast, cache-friendly, perfect for Cloudflare Pages.
// Stripe endpoints live in /functions (Cloudflare Pages Functions).
export default defineConfig({
  site: 'https://enilaangel.com',
  output: 'static',
});
