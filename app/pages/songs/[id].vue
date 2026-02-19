<script setup lang="ts">
import type { LocalSong } from '#shared/types/domain'
import { getSong } from '~/services/db/repositories.client'

const route = useRoute()
const db = useDb()
const { setStageMode } = useStageMode()
const { selectedInstrumentId, refreshInstruments, setInstrument } = useInstrument()

const song = ref<LocalSong | null>(null)
const semitones = ref(0)
const chordModalOpen = ref(false)
const selectedChordName = ref('')
const stageModeOpen = ref(false)

async function loadSong() {
  const songId = String(route.params.id)
  song.value = await getSong(db, songId)
}

function onChordClick(chordName: string) {
  selectedChordName.value = chordName
  chordModalOpen.value = true
}

watch(stageModeOpen, (value) => {
  setStageMode(value)
})

onMounted(async () => {
  await refreshInstruments()
  await loadSong()
})

onBeforeUnmount(() => {
  setStageMode(false)
})
</script>

<template>
  <div
    v-if="song"
    class="space-y-4"
  >
    <div class="flex items-center justify-between gap-2">
      <UButton
        to="/songs"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
      />

      <UButton
        :label="stageModeOpen ? 'Sair do palco' : 'Modo palco'"
        :icon="stageModeOpen ? 'i-lucide-monitor-off' : 'i-lucide-monitor-play'"
        variant="soft"
        @click="stageModeOpen = !stageModeOpen"
      />
    </div>

    <div>
      <p class="font-title text-2xl leading-7">
        {{ song.title }}
      </p>
      <p class="text-sm text-muted">
        {{ song.artist || 'Sem artista' }}
      </p>
    </div>

    <InstrumentSelect
      :model-value="selectedInstrumentId"
      @update:model-value="setInstrument"
    />

    <TransposeControls v-model="semitones" />

    <UCard>
      <ChordProRenderer
        :content="song.content"
        :semitones="semitones"
        @chord-click="onChordClick"
      />
    </UCard>

    <ChordVariationsModal
      v-model="chordModalOpen"
      :chord-name="selectedChordName"
      :instrument-id="selectedInstrumentId"
    />

    <StageModeOverlay
      v-model="stageModeOpen"
      :title="song.title"
      :content="song.content"
      :semitones="semitones"
      @chord-click="onChordClick"
    />
  </div>

  <UAlert
    v-else
    color="warning"
    variant="subtle"
    icon="i-lucide-triangle-alert"
    title="Música não encontrada"
    description="Essa música pode ter sido removida localmente."
  />
</template>
