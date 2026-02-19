<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  content: string
  semitones: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'chordClick': [chord: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const autoScrollEnabled = ref(false)
const autoScrollSpeed = ref(3)
let intervalId: ReturnType<typeof setInterval> | null = null

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

function clearAutoScroll() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function setupAutoScroll() {
  clearAutoScroll()

  if (!open.value || !autoScrollEnabled.value || !containerRef.value) {
    return
  }

  intervalId = setInterval(() => {
    if (!containerRef.value) {
      return
    }

    containerRef.value.scrollBy({ top: autoScrollSpeed.value * 0.6 })
  }, 24)
}

function changeSpeed(delta: number) {
  autoScrollSpeed.value = Math.max(1, Math.min(20, autoScrollSpeed.value + delta))
  setupAutoScroll()
}

function handleTapScroll(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (target.closest('button')) {
    return
  }

  const container = containerRef.value

  if (!container) {
    return
  }

  const rect = container.getBoundingClientRect()
  const tapY = event.clientY - rect.top
  const step = Math.max(80, Math.round(rect.height * 0.35))

  container.scrollBy({
    top: tapY < rect.height / 2 ? -step : step,
    behavior: 'smooth'
  })
}

watch([open, autoScrollEnabled], () => {
  setupAutoScroll()
})

onBeforeUnmount(() => {
  clearAutoScroll()
})
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[70] bg-black text-white flex flex-col"
  >
    <div class="px-4 py-3 border-b border-white/20 flex items-center justify-between gap-3">
      <p class="font-title text-base truncate">
        {{ title }}
      </p>

      <div class="flex items-center gap-2">
        <UButton
          :label="autoScrollEnabled ? 'Parar' : 'Auto'"
          color="neutral"
          variant="soft"
          @click="autoScrollEnabled = !autoScrollEnabled"
        />
        <UButton
          icon="i-lucide-minus"
          color="neutral"
          variant="soft"
          @click="changeSpeed(-1)"
        />
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ autoScrollSpeed }}
        </UBadge>
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="soft"
          @click="changeSpeed(1)"
        />
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="soft"
          @click="open = false"
        />
      </div>
    </div>

    <div
      ref="containerRef"
      class="flex-1 overflow-y-auto px-4 py-6 text-2xl leading-[2.25rem]"
      @click="handleTapScroll"
    >
      <ChordProRenderer
        :content="content"
        :semitones="semitones"
        @chord-click="emit('chordClick', $event)"
      />
    </div>
  </div>
</template>
