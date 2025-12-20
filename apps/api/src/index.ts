import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { poweredBy } from 'hono/powered-by';
import { gamesRoute } from './routes/games';
import adminRoute from './routes/admin';
import portalRoute from './routes/portal';
import tooltipsRoute from './routes/tooltips';
import { authRoute } from './routes/auth';
import { dashboardRoute } from './routes/dashboard';
import { requireGlobalAccess } from './middleware/requireGlobalAccess';

type Variables = {
  userId: string;
};

// On définit le type de l'App pour le RPC
const app = new Hono<{ Variables: Variables }>()
  .use('*', poweredBy())
  .use('*', cors({
    // Autoriser les origines dev: localhost/127.0.0.1 sur 5173 (web) et 5174 (admin)
    origin: (origin) => {
      const allowed = new Set([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
      ]);
      return origin && allowed.has(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true, // Important pour permettre les cookies
  }))
  // Middleware d'authentification pour extraire l'ID utilisateur du cookie ou du header
  .use('*', async (c, next) => {
    // Priorité au cookie session-id
    const sessionId = c.req.header('cookie')?.split(';')
      .find(cookie => cookie.trim().startsWith('session-id='))
      ?.split('=')[1];
    
    let userId = sessionId;
    
    // Fallback vers le header X-User-ID (mode test)
    if (!userId) {
      userId = c.req.header('x-user-id');
    }
    
    if (userId) {
      c.set('userId', userId);
    }
    await next();
  })
  // On définit la route health directement ici pour tester
  .get('/health', (c) => {
    return c.json({ status: 'ok', services: { database: 'connected' } });
  })
  // Routes auth
  .route('/auth', authRoute)
  // Routes dashboard
  .route('/dashboard', dashboardRoute)
  // Routes admin (protégées)
  .route('/admin', adminRoute)
  // Routes portail client
  .route('/portal', portalRoute)
  // Routes tooltips
  .route('/tooltips', tooltipsRoute)
  // Routes jeux
  .route('/games', gamesRoute);

import { startImportWorker } from './worker/import-worker';

// Export indispensable pour le frontend
export type AppType = typeof app;

console.log("🚀 Serveur API démarré sur le port 3000");
console.log("📍 R2 Endpoint:", process.env.R2_ENDPOINT || "NON DÉFINI");

// Démarrage du Worker BullMQ (Import CSV)
try {
  startImportWorker();
  console.log("✅ Worker BullMQ (Import CSV) démarré");
} catch (e) {
  console.error("❌ Erreur au démarrage du Worker BullMQ:", e);
}

// Démarrage natif Bun
export default {
  port: 3000,
  fetch: app.fetch,
};
