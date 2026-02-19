<script setup lang="ts">
const { state } = useSync()

const indicator = computed(() => {
  if (state.value.status === 'syncing') {
    return {
      color: 'info' as const,
      icon: 'i-lucide-refresh-cw',
      label: 'Sincronizando'
    }
  }

  if (state.value.status === 'error') {
    return {
      color: 'warning' as const,
      icon: 'i-lucide-alert-circle',
      label: 'Com erro'
    }
  }

  return {
    color: 'success' as const,
    icon: 'i-lucide-check-circle-2',
    label: state.value.pendingDirtyCount > 0 ? `Pendente (${state.value.pendingDirtyCount})` : 'Em dia'
  }
})
</script>

<template>
  <UBadge
    :color="indicator.color"
    variant="subtle"
    class="rounded-full"
  >
    <UIcon
      :name="indicator.icon"
      class="size-3.5 mr-1"
      :class="state.status === 'syncing' ? 'animate-spin' : ''"
    />
    {{ indicator.label }}
  </UBadge>
</template>
