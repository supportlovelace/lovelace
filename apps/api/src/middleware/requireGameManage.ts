import type { Context, Next } from 'hono';
import { checkPermission } from '../authz/client';

// Middleware: require manage rights on a specific game for the current user
export const requireGameManage = async (c: Context, next: Next) => {
  const params = c.req.param() as { id: string };
  const id = params.id;
  const userId = c.get('userId') || c.req.header('x-user-id') || 'user-1';

  if (!id) {
    return c.json({ status: 'error', message: 'Game ID is required' }, 400);
  }

  // Check if user has manage permission on the specific game
  const hasManage = await checkPermission(`user:${userId}`, 'manage', `game:${id}`);
  if (!hasManage) {
    return c.json({ status: 'error', message: 'Access denied - insufficient permissions' }, 403);
  }

  await next();
};
