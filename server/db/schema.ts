import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * zchords schema – all tables use zchords_ prefix (shared DB).
 * See docs/DRIZZLE_PLAYBOOK.md for conventions.
 */
export const example = pgTable('zchords_example', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
