import type { ZChordsDexie } from './dexie.client'

const DEVICE_ID_KEY = 'deviceId'
const LAST_SYNCED_AT_KEY = 'lastSyncedAt'
const SELECTED_INSTRUMENT_ID_KEY = 'selectedInstrumentId'

function nowIso() {
  return new Date().toISOString()
}

function createMetaValue(value: Record<string, unknown>) {
  const timestamp = nowIso()

  return {
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    dirty: false,
    syncError: null,
    value
  }
}

export async function setMetaValue(
  db: ZChordsDexie,
  key: string,
  value: Record<string, unknown>,
  dirty = false
) {
  const existing = await db.meta.where('key').equals(key).first()

  if (!existing) {
    await db.meta.add({
      ...createMetaValue(value),
      key,
      dirty
    })
    return
  }

  await db.meta.update(existing.id, {
    value,
    updatedAt: nowIso(),
    dirty,
    syncError: null
  })
}

export async function getMetaValue<T>(db: ZChordsDexie, key: string): Promise<T | null> {
  const row = await db.meta.where('key').equals(key).first()

  if (!row || row.deletedAt) {
    return null
  }

  return row.value as T
}

export async function ensureDeviceId(db: ZChordsDexie) {
  const current = await getMetaValue<{ deviceId: string }>(db, DEVICE_ID_KEY)

  if (current?.deviceId) {
    return current.deviceId
  }

  const deviceId = crypto.randomUUID()
  await setMetaValue(db, DEVICE_ID_KEY, { deviceId }, false)
  return deviceId
}

export async function getDeviceId(db: ZChordsDexie) {
  const current = await getMetaValue<{ deviceId: string }>(db, DEVICE_ID_KEY)
  return current?.deviceId ?? null
}

export async function setLastSyncedAt(db: ZChordsDexie, timestamp: string) {
  await setMetaValue(db, LAST_SYNCED_AT_KEY, { timestamp }, false)
}

export async function getLastSyncedAt(db: ZChordsDexie) {
  const current = await getMetaValue<{ timestamp: string }>(db, LAST_SYNCED_AT_KEY)
  return current?.timestamp ?? null
}

export async function setSelectedInstrumentId(db: ZChordsDexie, instrumentId: string) {
  await setMetaValue(db, SELECTED_INSTRUMENT_ID_KEY, { instrumentId }, false)
}

export async function getSelectedInstrumentId(db: ZChordsDexie) {
  const current = await getMetaValue<{ instrumentId: string }>(db, SELECTED_INSTRUMENT_ID_KEY)
  return current?.instrumentId ?? null
}

export async function countDirtyRows(db: ZChordsDexie) {
  const [instruments, chordShapes, songs, playlists, playlistItems, meta] = await Promise.all([
    db.instruments.where('dirty').equals(1).count(),
    db.chordShapes.where('dirty').equals(1).count(),
    db.songs.where('dirty').equals(1).count(),
    db.playlists.where('dirty').equals(1).count(),
    db.playlistItems.where('dirty').equals(1).count(),
    db.meta.where('dirty').equals(1).count()
  ])

  return instruments + chordShapes + songs + playlists + playlistItems + meta
}
