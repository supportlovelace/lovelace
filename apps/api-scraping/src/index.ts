import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';

const app = new Hono();

app.use('*', logger());
app.use('*', poweredBy());

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'api-scraping' });
});

app.get('/', (c) => {
  return c.json({
    message: 'Lovelace Scraping API is running',
    version: '1.0.0'
  });
});

export default {
  port: 3001,
  fetch: app.fetch,
};
