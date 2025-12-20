import { Hono } from "hono";
import { processAndUploadAsset } from "../../lib/assets";

const app = new Hono();

app.post("/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];
    const type = body["type"] as "game_logo" | "platform_logo" | "avatar";
    const altText = body["altText"] as string | undefined;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "Fichier manquant ou invalide" }, 400);
    }

    if (!type) {
      return c.json({ error: "Type d'asset requis" }, 400);
    }

    // Convertir File en Buffer pour notre service
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const assetId = await processAndUploadAsset(buffer, type, altText);

    return c.json({ 
      message: "Asset uploadé avec succès", 
      assetId 
    }, 201);
  } catch (error) {
    console.error("[AssetsRoute] Erreur upload:", error);
    return c.json({ error: "Erreur lors de l'upload de l'asset" }, 500);
  }
});

export default app;
