import { Hono } from "hono";
import { db } from "../../db";
import { users, games, platforms, gameOnboardingRequests, gameOnboardingProgress } from "../../db/schema";
import { sql, eq } from "drizzle-orm";
import { getTemporalClient } from "../../lib/temporal";

const app = new Hono();

app.get("/stats", async (c) => {
  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [gameCount] = await db.select({ count: sql<number>`count(*)` }).from(games);
    const [platformCount] = await db.select({ count: sql<number>`count(*)` }).from(platforms);
    
    const [pendingActions] = await db.select({ count: sql<number>`count(*)` })
      .from(gameOnboardingRequests)
      .where(eq(gameOnboardingRequests.status, 'pending'));

    // Compte les jeux ayant un processus actif (soit un step running, soit une requête en attente)
    const [runningOnboardings] = await db.execute(sql`
      SELECT count(distinct game_id) as count FROM (
        SELECT game_id FROM game_onboarding_progress WHERE status = 'running'
        UNION
        SELECT game_id FROM game_onboarding_requests WHERE status = 'pending'
      ) as combined_running
    `);

    const [completedOnboardings] = await db.select({ count: sql<number>`count(distinct game_id)` })
      .from(gameOnboardingProgress)
      .where(eq(gameOnboardingProgress.status, 'completed'));

    // Check Temporal Status
    let temporalStatus = 'down';
    try {
      const temporal = await getTemporalClient();
      await temporal.workflowService.getSystemInfo({});
      temporalStatus = 'up';
    } catch(e) {
      console.warn("Temporal server unreachable");
    }

    return c.json({
      stats: {
        users: Number(userCount.count),
        games: Number(gameCount.count),
        platforms: Number(platformCount.count),
        pendingActions: Number(pendingActions.count),
        onboarding: {
          running: Number(runningOnboardings.count),
          completed: Number(completedOnboardings.count),
          total: Number(gameCount.count)
        }
      },
      services: {
        database: 'connected',
        temporal: temporalStatus
      }
    });
  } catch (error) {
    console.error("[DashboardRoute] Error fetching stats:", error);
    return c.json({ error: "Erreur lors de la récupération des statistiques" }, 500);
  }
});

export default app;
