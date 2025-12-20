import { Hono } from "hono";
import { db } from "../../db";
import { users, games, platforms } from "../../db/schema";
import { sql } from "drizzle-orm";

const app = new Hono();

app.get("/stats", async (c) => {
  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [gameCount] = await db.select({ count: sql<number>`count(*)` }).from(games);
    const [platformCount] = await db.select({ count: sql<number>`count(*)` }).from(platforms);

    return c.json({
      stats: {
        users: Number(userCount.count),
        games: Number(gameCount.count),
        platforms: Number(platformCount.count),
      }
    });
  } catch (error) {
    console.error("[DashboardRoute] Error fetching stats:", error);
    return c.json({ error: "Erreur lors de la récupération des statistiques" }, 500);
  }
});

export default app;
