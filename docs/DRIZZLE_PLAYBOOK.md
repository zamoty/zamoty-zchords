# Drizzle + Neon Playbook

This project uses [Drizzle ORM](https://orm.drizzle.team/) with [Neon](https://neon.tech) PostgreSQL. The database is **shared across multiple projects**, so all zchords tables use the `zchords_` prefix.

---

## Table naming convention

**All zchords tables must be prefixed with `zchords_`.**

Examples:
- `zchords_users` ✅
- `zchords_songs` ✅
- `zchords_sets` ✅
- `users` ❌ (collides with other projects)

When defining a table in schema, pass the physical table name with the prefix:

```ts
export const users = pgTable('zchords_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
```

The constant name (`users`) is how you reference it in code; the first string argument (`zchords_users`) is the actual PostgreSQL table name.

---

## Project layout

| Path | Purpose |
|------|---------|
| `server/db/schema.ts` | Table definitions (all with `zchords_` prefix) |
| `server/utils/db.ts` | `useDb()` – returns Drizzle instance for server code |
| `drizzle.config.ts` | Drizzle Kit config (migrations, schema path) |
| `drizzle/` | Generated migration SQL files + `meta/` (journal, snapshots) |
| `.env` | `DATABASE_URL` – Neon connection string (not committed) |

---

## Environment setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` with your Neon connection string from the [Neon Console](https://console.neon.tech).
3. Never commit `.env` (it is in `.gitignore`).

---

## Defining tables

1. Open `server/db/schema.ts`.
2. Add a table with the `zchords_` prefix:

```ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const songs = pgTable('zchords_songs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})
```

3. Export it so other schema files or routes can import it.

---

## Migrations workflow

### 1. Generate migration (after schema changes)

```bash
pnpm db:generate
```

Creates a new file in `drizzle/` (e.g. `drizzle/0001_add_songs.sql`). Commit these files.

### 2. Apply migrations to database

**Push schema (dev, fast, no migration history):**

```bash
pnpm db:push
```

**Run migrations (prod, tracks history):**

```bash
pnpm db:migrate
```

Use `db:push` for quick prototyping; use `db:migrate` for production and shared DBs.

### 3. Inspect database

```bash
pnpm db:studio
```

Opens Drizzle Studio to browse and edit data.

---

## Using the database in server code

### In API routes

```ts
// server/api/songs.get.ts
import { songs } from '~/server/db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  const rows = await db.select().from(songs)
  return rows
})
```

### In server utilities or plugins

```ts
import { songs } from '~/server/db/schema'

const db = useDb()
const song = await db.insert(songs).values({ title: 'Example', artist: 'Artist' }).returning()
```

### Insert

```ts
const [inserted] = await db.insert(songs)
  .values({ title: 'My Song', artist: 'Someone' })
  .returning()
```

### Update

```ts
await db.update(songs)
  .set({ title: 'Updated Title' })
  .where(eq(songs.id, songId))
```

### Delete

```ts
import { eq } from 'drizzle-orm'

await db.delete(songs).where(eq(songs.id, songId))
```

### Raw SQL (when needed)

```ts
import { sql } from 'drizzle-orm'

const result = await db.execute(sql`SELECT COUNT(*) FROM zchords_songs`)
```

---

## Available scripts

| Script | Command | Description |
|--------|---------|-------------|
| Generate | `pnpm db:generate` | Generate migration from schema changes |
| Push | `pnpm db:push` | Push schema to DB (dev) |
| Migrate | `pnpm db:migrate` | Run migrations |
| Studio | `pnpm db:studio` | Open Drizzle Studio |

---

## Health check

`GET /api/health` verifies DB connectivity. Returns `{ ok: true, database: 'connected' }` when the connection works.

---

## References

- [Drizzle ORM docs](https://orm.drizzle.team/)
- [Drizzle with Neon](https://orm.drizzle.team/docs/get-started-postgresql#neon)
- [Neon Console](https://console.neon.tech)
