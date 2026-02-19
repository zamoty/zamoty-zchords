<script setup lang="ts">
import type { LocalSong } from '#shared/types/domain'
import { listSongs, saveSong, softDeleteSong } from '~/services/db/repositories.client'

const db = useDb()
const { refreshPendingDirtyCount } = useSync()

const loading = ref(true)
const songs = ref<LocalSong[]>([])
const search = ref('')
const editorOpen = ref(false)

const form = reactive({
  id: '',
  title: '',
  artist: '',
  key: '',
  capo: '',
  content: ''
})

const filteredSongs = computed(() => songs.value)

async function loadSongs() {
  loading.value = true
  songs.value = await listSongs(db, search.value)
  loading.value = false
}

function resetForm() {
  form.id = ''
  form.title = ''
  form.artist = ''
  form.key = ''
  form.capo = ''
  form.content = ''
}

function openNewSongModal() {
  resetForm()
  editorOpen.value = true
}

function openEditSongModal(song: LocalSong) {
  form.id = song.id
  form.title = song.title
  form.artist = song.artist ?? ''
  form.key = song.key ?? ''
  form.capo = song.capo !== null ? String(song.capo) : ''
  form.content = song.content
  editorOpen.value = true
}

async function submitSong() {
  if (!form.title.trim() || !form.content.trim()) {
    return
  }

  await saveSong(db, {
    id: form.id || undefined,
    title: form.title.trim(),
    artist: form.artist.trim() || null,
    key: form.key.trim() || null,
    capo: form.capo.trim() ? Number(form.capo) : null,
    content: form.content
  })

  editorOpen.value = false
  await loadSongs()
  await refreshPendingDirtyCount()
}

async function deleteSong(songId: string) {
  await softDeleteSong(db, songId)
  await loadSongs()
  await refreshPendingDirtyCount()
}

watch(search, async () => {
  await loadSongs()
})

onMounted(async () => {
  await loadSongs()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <div>
        <p class="font-title text-2xl">
          Músicas
        </p>
        <p class="text-sm text-muted">
          Biblioteca de cifras em ChordPro
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          to="/import/share"
          label="Importar"
          icon="i-lucide-share-2"
          color="neutral"
          variant="outline"
        />

        <UButton
          label="Nova"
          icon="i-lucide-plus"
          @click="openNewSongModal"
        />
      </div>
    </div>

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Buscar por título ou artista"
      class="w-full"
    />

    <div
      v-if="loading"
      class="py-10 flex justify-center"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-6 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="filteredSongs.length === 0"
      class="space-y-3"
    >
      <UAlert
        color="neutral"
        variant="subtle"
        icon="i-lucide-folder-open"
        title="Nenhuma música encontrada"
        description="Se for o primeiro acesso offline, conecte-se e toque em Sincronizar em Ajustes."
      />
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <UCard
        v-for="song in filteredSongs"
        :key="song.id"
      >
        <div class="flex items-start justify-between gap-2">
          <NuxtLink
            :to="`/songs/${song.id}`"
            class="min-w-0 flex-1"
          >
            <p class="font-semibold truncate">
              {{ song.title }}
            </p>
            <p class="text-sm text-muted truncate">
              {{ song.artist || 'Sem artista' }}
            </p>
          </NuxtLink>

          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              @click="openEditSongModal(song)"
            />
            <UButton
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              @click="deleteSong(song.id)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <UModal
      v-model:open="editorOpen"
      title="Música"
      description="Preencha os campos abaixo"
    >
      <template #body>
        <form
          class="space-y-3"
          @submit.prevent="submitSong"
        >
          <UFormField
            label="Título"
            required
          >
            <UInput
              v-model="form.title"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Artista">
            <UInput
              v-model="form.artist"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-2">
            <UFormField label="Tom">
              <UInput
                v-model="form.key"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Capotraste">
              <UInput
                v-model="form.capo"
                type="number"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Conteúdo (ChordPro)"
            required
          >
            <UTextarea
              v-model="form.content"
              :rows="10"
              class="w-full font-chords"
            />
          </UFormField>

          <UButton
            type="submit"
            icon="i-lucide-save"
            label="Salvar música"
            block
          />
        </form>
      </template>
    </UModal>
  </div>
</template>
