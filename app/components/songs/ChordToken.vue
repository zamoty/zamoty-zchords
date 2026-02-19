<script setup lang="ts">
const props = defineProps<{
  chord: string
}>()

const emit = defineEmits<{
  click: [chord: string]
}>()
</script>

<template>
  <UButton
    :label="props.chord"
    size="xs"
    color="primary"
    variant="soft"
    class="font-chords font-semibold rounded-md align-middle"
    @click="emit('click', props.chord)"
  />
</template>
