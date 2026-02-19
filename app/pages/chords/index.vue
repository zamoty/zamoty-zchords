<script setup lang="ts">
import { searchChords } from '~/services/db/repositories.client'

const ROOT_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

const ENHARMONIC_TO_SHARP: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Fb': 'E',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  'Cb': 'B',
  'E#': 'F',
  'B#': 'C'
}

const ROOT_REGEX = /^([A-G](?:#|b)?)/

const db = useDb()
const { selectedInstrumentId, refreshInstruments, setInstrument } = useInstrument()

const allChordNames = ref<string[]>([])
const selectedRoot = ref<string | null>(null)
const selectedChordName = ref('')
const loading = ref(false)
const slideoverOpen = ref(false)

function normalizeRoot(root: string) {
  return ENHARMONIC_TO_SHARP[root] ?? root
}

function getChordRoot(chordName: string) {
  const match = chordName.match(ROOT_REGEX)
  if (!match?.[1]) {
    return null
  }

  return normalizeRoot(match[1])
}

async function loadChordNames() {
  if (!selectedInstrumentId.value) {
    allChordNames.value = []
    selectedRoot.value = null
    selectedChordName.value = ''
    return
  }

  loading.value = true

  try {
    const shapes = await searchChords(db, selectedInstrumentId.value, '')
    const unique = Array.from(new Set(shapes.map(shape => shape.chordName)))
      .sort((a, b) => a.localeCompare(b))

    allChordNames.value = unique

    const availableRoots = ROOT_ORDER.filter((root) => {
      return unique.some(name => getChordRoot(name) === root)
    })

    if (availableRoots.length === 0) {
      selectedRoot.value = null
      selectedChordName.value = ''
      return
    }

    if (selectedRoot.value && !availableRoots.includes(selectedRoot.value as (typeof ROOT_ORDER)[number])) {
      selectedRoot.value = null
      selectedChordName.value = ''
    }
  } finally {
    loading.value = false
  }
}

function selectRoot(root: string) {
  selectedRoot.value = root
  selectedChordName.value = ''
}

function goBackToRoots() {
  selectedRoot.value = null
  selectedChordName.value = ''
}

function openChord(chordName: string) {
  selectedChordName.value = chordName
  slideoverOpen.value = true
}

const rootCards = computed(() => {
  const available = new Set(
    allChordNames.value
      .map(name => getChordRoot(name))
      .filter((value): value is string => Boolean(value))
  )

  return ROOT_ORDER.map(root => ({
    root,
    enabled: available.has(root)
  }))
})

const chordCards = computed(() => {
  if (!selectedRoot.value) {
    return []
  }

  return allChordNames.value.filter(name => getChordRoot(name) === selectedRoot.value)
})

watch(selectedInstrumentId, async () => {
  await loadChordNames()
})

onMounted(async () => {
  await refreshInstruments()
  await loadChordNames()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="font-title text-2xl">
          Dicionário de acordes
        </p>
        <p class="text-sm text-muted">
          Escolha a nota base e depois o acorde
        </p>
      </div>

      <InstrumentSelect
        :model-value="selectedInstrumentId"
        @update:model-value="setInstrument"
      />
    </div>

    <UCard v-if="!selectedRoot">
      <template #header>
        <p class="font-semibold">
          Notas base
        </p>
      </template>

      <div
        v-if="loading"
        class="py-6 text-center text-sm text-muted"
      >
        Carregando acordes...
      </div>

      <div
        v-else
        class="grid grid-cols-4 gap-2"
      >
        <button
          v-for="card in rootCards"
          :key="card.root"
          type="button"
          class="rounded-md border border-default px-2 py-3 text-center transition"
          :class="card.enabled ? 'bg-elevated/40 hover:bg-elevated text-highlighted' : 'bg-muted/40 text-muted cursor-not-allowed'"
          :disabled="!card.enabled"
          @click="selectRoot(card.root)"
        >
          <p class="font-title text-lg leading-none">
            {{ card.root }}
          </p>
        </button>
      </div>
    </UCard>

    <UCard v-else>
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="goBackToRoots"
            />
            <p class="font-semibold">
              Acordes de {{ selectedRoot }}
            </p>
          </div>

          <UBadge
            color="neutral"
            variant="soft"
          >
            {{ chordCards.length }}
          </UBadge>
        </div>
      </template>

      <div
        v-if="chordCards.length > 0"
        class="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        <button
          v-for="chordName in chordCards"
          :key="chordName"
          type="button"
          class="rounded-md border border-default bg-elevated/30 px-2 py-3 text-center transition hover:bg-elevated"
          @click="openChord(chordName)"
        >
          <p class="font-title text-base leading-tight">
            {{ chordName }}
          </p>
        </button>
      </div>

      <p
        v-else
        class="text-sm text-muted"
      >
        Nenhum acorde encontrado para esta nota.
      </p>
    </UCard>

    <ChordVariationsModal
      v-model="slideoverOpen"
      :chord-name="selectedChordName"
      :instrument-id="selectedInstrumentId"
      :limit="12"
    />
  </div>
</template>
