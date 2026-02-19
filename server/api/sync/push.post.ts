import { eq } from 'drizzle-orm'
import {
  chordShapes,
  instruments,
  meta,
  playlistItems,
  playlists,
  songs
} from '#server/db/schema'
import {
  emptyAcceptedMap,
  emptyRejectedMap,
  ensurePushPayload,
  sanitizeChordShape,
  sanitizeInstrument,
  sanitizeMeta,
  sanitizePlaylist,
  sanitizePlaylistItem,
  sanitizeSong
} from '#server/utils/sync'
import type { RejectedSyncRow, PushResponse } from '#shared/types/sync'

type SyncTable = typeof instruments | typeof chordShapes | typeof songs | typeof playlists | typeof playlistItems | typeof meta

export default defineEventHandler(async (event): Promise<PushResponse> => {
  const rawBody = await readBody(event)
  const payload = ensurePushPayload(rawBody)

  if (!payload) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid push payload'
    })
  }

  const db = useServerDb()
  const accepted = emptyAcceptedMap()
  const rejected = emptyRejectedMap()

  async function processRow<T extends { id: string, updatedAt: string }>(
    tableName: keyof typeof accepted,
    rawRow: unknown,
    sanitize: (raw: unknown) => T | null,
    table: SyncTable
  ) {
    const row = sanitize(rawRow)

    if (!row) {
      const invalid = rawRow as Partial<{ id: string }>
      rejected[tableName].push({
        id: invalid.id ?? 'unknown',
        reason: 'invalid_payload'
      })
      return
    }

    try {
      const current = await db.select({ updatedAt: table.updatedAt })
        .from(table)
        .where(eq(table.id, row.id))
        .limit(1)

      const currentUpdatedAt = current[0]?.updatedAt

      if (currentUpdatedAt && new Date(currentUpdatedAt).getTime() > new Date(row.updatedAt).getTime()) {
        rejected[tableName].push({
          id: row.id,
          reason: 'stale_update',
          message: 'Server row has newer updatedAt'
        })
        return
      }

      const setValues = { ...(row as Record<string, unknown>) }
      delete setValues.id

      await db.insert(table)
        .values(row as never)
        .onConflictDoUpdate({
          target: table.id,
          set: setValues
        })

      accepted[tableName].push(row.id)
    } catch (error) {
      rejected[tableName].push({
        id: row.id,
        reason: 'server_error',
        message: String(error)
      } satisfies RejectedSyncRow)
    }
  }

  const instrumentRows = Array.isArray(payload.changes.instruments) ? payload.changes.instruments : []
  const chordShapeRows = Array.isArray(payload.changes.chord_shapes) ? payload.changes.chord_shapes : []
  const songRows = Array.isArray(payload.changes.songs) ? payload.changes.songs : []
  const playlistRows = Array.isArray(payload.changes.playlists) ? payload.changes.playlists : []
  const playlistItemRows = Array.isArray(payload.changes.playlist_items) ? payload.changes.playlist_items : []
  const metaRows = Array.isArray(payload.changes.meta) ? payload.changes.meta : []

  for (const row of instrumentRows) {
    await processRow('instruments', row, sanitizeInstrument, instruments)
  }

  for (const row of chordShapeRows) {
    await processRow('chord_shapes', row, sanitizeChordShape, chordShapes)
  }

  for (const row of songRows) {
    await processRow('songs', row, sanitizeSong, songs)
  }

  for (const row of playlistRows) {
    await processRow('playlists', row, sanitizePlaylist, playlists)
  }

  for (const row of playlistItemRows) {
    await processRow('playlist_items', row, sanitizePlaylistItem, playlistItems)
  }

  for (const row of metaRows) {
    await processRow('meta', row, sanitizeMeta, meta)
  }

  return {
    serverTime: new Date().toISOString(),
    accepted,
    rejected
  }
})
