<script setup lang="ts">
import { getDeviceId } from '~/services/db/metaRepository.client'

const db = useDb()
const { state, syncNow } = useSync()
const { canInstall, promptInstall } = useInstallPrompt()
const installing = ref(false)

const online = ref(import.meta.client ? navigator.onLine : true)
const syncing = ref(false)
const deviceId = ref<string | null>(null)

function handleOnline() {
  online.value = true
}

function handleOffline() {
  online.value = false
}

async function loadDeviceId() {
  deviceId.value = await getDeviceId(db)
}

async function handleSyncNow() {
  syncing.value = true
  try {
    await syncNow()
  } finally {
    syncing.value = false
  }
}

async function handleInstallApp() {
  installing.value = true

  try {
    await promptInstall()
  } finally {
    installing.value = false
  }
}

onMounted(async () => {
  await loadDeviceId()

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <p class="font-title text-2xl">
        Ajustes
      </p>
      <p class="text-sm text-muted">
        Sincronização e preferências locais
      </p>
    </div>

    <UCard>
      <template #header>
        <p class="font-semibold">
          Sincronização
        </p>
      </template>

      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <SyncIndicator />
          <UBadge
            :color="online ? 'success' : 'warning'"
            variant="soft"
          >
            {{ online ? 'Online' : 'Offline' }}
          </UBadge>
        </div>

        <div class="text-sm text-muted space-y-1">
          <p>Última sincronização: {{ state.lastSyncedAt || 'Nunca' }}</p>
          <p>Alterações pendentes: {{ state.pendingDirtyCount }}</p>
          <p v-if="state.lastError">
            Último erro: {{ state.lastError }}
          </p>
        </div>

        <UButton
          label="Sincronizar"
          icon="i-lucide-refresh-cw"
          :loading="syncing || state.status === 'syncing'"
          @click="handleSyncNow"
        />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <p class="font-semibold">
          Aplicativo
        </p>
      </template>

      <div class="space-y-3">
        <UButton
          v-if="canInstall"
          label="Instalar app"
          icon="i-lucide-download"
          :loading="installing"
          @click="handleInstallApp"
        />

        <p
          v-else
          class="text-sm text-muted"
        >
          Se “Instalar app” não aparecer no menu do Chrome, use “Adicionar à tela inicial”.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <p class="font-semibold">
          Dispositivo
        </p>
      </template>

      <p class="text-sm text-muted break-all">
        deviceId: {{ deviceId || 'Gerando...' }}
      </p>
    </UCard>

    <UCard>
      <template #header>
        <p class="font-semibold">
          Afinador
        </p>
      </template>

      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-mic"
        title="Em breve"
        description="Tela de afinador ficará disponível após o MVP principal."
      />
    </UCard>
  </div>
</template>
