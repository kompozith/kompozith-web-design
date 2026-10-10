import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {createApiApp} from './server/app.ts';
import {UPLOAD_DIR} from './server/db.ts';

/**
 * Mounts the CMS API inside the Vite dev server so the site and its admin API
 * share one origin in development. Same-origin matters here: the session
 * cookie is SameSite=Strict, so a separate API port would never receive it.
 *
 * The API module is loaded once at config time — restart `npm run dev` after
 * editing anything under server/.
 */
function cmsApiPlugin(): Plugin {
  return {
    name: 'kompozith-cms-api',
    configureServer(server) {
      server.middlewares.use('/uploads', express.static(UPLOAD_DIR));
      server.middlewares.use('/api', createApiApp());
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cmsApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // data/ holds the CMS store and uploads: every save would otherwise look
      // like a source change and bounce the dev server mid-edit.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {ignored: ['**/data/**']},
    },
  };
});
