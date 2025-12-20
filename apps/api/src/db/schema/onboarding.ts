import { pgTable, uuid, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userOnboarding = pgTable('user_onboarding', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stepSlug: text('step_slug').notNull(), // ex: 'hub-welcome-tour'
  completedAt: timestamp('completed_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.stepSlug] }),
}));
