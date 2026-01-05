import { pgTable, uuid, text, timestamp, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { games } from './structure';

/**
 * Catalogue des étapes d'onboarding disponibles.
 * Définit le "quoi" et le "comment" (Kestra, Script, etc.)
 */
export const onboardingSteps = pgTable('onboarding_steps', {
  slug: text('slug').primaryKey(),
  platform: text('platform'), // 'steam', 'reddit', 'discord' ou NULL pour général
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  dependsOn: text('depends_on').array(), // Liste de slugs
  executorType: text('executor_type').notNull(), // 'kestra', 'temporal', 'script', 'manual'
  executorConfig: jsonb('executor_config').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * État d'avancement réel pour un jeu spécifique.
 */
export const gameOnboardingProgress = pgTable('game_onboarding_progress', {
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  stepSlug: text('step_slug').notNull().references(() => onboardingSteps.slug, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // 'pending', 'running', 'completed', 'error'
  totalItems: integer('total_items').default(0),
  processedItems: integer('processed_items').default(0),
  failedItems: integer('failed_items').default(0),
  lastRunAt: timestamp('last_run_at'),
  result: jsonb('result').default({}),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.gameId, table.stepSlug] }),
}));
