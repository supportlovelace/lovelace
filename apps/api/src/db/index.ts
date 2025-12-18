import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, publishers, studios, games } from '../db/schema';

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://admin:password123@localhost:5432/lovelace_db');
export const db = drizzle(queryClient, { schema: { users, publishers, studios, games } });
