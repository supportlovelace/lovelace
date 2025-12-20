import { defineConfig } from 'drizzle-kit';

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  console.log(`📡 Drizzle tente de se connecter à : ${url.hostname}:${url.port}${url.pathname} (User: ${url.username})`);
} else {
  console.error("❌ DATABASE_URL n'est pas définie dans l'environnement !");
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
