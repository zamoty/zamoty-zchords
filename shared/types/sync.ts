import type {
  ChordShape,
  Instrument,
  MetaEntry,
  Playlist,
  PlaylistItem,
  Song,
  SyncTableName
} from './domain'

export interface PullQuery {
  since: string
  deviceId: string
}

export interface SyncChangesPayload {
  instruments: Instrument[]
  chord_shapes: ChordShape[]
  songs: Song[]
  playlists: Playlist[]
  playlist_items: PlaylistItem[]
  meta: MetaEntry[]
}

export interface PullResponse {
  serverTime: string
  changes: SyncChangesPayload
}

export interface PushRequest {
  deviceId: string
  changes: Partial<SyncChangesPayload>
}

export interface RejectedSyncRow {
  id: string
  reason: 'invalid_payload' | 'stale_update' | 'server_error'
  message?: string
}

export type SyncAcceptedMap = Record<SyncTableName, string[]>
export type SyncRejectedMap = Record<SyncTableName, RejectedSyncRow[]>

export interface PushResponse {
  serverTime: string
  accepted: SyncAcceptedMap
  rejected: SyncRejectedMap
}
