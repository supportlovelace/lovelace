import { Hono } from "hono";
import { db } from "../../db";
import { platforms, onboardingSteps } from "../../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

// LIST ALL
app.get("/", async (c) => {
  try {
    const allPlatforms = await db.select().from(platforms).orderBy(platforms.name);
    return c.json({ platforms: allPlatforms });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des plateformes" }, 500);
  }
});

// CREATE
app.post("/", async (c) => {
  const { name, slug, logoAssetId, hasChannel, isActive, color, configSchema } = await c.req.json();

  if (!name || !slug) return c.json({ error: "Nom et slug requis" }, 400);

  try {
    const [newPlatform] = await db
      .insert(platforms)
      .values({
        name,
        slug,
        logoAssetId: logoAssetId || null,
        hasChannel: hasChannel ?? false,
        isActive: isActive !== false,
        configSchema: configSchema || [],
        color,
      })
      .returning();

    return c.json({ message: "Plateforme créée", platform: newPlatform }, 201);
  } catch (error) {
    return c.json({ error: "Erreur lors de la création de la plateforme" }, 500);
  }
});

// READ ONE
app.get("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    if (!platform) return c.json({ error: "Plateforme non trouvée" }, 404);
    return c.json({ platform });
  } catch (error) {
    return c.json({ error: "Erreur" }, 500);
  }
});

// LIST ONBOARDING STEPS FOR A PLATFORM
app.get("/:id/onboarding-steps", async (c) => {
  const { id } = c.req.param();
  try {
    const platformData = await db.select().from(platforms).where(eq(platforms.id, id));
    if (platformData.length === 0) return c.json({ error: "Plateforme non trouvée" }, 404);
    
    const steps = await db
      .select()
      .from(onboardingSteps)
      .where(eq(onboardingSteps.platform, platformData[0].slug))
      .orderBy(onboardingSteps.order);
    
    return c.json({ steps });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des étapes" }, 500);
  }
});

// UPSERT ONBOARDING STEP
app.post("/:id/onboarding-steps", async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();

  try {
    const [platformData] = await db.select().from(platforms).where(eq(platforms.id, id));
    if (!platformData) return c.json({ error: "Plateforme non trouvée" }, 404);

    const stepData = {
      ...body,
      platform: platformData.slug,
    };

    const [newStep] = await db
      .insert(onboardingSteps)
      .values(stepData)
      .onConflictDoUpdate({
        target: onboardingSteps.slug,
        set: stepData,
      })
      .returning();

    return c.json({ step: newStep });
  } catch (error) {
    console.error("[PlatformsRoute] Error upserting step:", error);
    return c.json({ error: "Erreur lors de la sauvegarde de l'étape" }, 500);
  }
});

// DELETE ONBOARDING STEP
app.delete("/onboarding-steps/:slug", async (c) => {
  const { slug } = c.req.param();
  try {
    await db.delete(onboardingSteps).where(eq(onboardingSteps.slug, slug));
    return c.json({ message: "Étape supprimée" });
  } catch (error) {
    return c.json({ error: "Erreur lors de la suppression" }, 500);
  }
});

// UPDATE PLATFORM
app.put("/:id", async (c) => {
  const { id } = c.req.param();
  const { name, slug, logoAssetId, hasChannel, isActive, color, configSchema } = await c.req.json();

  try {
    const [updated] = await db
      .update(platforms)
      .set({
        name,
        slug,
        logoAssetId,
        hasChannel,
        isActive,
        color,
        configSchema: configSchema || [],
        updatedAt: new Date(),
      })
      .where(eq(platforms.id, id))
      .returning();

    if (!updated) return c.json({ error: "Plateforme non trouvée" }, 404);
    return c.json({ platform: updated });
  } catch (error) {
    return c.json({ error: "Erreur lors de la mise à jour" }, 500);
  }
});

// DELETE PLATFORM
app.delete("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [deleted] = await db.delete(platforms).where(eq(platforms.id, id)).returning();
    if (!deleted) return c.json({ error: "Plateforme non trouvée" }, 404);
    return c.json({ message: "Plateforme supprimée", id });
  } catch (error) {
    return c.json({ error: "Erreur lors de la suppression" }, 500);
  }
});

export default app;
