import { Worker, type ConnectionOptions } from 'bullmq';
import { db } from '../db';
import { gameOnboardingProgress } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Configuration Redis
const redisConfig: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

export const IMPORT_QUEUE_NAME = 'lovelace-imports';

// Client S3 pour le Worker
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
});

interface ImportJobData {
  gameId: string;
  stepSlug: string;
  targetTable: string;
  s3Key: string;
  mapping: Record<string, string>;
}

export const startImportWorker = () => {
  console.log('👷 [Worker] Démarrage du worker d\'import CSV (Streaming Mode)...');
  console.log(`🔧 [Worker Config] S3 Endpoint: ${process.env.S3_ENDPOINT}`);
  console.log(`🔧 [Worker Config] ClickHouse URL: ${process.env.CLICKHOUSE_URL || 'http://lovelace-clickhouse:8123'}`);

  const worker = new Worker<ImportJobData>(IMPORT_QUEUE_NAME, async (job) => {
    const { gameId, stepSlug, targetTable, s3Key, mapping } = job.data;
    console.log(`📥 [Job ${job.id}] Start Import: ${s3Key} -> ${targetTable}`);

    try {
      // 1. Récupérer le Stream S3
      const bucket = process.env.S3_BUCKET_NAME || "lovelace-imports";
      let s3Stream: Readable;
      
      try {
        const getObj = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: s3Key }));
        if (!getObj.Body) throw new Error("Fichier S3 vide");
        s3Stream = getObj.Body as Readable;
      } catch (e: any) {
        throw new Error(`Erreur S3 (Check credentials/bucket): ${e.message}`);
      }

      // 2. Préparer ClickHouse
      const chHost = process.env.CLICKHOUSE_URL || "http://lovelace-clickhouse:8123";
      const chUser = process.env.CLICKHOUSE_USER || "admin";
      const chPass = process.env.CLICKHOUSE_PASSWORD || "password";
      
      const normalizedMapping: Record<string, string> = {};
      for (const [targetCol, csvCol] of Object.entries(mapping)) {
        normalizedMapping[csvCol.toLowerCase().replace(/['"]/g, '').trim()] = targetCol;
      }

      let batch: any[] = [];
      const BATCH_SIZE = 5000;
      let totalRows = 0;

      const flushBatch = async (data: any[]) => {
        if (data.length === 0) return;
        const ndjson = data.map(row => JSON.stringify(row)).join('\n');
        
        const chRes = await fetch(`${chHost}/?user=${chUser}&password=${chPass}&query=INSERT INTO ${targetTable} FORMAT JSONEachRow`, {
          method: 'POST',
          body: ndjson,
          headers: { 'Content-Type': 'application/x-ndjson' }
        });

        if (!chRes.ok) {
          const errText = await chRes.text();
          throw new Error(`ClickHouse Error (${chRes.status}): ${errText}`);
        }
        
        console.log(`🚀 [Job ${job.id}] Batch inséré (${data.length} lignes)`);
      };

      // 3. Parser le CSV
      await new Promise<void>((resolve, reject) => {
        s3Stream
          .pipe(csv({ separator: ';' })) // On peut aussi tenter de détecter le séparateur ici
          .on('data', (row) => {
            const cleanRow: any = { game_id: gameId };
            let hasData = false;

            for (const [key, value] of Object.entries(row)) {
              const normKey = key.toLowerCase().replace(/['"]/g, '').trim();
              const targetCol = normalizedMapping[normKey];
              if (targetCol) {
                cleanRow[targetCol] = value;
                hasData = true;
              }
            }

            if (hasData) {
              batch.push(cleanRow);
              totalRows++;
            }

            if (batch.length >= BATCH_SIZE) {
              s3Stream.pause();
              const currentBatch = [...batch];
              batch = [];
              flushBatch(currentBatch)
                .then(() => s3Stream.resume())
                .catch(err => {
                  s3Stream.destroy();
                  reject(err);
                });
            }
          })
          .on('end', async () => {
            if (batch.length > 0) {
              try {
                await flushBatch(batch);
                resolve();
              } catch (err) {
                reject(err);
              }
            } else {
              resolve();
            }
          })
          .on('error', (err) => reject(err));
      });

      console.log(`✅ [Job ${job.id}] Import terminé (${totalRows} lignes).`);

      await db.update(gameOnboardingProgress)
        .set({
          status: 'completed',
          lastRunAt: new Date(),
          result: { s3Key, targetTable, mapping, jobId: job.id, rows: totalRows } 
        })
        .where(and(
          eq(gameOnboardingProgress.gameId, gameId),
          eq(gameOnboardingProgress.stepSlug, stepSlug)
        ));

    } catch (error: any) {
      console.error(`❌ [Job ${job.id}] Échec:`, error.message);
      
      await db.update(gameOnboardingProgress)
        .set({
          status: 'error',
          result: { error: error.message, jobId: job.id } 
        })
        .where(and(
          eq(gameOnboardingProgress.gameId, gameId),
          eq(gameOnboardingProgress.stepSlug, stepSlug)
        ));
        
      throw error;
    }
  }, {
    connection: redisConfig,
    concurrency: 2,
  });

  return worker;
};
