import { Hono } from "hono";
import { db } from "../../db";
import { userOnboarding } from "../../db/schema";
import { eq, and } from "drizzle-orm";

const app = new Hono();

// GET completed steps for the current user
app.get("/completed", async (c) => {
  const userId = c.get("userId");
  if (!userId) return c.json({ error: "Non authentifié" }, 401);

  try {
    const completed = await db
      .select({ stepSlug: userOnboarding.stepSlug })
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, userId));

    return c.json({ completed: completed.map(c => c.stepSlug) });
  } catch (error) {
    return c.json({ error: "Erreur serveur" }, 500);
  }
});

// POST mark a step as completed
app.post("/complete", async (c) => {
  const userId = c.get("userId");
  const { stepSlug } = await c.req.json();

  if (!userId) return c.json({ error: "Non authentifié" }, 401);
  if (!stepSlug) return c.json({ error: "Slug manquant" }, 400);

  try {
    await db.insert(userOnboarding).values({
      userId,
      stepSlug,
    }).onConflictDoNothing(); // Si déjà fait, on ignore

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erreur lors de l'enregistrement" }, 500);
  }
});

export default app;
