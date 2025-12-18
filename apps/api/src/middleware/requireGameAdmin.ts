import type { MiddlewareHandler } from 'hono';
import { checkPermission } from '../authz/client';

// Middleware: require admin rights on a game for the current user (user-1)
export const requireGameAdmin: MiddlewareHandler = async (c, next) => {
  const { id } = c.req.param();
  const userId = c.req.header('x-user-id') || 'user-1';

  // In our schema, `manage` permission includes `admin` relation for game
  const hasAdmin = await checkPermission(`user:${userId}`, 'manage', `game:${id}`);
  if (!hasAdmin) {
    return c.json({ status: 'error', message: 'Access denied' }, 403);
  }

  await next();
};
