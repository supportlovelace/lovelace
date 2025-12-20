import { Hono } from "hono";
import { db } from "../../db";
import { onboardingSteps, gameOnboardingProgress, gamePlatforms, platforms } from "../../db/schema";
import { eq, and, inArray, or, isNull } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Config S3 (MinIO sur le VPS)
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || "lovelace-imports";

const app = new Hono();

// LIST GLOBAL STEPS (platform is NULL)
app.get("/global", async (c) => {
  try {
    const steps = await db
      .select()
      .from(onboardingSteps)
      .where(isNull(onboardingSteps.platform))
      .orderBy(onboardingSteps.order);
    
    return c.json({ steps });
  } catch (error) {
    return c.json({ error: "Erreur lors de la récupération des étapes globales" }, 500);
  }
});

// UPSERT GLOBAL STEP
app.post("/global", async (c) => {
  const body = await c.req.json();
  try {
    const stepData = { ...body, platform: null };
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
    return c.json({ error: "Erreur lors de la sauvegarde" }, 500);
  }
});

// GET Onboarding status for a game
app.get("/:gameId", async (c) => {
  const { gameId } = c.req.param();

  try {
    const activePlatforms = await db
      .select({ slug: platforms.slug })
      .from(gamePlatforms)
      .innerJoin(platforms, eq(gamePlatforms.platformId, platforms.id))
      .where(eq(gamePlatforms.gameId, gameId));
    
    const activePlatformSlugs = activePlatforms.map(p => p.slug);
    const conditions = [isNull(onboardingSteps.platform)];
    if (activePlatformSlugs.length > 0) {
      conditions.push(inArray(onboardingSteps.platform, activePlatformSlugs));
    }

    const catalogSteps = await db
      .select({
        step: onboardingSteps,
        platformName: platforms.name,
        platformColor: platforms.color,
      })
      .from(onboardingSteps)
      .leftJoin(platforms, eq(onboardingSteps.platform, platforms.slug))
      .where(or(...conditions))
      .orderBy(onboardingSteps.order);

    const progress = await db
      .select()
      .from(gameOnboardingProgress)
      .where(eq(gameOnboardingProgress.gameId, gameId));

    const stepsWithStatus = catalogSteps.map(({ step, platformName, platformColor }) => {
      const stepProgress = progress.find(p => p.stepSlug === step.slug);
      let isLocked = false;
      if (step.dependsOn && step.dependsOn.length > 0) {
        isLocked = step.dependsOn.some(depSlug => {
          const depProgress = progress.find(p => p.stepSlug === depSlug);
          return depProgress?.status !== 'completed';
        });
      }

      return {
        ...step,
        platformName,
        platformColor,
        status: stepProgress?.status || 'pending',
        isLocked,
        lastRunAt: stepProgress?.lastRunAt || null,
        result: stepProgress?.result || {}
      };
    });

    return c.json({ onboarding: stepsWithStatus });
  } catch (error) {
    console.error("[OnboardingRoute] Error:", error);
    return c.json({ error: "Erreur lors de la récupération de l'onboarding" }, 500);
  }
});

// PARSE CSV HEADERS
app.post("/parse-csv", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"] as File;
    if (!file) return c.json({ error: "Fichier manquant" }, 400);

    const text = await file.text();
    const firstLine = text.split("\n")[0].trim();
    const delimiter = firstLine.includes(";") ? ";" : ",";
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));

    return c.json({ headers });
  } catch (error) {
    return c.json({ error: "Erreur lors du parsing du CSV" }, 500);
  }
});

// POST Trigger a step
app.post("/:gameId/:slug/trigger", async (c) => {
  const { gameId, slug } = c.req.param();
  
  try {
    const contentType = c.req.header("content-type");
    let file: File | null = null;
    let mapping: any = null;
    let targetTable: string | null = null;

    if (contentType?.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      file = body["file"] as File;
      mapping = typeof body["mapping"] === "string" ? JSON.parse(body["mapping"]) : null;
      targetTable = body["targetTable"] as string;
    } else {
      const body = await c.req.json();
      mapping = body.mapping;
      targetTable = body.targetTable;
    }

    const [step] = await db.select().from(onboardingSteps).where(eq(onboardingSteps.slug, slug));
    if (!step) return c.json({ error: "Étape non trouvée" }, 404);

    let s3Key = null;

    // 1. Upload vers S3 si fichier présent
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      s3Key = `onboarding/${gameId}/${slug}/${Date.now()}-${file.name}`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: "text/csv",
      }));
    }

    // 2. Mettre à jour le statut en 'running'
    await db.insert(gameOnboardingProgress).values({
      gameId,
      stepSlug: slug,
      status: 'running',
      lastRunAt: new Date(),
      result: { s3Key, targetTable, mapping }
    }).onConflictDoUpdate({
      target: [gameOnboardingProgress.gameId, gameOnboardingProgress.stepSlug],
      set: { status: 'running', lastRunAt: new Date(), result: { s3Key, targetTable, mapping } }
    });

    // 3. Ajouter le job dans la file d'attente (BullMQ)
    // C'est asynchrone, robuste et ne bloque pas l'API.
    const { importQueue } = await import("../../lib/queue");
    
    // On nettoie le mapping pour éviter les soucis de sérialisation
    const safeMapping: Record<string, string> = {};
    if (mapping && typeof mapping === 'object') {
       Object.assign(safeMapping, mapping);
    }

    const job = await importQueue.add('csv-import', {
      gameId,
      stepSlug: slug,
      targetTable: targetTable || 'unknown_table',
      s3Key: s3Key || '',
      mapping: safeMapping
    });

    console.log(`📥 [API] Job d'import ajouté à la file: ${job.id}`);

    return c.json({ 
      message: "Importation en file d'attente", 
      status: 'running', 
      jobId: job.id 
    });

  } catch (error) {
    console.error("[OnboardingTrigger] Error:", error);
    return c.json({ error: "Erreur lors du lancement" }, 500);
  }
});

// POST Mark a step as completed (called by Worker or External)

// POST Mark a step as completed (called by Kestra)
app.post("/:gameId/:slug/complete", async (c) => {
  const { gameId, slug } = c.req.param();
  const { status, result } = await c.req.json();

  try {
    await db.update(gameOnboardingProgress)
      .set({ 
        status: status || 'completed', 
        result: result || {},
        updatedAt: new Date() 
      })
      .where(and(
        eq(gameOnboardingProgress.gameId, gameId),
        eq(gameOnboardingProgress.stepSlug, slug)
      ));

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erreur lors de la mise à jour" }, 500);
  }
});

// POST Generic Form Submit
app.post("/:gameId/:slug/submit-form", async (c) => {
  const { gameId, slug } = c.req.param();
  const formData = await c.req.json();

  try {
    const [step] = await db.select().from(onboardingSteps).where(eq(onboardingSteps.slug, slug));
    if (!step) return c.json({ error: "Étape non trouvée" }, 404);
    if (step.executorType !== 'form') return c.json({ error: "Cette étape n'est pas un formulaire" }, 400);

    const config = step.executorConfig as any;
    const targetTable = config.targetTable || 'games';

    // 1. Mise à jour de l'entité cible (pour l'instant on supporte 'games')
    if (targetTable === 'games') {
      const [game] = await db.select().from(games).where(eq(games.id, gameId));
      if (!game) return c.json({ error: "Jeu non trouvé" }, 404);

      // Merge JSONB metadata
      const newMetadata = { ...(game.metadata as object || {}), ...formData };
      
      await db.update(games)
        .set({ metadata: newMetadata, updatedAt: new Date() })
        .where(eq(games.id, gameId));
    } else {
      return c.json({ error: `Table cible '${targetTable}' non supportée pour le moment` }, 400);
    }

    // 2. Marquer l'onboarding comme complété
    await db.insert(gameOnboardingProgress).values({
      gameId,
      stepSlug: slug,
      status: 'completed',
      lastRunAt: new Date(),
      result: { submittedData: formData }
    }).onConflictDoUpdate({
      target: [gameOnboardingProgress.gameId, gameOnboardingProgress.stepSlug],
      set: { status: 'completed', lastRunAt: new Date(), result: { submittedData: formData } }
    });

    return c.json({ success: true, message: "Données enregistrées" });
  } catch (error: any) {
    console.error("[OnboardingFormSubmit] Error:", error);
    return c.json({ error: "Erreur lors de la sauvegarde du formulaire" }, 500);
  }
});

export default app;