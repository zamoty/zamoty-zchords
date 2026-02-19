<script setup lang="ts">
import { parseChordPro } from '~/utils/chords/chordpro'

const props = defineProps<{
  content: string
  semitones: number
}>()

const emit = defineEmits<{
  chordClick: [chord: string]
}>()

const parsedLines = computed(() => parseChordPro(props.content, props.semitones))
</script>

<template>
  <div class="font-mono leading-7 overflow-x-auto">
    <div
      v-for="(line, lineIndex) in parsedLines"
      :key="`${lineIndex}-${line.raw}`"
      class="min-w-full"
    >
      <div
        v-if="line.placements.length > 0"
        class="relative h-6 whitespace-pre text-primary"
      >
        <span class="invisible select-none">{{ line.chordLine || ' ' }}</span>

        <button
          v-for="placement in line.placements"
          :key="`${lineIndex}-${placement.start}-${placement.chord}`"
          type="button"
          class="absolute top-0 font-semibold hover:underline focus:outline-none"
          :style="{ left: `${placement.start}ch` }"
          @click="emit('chordClick', placement.original)"
        >
          {{ placement.chord }}
        </button>
      </div>

      <p :class="line.placements.length > 0 ? 'whitespace-pre min-h-7' : 'whitespace-pre'">
        {{ line.lyric || ' ' }}
      </p>
    </div>
  </div>
</template>
