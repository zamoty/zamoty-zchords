import type {
  ChordShape,
  Instrument,
  MetaEntry,
  Playlist,
  PlaylistItem,
  Song,
  SyncTableName
} from '#shared/types/domain'
import type { PushRequest, SyncAcceptedMap, SyncRejectedMap } from '#shared/types/sync'

const EPOCH_ISO = '1970-01-01T00:00:00.000Z'

export const SYNC_TABLES: SyncTableName[] = [
  'instruments',
  'chord_shapes',
  'songs',
  'playlists',
  'playlist_items',
  'meta'
]

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  return asString(value)
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const allStrings = value.every(item => typeof item === 'string')
  return allStrings ? value as string[] : null
}

function asNumberArray(value: unknown): number[] | null {
  if (value === null || value === undefined) {
    return null
  }

  if (!Array.isArray(value)) {
    return null
  }

  const allNumbers = value.every(item => typeof item === 'number' && Number.isFinite(item))
  return allNumbers ? value as number[] : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!isObject(value)) {
    return null
  }

  return value
}

function normalizeBaseRow(raw: Record<string, unknown>) {
  const now = new Date().toISOString()
  const id = asString(raw.id)

  if (!id) {
    return null
  }

  const createdAt = asString(raw.createdAt) ?? asString(raw.created_at) ?? now
  const updatedAt = asString(raw.updatedAt) ?? asString(raw.updated_at) ?? now
  const deletedAt
    = asNullableString(raw.deletedAt)
      ?? asNullableString(raw.deleted_at)
      ?? null

  return {
    id,
    createdAt,
    updatedAt,
    deletedAt
  }
}

export function emptyAcceptedMap(): SyncAcceptedMap {
  return {
    instruments: [],
    chord_shapes: [],
    songs: [],
    playlists: [],
    playlist_items: [],
    meta: []
  }
}

export function emptyRejectedMap(): SyncRejectedMap {
  return {
    instruments: [],
    chord_shapes: [],
    songs: [],
    playlists: [],
    playlist_items: [],
    meta: []
  }
}

export function parseSince(rawSince: unknown): string {
  const since = typeof rawSince === 'string' ? rawSince : EPOCH_ISO
  const timestamp = Date.parse(since)

  if (Number.isNaN(timestamp)) {
    return EPOCH_ISO
  }

  return new Date(timestamp).toISOString()
}

export function ensurePushPayload(payload: unknown): PushRequest | null {
  if (!isObject(payload)) {
    return null
  }

  if (typeof payload.deviceId !== 'string' || payload.deviceId.length === 0) {
    return null
  }

  const changes = isObject(payload.changes) ? payload.changes : {}

  return {
    deviceId: payload.deviceId,
    changes
  }
}

export function sanitizeInstrument(raw: unknown): Instrument | null {
  if (!isObject(raw)) {
    return null
  }

  const base = normalizeBaseRow(raw)
  const code = asString(raw.code)
  const name = asString(raw.name)
  const tuning = asStringArray(raw.tuning)
  const stringsCount = asNumber(raw.stringsCount) ?? asNumber(raw.strings_count)

  if (!base || !code || !name || !tuning || stringsCount === null) {
    return null
  }

  return {
    ...base,
    code,
    name,
    tuning,
    stringsCount
  }
}

export function sanitizeChordShape(raw: unknown): ChordShape | null {
  if (!isObject(raw)) {
    return null
  }

  const base = normalizeBaseRow(raw)
  const instrumentId = asString(raw.instrumentId) ?? asString(raw.instrument_id)
  const chordName = asString(raw.chordName) ?? asString(raw.chord_name)
  const source = asString(raw.source)

  if (!base || !instrumentId || !chordName || !source) {
    return null
  }

  const frets = raw.frets
  const fretsValid = typeof frets === 'string' || Array.isArray(frets)

  if (!fretsValid) {
    return null
  }

  const fingers = asNumberArray(raw.fingers)
  const barres = asNumberArray(raw.barres)
  const baseFret = asNumber(raw.baseFret) ?? asNumber(raw.base_fret) ?? 1
  const tags = asRecord(raw.tags)

  return {
    ...base,
    instrumentId,
    chordName,
    frets,
    fingers,
    barres,
    baseFret,
    tags,
    source: source === 'chords-db' ? 'chords-db' : 'manual'
  }
}

export function sanitizeSong(raw: unknown): Song | null {
  if (!isObject(raw)) {
    return null
  }

  const base = normalizeBaseRow(raw)
  const title = asString(raw.title)
  const content = asString(raw.content)
  const contentFormat = asString(raw.contentFormat) ?? asString(raw.content_format) ?? 'chordpro'

  if (!base || !title || !content) {
    return null
  }

  const artist = asNullableString(raw.artist)
  const key = asNullableString(raw.key)
  const capo = asNumber(raw.capo)

  return {
    ...base,
    title,
    artist,
    contentFormat: contentFormat === 'chordpro' ? 'chordpro' : 'chordpro',
    content,
    key,
    capo
  }
}

export function sanitizePlaylist(raw: unknown): Playlist | null {
  if (!isObject(raw)) {
    return null
  }

  const base = normalizeBaseRow(raw)
  const name = asString(raw.name)
  const description = asNullableString(raw.description)

  if (!base || !name) {
    return null
  }

  return {
    ...base,
    name,
    description
  }
}

export function sanitizePlaylistItem(raw: unknown): PlaylistItem | null {
  if (!isObject(raw)) {
    return null
  }

  const base = normalizeBaseRow(raw)
  const playlistId = asString(raw.playlistId) ?? asString(raw.playlist_id)
  const songId = asString(raw.songId) ?? asString(raw.song_id)
  const position = asNumber(raw.position)

  if (!base || !playlistId || !songId || position === null) {
    return null
  }

  return {
    ...base,
    playlistId,
    songId,
    position
  }
}

export function sanitizeMeta(raw: unknown): MetaEntry | null {
  if (!isObject(raw)) {
    return null
  }

  const base = normalizeBaseRow(raw)
  const key = asString(raw.key)
  const value = asRecord(raw.value)

  if (!base || !key || !value) {
    return null
  }

  return {
    ...base,
    key,
    value
  }
}
