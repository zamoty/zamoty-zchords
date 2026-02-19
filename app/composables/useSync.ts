import type { LocalSyncStatus } from '#shared/types/domain'
import { getDeviceId, getLastSyncedAt } from '~/services/db/metaRepository.client'
import { registerLocalMutationHook } from '~/services/db/repositories.client'
import { getDirtyCount, pushDirtyChanges, runManualSync } from '~/services/sync/syncService.client'

let initialized = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function useSync() {
  const db = useDb()
  const toast = useToast()

  const state = useState<LocalSyncStatus>('sync-state', () => ({
    status: 'idle',
    lastSyncedAt: null,
    lastError: null,
    pendingDirtyCount: 0
  }))

  async function refreshPendingDirtyCount() {
    state.value.pendingDirtyCount = await getDirtyCount(db)
  }

  async function loadLastSyncedAt() {
    state.value.lastSyncedAt = await getLastSyncedAt(db)
  }

  async function withSyncState<T>(task: () => Promise<T>) {
    state.value.status = 'syncing'
    state.value.lastError = null

    try {
      const result = await task()
      state.value.status = 'idle'
      await refreshPendingDirtyCount()
      return result
    } catch (error) {
      state.value.status = 'error'
      state.value.lastError = String(error)
      toast.add({
        title: 'Falha na sincronização',
        description: 'As mudanças locais foram mantidas. Tente novamente.',
        color: 'warning'
      })
      await refreshPendingDirtyCount()
      throw error
    }
  }

  function hasRejectedRows(payload: {
    rejected: Record<string, Array<unknown>>
  }) {
    return Object.values(payload.rejected).some(rows => rows.length > 0)
  }

  async function runAutoPush() {
    if (!navigator.onLine) {
      return
    }

    const deviceId = await getDeviceId(db)

    if (!deviceId) {
      return
    }

    await withSyncState(async () => {
      const result = await pushDirtyChanges(db, deviceId)
      if (result) {
        state.value.lastSyncedAt = result.serverTime
        if (hasRejectedRows(result)) {
          toast.add({
            title: 'Conflitos de sincronização',
            description: 'Algumas alterações locais foram rejeitadas e continuam pendentes.',
            color: 'warning'
          })
        }
      }
      return result
    })
  }

  function scheduleAutoPush() {
    if (!navigator.onLine) {
      return
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      void runAutoPush().catch(() => {
        // Error state/toast handled inside withSyncState.
      })
    }, 2500)
  }

  async function syncNow() {
    const deviceId = await getDeviceId(db)

    if (!deviceId) {
      throw new Error('deviceId not initialized')
    }

    await withSyncState(async () => {
      const { pullResult, pushResult } = await runManualSync(db, deviceId)
      state.value.lastSyncedAt = pushResult?.serverTime ?? pullResult.serverTime

      if (pushResult && hasRejectedRows(pushResult)) {
        toast.add({
          title: 'Conflitos de sincronização',
          description: 'Algumas alterações locais foram rejeitadas e continuam pendentes.',
          color: 'warning'
        })
      }
    })
  }

  if (import.meta.client && !initialized) {
    initialized = true
    registerLocalMutationHook(() => {
      void refreshPendingDirtyCount()
      scheduleAutoPush()
    })

    window.addEventListener('online', () => {
      scheduleAutoPush()
    })

    void loadLastSyncedAt()
    void refreshPendingDirtyCount()
  }

  return {
    state,
    syncNow,
    refreshPendingDirtyCount
  }
}
