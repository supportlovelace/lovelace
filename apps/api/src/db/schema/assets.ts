import { pgTable, uuid, text, timestamp, index, integer } from 'drizzle-orm/pg-core';

export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(), // 'game_logo', 'platform_logo', 'avatar', etc.
  originalUrl: text('original_url'), // Source originale si c'était un lien externe
  license: text('license'),
  contentHash: text('content_hash').notNull(), // SHA-256 pour déduplication
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  altText: text('alt_text'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  hashIdx: index('assets_hash_idx').on(table.contentHash)
}));

export const assetVariants = pgTable('asset_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  size: integer('size').notNull(), // 48, 96, 192, 384
  format: text('format').notNull(), // 'webp', 'png', etc.
  objectKey: text('object_key').notNull(), // La clé dans R2
  bytes: integer('bytes').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  assetIdx: index('asset_variants_asset_id_idx').on(table.assetId)
}));
