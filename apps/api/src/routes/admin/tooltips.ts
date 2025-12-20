import { Hono } from "hono";
import { db } from "../../db";
import { tooltips, tooltipTranslations } from "../../db/schema";
import { eq, and } from "drizzle-orm";

const app = new Hono();

// LIST ALL (with translations for a specific locale if provided, or just the base)
app.get("/", async (c) => {
  const locale = c.req.query("locale") || "fr";
  try {
    const allTooltips = await db
      .select({
        id: tooltips.id,
        slug: tooltips.slug,
        app: tooltips.app,
        page: tooltips.page,
        color: tooltips.color,
        title: tooltipTranslations.title,
        content: tooltipTranslations.content,
        locale: tooltipTranslations.locale,
      })
      .from(tooltips)
      .leftJoin(
        tooltipTranslations,
        and(
          eq(tooltips.id, tooltipTranslations.tooltipId),
          eq(tooltipTranslations.locale, locale)
        )
      )
      .orderBy(tooltips.app, tooltips.page, tooltips.slug);

    return c.json({ tooltips: allTooltips });
  } catch (error) {
    console.error("[TooltipsRoute] Error fetching tooltips:", error);
    return c.json({ error: "Erreur lors de la récupération des tooltips" }, 500);
  }
});

// GET ONE (with all its translations)
app.get("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [tooltip] = await db.select().from(tooltips).where(eq(tooltips.id, id));
    if (!tooltip) return c.json({ error: "Tooltip non trouvé" }, 404);

    const translations = await db
      .select()
      .from(tooltipTranslations)
      .where(eq(tooltipTranslations.tooltipId, id));

    return c.json({ tooltip, translations });
  } catch (error) {
    return c.json({ error: "Erreur" }, 500);
  }
});

// CREATE / UPDATE BASE
app.post("/", async (c) => {
  const { slug, app: appName, page, color } = await c.req.json();
  if (!slug || !appName || !page) return c.json({ error: "Slug, app et page requis" }, 400);

  try {
    const [newTooltip] = await db
      .insert(tooltips)
      .values({ slug, app: appName, page, color: color || 'violet' })
      .returning();

    return c.json({ tooltip: newTooltip }, 201);
  } catch (error) {
    return c.json({ error: "Erreur (slug peut-être déjà utilisé)" }, 500);
  }
});

app.put("/:id", async (c) => {
  const { id } = c.req.param();
  const { slug, app: appName, page, color } = await c.req.json();

  try {
    const [updated] = await db
      .update(tooltips)
      .set({ slug, app: appName, page, color, updatedAt: new Date() })
      .where(eq(tooltips.id, id))
      .returning();

    if (!updated) return c.json({ error: "Tooltip non trouvé" }, 404);
    return c.json({ tooltip: updated });
  } catch (error) {
    return c.json({ error: "Erreur" }, 500);
  }
});

// UPSERT TRANSLATION
app.post("/:id/translations", async (c) => {
  const { id } = c.req.param();
  const { locale, title, content } = await c.req.json();

  if (!locale || !title || !content) return c.json({ error: "Champs requis" }, 400);

  try {
    // Check if exists
    const [existing] = await db
      .select()
      .from(tooltipTranslations)
      .where(
        and(
          eq(tooltipTranslations.tooltipId, id),
          eq(tooltipTranslations.locale, locale)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(tooltipTranslations)
        .set({ title, content, updatedAt: new Date() })
        .where(eq(tooltipTranslations.id, existing.id))
        .returning();
      return c.json({ translation: updated });
    } else {
      const [inserted] = await db
        .insert(tooltipTranslations)
        .values({ tooltipId: id, locale, title, content })
        .returning();
      return c.json({ translation: inserted }, 201);
    }
  } catch (error) {
    return c.json({ error: "Erreur lors de la sauvegarde de la traduction" }, 500);
  }
});

// DELETE
app.delete("/:id", async (c) => {
  const { id } = c.req.param();
  try {
    const [deleted] = await db.delete(tooltips).where(eq(tooltips.id, id)).returning();
    if (!deleted) return c.json({ error: "Tooltip non trouvé" }, 404);
    return c.json({ message: "Tooltip supprimé" });
  } catch (error) {
    return c.json({ error: "Erreur" }, 500);
  }
});

export default app;
