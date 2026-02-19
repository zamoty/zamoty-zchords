import type {
  ChordShape,
  LocalPlaylist,
  LocalPlaylistItem,
  LocalSong,
  Playlist,
  PlaylistItem,
  Song
} from '#shared/types/domain'
import type { ZChordsDexie } from './dexie.client'

let mutationHook: (() => void) | null = null

export function registerLocalMutationHook(hook: () => void) {
  mutationHook = hook
}

function notifyLocalMutation() {
  mutationHook?.()
}

function nowIso() {
  return new Date().toISOString()
}

function buildSongSearchText(title: string, artist: string | null) {
  return `${title} ${artist ?? ''}`.trim().toLowerCase()
}

type ParsedFret = 'x' | number | null

function normalizeShapeFrets(shape: ChordShape): string[] {
  if (typeof shape.frets !== 'string') {
    return shape.frets.map(value => String(value ?? '')).filter(Boolean)
  }

  const compact = shape.frets.trim()

  if (!compact) {
    return []
  }

  if (/[,\s]/.test(compact)) {
    return compact.split(/[,\s]+/).map(token => token.trim()).filter(Boolean)
  }

  return compact.split('')
}

function parseFretToken(token: string): ParsedFret {
  const normalized = token.trim().toLowerCase()

  if (!normalized) {
    return null
  }

  if (normalized === 'x') {
    return 'x'
  }

  const numeric = Number(normalized)
  if (!Number.isFinite(numeric)) {
    return null
  }

  if (numeric < 0) {
    return 'x'
  }

  return numeric
}

function analyzeShape(shape: ChordShape, expectedStringsCount?: number) {
  const frets = normalizeShapeFrets(shape)
  const parsed = frets.map(parseFretToken)
  const validTokenCount = parsed.filter(token => token !== null).length
  const numericFrets = parsed.filter((token): token is number => typeof token === 'number' && token > 0)
  const openCount = parsed.filter(token => token === 0).length
  const mutedCount = parsed.filter(token => token === 'x').length

  const minFret = numericFrets.length > 0 ? Math.min(...numericFrets) : 0
  const maxFret = numericFrets.length > 0 ? Math.max(...numericFrets) : 0
  const fretSpan = maxFret > 0 ? maxFret - minFret : 0

  const stringsMatch = typeof expectedStringsCount === 'number'
    ? frets.length === expectedStringsCount
    : true

  const hasPlayableInfo = numericFrets.length > 0 || openCount > 0
  const hasInvalidTokens = validTokenCount !== frets.length

  return {
    frets,
    numericFrets,
    openCount,
    mutedCount,
    fretSpan,
    stringsMatch,
    hasPlayableInfo,
    hasInvalidTokens
  }
}

function scoreChordShape(shape: ChordShape): number {
  const analysis = analyzeShape(shape)
  const maxFret = analysis.numericFrets.length > 0 ? Math.max(...analysis.numericFrets) : 0
  const difficulty = Number(shape.tags?.difficulty ?? 0)
  const positionIndex = Number(shape.tags?.positionIndex ?? Number.POSITIVE_INFINITY)
  const hasPositionIndex = Number.isFinite(positionIndex)
  const positionPenalty = hasPositionIndex ? positionIndex * 1000 : 5000
  const commonBonus = shape.tags?.common ? -120 : 0
  const sourceBonus = shape.source === 'manual' ? -16 : 0
  const openBonus = -analysis.openCount * 8
  const invalidPenalty = analysis.hasInvalidTokens ? 120 : 0

  return (
    positionPenalty
    + shape.baseFret * 16
    + analysis.fretSpan * 12
    + analysis.mutedCount * 5
    + analysis.numericFrets.length * 1.5
    + Math.max(0, maxFret - 5) * 6
    + (Number.isFinite(difficulty) ? difficulty * 8 : 0)
    + openBonus
    + invalidPenalty
    + commonBonus
    + sourceBonus
  )
}

function pickPrimaryVariations(shapes: ChordShape[], limit = 6, expectedStringsCount?: number): ChordShape[] {
  const unique = new Map<string, ChordShape>()

  for (const shape of shapes) {
    const key = `${shape.chordName}:${JSON.stringify(shape.frets)}:${shape.baseFret}`
    if (!unique.has(key)) {
      unique.set(key, shape)
    }
  }

  const filtered = Array.from(unique.values()).filter((shape) => {
    const analysis = analyzeShape(shape, expectedStringsCount)

    if (!analysis.hasPlayableInfo || !analysis.stringsMatch) {
      return false
    }

    return true
  })

  return filtered
    .sort((a, b) => {
      const byScore = scoreChordShape(a) - scoreChordShape(b)
      if (byScore !== 0) {
        return byScore
      }

      return a.id.localeCompare(b.id)
    })
    .slice(0, limit)
}

export async function listSongs(db: ZChordsDexie, searchTerm = '') {
  const normalized = searchTerm.trim().toLowerCase()
  const rows = await db.songs.toArray()

  return rows
    .filter(song => !song.deletedAt)
    .filter((song) => {
      if (!normalized) {
        return true
      }

      return song.searchText.includes(normalized)
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}

export async function getSong(db: ZChordsDexie, id: string) {
  const song = await db.songs.get(id)
  if (!song || song.deletedAt) {
    return null
  }

  return song
}

export async function saveSong(db: ZChordsDexie, input: Partial<Song> & Pick<Song, 'title' | 'content'>) {
  const timestamp = nowIso()
  const existing = input.id ? await db.songs.get(input.id) : null

  const row: LocalSong = {
    id: existing?.id ?? input.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    dirty: true,
    syncError: null,
    title: input.title,
    artist: input.artist ?? null,
    contentFormat: 'chordpro',
    content: input.content,
    key: input.key ?? null,
    capo: input.capo ?? null,
    searchText: buildSongSearchText(input.title, input.artist ?? null)
  }

  await db.songs.put(row)
  notifyLocalMutation()
  return row
}

export async function softDeleteSong(db: ZChordsDexie, id: string) {
  const existing = await db.songs.get(id)

  if (!existing) {
    return
  }

  await db.songs.update(id, {
    deletedAt: nowIso(),
    updatedAt: nowIso(),
    dirty: true,
    syncError: null
  })

  notifyLocalMutation()
}

export async function listPlaylists(db: ZChordsDexie) {
  const rows = await db.playlists.toArray()
  return rows
    .filter(row => !row.deletedAt)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function savePlaylist(db: ZChordsDexie, input: Partial<Playlist> & Pick<Playlist, 'name'>) {
  const timestamp = nowIso()
  const existing = input.id ? await db.playlists.get(input.id) : null

  const row: LocalPlaylist = {
    id: existing?.id ?? input.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    dirty: true,
    syncError: null,
    name: input.name,
    description: input.description ?? null
  }

  await db.playlists.put(row)
  notifyLocalMutation()
  return row
}

export async function softDeletePlaylist(db: ZChordsDexie, id: string) {
  const existing = await db.playlists.get(id)

  if (!existing) {
    return
  }

  await db.playlists.update(id, {
    deletedAt: nowIso(),
    updatedAt: nowIso(),
    dirty: true,
    syncError: null
  })

  const playlistItems = await db.playlistItems.where('playlistId').equals(id).toArray()
  const timestamp = nowIso()

  await db.playlistItems.bulkPut(playlistItems.map(item => ({
    ...item,
    deletedAt: timestamp,
    updatedAt: timestamp,
    dirty: true,
    syncError: null
  })))

  notifyLocalMutation()
}

export async function listPlaylistItems(db: ZChordsDexie, playlistId: string) {
  const rows = await db.playlistItems.where('playlistId').equals(playlistId).toArray()

  return rows
    .filter(row => !row.deletedAt)
    .sort((a, b) => a.position - b.position)
}

export async function addSongToPlaylist(db: ZChordsDexie, playlistId: string, songId: string) {
  const activeItems = await listPlaylistItems(db, playlistId)
  const maxPosition = activeItems.reduce((acc, item) => Math.max(acc, item.position), -1)
  const timestamp = nowIso()

  const row: LocalPlaylistItem = {
    id: crypto.randomUUID(),
    playlistId,
    songId,
    position: maxPosition + 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    dirty: true,
    syncError: null
  }

  await db.playlistItems.put(row)
  notifyLocalMutation()
}

export async function removePlaylistItem(db: ZChordsDexie, itemId: string) {
  const existing = await db.playlistItems.get(itemId)

  if (!existing) {
    return
  }

  const timestamp = nowIso()

  await db.playlistItems.update(itemId, {
    deletedAt: timestamp,
    updatedAt: timestamp,
    dirty: true,
    syncError: null
  })

  notifyLocalMutation()
}

export async function reorderPlaylistItems(db: ZChordsDexie, playlistId: string, orderedItems: PlaylistItem[]) {
  const timestamp = nowIso()

  const updated: LocalPlaylistItem[] = orderedItems.map((item, index) => ({
    ...item,
    playlistId,
    position: index,
    updatedAt: timestamp,
    dirty: true,
    syncError: null
  }))

  await db.playlistItems.bulkPut(updated)
  notifyLocalMutation()
}

export async function listInstruments(db: ZChordsDexie) {
  const rows = await db.instruments.toArray()

  return rows
    .filter(row => !row.deletedAt)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function searchChords(db: ZChordsDexie, instrumentId: string, search = ''): Promise<ChordShape[]> {
  const normalized = search.trim().toLowerCase()
  const instrument = await db.instruments.get(instrumentId)
  const rows = await db.chordShapes.where('instrumentId').equals(instrumentId).toArray()
  const filtered = rows
    .filter(row => !row.deletedAt)
    .filter((row) => {
      if (!normalized) {
        return true
      }

      return row.chordName.toLowerCase().includes(normalized)
    })

  const byChord = new Map<string, ChordShape[]>()

  for (const shape of filtered) {
    const list = byChord.get(shape.chordName) ?? []
    list.push(shape)
    byChord.set(shape.chordName, list)
  }

  const primaryShapes: ChordShape[] = []

  for (const shapes of byChord.values()) {
    primaryShapes.push(...pickPrimaryVariations(shapes, 3, instrument?.stringsCount))
  }

  return primaryShapes.sort((a, b) => {
    const byName = a.chordName.localeCompare(b.chordName)
    if (byName !== 0) {
      return byName
    }

    return scoreChordShape(a) - scoreChordShape(b)
  })
}

export async function getChordVariations(
  db: ZChordsDexie,
  instrumentId: string,
  chordName: string,
  limit = 6
): Promise<ChordShape[]> {
  const normalized = chordName.trim().toLowerCase()
  const instrument = await db.instruments.get(instrumentId)
  const rows = await db.chordShapes.where('instrumentId').equals(instrumentId).toArray()

  const matches = rows
    .filter(row => !row.deletedAt)
    .filter(row => row.chordName.toLowerCase() === normalized)

  return pickPrimaryVariations(matches, limit, instrument?.stringsCount)
}
