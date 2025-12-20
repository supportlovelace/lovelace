import { Hono } from "hono";
import { db } from "../db";
import { tooltips, tooltipTranslations } from "../db/schema";
import { eq, and } from "drizzle-orm";

const app = new Hono();

// GET tooltips for an app, optionally filtered by page, for a specific locale
app.get("/:app", async (c) => {
  const appName = c.req.param("app");
  const page = c.req.query("page");
  const locale = c.req.query("locale") || "fr";

  try {
    let query = db
      .select({
        slug: tooltips.slug,
        color: tooltips.color,
        title: tooltipTranslations.title,
        content: tooltipTranslations.content,
      })
      .from(tooltips)
      .innerJoin(
        tooltipTranslations,
        and(
          eq(tooltips.id, tooltipTranslations.tooltipId),
          eq(tooltipTranslations.locale, locale)
        )
      )
      .where(eq(tooltips.app, appName));

    if (page) {
      // @ts-ignore
      query = query.where(eq(tooltips.page, page));
    }

    const results = await query;

    // Transform into a dictionary { [slug]: { title, content, color } }
    const dictionary = results.reduce((acc, curr) => {
      acc[curr.slug] = {
        title: curr.title,
        content: curr.content,
        color: curr.color,
      };
      return acc;
    }, {} as Record<string, any>);

    return c.json({ tooltips: dictionary });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des tooltips" }, 500);
  }
});

export default app;
