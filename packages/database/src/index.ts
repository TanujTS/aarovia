import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export connection for manual queries if needed
export { client };

// Export all schema for easy access
export * from './schema';
