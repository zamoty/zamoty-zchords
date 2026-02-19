export type SyncTableName
  = | 'instruments'
    | 'chord_shapes'
    | 'songs'
    | 'playlists'
    | 'playlist_items'
    | 'meta'

export type ShapeFret = string | number | null
export type ShapeFrets = ShapeFret[] | string

export interface BaseSyncEntity {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Instrument extends BaseSyncEntity {
  code: string
  name: string
  tuning: string[]
  stringsCount: number
}

export interface ChordShape extends BaseSyncEntity {
  instrumentId: string
  chordName: string
  frets: ShapeFrets
  fingers: number[] | null
  barres: number[] | null
  baseFret: number
  tags: Record<string, unknown> | null
  source: 'chords-db' | 'manual'
}

export interface Song extends BaseSyncEntity {
  title: string
  artist: string | null
  contentFormat: 'chordpro'
  content: string
  key: string | null
  capo: number | null
}

export interface Playlist extends BaseSyncEntity {
  name: string
  description: string | null
}

export interface PlaylistItem extends BaseSyncEntity {
  playlistId: string
  songId: string
  position: number
}

export interface MetaEntry extends BaseSyncEntity {
  key: string
  value: Record<string, unknown>
}

export interface LocalSyncFlags {
  dirty: boolean
  syncError: string | null
}

export type LocalInstrument = Instrument & LocalSyncFlags
export type LocalChordShape = ChordShape & LocalSyncFlags
export type LocalSong = Song & LocalSyncFlags & { searchText: string }
export type LocalPlaylist = Playlist & LocalSyncFlags
export type LocalPlaylistItem = PlaylistItem & LocalSyncFlags
export type LocalMetaEntry = MetaEntry & LocalSyncFlags

export interface LocalSyncStatus {
  status: 'idle' | 'syncing' | 'error'
  lastSyncedAt: string | null
  lastError: string | null
  pendingDirtyCount: number
}
