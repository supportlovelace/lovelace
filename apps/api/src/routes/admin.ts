import { Hono } from "hono";
import { db } from "../db";
import { publishers, studios, users, games } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireGlobalAccess } from "../middleware/requireGlobalAccess";
import { checkPermission, spicedbClient } from "../authz/client";
import { v1 } from "@authzed/authzed-node";
import { Metadata } from "@grpc/grpc-js";
import type {
  Publisher,
  Studio,
  PublisherInsert,
  StudioInsert,
  PublishersResponse,
  StudiosResponse,
  PublishersResponseError,
  StudiosResponseError,
} from "../types";

// Type pour le contexte avec userId
type Variables = {
  userId: string;
};

const adminRoute = new Hono<{ Variables: Variables }>();

function makeAuthMetadata(): Metadata {
  const md = new Metadata();
  // Pour le développement local avec credentials.createInsecure(),
  // on n'envoie PAS de token Bearer
  const token = process.env.SPICEDB_GRPC_TOKEN;
  if (token) md.set("authorization", `Bearer ${token}`);
  return md;
}

async function writeRelationship(
  namespace: string,
  objectId: string,
  relation: string,
  subjectId: string,
): Promise<void> {
  try {
    const md = makeAuthMetadata();
    const update = v1.RelationshipUpdate.create({
      operation: v1.RelationshipUpdate_Operation.CREATE,
      relationship: v1.Relationship.create({
        resource: v1.ObjectReference.create({
          objectType: namespace,
          objectId,
        }),
        relation,
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({
            objectType: "user",
            objectId: subjectId,
          }),
        }),
      }),
    });

    const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
    await spicedbClient.promises.writeRelationships(req, md);
  } catch (error) {
    console.error("SpiceDB write error:", error);
    throw error;
  }
}

// Appliquer le middleware de protection globale à toutes les routes admin
adminRoute.use("*", requireGlobalAccess);

// POST /admin/publishers - Créer un nouveau publisher
adminRoute.post("/publishers", async (c) => {
  const userId = c.get("userId");
  const { name, description } = await c.req.json();

  if (!name) {
    return c.json<PublishersResponseError>({ error: "Le nom est requis" }, 400);
  }

  try {
    // Insérer dans la base de données
    const [newPublisher] = await db
      .insert(publishers)
      .values({
        name,
        description: description || null,
        createdBy: userId,
      } as PublisherInsert)
      .returning();

    // Écrire la relation SpiceDB: publisher:[ID] admin user:[CreatorID]
    await writeRelationship("publisher", newPublisher.id, "admin", userId);

    return c.json<PublishersResponse>(
      {
        message: "Publisher créé avec succès",
        publishers: [newPublisher],
      },
      201,
    );
  } catch (error) {
    console.error("Erreur lors de la création du publisher:", error);
    return c.json<PublishersResponseError>(
      { error: "Erreur lors de la création du publisher" },
      500,
    );
  }
});

// POST /admin/studios - Créer un nouveau studio
adminRoute.post("/studios", async (c) => {
  const userId = c.get("userId");
  const { name, description, publisherId } = await c.req.json();

  if (!name || !publisherId) {
    return c.json<StudiosResponseError>(
      { error: "Le nom et publisherId sont requis" },
      400,
    );
  }

  try {
    // Vérifier que le publisher existe
    const [publisher] = await db
      .select()
      .from(publishers)
      .where(eq(publishers.id, publisherId));
    if (!publisher) {
      return c.json<StudiosResponseError>(
        { error: "Publisher non trouvé" },
        404,
      );
    }

    // Insérer dans la base de données
    const [newStudio] = await db
      .insert(studios)
      .values({
        name,
        description: description || null,
        publisherId,
        createdBy: userId,
      } as StudioInsert)
      .returning();

    // Écrire DEUX relations SpiceDB:
    // 1. studio:[ID] admin user:[CreatorID]
    await writeRelationship("studio", newStudio.id, "admin", userId);

    // 2. studio:[ID] publisher publisher:[PublisherID]
    const md = makeAuthMetadata();
    const update = v1.RelationshipUpdate.create({
      operation: v1.RelationshipUpdate_Operation.CREATE,
      relationship: v1.Relationship.create({
        resource: v1.ObjectReference.create({
          objectType: "studio",
          objectId: newStudio.id,
        }),
        relation: "publisher",
        subject: v1.SubjectReference.create({
          object: v1.ObjectReference.create({
            objectType: "publisher",
            objectId: publisherId,
          }),
        }),
      }),
    });

    const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
    await spicedbClient.promises.writeRelationships(req, md);

    return c.json<StudiosResponse>(
      {
        message: "Studio créé avec succès",
        studios: [newStudio],
      },
      201,
    );
  } catch (error) {
    console.error("Erreur lors de la création du studio:", error);
    return c.json<StudiosResponseError>(
      { error: "Erreur lors de la création du studio" },
      500,
    );
  }
});

// GET /admin/publishers - Lister tous les publishers
adminRoute.get("/publishers", async (c) => {
  try {
    const allPublishers = await db.select().from(publishers);
    return c.json<PublishersResponse>({ publishers: allPublishers });
  } catch (error) {
    console.error("Erreur lors de la récupération des publishers:", error);
    return c.json<PublishersResponseError>(
      { error: "Erreur lors de la récupération des publishers" },
      500,
    );
  }
});

// GET /admin/studios - Lister tous les studios
adminRoute.get("/studios", async (c) => {
  try {
    const allStudios = await db
      .select({
        id: studios.id,
        name: studios.name,
        description: studios.description,
        publisherId: studios.publisherId,
        publisherName: publishers.name,
        createdBy: studios.createdBy,
        createdAt: studios.createdAt,
        updatedAt: studios.updatedAt,
      })
      .from(studios)
      .leftJoin(publishers, eq(studios.publisherId, publishers.id));

    return c.json<StudiosResponse>({ studios: allStudios });
  } catch (error) {
    console.error("Erreur lors de la récupération des studios:", error);
    return c.json<StudiosResponseError>(
      { error: "Erreur lors de la récupération des studios" },
      500,
    );
  }
});

// GET /admin/publishers/:id/users - Lister les utilisateurs d'un publisher
adminRoute.get("/publishers/:id/users", async (c) => {
  const { id } = c.req.param() as { id: string };

  if (!id) {
    return c.json({ error: "Publisher ID is required" }, 400);
  }

  try {
    // Vérifier que le publisher existe
    const [publisher] = await db
      .select()
      .from(publishers)
      .where(eq(publishers.id, id));
    if (!publisher) {
      return c.json({ error: "Publisher non trouvé" }, 404);
    }

    // Utiliser une approche plus simple avec CheckPermission pour éviter les problèmes de typage
    const md = makeAuthMetadata();

    // Pour l'instant, utilisons une approche plus simple en vérifiant les permissions utilisateurs par utilisateurs
    // On va récupérer tous les utilisateurs et vérifier leurs permissions avec ce publisher
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users);

    const userRelations = await Promise.all(
      allUsers.map(async (user) => {
        // Vérifier si admin
        const adminRequest = v1.CheckPermissionRequest.create({
          resource: v1.ObjectReference.create({
            objectType: "publisher",
            objectId: id,
          }),
          permission: "admin",
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({
              objectType: "user",
              objectId: user.id,
            }),
          }),
        });

        const adminResponse = await spicedbClient.promises.checkPermission(
          adminRequest,
          md,
        );
        const isAdmin =
          adminResponse.permissionship ===
          v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION;

        // Vérifier si member
        const memberRequest = v1.CheckPermissionRequest.create({
          resource: v1.ObjectReference.create({
            objectType: "publisher",
            objectId: id,
          }),
          permission: "member",
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({
              objectType: "user",
              objectId: user.id,
            }),
          }),
        });

        const memberResponse = await spicedbClient.promises.checkPermission(
          memberRequest,
          md,
        );
        const isMember =
          memberResponse.permissionship ===
          v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION;

        return {
          userId: user.id,
          role: isAdmin ? "admin" : isMember ? "member" : "none",
          user: user,
        };
      }),
    );

    // Filtrer seulement les utilisateurs qui ont un rôle
    const validUserRelations = userRelations.filter((ur) => ur.role !== "none");

    return c.json({
      publisher,
      userRelations: validUserRelations,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des utilisateurs du publisher:",
      error,
    );
    return c.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      500,
    );
  }
});

// POST /admin/publishers/:id/users - Modifier les relations utilisateur/publisher
adminRoute.post('/publishers/:id/users', async (c) => {
  const { id } = c.req.param() as { id: string };
  const { userId: targetUserId, role, action } = await c.req.json();

  if (!id || !targetUserId || !role || !action) {
    return c.json({ error: 'Publisher ID, user ID, role, et action sont requis' }, 400);
  }

  if (!['admin', 'member'].includes(role)) {
    return c.json({ error: 'Rôle invalide. Valeurs acceptées: admin, member' }, 400);
  }

  if (!['add', 'remove'].includes(action)) {
    return c.json({ error: 'Action invalide. Valeurs acceptées: add, remove' }, 400);
  }

  try {
    // Vérifier que le publisher existe
    const publisher = await db.select().from(publishers).where(eq(publishers.id, id)).then(rows => rows[0]);
    if (!publisher) {
      return c.json({ error: 'Publisher non trouvé' }, 404);
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).then(rows => rows[0]);
    if (!targetUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    const md = makeAuthMetadata();
    
    if (action === 'add') {
      // Ajouter la relation
      const update = v1.RelationshipUpdate.create({
        operation: v1.RelationshipUpdate_Operation.CREATE,
        relationship: v1.Relationship.create({
          resource: v1.ObjectReference.create({ objectType: 'publisher', objectId: id }),
          relation: role,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({ objectType: 'user', objectId: targetUserId })
          })
        })
      });

      const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
      await spicedbClient.promises.writeRelationships(req, md);

      return c.json({
        message: `Utilisateur ${targetUser.name} ajouté en tant que ${role} du publisher`,
        user: targetUser,
        role,
        action: 'added'
      });
    } else {
      // Supprimer la relation
      const update = v1.RelationshipUpdate.create({
        operation: v1.RelationshipUpdate_Operation.DELETE,
        relationship: v1.Relationship.create({
          resource: v1.ObjectReference.create({ objectType: 'publisher', objectId: id }),
          relation: role,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({ objectType: 'user', objectId: targetUserId })
          })
        })
      });

      const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
      await spicedbClient.promises.writeRelationships(req, md);

      return c.json({
        message: `Utilisateur ${targetUser.name} retiré du rôle ${role} du publisher`,
        user: targetUser,
        role,
        action: 'removed'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la modification des relations utilisateur/publisher:', error);
    return c.json({ error: 'Erreur lors de la modification des relations' }, 500);
  }
});

// POST /admin/studios/:id/users - Modifier les relations utilisateur/studio
adminRoute.post('/studios/:id/users', async (c) => {
  const { id } = c.req.param() as { id: string };
  const { userId: targetUserId, role, action } = await c.req.json();

  if (!id || !targetUserId || !role || !action) {
    return c.json({ error: 'Studio ID, user ID, role, et action sont requis' }, 400);
  }

  if (!['admin', 'member'].includes(role)) {
    return c.json({ error: 'Rôle invalide. Valeurs acceptées: admin, member' }, 400);
  }

  if (!['add', 'remove'].includes(action)) {
    return c.json({ error: 'Action invalide. Valeurs acceptées: add, remove' }, 400);
  }

  try {
    // Vérifier que le studio existe
    const studio = await db.select().from(studios).where(eq(studios.id, id)).then(rows => rows[0]);
    if (!studio) {
      return c.json({ error: 'Studio non trouvé' }, 404);
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).then(rows => rows[0]);
    if (!targetUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    const md = makeAuthMetadata();
    
    if (action === 'add') {
      // Ajouter la relation
      const update = v1.RelationshipUpdate.create({
        operation: v1.RelationshipUpdate_Operation.CREATE,
        relationship: v1.Relationship.create({
          resource: v1.ObjectReference.create({ objectType: 'studio', objectId: id }),
          relation: role,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({ objectType: 'user', objectId: targetUserId })
          })
        })
      });

      const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
      await spicedbClient.promises.writeRelationships(req, md);

      return c.json({
        message: `Utilisateur ${targetUser.name} ajouté en tant que ${role} du studio`,
        user: targetUser,
        role,
        action: 'added'
      });
    } else {
      // Supprimer la relation
      const update = v1.RelationshipUpdate.create({
        operation: v1.RelationshipUpdate_Operation.DELETE,
        relationship: v1.Relationship.create({
          resource: v1.ObjectReference.create({ objectType: 'studio', objectId: id }),
          relation: role,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({ objectType: 'user', objectId: targetUserId })
          })
        })
      });

      const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
      await spicedbClient.promises.writeRelationships(req, md);

      return c.json({
        message: `Utilisateur ${targetUser.name} retiré du rôle ${role} du studio`,
        user: targetUser,
        role,
        action: 'removed'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la modification des relations utilisateur/studio:', error);
    return c.json({ error: 'Erreur lors de la modification des relations' }, 500);
  }
});

// POST /admin/games/:id/users - Modifier les relations utilisateur/game
adminRoute.post('/games/:id/users', async (c) => {
  const { id } = c.req.param() as { id: string };
  const { userId: targetUserId, role, action } = await c.req.json();

  if (!id || !targetUserId || !role || !action) {
    return c.json({ error: 'Game ID, user ID, role, et action sont requis' }, 400);
  }

  if (!['admin', 'member'].includes(role)) {
    return c.json({ error: 'Rôle invalide. Valeurs acceptées: admin, member' }, 400);
  }

  if (!['add', 'remove'].includes(action)) {
    return c.json({ error: 'Action invalide. Valeurs acceptées: add, remove' }, 400);
  }

  try {
    // Vérifier que le jeu existe
    const game = await db.select().from(games).where(eq(games.id, id)).then(rows => rows[0]);
    if (!game) {
      return c.json({ error: 'Jeu non trouvé' }, 404);
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).then(rows => rows[0]);
    if (!targetUser) {
      return c.json({ error: 'Utilisateur non trouvé' }, 404);
    }

    const md = makeAuthMetadata();
    
    if (action === 'add') {
      // Ajouter la relation
      const update = v1.RelationshipUpdate.create({
        operation: v1.RelationshipUpdate_Operation.CREATE,
        relationship: v1.Relationship.create({
          resource: v1.ObjectReference.create({ objectType: 'game', objectId: id }),
          relation: role,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({ objectType: 'user', objectId: targetUserId })
          })
        })
      });

      const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
      await spicedbClient.promises.writeRelationships(req, md);

      return c.json({
        message: `Utilisateur ${targetUser.name} ajouté en tant que ${role} du jeu`,
        user: targetUser,
        role,
        action: 'added'
      });
    } else {
      // Supprimer la relation
      const update = v1.RelationshipUpdate.create({
        operation: v1.RelationshipUpdate_Operation.DELETE,
        relationship: v1.Relationship.create({
          resource: v1.ObjectReference.create({ objectType: 'game', objectId: id }),
          relation: role,
          subject: v1.SubjectReference.create({
            object: v1.ObjectReference.create({ objectType: 'user', objectId: targetUserId })
          })
        })
      });

      const req = v1.WriteRelationshipsRequest.create({ updates: [update] });
      await spicedbClient.promises.writeRelationships(req, md);

      return c.json({
        message: `Utilisateur ${targetUser.name} retiré du rôle ${role} du jeu`,
        user: targetUser,
        role,
        action: 'removed'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la modification des relations utilisateur/game:', error);
    return c.json({ error: 'Erreur lors de la modification des relations' }, 500);
  }
});



// GET /admin/users - Lister tous les utilisateurs
adminRoute.get("/users", async (c) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    return c.json({ users: allUsers });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return c.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      500,
    );
  }
});

// GET /admin/users/:id/permissions - Lister les permissions d'un utilisateur
adminRoute.get("/users/:id/permissions", async (c) => {
  const { id } = c.req.param() as { id: string };

  if (!id) {
    return c.json({ error: "User ID is required" }, 400);
  }

  try {
    // Vérifier que l'utilisateur existe
    const [targetUser] = await db.select().from(users).where(eq(users.id, id));
    if (!targetUser) {
      return c.json({ error: "Utilisateur non trouvé" }, 404);
    }

    const md = makeAuthMetadata();
    const permissions: any[] = [];

    // UTILISATION CORRECTE DE LOOKUPRESOURCES - 3 REQUÊTES MAXIMUM
    // C'est la méthode conçue par SpiceDB pour la recherche d'accès à grande échelle

    // POUR L'INSTANT: Utiliser l'approche CheckPermission batch optimisée
    // LookupResources nécessite une configuration plus complexe du client

    // 1. Récupérer toutes les ressources
    const [allPublishers, allStudios, allGames] = await Promise.all([
      db.select().from(publishers),
      db.select().from(studios),
      db
        .select({
          id: games.id,
          name: games.name,
          studioId: games.studioId,
        })
        .from(games),
    ]);

    // 2. Vérifier les permissions en batch (plus performant que boucle simple)
    const permissionChecks = await Promise.all([
      // Publishers
      ...allPublishers.map(async (publisher) => {
        const hasPermission = await checkPermission(
          `user:${id}`,
          "admin",
          `publisher:${publisher.id}`,
        );
        return hasPermission
          ? {
              type: "publisher",
              id: publisher.id,
              role: "admin",
              resourceName: publisher.name || publisher.id,
            }
          : null;
      }),
      // Studios
      ...allStudios.map(async (studio) => {
        const hasPermission = await checkPermission(
          `user:${id}`,
          "admin",
          `studio:${studio.id}`,
        );
        return hasPermission
          ? {
              type: "studio",
              id: studio.id,
              role: "admin",
              resourceName: studio.name || studio.id,
            }
          : null;
      }),
      // Games
      ...allGames.map(async (game) => {
        const hasPermission = await checkPermission(
          `user:${id}`,
          "admin",
          `game:${game.id}`,
        );
        return hasPermission
          ? {
              type: "game",
              id: game.id,
              role: "admin",
              resourceName: game.name || game.id,
            }
          : null;
      }),
    ]);

    // 3. Filtrer les permissions valides
    permissions.push(...permissionChecks.filter(Boolean));

    return c.json({
      user: targetUser,
      permissions,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des permissions utilisateur:",
      error,
    );
    return c.json(
      { error: "Erreur lors de la récupération des permissions" },
      500,
    );
  }
});

export { adminRoute };
