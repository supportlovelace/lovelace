import { Client, Connection } from '@temporalio/client';

let client: Client | null = null;

export const getTemporalClient = async () => {
  if (client) return client;

  // En prod, l'adresse sera temporal:7233
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

  const connection = await Connection.connect({
    address,
  });

  client = new Client({
    connection,
  });

  return client;
};
