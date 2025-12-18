import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email)
}));

// Publishers table
export const publishers = pgTable('publishers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('publishers_name_idx').on(table.name),
  createdByIdx: index('publishers_created_by_idx').on(table.createdBy)
}));

// Studios table
export const studios = pgTable('studios', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  publisherId: uuid('publisher_id').notNull().references(() => publishers.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('studios_name_idx').on(table.name),
  publisherIdIdx: index('studios_publisher_id_idx').on(table.publisherId),
  createdByIdx: index('studios_created_by_idx').on(table.createdBy)
}));

// Games table (updated with foreign key)
export const games = pgTable('games', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('games_name_idx').on(table.name),
  studioIdIdx: index('games_studio_id_idx').on(table.studioId),
  createdByIdx: index('games_created_by_idx').on(table.createdBy)
}));
