import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const queryClient = postgres(process.env.DATABASE_URL || 'postgres://admin:password123@localhost:5432/lovelace_db');
export const db = drizzle(queryClient, { schema });
