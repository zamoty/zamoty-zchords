<script setup lang="ts">
import type { LocalPlaylist } from '#shared/types/domain'
import { listPlaylists, savePlaylist, softDeletePlaylist } from '~/services/db/repositories.client'

const db = useDb()
const { refreshPendingDirtyCount } = useSync()

const playlists = ref<LocalPlaylist[]>([])

async function loadPlaylists() {
  playlists.value = await listPlaylists(db)
}

async function onCreatePlaylist(payload: { name: string, description: string | null }) {
  await savePlaylist(db, payload)
  await loadPlaylists()
  await refreshPendingDirtyCount()
}

async function deletePlaylist(id: string) {
  await softDeletePlaylist(db, id)
  await loadPlaylists()
  await refreshPendingDirtyCount()
}

onMounted(async () => {
  await loadPlaylists()
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="font-title text-2xl">
        Playlists
      </p>
      <p class="text-sm text-muted">
        Organize repertórios e ordem de execução
      </p>
    </div>

    <PlaylistEditor @submit="onCreatePlaylist" />

    <div class="space-y-2">
      <UCard
        v-for="playlist in playlists"
        :key="playlist.id"
      >
        <div class="flex items-center justify-between gap-3">
          <NuxtLink
            :to="`/playlists/${playlist.id}`"
            class="min-w-0 flex-1"
          >
            <p class="font-semibold truncate">
              {{ playlist.name }}
            </p>
            <p class="text-sm text-muted truncate">
              {{ playlist.description || 'Sem descrição' }}
            </p>
          </NuxtLink>

          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            @click="deletePlaylist(playlist.id)"
          />
        </div>
      </UCard>

      <UAlert
        v-if="playlists.length === 0"
        color="neutral"
        variant="subtle"
        icon="i-lucide-list-music"
        title="Nenhuma playlist criada"
        description="Crie uma playlist para montar seu setlist."
      />
    </div>
  </div>
</template>
