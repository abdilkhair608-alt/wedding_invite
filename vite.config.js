import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import rsvpPlugin from './server/vite-rsvp.js';
import { serverConfig } from './server/config.js';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    rsvpPlugin(serverConfig({ ...loadEnv(mode, process.cwd(), ''), ...process.env })),
  ],
  base: './',
  server: {
    watch: { ignored: ['**/.qa/**', '**/.npm-cache/**', '**/.data/**'] },
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.data/**', '**/.qa/**'] },
  },
}));
