import type { ZChordsDexie } from '~/services/db/dexie.client'
import { getLocalDb } from '~/services/db/dexie.client'

export function useDb(): ZChordsDexie {
  if (import.meta.server) {
    throw new Error('useDb() is client-only')
  }

  const nuxtApp = useNuxtApp()
  return nuxtApp.$db ?? getLocalDb()
}
