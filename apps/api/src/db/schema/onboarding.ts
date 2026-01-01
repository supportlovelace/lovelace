import { pgTable, uuid, text, timestamp, primaryKey, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { games } from './structure';

export const userOnboarding = pgTable('user_onboarding', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stepSlug: text('step_slug').notNull(), // ex: 'hub-welcome-tour'
  completedAt: timestamp('completed_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.stepSlug] }),
}));

export const gameOnboardingRequests = pgTable('game_onboarding_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  stepSlug: text('step_slug').notNull(),
  workflowId: text('workflow_id').notNull(),
  type: text('type').notNull(), // 'UPLOAD', 'FORM', 'CONFIRM'
  config: jsonb('config').default({}).notNull(),
  status: text('status').default('pending').notNull(),
  result: jsonb('result'),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});
