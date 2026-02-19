<script setup lang="ts">
const route = useRoute()

const tabs = [
  { label: 'Músicas', icon: 'i-lucide-music-3', to: '/songs' },
  { label: 'Playlists', icon: 'i-lucide-list-music', to: '/playlists' },
  { label: 'Acordes', icon: 'i-lucide-guitar', to: '/chords' },
  { label: 'Ajustes', icon: 'i-lucide-settings-2', to: '/settings' }
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <nav class="fixed bottom-0 inset-x-0 z-40 border-t border-default/60 bg-default/95 backdrop-blur supports-[backdrop-filter]:bg-default/75">
    <UContainer class="py-2">
      <div class="grid grid-cols-4 gap-2">
        <UButton
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          :label="tab.label"
          :icon="tab.icon"
          variant="ghost"
          size="sm"
          class="flex-col h-14 rounded-md"
          :color="isActive(tab.to) ? 'primary' : 'neutral'"
          :ui="{ leadingIcon: 'size-5 mb-0.5' }"
        />
      </div>
    </UContainer>
  </nav>
</template>
