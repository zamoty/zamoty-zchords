<script setup lang="ts">
import type { CifraClubImportResponse } from '#shared/types/import'
import { saveSong } from '~/services/db/repositories.client'

const route = useRoute()
const db = useDb()
const toast = useToast()
const { refreshPendingDirtyCount } = useSync()

const importing = ref(false)
const importError = ref('')
const importedSongId = ref('')
const urlInput = ref('')
const autoImportDone = ref(false)

function queryValue(name: string) {
  const value = route.query[name]

  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    const first = value.find(item => typeof item === 'string')
    return typeof first === 'string' ? first.trim() : ''
  }

  return ''
}

function extractFirstUrl(input: string) {
  const match = input.match(/https?:\/\/[^\s]+/i)
  return match?.[0] ?? ''
}

function normalizeUrl(rawValue: string) {
  const value = rawValue.trim()

  if (!value) {
    return ''
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `https://${value}`
}

const sharedTitle = computed(() => queryValue('title'))
const sharedText = computed(() => queryValue('text'))
const sharedUrl = computed(() => queryValue('url'))

const resolvedSharedUrl = computed(() => {
  const fromUrlParam = normalizeUrl(sharedUrl.value)

  if (fromUrlParam) {
    return fromUrlParam
  }

  const fromText = extractFirstUrl(sharedText.value)
  return normalizeUrl(fromText)
})

function deriveFallbackTitle(rawText: string, fallback = 'Música importada') {
  const firstContentLine = rawText
    .split('\n')
    .map(line => line.trim())
    .find(line => line.length > 0)

  if (!firstContentLine) {
    return fallback
  }

  return firstContentLine.slice(0, 80)
}

function resolveErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const candidate = error as {
      data?: { statusMessage?: unknown }
      statusMessage?: unknown
      message?: unknown
    }

    const fromData = typeof candidate.data?.statusMessage === 'string' ? candidate.data.statusMessage : ''
    if (fromData) {
      return fromData
    }

    if (typeof candidate.statusMessage === 'string' && candidate.statusMessage) {
      return candidate.statusMessage
    }

    if (typeof candidate.message === 'string' && candidate.message) {
      return candidate.message
    }
  }

  return 'Não foi possível importar a música.'
}

async function persistSong(payload: {
  title: string
  artist: string | null
  key: string | null
  content: string
}) {
  const saved = await saveSong(db, {
    title: payload.title,
    artist: payload.artist,
    key: payload.key,
    content: payload.content
  })

  importedSongId.value = saved.id
  await refreshPendingDirtyCount()

  return saved.id
}

async function importFromCifraClub(url: string) {
  const result = await $fetch<CifraClubImportResponse>('/api/import/cifraclub', {
    method: 'POST',
    body: { url }
  })

  return persistSong({
    title: result.title,
    artist: result.artist,
    key: result.key,
    content: result.content
  })
}

async function importFromSharedText(text: string) {
  const trimmed = text.trim()

  if (!trimmed) {
    throw new Error('Nenhum texto recebido para importar.')
  }

  const songId = await persistSong({
    title: sharedTitle.value || deriveFallbackTitle(trimmed),
    artist: null,
    key: null,
    content: trimmed
  })

  return songId
}

async function runImport() {
  importError.value = ''
  importedSongId.value = ''
  importing.value = true

  try {
    const url = normalizeUrl(urlInput.value)
    let importedId = ''

    if (url) {
      importedId = await importFromCifraClub(url)
    } else {
      importedId = await importFromSharedText(sharedText.value)
    }

    toast.add({
      title: 'Música importada',
      description: 'A música foi salva na sua biblioteca local.',
      color: 'success'
    })

    await navigateTo(`/songs/${importedId}`)
  } catch (error) {
    importError.value = resolveErrorMessage(error)
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  urlInput.value = resolvedSharedUrl.value

  if (autoImportDone.value) {
    return
  }

  if (urlInput.value || sharedText.value.trim()) {
    autoImportDone.value = true
    void runImport()
  }
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="font-title text-2xl">
        Importar música
      </p>
      <p class="text-sm text-muted">
        Recebe links compartilhados e salva na biblioteca local.
      </p>
    </div>

    <UCard>
      <template #header>
        <p class="font-semibold">
          Link da música
        </p>
      </template>

      <div class="space-y-3">
        <UInput
          v-model="urlInput"
          icon="i-lucide-link"
          placeholder="Cole o link da cifra (Cifra Club)"
          class="w-full"
        />

        <UButton
          label="Importar agora"
          icon="i-lucide-download"
          :loading="importing"
          block
          @click="runImport"
        />

        <p class="text-xs text-muted">
          Dica: no Android, você pode compartilhar o link direto para o app instalado.
        </p>
      </div>
    </UCard>

    <UAlert
      v-if="importError"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="Falha na importação"
      :description="importError"
    />

    <UAlert
      v-if="!importError && importing"
      color="primary"
      variant="soft"
      icon="i-lucide-loader-circle"
      title="Importando..."
      description="Estamos processando a cifra compartilhada."
    />

    <UAlert
      v-if="!importing && importedSongId"
      color="success"
      variant="soft"
      icon="i-lucide-check-circle-2"
      title="Importação concluída"
      description="A música já está disponível na sua biblioteca."
    />
  </div>
</template>
