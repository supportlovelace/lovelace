import { pgTable, uuid, text, timestamp, index, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { games } from './structure';
import { assets } from './assets';

export const platforms = pgTable('platforms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoAssetId: uuid('logo_asset_id').references(() => assets.id),
  hasChannel: boolean('has_channel').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  color: text('color'), // ex: '#1b2838' pour Steam
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  slugIdx: index('platforms_slug_idx').on(table.slug)
}));

export const gamePlatforms = pgTable('game_platforms', {
  id: uuid('id').defaultRandom().primaryKey(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  platformId: uuid('platform_id').notNull().references(() => platforms.id, { onDelete: 'cascade' }),
  config: jsonb('config').default({}).notNull(),
  status: text('status').default('pending').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  gamePlatformIdx: uniqueIndex('game_platform_idx').on(table.gameId, table.platformId),
  gameIdx: index('game_platforms_game_idx').on(table.gameId),
  platformIdx: index('game_platforms_platform_idx').on(table.platformId)
}));
