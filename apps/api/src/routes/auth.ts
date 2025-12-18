import { Hono } from 'hono';
import { requireGlobalAccess } from '../middleware/requireGlobalAccess';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Type pour le contexte avec userId
type Variables = {
  userId: string;
};

const authRoute = new Hono<{ Variables: Variables }>();

// POST /auth/login - Connexion de l'utilisateur et création de session
authRoute.post('/login', async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: 'userId est requis' }, 400);
    }

    // Vérifier si l'utilisateur existe dans la base de données
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    // Créer le cookie de session
    return c.json({ 
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, 200, {
      'Set-Cookie': `session-id=${userId}; HttpOnly; Path=/; SameSite=lax; Max-Age=${60 * 60 * 24 * 7}`
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return c.json({ error: 'Erreur lors de la connexion' }, 500);
  }
});

// GET /auth/me - Récupère les informations de l'utilisateur connecté
authRoute.get('/me', async (c) => {
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  // Récupérer les informations de l'utilisateur depuis la base de données
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return c.json({ error: 'Utilisateur non trouvé' }, 404);
  }

  return c.json({ 
    id: user.id,
    email: user.email,
    name: user.name
  });
});

// GET /auth/check-global-admin - Vérifie si l'utilisateur a l'accès global admin
// Cette route est protégée par le middleware requireGlobalAccess
authRoute.get('/check-global-admin', requireGlobalAccess, async (c) => {
  // Si on arrive ici, c'est que le middleware requireGlobalAccess a validé l'accès
  return c.json({ access: true });
});

export { authRoute };
