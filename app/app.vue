<script setup lang="ts">
const { state } = useSync()
const { active: stageModeActive } = useStageMode()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

useSeoMeta({
  title: 'ZChords',
  description: 'Biblioteca de cifras e acordes offline para palco.',
  ogTitle: 'ZChords',
  ogDescription: 'Biblioteca de cifras e acordes offline para palco.'
})
</script>

<template>
  <UApp>
    <div class="min-h-dvh bg-gradient-to-b from-primary/5 via-default to-default">
      <header
        v-if="!stageModeActive"
        class="sticky top-0 z-30 border-b border-default/70 bg-default/90 backdrop-blur"
      >
        <UContainer class="h-14 flex items-center justify-between gap-3">
          <div>
            <p class="font-title text-lg leading-5">
              ZChords
            </p>
            <p class="text-[11px] text-muted leading-4">
              Offline-first
            </p>
          </div>

          <div class="flex items-center gap-2">
            <SyncIndicator />
            <UBadge
              v-if="state.pendingDirtyCount"
              color="warning"
              variant="soft"
            >
              {{ state.pendingDirtyCount }}
            </UBadge>
          </div>
        </UContainer>
      </header>

      <main :class="stageModeActive ? '' : 'pb-24 pt-4'">
        <UContainer>
          <NuxtPage />
        </UContainer>
      </main>

      <BottomTabs v-if="!stageModeActive" />
    </div>
  </UApp>
</template>
