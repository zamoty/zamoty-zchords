<script setup lang="ts">
import type { ChordShape } from '#shared/types/domain'
import { getChordVariations } from '~/services/db/repositories.client'

const props = defineProps<{
  modelValue: boolean
  chordName: string
  instrumentId: string | null
  initialVariationIndex?: number
  limit?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const db = useDb()
const variations = ref<ChordShape[]>([])
const variationIndex = ref(0)

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const currentVariation = computed(() => {
  return variations.value[variationIndex.value] ?? null
})

function resolveInitialIndex(length: number) {
  const target = Number(props.initialVariationIndex ?? 0)
  if (!Number.isFinite(target) || length <= 0) {
    return 0
  }

  return Math.min(Math.max(Math.trunc(target), 0), length - 1)
}

async function loadVariations() {
  if (!props.instrumentId || !props.chordName) {
    variations.value = []
    variationIndex.value = 0
    return
  }

  variations.value = await getChordVariations(
    db,
    props.instrumentId,
    props.chordName,
    props.limit ?? 6
  )

  variationIndex.value = resolveInitialIndex(variations.value.length)
}

function nextVariation() {
  if (variations.value.length === 0) {
    return
  }

  variationIndex.value = (variationIndex.value + 1) % variations.value.length
}

function prevVariation() {
  if (variations.value.length === 0) {
    return
  }

  variationIndex.value = (variationIndex.value - 1 + variations.value.length) % variations.value.length
}

watch(() => [
  props.modelValue,
  props.instrumentId,
  props.chordName,
  props.initialVariationIndex,
  props.limit
], () => {
  if (props.modelValue) {
    void loadVariations()
  }
})
</script>

<template>
  <USlideover
    v-model:open="open"
    side="right"
    :ui="{
      content: 'w-full max-w-full h-full inset-y-0 right-0 rounded-none sm:ring-0 shadow-none',
      body: 'flex-1 overflow-y-auto p-2 sm:p-3'
    }"
    title="Variações de acorde"
    :description="chordName"
  >
    <template #body>
      <div class="space-y-4 h-full flex flex-col">
        <ChordDiagram
          :shape="currentVariation"
          :large="true"
        />

        <div class="mt-auto flex items-center justify-between gap-2">
          <UButton
            label="Anterior"
            icon="i-lucide-chevron-left"
            variant="outline"
            @click="prevVariation"
          />

          <p class="text-sm text-muted">
            {{ variations.length === 0 ? '0/0' : `${variationIndex + 1}/${variations.length}` }}
          </p>

          <UButton
            label="Próximo"
            trailing-icon="i-lucide-chevron-right"
            variant="outline"
            @click="nextVariation"
          />
        </div>
      </div>
    </template>
  </USlideover>
</template>
