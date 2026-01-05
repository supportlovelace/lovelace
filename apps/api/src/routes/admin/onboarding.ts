import { Hono } from "hono";
import { db } from "../../db";
import { onboardingSteps, gameOnboardingProgress, gamePlatforms, platforms, gameOnboardingRequests, games } from "../../db/schema";
import { eq, and, inArray, or, isNull, sql } from "drizzle-orm";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getTemporalClient } from "../../lib/temporal";
import { clickhouse } from "../../lib/clickhouse";

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

// --- CATALOGUE CONFIGURATION ---

// LIST GLOBAL STEPS
app.get("/global", async (c) => {
  try {
    const steps = await db
      .select()
      .from(onboardingSteps)
      .where(isNull(onboardingSteps.platform))
      .orderBy(onboardingSteps.order);
    
    return c.json({ steps });
  } catch (error) {
    return c.json({ error: "Erreur récupération étapes" }, 500);
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
    return c.json({ error: "Erreur sauvegarde" }, 500);
  }
});

// KESTRA CALLBACK (Webhook)
app.post("/kestra/callback", async (c) => {
  const body = await c.req.json();
  const { temporalWorkflowId, status, result } = body;

  if (!temporalWorkflowId) {
    return c.json({ error: "Missing temporalWorkflowId" }, 400);
  }

  try {
    const temporal = await getTemporalClient();
    const handle = temporal.workflow.getHandle(temporalWorkflowId);
    
    // On signale le workflow Temporal que Kestra a fini (Signal UNIFIÉ)
    await handle.signal('onboarding_input_received', { status, result });

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Kestra Callback Error:", error);
    return c.json({ error: `Erreur signal: ${error.message}` }, 500);
  }
});

// --- WORKFLOW ORCHESTRATION (TEMPORAL) ---

// START Onboarding
app.post("/:gameId/start", async (c) => {
  const { gameId } = c.req.param();
  try {
    const [game] = await db.select({ name: games.name }).from(games).where(eq(games.id, gameId));
    if (!game) return c.json({ error: "Jeu non trouvé" }, 404);

    const gameSlug = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const workflowId = `onboarding-${gameSlug}-${gameId}`;
    
    const temporal = await getTemporalClient();
    
    const handle = await temporal.workflow.start('MainOnboardingWorkflow', {
      taskQueue: 'lovelace-core',
      workflowId,
      args: [gameId],
    });

    return c.json({ success: true, workflowId: handle.workflowId });
  } catch (error: any) {
    if (error.constructor.name === 'WorkflowExecutionAlreadyStartedError') {
      return c.json({ error: "Onboarding déjà en cours" }, 409);
    }
    return c.json({ error: "Erreur lancement workflow" }, 500);
  }
});

// CANCEL Onboarding
app.post("/:gameId/cancel", async (c) => {
  const { gameId } = c.req.param();
  try {
    const [game] = await db.select({ name: games.name }).from(games).where(eq(games.id, gameId));
    if (!game) return c.json({ error: "Jeu non trouvé" }, 404);
    
    const gameSlug = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const realWorkflowId = `onboarding-${gameSlug}-${gameId}`;

    const temporal = await getTemporalClient();

    try {
      const handle = temporal.workflow.getHandle(realWorkflowId);
      await handle.terminate('Admin triggered cancellation');
    } catch (e) {
      console.warn("Workflow not found on Temporal, continuing cleanup anyway");
    }

    // 2. Nettoyer les steps en base (ceux qui ne sont pas 'completed')
    await db.update(gameOnboardingProgress)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(
        eq(gameOnboardingProgress.gameId, gameId),
        or(eq(gameOnboardingProgress.status, 'running'), eq(gameOnboardingProgress.status, 'pending'))
      ));

    // 3. Nettoyer les requêtes en attente
    await db.update(gameOnboardingRequests)
      .set({ status: 'cancelled', completedAt: new Date() })
      .where(and(
        eq(gameOnboardingRequests.gameId, gameId),
        eq(gameOnboardingRequests.status, 'pending')
      ));

    return c.json({ success: true });
  } catch (error) {
    console.error("Cancel Onboarding Error:", error);
    return c.json({ error: "Erreur lors de l'annulation" }, 500);
  }
});

// INTERNAL: Create Request (Called by Worker)
app.post("/requests/create", async (c) => {
  const body = await c.req.json();
  try {
    const [req] = await db.insert(gameOnboardingRequests).values({
      gameId: body.gameId,
      stepSlug: body.stepSlug,
      workflowId: body.workflowId,
      type: body.type,
      config: body.config,
      status: 'pending'
    }).returning();
    
    try {
        const { io } = await import("../../index");
        io.to(`game:${body.gameId}`).emit('onboarding_request', req);
    } catch(e) {}

    return c.json({ request: req });
  } catch (error) {
    return c.json({ error: "Erreur création demande" }, 500);
  }
});

// GET All Pending Requests (Global)
app.get("/requests/pending", async (c) => {
  try {
    const requests = await db.select({
        id: gameOnboardingRequests.id,
        gameId: gameOnboardingRequests.gameId,
        gameName: games.name,
        type: gameOnboardingRequests.type,
        stepSlug: gameOnboardingRequests.stepSlug,
    })
    .from(gameOnboardingRequests)
    .innerJoin(games, eq(gameOnboardingRequests.gameId, games.id))
    .where(eq(gameOnboardingRequests.status, 'pending'));
    
    return c.json({ requests });
  } catch (error) {
    return c.json({ error: "Erreur récupération demandes" }, 500);
  }
});

// GET Pending Requests for a Game
app.get("/:gameId/requests", async (c) => {
  const { gameId } = c.req.param();
  try {
    const requests = await db.select().from(gameOnboardingRequests)
      .where(and(eq(gameOnboardingRequests.gameId, gameId), eq(gameOnboardingRequests.status, 'pending')));
    return c.json({ requests });
  } catch (error) {
    return c.json({ error: "Erreur" }, 500);
  }
});

// SUBMIT Request (Signal Temporal)
app.post("/requests/:requestId/submit", async (c) => {
  const { requestId } = c.req.param();
  const body = await c.req.json();
  try {
    const [req] = await db.select().from(gameOnboardingRequests).where(eq(gameOnboardingRequests.id, requestId));
    if (!req) return c.json({ error: "Request not found" }, 404);

    await db.update(gameOnboardingRequests)
      .set({ status: 'completed', result: body.result, completedAt: new Date() })
      .where(eq(gameOnboardingRequests.id, requestId));

    const temporal = await getTemporalClient();
    const handle = temporal.workflow.getHandle(req.workflowId);
    await handle.signal('onboarding_input_received', body.result);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: `Erreur signal: ${error.message}` }, 500);
  }
});

// --- DATA ACTIONS ---

// UPLOAD to S3
app.post("/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"] as File;
    const gameId = body["gameId"] as string;
    if (!file || !gameId) return c.json({ error: "Paramètres manquants" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = `onboarding/${gameId}/${Date.now()}-${file.name}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    }));

    return c.json({ s3Key });
  } catch (error) {
    return c.json({ error: "Erreur upload" }, 500);
  }
});

// PARSE CSV
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
    return c.json({ error: "Erreur parsing" }, 500);
  }
});

// INTROSPECT CSV (via ClickHouse)
app.post("/introspect-csv", async (c) => {
  const { s3Key } = await c.req.json();
  if (!s3Key) return c.json({ error: "Missing s3Key" }, 400);

  const S3_ACCESS = process.env.S3_ACCESS_KEY;
  const S3_SECRET = process.env.S3_SECRET_KEY;
  const S3_URL = `http://lovelace-s3:9000/${BUCKET}/${s3Key}`;

  try {
    // 1. Détection automatique du séparateur (S3 Partial Fetch)
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Range: "bytes=0-1024" 
    });
    const s3Res = await s3Client.send(getCommand);
    const chunk = await s3Res.Body?.transformToString() || "";
    
    const firstLine = chunk.split("\n")[0];
    const semiCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = semiCount > commaCount ? ';' : ',';
    
    console.log(`🔍 [Introspect] Detected delimiter: '${delimiter}'`);

    // 2. Requête ClickHouse
    const query = `DESCRIBE s3('${S3_URL}', '${S3_ACCESS}', '${S3_SECRET}', 'CSVWithNames') 
                   SETTINGS format_csv_delimiter = '${delimiter}'`;
    
    const resultSet = await clickhouse.query({
      query,
      format: 'JSONEachRow',
    });

    const headers = (await resultSet.json()).map((col: any) => col.name);

    return c.json({ headers });
  } catch (error: any) {
    console.error("ClickHouse Introspection Error:", error);
    return c.json({ error: "Erreur analyse ClickHouse", details: error.message }, 500);
  }
});

// CONFIG UPDATE
app.post("/config-update", async (c) => {
  const body = await c.req.json();
  const { gameId, platformSlug, config, updates } = body;

  try {
    const processUpdate = async (slug: string, cfg: any) => {
      const [integration] = await db.select({ id: gamePlatforms.id, config: gamePlatforms.config })
        .from(gamePlatforms)
        .innerJoin(platforms, eq(gamePlatforms.platformId, platforms.id))
        .where(and(eq(gamePlatforms.gameId, gameId), eq(platforms.slug, slug)));

      if (!integration) return;

      const newConfig = { ...(integration.config as object || {}), ...cfg };
      await db.update(gamePlatforms)
        .set({ config: newConfig, updatedAt: new Date() })
        .where(eq(gamePlatforms.id, integration.id));
    };

    if (updates && Array.isArray(updates)) {
      for (const update of updates) {
        await processUpdate(update.platformSlug, update.config);
      }
    } else if (platformSlug && config) {
      await processUpdate(platformSlug, config);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Config Update Error:", error);
    return c.json({ error: "Erreur config" }, 500);
  }
});

// PROGRESS Update
app.post("/:gameId/:slug/progress", async (c) => {
  const { gameId, slug } = c.req.param();
  const { totalItems, processedIncrement, failedIncrement, workflowId } = await c.req.json();

  try {
    const [progress] = await db.update(gameOnboardingProgress)
      .set({
        totalItems: totalItems !== undefined ? totalItems : undefined,
        processedItems: sql`${gameOnboardingProgress.processedItems} + ${processedIncrement || 0}`,
        failedItems: sql`${gameOnboardingProgress.failedItems} + ${failedIncrement || 0}`,
        status: 'running',
        updatedAt: new Date()
      })
      .where(and(eq(gameOnboardingProgress.gameId, gameId), eq(gameOnboardingProgress.stepSlug, slug)))
      .returning();

    if (!progress) return c.json({ error: "Progress not found" }, 404);

    // Vérifier si c'est fini
    if (progress.totalItems && (progress.processedItems + progress.failedItems >= progress.totalItems)) {
      // Marquer comme complété
      await db.update(gameOnboardingProgress)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(and(eq(gameOnboardingProgress.gameId, gameId), eq(gameOnboardingProgress.stepSlug, slug)));

      // Signaler Temporal
      if (workflowId) {
        const temporal = await getTemporalClient();
        const handle = temporal.workflow.getHandle(workflowId);
        await handle.signal('onboarding_input_received', { 
          status: 'SUCCESS', 
          result: { completed: true, processed: progress.processedItems } 
        });
      }
    }

    return c.json({ success: true, current: progress.processedItems, total: progress.totalItems });
  } catch (error) {
    console.error("Progress Update Error:", error);
    return c.json({ error: "Erreur mise à jour progression" }, 500);
  }
});

// COMPLETE Step
app.post("/:gameId/:slug/complete", async (c) => {
  const { gameId, slug } = c.req.param();
  const { status, result } = await c.req.json();
  try {
    await db.insert(gameOnboardingProgress)
      .values({ gameId, stepSlug: slug, status: status || 'completed', result: result || {}, lastRunAt: new Date(), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [gameOnboardingProgress.gameId, gameOnboardingProgress.stepSlug],
        set: { status: status || 'completed', result: result || {}, updatedAt: new Date(), lastRunAt: new Date() }
      });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erreur statut" }, 500);
  }
});

// GET Progress
app.get("/:gameId", async (c) => {
  const { gameId } = c.req.param();
  try {
    const activePlatforms = await db.select({ slug: platforms.slug }).from(gamePlatforms)
      .innerJoin(platforms, eq(gamePlatforms.platformId, platforms.id))
      .where(eq(gamePlatforms.gameId, gameId));
    
    const activePlatformSlugs = activePlatforms.map(p => p.slug);
    
    const gameConfigs = await db.select({ slug: platforms.slug, config: gamePlatforms.config, configSchema: platforms.configSchema })
      .from(gamePlatforms)
      .innerJoin(platforms, eq(gamePlatforms.platformId, platforms.id))
      .where(eq(gamePlatforms.gameId, gameId));

    const conditions = [isNull(onboardingSteps.platform)];
    if (activePlatformSlugs.length > 0) conditions.push(inArray(onboardingSteps.platform, activePlatformSlugs));

    const catalogSteps = await db.select({ 
      step: onboardingSteps, 
      platformName: platforms.name, 
      platformColor: platforms.color,
      platformLogoAssetId: platforms.logoAssetId 
    })
      .from(onboardingSteps)
      .leftJoin(platforms, eq(onboardingSteps.platform, platforms.slug))
      .where(or(...conditions)).orderBy(onboardingSteps.order);

    const progress = await db.select().from(gameOnboardingProgress).where(eq(gameOnboardingProgress.gameId, gameId));

    const stepsWithStatus = catalogSteps.map(({ step, platformName, platformColor, platformLogoAssetId }) => {
      const stepProgress = progress.find(p => p.stepSlug === step.slug);
      return { 
        ...step, 
        platformName, 
        platformColor, 
        platformLogoAssetId,
        status: stepProgress?.status || 'pending', 
        lastRunAt: stepProgress?.lastRunAt || null, 
        updatedAt: stepProgress?.updatedAt || null,
        result: stepProgress?.result || {} 
      };
    });

    return c.json({ onboarding: stepsWithStatus, configs: gameConfigs });
  } catch (error) {
    return c.json({ error: "Erreur récupération" }, 500);
  }
});

export default app;