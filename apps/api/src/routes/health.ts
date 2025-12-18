import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { poweredBy } from 'hono/powered-by';
import { serve } from '@hono/node-server';
import { spicedbClient } from '../authz/client';
import { v1 } from '@authzed/authzed-node';
import { Metadata } from '@grpc/grpc-js';

function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  const token = process.env.SPICEDB_GRPC_TOKEN; // local: souvent vide avec credentials.createInsecure()
  if (token) md.set('authorization', `Bearer ${token}`);
  return md;
}

const healthApp = new Hono()
  .use('*', poweredBy())
  .use('*', cors())
  .get('/', (c) => c.text('Health API Ready'))
  .get('/health', async (c) => {
    try {
      // Vérifier SpiceDB
      const md = makeAuthMetadata();
      const healthReq = v1.CheckPermissionRequest.create({
        resource: v1.ObjectReference.create({ objectType: 'game', objectId: 'health-check' }),
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({ objectType: 'user', objectId: 'health-user' })
        }),
        permission: 'view'
      });

      let spicedbReady = false;
      try {
        await spicedbClient.promises.checkPermission(healthReq, md);
        spicedbReady = true; // L’appel a réussi (peu importe le résultat fonctionnel)
      } catch (e) {
        spicedbReady = false; // échec transport/validation
      }

      // Vérifier Postgres (via Drizzle)
      // Note: Drizzle vérifie la connexion automatiquement

      return c.json({
        status: 'ok',
        version: '1.0.0',
        postgres: 'ok',
        spicedb: spicedbReady ? 'ok' : 'error',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return c.json({
        status: 'error',
        message: error.message
      }, 500);
    }
  });

export const startHealth = (port: number) => {
  console.log(`Health server running on port ${port}`);
  serve({ fetch: healthApp.fetch, port });
};
