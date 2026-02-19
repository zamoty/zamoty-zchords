import { gt } from 'drizzle-orm'
import {
  chordShapes,
  instruments,
  meta,
  playlistItems,
  playlists,
  songs
} from '#server/db/schema'
import { parseSince } from '#server/utils/sync'
import type { PullResponse } from '#shared/types/sync'

export default defineEventHandler(async (event): Promise<PullResponse> => {
  const query = getQuery(event)
  const deviceId = typeof query.deviceId === 'string' ? query.deviceId : ''

  if (!deviceId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'deviceId is required'
    })
  }

  const since = parseSince(query.since)
  const db = useServerDb()

  const [instrumentRows, shapeRows, songRows, playlistRows, playlistItemRows, metaRows] = await Promise.all([
    db.select().from(instruments).where(gt(instruments.updatedAt, since)),
    db.select().from(chordShapes).where(gt(chordShapes.updatedAt, since)),
    db.select().from(songs).where(gt(songs.updatedAt, since)),
    db.select().from(playlists).where(gt(playlists.updatedAt, since)),
    db.select().from(playlistItems).where(gt(playlistItems.updatedAt, since)),
    db.select().from(meta).where(gt(meta.updatedAt, since))
  ])

  return {
    serverTime: new Date().toISOString(),
    changes: {
      instruments: instrumentRows,
      chord_shapes: shapeRows.map(row => ({
        ...row,
        source: row.source === 'chords-db' ? 'chords-db' : 'manual'
      })),
      songs: songRows.map(row => ({
        ...row,
        contentFormat: 'chordpro' as const
      })),
      playlists: playlistRows,
      playlist_items: playlistItemRows,
      meta: metaRows
    }
  }
})
