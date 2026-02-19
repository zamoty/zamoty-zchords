import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const db = useServerDb()
    await db.execute(sql`SELECT 1`)
    return { ok: true, database: 'connected' }
  } catch (error) {
    setResponseStatus(event, 503)
    return { ok: false, database: 'unavailable', error: String(error) }
  }
})
