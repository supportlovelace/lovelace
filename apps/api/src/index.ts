import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { poweredBy } from 'hono/powered-by';
import { Server } from "socket.io";
import { Server as Engine } from "@socket.io/bun-engine";
import postgres from 'postgres';

import { gamesRoute } from './routes/games';
import adminRoute from './routes/admin';
import portalRoute from './routes/portal';
import tooltipsRoute from './routes/tooltips';
import { authRoute } from './routes/auth';
import { dashboardRoute } from './routes/dashboard';
import { requireGlobalAccess } from './middleware/requireGlobalAccess';
import { startImportWorker } from './worker/import-worker';

// --- SOCKET.IO SETUP (BUN ENGINE) ---
const io = new Server({
  cors: {
    origin: [
      "http://localhost:5173", "http://localhost:5174", "http://localhost:5175",
      "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
const engine = new Engine();

io.bind(engine);

io.on("connection", (socket) => {
  // socket.on("ping", ...) // Supprimé pour prod
  
  socket.on("join_game", (gameId) => {
    socket.join(`game:${gameId}`);
  });

  socket.on("leave_game", (gameId) => {
    socket.leave(`game:${gameId}`);
  });
});

// --- POSTGRES NOTIFICATION LISTENER ---
const connectionString = process.env.DATABASE_URL;
if (connectionString) {
  const sqlListen = postgres(connectionString);

  sqlListen.listen('db_changes', (payload) => {
    try {
      const data = JSON.parse(payload);
      if (data.game_id) {
        io.to(`game:${data.game_id}`).emit('onboarding_updated', data);
      } else {
        io.emit('db_event', data);
      }
    } catch (e) {
      console.error('Erreur parsing notification DB:', e);
    }
  }).catch(err => {
    console.error('❌ [Postgres] Erreur connection Listener:', err);
  });
}

// Export de io pour l'utiliser ailleurs
export { io };

type Variables = {
  userId: string;
};

// On définit le type de l'App pour le RPC
const app = new Hono<{ Variables: Variables }>()
  .use('*', poweredBy())
  .use('*', cors({
    // Autoriser les origines dev
    origin: (origin) => {
      const allowed = new Set([
        'http://localhost:5173', 'http://127.0.0.1:5173',
        'http://localhost:5174', 'http://127.0.0.1:5174',
        'http://localhost:5175', 'http://127.0.0.1:5175',
      ]);
      return origin && allowed.has(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    credentials: true,
  }))
  .use('*', async (c, next) => {
    const sessionId = c.req.header('cookie')?.split(';')
      .find(cookie => cookie.trim().startsWith('session-id='))
      ?.split('=')[1];
    
    let userId = sessionId;
    if (!userId) {
      userId = c.req.header('x-user-id');
    }
    
    if (userId) {
      c.set('userId', userId);
    }
    await next();
  })
  .get('/health', (c) => {
    return c.json({ status: 'ok', services: { database: 'connected' } });
  })
  .route('/auth', authRoute)
  .route('/dashboard', dashboardRoute)
  .route('/admin', adminRoute)
  .route('/portal', portalRoute)
  .route('/tooltips', tooltipsRoute)
  .route('/games', gamesRoute);

// Export indispensable pour le frontend
export type AppType = typeof app;

console.log("🚀 Serveur API démarré sur le port 3000");
console.log("📍 R2 Endpoint:", process.env.R2_ENDPOINT || "NON DÉFINI");

// Récupération du handler websocket natif de l'engine Socket.io
const { websocket } = engine.handler();

export default {
  port: 3000,
  idleTimeout: 30, // must be greater than pingInterval (25s)
  
  fetch(req: Request, server: any) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/socket.io/")) {
      return engine.handleRequest(req, server);
    } else {
      return app.fetch(req, server);
    }
  },
  
  websocket,
};
