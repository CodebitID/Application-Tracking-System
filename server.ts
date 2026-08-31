import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PORT, IS_PRODUCTION } from './src/server/config';
import { db } from './src/server/db';
import { healthRouter } from './src/server/routes/healthRoutes';
import { jobRouter } from './src/server/routes/jobRoutes';
import { integrationRouter } from './src/server/routes/integrationRoutes';
import { webhookRouter } from './src/server/routes/webhookRoutes';
import { aiRouter } from './src/server/routes/aiRoutes';

export const app = express();

// Parse JSON payloads with generous limit for analysis and description texts.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes. Database initialization happens before requests are served.
app.use(healthRouter);
app.use(jobRouter);
app.use(integrationRouter);
app.use(webhookRouter);
app.use(aiRouter);

let initialized = false;

export async function initializeServer() {
  if (initialized) return;
  await db.init();
  initialized = true;
}

async function startLocalServer() {
  await initializeServer();

  // Vite middleware in development or static dist files in local production.
  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.VERCEL !== '1') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Career Opportunity Tracker server running at http://0.0.0.0:${PORT}`);
  });
}

// Keep the existing local `npm run dev` / `npm start` workflow intact.
// On Vercel, /api/index.ts imports this module and Vercel owns the HTTP lifecycle.
if (process.env.VERCEL !== '1') {
  startLocalServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}

export default app;
