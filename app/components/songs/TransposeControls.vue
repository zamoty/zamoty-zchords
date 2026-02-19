<script setup lang="ts">
const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function update(delta: number) {
  const next = Math.max(-12, Math.min(12, props.modelValue + delta))
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <UButton
      icon="i-lucide-minus"
      color="neutral"
      variant="outline"
      @click="update(-1)"
    />
    <UBadge
      color="neutral"
      variant="soft"
      class="px-3 py-1"
    >
      {{ modelValue >= 0 ? `+${modelValue}` : modelValue }} semitom
    </UBadge>
    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="outline"
      @click="update(1)"
    />
    <UButton
      label="Resetar"
      color="neutral"
      variant="ghost"
      @click="emit('update:modelValue', 0)"
    />
  </div>
</template>
