import { Hono } from "hono";
import { db } from "../../db";
import { gamePlatforms, games, platforms } from "../../db/schema";
import { eq, and } from "drizzle-orm";

const app = new Hono();

const DISCORD_API_URL = "https://discord.com/api/v10";

app.get("/guilds", async (c) => {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    return c.json({ error: "DISCORD_BOT_TOKEN non configuré" }, 500);
  }

  try {
    // 1. Récupérer la liste des serveurs (guilds) depuis Discord
    const discordRes = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!discordRes.ok) {
      return c.json({ error: "Impossible de récupérer les serveurs Discord" }, discordRes.status);
    }

    const guilds = await discordRes.json();

    // 2. Récupérer les liaisons existantes dans notre base de données
    // On cherche les integrations Discord (slug 'discord')
    const linkedGuilds = await db
      .select({
        guildId: gamePlatforms.config, // Contient { guildId: "..." }
        gameName: games.name,
        gameId: games.id
      })
      .from(gamePlatforms)
      .innerJoin(games, eq(gamePlatforms.gameId, games.id))
      .innerJoin(platforms, eq(gamePlatforms.platformId, platforms.id))
      .where(eq(platforms.slug, 'discord'));

    // 3. Mapper les infos du jeu sur les guilds Discord
    const enrichedGuilds = guilds.map((guild: any) => {
      const link = linkedGuilds.find((lg: any) => {
        const config = lg.guildId as any;
        return config && typeof config === 'object' && config.guildId === guild.id;
      });
      return {
        ...guild,
        game: link ? { id: link.gameId, name: link.gameName } : null
      };
    });

    return c.json({ guilds: enrichedGuilds });
  } catch (error) {
    console.error("[DiscordRoute] Error:", error);
    return c.json({ error: "Erreur interne" }, 500);
  }
});

app.get("/guilds/:id", async (c) => {
  const { id } = c.req.param();
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) return c.json({ error: "Token non configuré" }, 500);

  try {
    // On demande avec with_counts=true pour avoir les stats de membres
    const response = await fetch(`${DISCORD_API_URL}/guilds/${id}?with_counts=true`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!response.ok) return c.json({ error: "Serveur introuvable" }, 404);

    const guild = await response.json();
    return c.json({ guild });
  } catch (error) {
    return c.json({ error: "Erreur interne" }, 500);
  }
});

export default app;
