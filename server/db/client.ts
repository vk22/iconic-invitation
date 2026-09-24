import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

let pool: Pool | undefined

export function useDb() {
  if (!pool) {
    const { databaseUrl } = useRuntimeConfig()
    pool = new Pool({ connectionString: databaseUrl })
  }
  return drizzle(pool, { schema })
}
