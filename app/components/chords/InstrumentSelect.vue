<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { instruments, refreshInstruments } = useInstrument()
const open = ref(false)

function iconForInstrument(code: string) {
  if (code === 'guitar') {
    return 'i-lucide-guitar'
  }

  if (code === 'ukulele') {
    return 'i-lucide-music-2'
  }

  if (code === 'cavaquinho') {
    return 'i-lucide-music'
  }

  if (code.startsWith('viola_')) {
    return 'i-lucide-guitar'
  }

  return 'i-lucide-music'
}

const selectedInstrument = computed(() => {
  return instruments.value.find(instrument => instrument.id === props.modelValue) ?? null
})

const buttonLabel = computed(() => {
  if (!selectedInstrument.value) {
    return 'Escolher instrumento'
  }

  return selectedInstrument.value.name
})

function chooseInstrument(instrumentId: string) {
  emit('update:modelValue', instrumentId)
  open.value = false
}

onMounted(async () => {
  await refreshInstruments()
})
</script>

<template>
  <div class="flex items-center justify-end">
    <UButton
      color="neutral"
      variant="outline"
      :icon="iconForInstrument(selectedInstrument?.code ?? '')"
      trailing-icon="i-lucide-chevron-down"
      class="max-w-full"
      @click="open = true"
    >
      <span class="truncate">
        {{ buttonLabel }}
      </span>
    </UButton>

    <USlideover
      v-model:open="open"
      side="right"
      :ui="{
        content: 'w-full max-w-full sm:max-w-md h-full inset-y-0 right-0 rounded-none',
        body: 'p-3'
      }"
      title="Instrumentos"
      description="Selecione o instrumento para acordes e variações"
    >
      <template #body>
        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="instrument in instruments"
            :key="instrument.id"
            type="button"
            class="flex items-center justify-between gap-3 rounded-md border border-default bg-elevated/40 px-3 py-3 text-left transition hover:bg-elevated"
            :class="instrument.id === modelValue ? 'ring-1 ring-primary border-primary/40' : ''"
            @click="chooseInstrument(instrument.id)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="inline-flex size-8 items-center justify-center rounded-md bg-primary/12 text-primary">
                <UIcon
                  :name="iconForInstrument(instrument.code)"
                  class="size-4"
                />
              </span>

              <div class="min-w-0">
                <p class="truncate text-sm font-medium">
                  {{ instrument.name }}
                </p>
                <p class="truncate text-xs text-muted">
                  {{ instrument.tuning.join(' · ') }}
                </p>
              </div>
            </div>

            <UIcon
              v-if="instrument.id === modelValue"
              name="i-lucide-check"
              class="size-4 text-primary"
            />
          </button>
        </div>
      </template>
    </USlideover>
  </div>
</template>
