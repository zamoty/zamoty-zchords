import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export function useServerDb() {
  const config = useRuntimeConfig()
  const connectionString = config.databaseUrl

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to your .env file.')
  }

  const sql = neon(connectionString)
  return drizzle({ client: sql })
}
