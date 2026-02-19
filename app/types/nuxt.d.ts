import type { ZChordsDexie } from '~/services/db/dexie.client'

declare module '#app' {
  interface NuxtApp {
    $db: ZChordsDexie
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $db: ZChordsDexie
  }
}

export {}
