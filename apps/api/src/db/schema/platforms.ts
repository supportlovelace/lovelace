import { pgTable, uuid, text, timestamp, index, boolean, jsonb, uniqueIndex, integer, primaryKey } from 'drizzle-orm/pg-core';
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
  configSchema: jsonb('config_schema').default([]).notNull(), // Liste des champs requis ex: ['appId', 'apiKey']
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

export const platformChannels = pgTable('platform_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  gamePlatformId: uuid('game_platform_id').notNull().references(() => gamePlatforms.id, { onDelete: 'cascade' }),
  externalId: text('external_id').notNull(), // ID Discord/Slack
  name: text('name').notNull(),
  type: text('type'), // 'GUILD_TEXT', 'GUILD_VOICE'
  metadata: jsonb('metadata').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  uniqueChannel: uniqueIndex('unique_channel_per_connection').on(table.gamePlatformId, table.externalId),
  gamePlatformIdx: index('platform_channels_gp_idx').on(table.gamePlatformId)
}));

// Rôles (ex: @Admin, @Subscriber)
export const platformRoles = pgTable('platform_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  gamePlatformId: uuid('game_platform_id').notNull().references(() => gamePlatforms.id, { onDelete: 'cascade' }),
  externalId: text('external_id').notNull(), // ID du rôle Discord
  name: text('name').notNull(),
  color: text('color'), // ex: #FF0000
  position: integer('position').default(0), // Pour l'ordre hiérarchique
  permissions: jsonb('permissions').default({}), // Bitfield ou liste de perms
  metadata: jsonb('metadata').default({}),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  uniqueRole: uniqueIndex('unique_role_per_connection').on(table.gamePlatformId, table.externalId),
  gpIdx: index('platform_roles_gp_idx').on(table.gamePlatformId)
}));

// Membres (ex: @Antoine)
export const platformMembers = pgTable('platform_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  gamePlatformId: uuid('game_platform_id').notNull().references(() => gamePlatforms.id, { onDelete: 'cascade' }),
  externalId: text('external_id').notNull(), // User ID Discord
  username: text('username').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  isBot: boolean('is_bot').default(false),
  joinedAt: timestamp('joined_at'), // Date d'arrivée sur le serveur
  metadata: jsonb('metadata').default({}),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  uniqueMember: uniqueIndex('unique_member_per_connection').on(table.gamePlatformId, table.externalId),
  gpIdx: index('platform_members_gp_idx').on(table.gamePlatformId)
}));

// Liaison Membre <-> Rôles
export const platformMemberRoles = pgTable('platform_member_roles', {
  memberId: uuid('member_id').notNull().references(() => platformMembers.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => platformRoles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.memberId, table.roleId] })
}));
