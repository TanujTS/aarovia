export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
};
