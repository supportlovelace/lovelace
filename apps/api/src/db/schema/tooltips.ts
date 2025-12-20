import { pgTable, uuid, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const tooltips = pgTable('tooltips', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull(),
  app: text('app').notNull(), // 'admin', 'hub', 'playtest', etc.
  page: text('page').notNull(), // 'games', 'platforms', 'dashboard', etc.
  color: text('color').default('violet').notNull(), // 'violet', 'blue', 'green', 'red', 'gray'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  slugIdx: uniqueIndex('tooltips_slug_idx').on(table.slug),
  appPageIdx: index('tooltips_app_page_idx').on(table.app, table.page)
}));

export const tooltipTranslations = pgTable('tooltip_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tooltipId: uuid('tooltip_id').notNull().references(() => tooltips.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(), // 'fr', 'en', etc.
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tooltipLocaleIdx: uniqueIndex('tooltip_locale_idx').on(table.tooltipId, table.locale)
}));
