import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { db } from "../db";
import { assets, assetVariants } from "../db/schema";
import { eq } from "drizzle-orm";

// Configuration R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || "",
    secretAccessKey: process.env.R2_SECRET_KEY || "",
  },
});

console.log("[AssetService] Client R2 initialisé avec endpoint:", process.env.R2_ENDPOINT || "MANQUANT");

const BUCKET = process.env.R2_BUCKET_NAME;
const SIZES = [48, 96, 192, 384];

/**
 * Prend une image (URL ou Buffer), la traite avec Sharp,
 * génère des variantes WebP, upload sur R2 et enregistre en DB.
 */
export async function processAndUploadAsset(
  input: Buffer | string,
  type: "game_logo" | "platform_logo" | "avatar",
  altText?: string
) {
  try {
    // 1. Récupérer le Buffer
    let buffer: Buffer;
    let originalUrl: string | null = null;

    if (typeof input === "string") {
      const res = await fetch(input);
      if (!res.ok) throw new Error(`Impossible de télécharger l'image: ${res.statusText}`);
      buffer = Buffer.from(await res.arrayBuffer());
      originalUrl = input;
    } else {
      buffer = input;
    }

    // 2. Calculer le SHA-256 pour la déduplication
    const hash = createHash("sha256").update(buffer).digest("hex");

    // 3. Vérifier si l'asset existe déjà
    const [existing] = await db.select().from(assets).where(eq(assets.contentHash, hash));
    if (existing) {
      console.log(`[AssetService] Asset déjà existant: ${existing.id} (hash match)`);
      return existing.id;
    }

    // 4. Analyser l'original avec Sharp
    const metadata = await sharp(buffer).metadata();
    const mimeType = `image/${metadata.format || 'unknown'}`;

    // 5. Créer l'entrée Asset en base
    const [newAsset] = await db.insert(assets).values({
      type,
      contentHash: hash,
      mimeType,
      width: metadata.width,
      height: metadata.height,
      originalUrl,
      altText,
    }).returning();

    const assetId = newAsset.id;
    console.log(`[AssetService] Nouvel asset créé: ${assetId}`);

    // 6. Générer les variantes et uploader vers R2
    const variantPromises = SIZES.map(async (size) => {
      const resizedBuffer = await sharp(buffer)
        .resize(size, size, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const info = await sharp(resizedBuffer).metadata();
      const key = `assets/${assetId}/${size}.webp`;

      // Upload R2
      await r2Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: resizedBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }));

      // SQL Variant
      await db.insert(assetVariants).values({
        assetId,
        size,
        format: "webp",
        objectKey: key,
        bytes: resizedBuffer.length,
        width: info.width || size,
        height: info.height || size,
      });
    });

    // Upload de l'original
    const originalKey = `assets/${assetId}/original.${metadata.format || 'bin'}`;
    variantPromises.push(
      r2Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: originalKey,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      })).then(() => Promise.resolve())
    );

    await Promise.all(variantPromises);
    return assetId;

  } catch (error) {
    console.error("[AssetService] Erreur critique:", error);
    throw error;
  }
}
