import Dexie, { type Table } from 'dexie'
import type {
  LocalChordShape,
  LocalInstrument,
  LocalMetaEntry,
  LocalPlaylist,
  LocalPlaylistItem,
  LocalSong
} from '#shared/types/domain'

export class ZChordsDexie extends Dexie {
  instruments!: Table<LocalInstrument, string>
  chordShapes!: Table<LocalChordShape, string>
  songs!: Table<LocalSong, string>
  playlists!: Table<LocalPlaylist, string>
  playlistItems!: Table<LocalPlaylistItem, string>
  meta!: Table<LocalMetaEntry, string>

  constructor() {
    super('zchords')

    this.version(1).stores({
      instruments: '&id, code, name, updatedAt, deletedAt, dirty',
      chordShapes: '&id, instrumentId, chordName, [instrumentId+chordName], updatedAt, deletedAt, dirty',
      songs: '&id, title, artist, searchText, updatedAt, deletedAt, dirty',
      playlists: '&id, name, updatedAt, deletedAt, dirty',
      playlistItems: '&id, playlistId, songId, [playlistId+position], position, updatedAt, deletedAt, dirty',
      meta: '&id, &key, updatedAt, deletedAt, dirty'
    })
  }
}

let dbSingleton: ZChordsDexie | null = null

export function getLocalDb() {
  if (!dbSingleton) {
    dbSingleton = new ZChordsDexie()
  }

  return dbSingleton
}
