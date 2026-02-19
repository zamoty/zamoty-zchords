<script setup lang="ts">
import draggable from 'vuedraggable'
import type { LocalPlaylistItem, LocalSong } from '#shared/types/domain'

interface PlaylistSortableEntry {
  playlistItem: LocalPlaylistItem
  song: LocalSong | null
}

const props = defineProps<{
  items: PlaylistSortableEntry[]
}>()

const emit = defineEmits<{
  reorder: [items: LocalPlaylistItem[]]
  remove: [itemId: string]
}>()

const localItems = ref<PlaylistSortableEntry[]>([])

function getItemKey(item: PlaylistSortableEntry) {
  return item.playlistItem.id
}

watch(() => props.items, (next) => {
  localItems.value = [...next]
}, { immediate: true })

function onReorder() {
  emit('reorder', localItems.value.map(item => item.playlistItem))
}
</script>

<template>
  <draggable
    v-model="localItems"
    :item-key="getItemKey"
    handle=".drag-handle"
    class="space-y-2"
    @end="onReorder"
  >
    <template #item="{ element, index }">
      <UCard>
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="font-semibold truncate">
              {{ element.song?.title ?? 'Música removida' }}
            </p>
            <p class="text-sm text-muted truncate">
              {{ element.song?.artist || 'Sem artista' }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <UBadge
              color="neutral"
              variant="subtle"
            >
              #{{ index + 1 }}
            </UBadge>
            <UButton
              icon="i-lucide-grip-vertical"
              color="neutral"
              variant="ghost"
              class="drag-handle"
            />
            <UButton
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              @click="emit('remove', element.playlistItem.id)"
            />
          </div>
        </div>
      </UCard>
    </template>
  </draggable>
</template>
