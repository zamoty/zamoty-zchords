<script setup lang="ts">
const props = defineProps<{
  initialName?: string
  initialDescription?: string
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [{ name: string, description: string | null }]
}>()

const name = ref(props.initialName ?? '')
const description = ref(props.initialDescription ?? '')

function onSubmit() {
  const normalizedName = name.value.trim()

  if (!normalizedName) {
    return
  }

  emit('submit', {
    name: normalizedName,
    description: description.value.trim() || null
  })

  name.value = ''
  description.value = ''
}
</script>

<template>
  <UCard>
    <template #header>
      <p class="font-title text-base">
        Nova playlist
      </p>
    </template>

    <form
      class="space-y-3"
      @submit.prevent="onSubmit"
    >
      <UFormField
        label="Nome"
        required
      >
        <UInput
          v-model="name"
          placeholder="Ex.: Louvor domingo"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Descrição">
        <UTextarea
          v-model="description"
          :rows="2"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        :label="submitLabel ?? 'Salvar playlist'"
        icon="i-lucide-save"
      />
    </form>
  </UCard>
</template>
