import type {
  LocalChordShape,
  LocalInstrument,
  LocalMetaEntry,
  LocalPlaylist,
  LocalPlaylistItem,
  LocalSong
} from '#shared/types/domain'
import type { PullResponse, PushRequest, PushResponse } from '#shared/types/sync'
import type { ZChordsDexie } from '~/services/db/dexie.client'
import { countDirtyRows, getLastSyncedAt, setLastSyncedAt } from '~/services/db/metaRepository.client'

const INITIAL_SYNC_POINT = '1970-01-01T00:00:00.000Z'

function normalizeSongSearchText(title: string, artist: string | null) {
  return `${title} ${artist ?? ''}`.trim().toLowerCase()
}

type LocalTransportFields = {
  dirty?: unknown
  syncError?: unknown
  searchText?: unknown
}

function stripLocalFields<T extends LocalTransportFields>(row: T): Omit<T, 'dirty' | 'syncError' | 'searchText'> {
  const { dirty: _dirty, syncError: _syncError, searchText: _searchText, ...serverRow } = row
  return serverRow
}

async function collectDirtyChanges(db: ZChordsDexie): Promise<PushRequest['changes']> {
  const [
    instruments,
    chordShapes,
    songs,
    playlists,
    playlistItems,
    meta
  ] = await Promise.all([
    db.instruments.where('dirty').equals(1).toArray(),
    db.chordShapes.where('dirty').equals(1).toArray(),
    db.songs.where('dirty').equals(1).toArray(),
    db.playlists.where('dirty').equals(1).toArray(),
    db.playlistItems.where('dirty').equals(1).toArray(),
    db.meta.where('dirty').equals(1).toArray()
  ])

  return {
    instruments: instruments.map(stripLocalFields),
    chord_shapes: chordShapes.map(stripLocalFields),
    songs: songs.map(stripLocalFields),
    playlists: playlists.map(stripLocalFields),
    playlist_items: playlistItems.map(stripLocalFields),
    meta: meta.map(stripLocalFields)
  }
}

function shouldKeepLocalDirty(local: { dirty: boolean }) {
  return local.dirty
}

async function applyRows<T extends { id: string, updatedAt: string }>(
  currentRows: T[],
  getLocal: (id: string) => Promise<{ dirty: boolean } | undefined>,
  putRows: (rows: T[]) => Promise<unknown>,
  mapIncoming: (row: T) => T
) {
  const mergedRows: T[] = []

  for (const row of currentRows) {
    const existing = await getLocal(row.id)

    if (existing && shouldKeepLocalDirty(existing)) {
      continue
    }

    mergedRows.push(mapIncoming(row))
  }

  if (mergedRows.length > 0) {
    await putRows(mergedRows)
  }
}

async function applyPullResponse(db: ZChordsDexie, payload: PullResponse) {
  await applyRows<LocalInstrument>(
    payload.changes.instruments as LocalInstrument[],
    id => db.instruments.get(id),
    rows => db.instruments.bulkPut(rows),
    row => ({ ...row, dirty: false, syncError: null })
  )

  await applyRows<LocalChordShape>(
    payload.changes.chord_shapes as LocalChordShape[],
    id => db.chordShapes.get(id),
    rows => db.chordShapes.bulkPut(rows),
    row => ({ ...row, dirty: false, syncError: null })
  )

  await applyRows<LocalSong>(
    payload.changes.songs as LocalSong[],
    id => db.songs.get(id),
    rows => db.songs.bulkPut(rows as LocalSong[]),
    row => ({
      ...row,
      dirty: false,
      syncError: null,
      searchText: normalizeSongSearchText(row.title, row.artist)
    })
  )

  await applyRows<LocalPlaylist>(
    payload.changes.playlists as LocalPlaylist[],
    id => db.playlists.get(id),
    rows => db.playlists.bulkPut(rows),
    row => ({ ...row, dirty: false, syncError: null })
  )

  await applyRows<LocalPlaylistItem>(
    payload.changes.playlist_items as LocalPlaylistItem[],
    id => db.playlistItems.get(id),
    rows => db.playlistItems.bulkPut(rows),
    row => ({ ...row, dirty: false, syncError: null })
  )

  await applyRows<LocalMetaEntry>(
    payload.changes.meta as LocalMetaEntry[],
    id => db.meta.get(id),
    rows => db.meta.bulkPut(rows),
    row => ({ ...row, dirty: false, syncError: null })
  )

  await setLastSyncedAt(db, payload.serverTime)
}

async function markPushResults(db: ZChordsDexie, payload: PushResponse) {
  for (const id of payload.accepted.instruments) {
    await db.instruments.update(id, { dirty: false, syncError: null })
  }

  for (const id of payload.accepted.chord_shapes) {
    await db.chordShapes.update(id, { dirty: false, syncError: null })
  }

  for (const id of payload.accepted.songs) {
    await db.songs.update(id, { dirty: false, syncError: null })
  }

  for (const id of payload.accepted.playlists) {
    await db.playlists.update(id, { dirty: false, syncError: null })
  }

  for (const id of payload.accepted.playlist_items) {
    await db.playlistItems.update(id, { dirty: false, syncError: null })
  }

  for (const id of payload.accepted.meta) {
    await db.meta.update(id, { dirty: false, syncError: null })
  }

  for (const row of payload.rejected.instruments) {
    await db.instruments.update(row.id, { dirty: true, syncError: row.reason })
  }

  for (const row of payload.rejected.chord_shapes) {
    await db.chordShapes.update(row.id, { dirty: true, syncError: row.reason })
  }

  for (const row of payload.rejected.songs) {
    await db.songs.update(row.id, { dirty: true, syncError: row.reason })
  }

  for (const row of payload.rejected.playlists) {
    await db.playlists.update(row.id, { dirty: true, syncError: row.reason })
  }

  for (const row of payload.rejected.playlist_items) {
    await db.playlistItems.update(row.id, { dirty: true, syncError: row.reason })
  }

  for (const row of payload.rejected.meta) {
    await db.meta.update(row.id, { dirty: true, syncError: row.reason })
  }

  await setLastSyncedAt(db, payload.serverTime)
}

export async function pullChanges(db: ZChordsDexie, deviceId: string, forceSince?: string) {
  const since = forceSince ?? await getLastSyncedAt(db) ?? INITIAL_SYNC_POINT

  const response = await $fetch<PullResponse>('/api/sync/pull', {
    method: 'GET',
    query: {
      since,
      deviceId
    }
  })

  await applyPullResponse(db, response)
  return response
}

export async function pushDirtyChanges(db: ZChordsDexie, deviceId: string) {
  const changes = await collectDirtyChanges(db)

  const hasChanges
    = (changes.instruments?.length ?? 0)
      + (changes.chord_shapes?.length ?? 0)
      + (changes.songs?.length ?? 0)
      + (changes.playlists?.length ?? 0)
      + (changes.playlist_items?.length ?? 0)
      + (changes.meta?.length ?? 0)
      > 0

  if (!hasChanges) {
    return null
  }

  const response = await $fetch<PushResponse>('/api/sync/push', {
    method: 'POST',
    body: {
      deviceId,
      changes
    }
  })

  await markPushResults(db, response)
  return response
}

export async function runManualSync(db: ZChordsDexie, deviceId: string) {
  const pullResult = await pullChanges(db, deviceId)
  const pushResult = await pushDirtyChanges(db, deviceId)
  return {
    pullResult,
    pushResult
  }
}

export async function bootstrapInitialSync(db: ZChordsDexie, deviceId: string) {
  const rowsCount
    = await db.instruments.count()
      + await db.chordShapes.count()
      + await db.songs.count()

  if (rowsCount > 0 || !navigator.onLine) {
    return
  }

  await pullChanges(db, deviceId, INITIAL_SYNC_POINT)
}

export async function getDirtyCount(db: ZChordsDexie) {
  return countDirtyRows(db)
}
