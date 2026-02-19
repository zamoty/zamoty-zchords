import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'

function withSyncTimestamps() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' })
  }
}

export const instruments = pgTable('zchords_instruments', {
  id: uuid('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  tuning: jsonb('tuning').$type<string[]>().notNull(),
  stringsCount: integer('strings_count').notNull(),
  ...withSyncTimestamps()
}, table => [
  uniqueIndex('zchords_instruments_code_unique').on(table.code),
  index('zchords_instruments_updated_at_idx').on(table.updatedAt)
])

export const chordShapes = pgTable('zchords_chord_shapes', {
  id: uuid('id').primaryKey(),
  instrumentId: uuid('instrument_id').notNull().references(() => instruments.id),
  chordName: text('chord_name').notNull(),
  frets: jsonb('frets').$type<(string | number | null)[] | string>().notNull(),
  fingers: jsonb('fingers').$type<number[] | null>(),
  barres: jsonb('barres').$type<number[] | null>(),
  baseFret: integer('base_fret').notNull().default(1),
  tags: jsonb('tags').$type<Record<string, unknown> | null>(),
  source: text('source').notNull(),
  ...withSyncTimestamps()
}, table => [
  index('zchords_chord_shapes_instrument_name_idx').on(table.instrumentId, table.chordName),
  index('zchords_chord_shapes_updated_at_idx').on(table.updatedAt)
])

export const songs = pgTable('zchords_songs', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist'),
  contentFormat: text('content_format').notNull().default('chordpro'),
  content: text('content').notNull(),
  key: text('key'),
  capo: integer('capo'),
  ...withSyncTimestamps()
}, table => [
  index('zchords_songs_title_idx').on(table.title),
  index('zchords_songs_artist_idx').on(table.artist),
  index('zchords_songs_updated_at_idx').on(table.updatedAt)
])

export const playlists = pgTable('zchords_playlists', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ...withSyncTimestamps()
}, table => [
  index('zchords_playlists_updated_at_idx').on(table.updatedAt)
])

export const playlistItems = pgTable('zchords_playlist_items', {
  id: uuid('id').primaryKey(),
  playlistId: uuid('playlist_id').notNull().references(() => playlists.id),
  songId: uuid('song_id').notNull().references(() => songs.id),
  position: integer('position').notNull(),
  ...withSyncTimestamps()
}, table => [
  index('zchords_playlist_items_playlist_position_idx').on(table.playlistId, table.position),
  index('zchords_playlist_items_updated_at_idx').on(table.updatedAt)
])

export const meta = pgTable('zchords_meta', {
  id: uuid('id').primaryKey(),
  key: text('key').notNull(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  ...withSyncTimestamps()
}, table => [
  uniqueIndex('zchords_meta_key_unique').on(table.key),
  index('zchords_meta_updated_at_idx').on(table.updatedAt)
])
