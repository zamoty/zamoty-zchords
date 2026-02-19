import { getLocalDb } from '~/services/db/dexie.client'
import { ensureDeviceId } from '~/services/db/metaRepository.client'
import { bootstrapInitialSync } from '~/services/sync/syncService.client'

export default defineNuxtPlugin(async (nuxtApp) => {
  const db = getLocalDb()

  if (!db.isOpen()) {
    await db.open()
  }

  const deviceId = await ensureDeviceId(db)

  nuxtApp.provide('db', db)

  void bootstrapInitialSync(db, deviceId).catch(() => {
    // Keep app fully usable offline even if bootstrap sync fails.
  })
})
