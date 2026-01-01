import { createClient } from "@clickhouse/client";

const url = process.env.CLICKHOUSE_URL || `http://${process.env.CH_HOST || 'localhost'}:${process.env.CH_PORT || 8123}`;
const username = process.env.CLICKHOUSE_USER || process.env.CH_USER || 'default';
const password = process.env.CLICKHOUSE_PASSWORD || process.env.CH_PASSWORD || '';

export const clickhouse = createClient({
  url,
  username,
  password,
  database: 'default',
});
