import { Hono } from "hono";
import { db } from "../../db";
import { users, publishers, studios, games } from "../../db/schema";
import { eq } from "drizzle-orm";
import { v1 } from "@authzed/authzed-node";
import { checkPermission, spicedbClient } from "../../authz/client";
import { makeAuthMetadata } from "./utils";

const app = new Hono();

// LIST
app.get("/", async (c) => {
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
    return c.json({ error: "Erreur lors de la récupération des utilisateurs" }, 500);
  }
});

// CREATE
app.post("/", async (c) => {
  const { email, name } = await c.req.json();

  if (!email || !name) return c.json({ error: "Email et nom requis" }, 400);

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) return c.json({ error: "Email déjà utilisé" }, 409);

    const [newUser] = await db.insert(users).values({ email, name }).returning();
    return c.json({ message: "Utilisateur créé", user: newUser }, 201);
  } catch (error) {
    return c.json({ error: "Erreur lors de la création" }, 500);
  }
});

// GET PERMISSIONS
app.get("/:id/permissions", async (c) => {
  const { id } = c.req.param();
  try {
    const [targetUser] = await db.select().from(users).where(eq(users.id, id));
    if (!targetUser) return c.json({ error: "Utilisateur non trouvé" }, 404);

    const md = makeAuthMetadata();

    // 1. Vérifier si c'est un Super Admin Global
    const isSuperAdmin = await checkPermission(`user:${id}`, "global_access", "lovelace_system:lovelace");

    const allGames = await db.select({ id: games.id, name: games.name, studioId: games.studioId }).from(games);

    const permissionChecks = await Promise.all(
      allGames.map(async (g) => {
        const has = await checkPermission(`user:${id}`, "manage", `game:${g.id}`);
        return has ? { type: "game", id: g.id, role: isSuperAdmin ? "super-admin" : "admin", resourceName: g.name } : null;
      })
    );

    return c.json({
      user: targetUser,
      isSuperAdmin,
      permissions: permissionChecks.filter(Boolean),
    });
  } catch (error) {
    console.error("[UsersRoute] Error fetching permissions:", error);
    return c.json({ error: "Erreur lors de la récupération des permissions" }, 500);
  }
});

export default app;
