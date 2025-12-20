import { pgTable, uuid, text, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { assets } from './assets';

export const publishers = pgTable('publishers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('publishers_name_idx').on(table.name),
  createdByIdx: index('publishers_created_by_idx').on(table.createdBy)
}));

export const studios = pgTable('studios', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default({}).notNull(),
  publisherId: uuid('publisher_id').notNull().references(() => publishers.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('studios_name_idx').on(table.name),
  publisherIdIdx: index('studios_publisher_id_idx').on(table.publisherId),
  createdByIdx: index('studios_created_by_idx').on(table.createdBy)
}));

export const games = pgTable('games', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default({}).notNull(),
  logoAssetId: uuid('logo_asset_id').references(() => assets.id),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('games_name_idx').on(table.name),
  studioIdIdx: index('games_studio_id_idx').on(table.studioId),
  createdByIdx: index('games_created_by_idx').on(table.createdBy)
}));