import type { Context, Next } from 'hono';
import { spicedbClient } from '../authz/client';
import { v1 } from '@authzed/authzed-node';
import { credentials, Metadata } from '@grpc/grpc-js';

function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  const token = process.env.SPICEDB_GRPC_TOKEN || 'ton_secret_ici';
  if (token) md.set('authorization', `Bearer ${token}`);
  return md;
}

async function checkGenericPermission(
  resourceType: string,
  resourceId: string,
  permission: string,
  subjectId: string
): Promise<boolean> {
  try {
    const md = makeAuthMetadata();
    const req = v1.CheckPermissionRequest.create({
      resource: v1.ObjectReference.create({ objectType: resourceType, objectId: resourceId }),
      subject: v1.SubjectReference.create({
        object: v1.ObjectReference.create({ objectType: 'user', objectId: subjectId })
      }),
      permission
    });

    const res = await spicedbClient.promises.checkPermission(req, md);
    return res.permissionship === v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION;
  } catch (error) {
    console.error('SpiceDB error:', error);
    return false;
  }
}

export const requireGlobalAccess = async (c: Context, next: Next) => {
  // Récupérer l'ID utilisateur depuis le contexte (attendu depuis un middleware d'auth)
  const userId = c.get('userId');
  
  if (!userId) {
    return c.json({ error: 'Utilisateur non authentifié' }, 401);
  }

  try {
    // Vérifier la permission globale avec SpiceDB
    const hasAccess = await checkGenericPermission(
      'lovelace_system',
      'lovelace',
      'global_access',
      userId
    );

    if (!hasAccess) {
      return c.json({ error: 'Accès global requis' }, 403);
    }

    await next();
  } catch (error) {
    console.error('Erreur lors de la vérification de permission globale:', error);
    return c.json({ error: 'Erreur de vérification des permissions' }, 500);
  }
};
