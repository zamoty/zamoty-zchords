<script setup lang="ts">
import type { LocalPlaylist, LocalPlaylistItem, LocalSong } from '#shared/types/domain'
import {
  addSongToPlaylist,
  getSong,
  listPlaylistItems,
  listPlaylists,
  listSongs,
  removePlaylistItem,
  reorderPlaylistItems
} from '~/services/db/repositories.client'

interface PlaylistEntry {
  playlistItem: LocalPlaylistItem
  song: LocalSong | null
}

const route = useRoute()
const db = useDb()
const { refreshPendingDirtyCount } = useSync()

const playlist = ref<LocalPlaylist | null>(null)
const allSongs = ref<LocalSong[]>([])
const entries = ref<PlaylistEntry[]>([])
const selectedSongId = ref<string | undefined>(undefined)

const songOptions = computed(() => {
  return allSongs.value.map(song => ({
    label: `${song.title} ${song.artist ? `• ${song.artist}` : ''}`,
    value: song.id
  }))
})

async function loadData() {
  const playlistId = String(route.params.id)
  const playlists = await listPlaylists(db)
  playlist.value = playlists.find(item => item.id === playlistId) ?? null

  allSongs.value = await listSongs(db)

  const playlistItems = await listPlaylistItems(db, playlistId)
  entries.value = await Promise.all(playlistItems.map(async (item) => {
    return {
      playlistItem: item,
      song: await getSong(db, item.songId)
    }
  }))
}

async function handleAddSong() {
  if (!playlist.value || !selectedSongId.value) {
    return
  }

  await addSongToPlaylist(db, playlist.value.id, selectedSongId.value)
  selectedSongId.value = undefined
  await loadData()
  await refreshPendingDirtyCount()
}

async function handleRemove(itemId: string) {
  await removePlaylistItem(db, itemId)
  await loadData()
  await refreshPendingDirtyCount()
}

async function handleReorder(items: LocalPlaylistItem[]) {
  if (!playlist.value) {
    return
  }

  await reorderPlaylistItems(db, playlist.value.id, items)
  await loadData()
  await refreshPendingDirtyCount()
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div
    v-if="playlist"
    class="space-y-4"
  >
    <div class="flex items-center justify-between gap-2">
      <UButton
        to="/playlists"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
      />

      <div class="text-right">
        <p class="font-title text-xl leading-6">
          {{ playlist.name }}
        </p>
        <p class="text-sm text-muted">
          {{ playlist.description || 'Sem descrição' }}
        </p>
      </div>
    </div>

    <UCard>
      <template #header>
        <p class="font-semibold">
          Adicionar música
        </p>
      </template>

      <div class="flex items-center gap-2">
        <USelect
          v-model="selectedSongId"
          :items="songOptions"
          value-key="value"
          placeholder="Escolha uma música"
          class="flex-1"
        />
        <UButton
          label="Adicionar"
          icon="i-lucide-plus"
          @click="handleAddSong"
        />
      </div>
    </UCard>

    <PlaylistSortableList
      :items="entries"
      @remove="handleRemove"
      @reorder="handleReorder"
    />

    <UAlert
      v-if="entries.length === 0"
      color="neutral"
      variant="subtle"
      icon="i-lucide-list-music"
      title="Playlist vazia"
      description="Adicione músicas e arraste para reordenar no celular."
    />
  </div>

  <UAlert
    v-else
    color="warning"
    variant="subtle"
    icon="i-lucide-triangle-alert"
    title="Playlist não encontrada"
  />
</template>
