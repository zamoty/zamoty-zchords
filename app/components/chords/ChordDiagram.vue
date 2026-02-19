<script setup lang="ts">
import type { ChordShape } from '#shared/types/domain'

const props = defineProps<{
  shape: ChordShape | null
  large?: boolean
}>()

function splitFrets(rawFrets: ChordShape['frets']) {
  if (Array.isArray(rawFrets)) {
    return rawFrets.map(value => String(value ?? '')).filter(Boolean)
  }

  const compact = rawFrets.trim()

  if (!compact) {
    return []
  }

  if (/[,\s]/.test(compact)) {
    return compact.split(/[,\s]+/).map(token => token.trim()).filter(Boolean)
  }

  return compact.split('')
}

const normalizedFrets = computed(() => {
  if (!props.shape) {
    return []
  }

  return splitFrets(props.shape.frets)
})

function splitFingers(rawFingers: ChordShape['fingers']) {
  if (!rawFingers) {
    return []
  }

  return rawFingers.map(value => Number(value) || 0)
}

const normalizedFingers = computed(() => splitFingers(props.shape?.fingers ?? null))

const metrics = computed(() => {
  if (props.large) {
    return {
      leftPadding: 58,
      rightPadding: 34,
      top: 44,
      bottom: 38,
      stringSpacing: 46,
      fretSpacing: 48,
      visibleFrets: 5,
      fingerRadius: 10.5,
      openRadius: 7,
      markerFontSize: 17,
      baseFontSize: 20
    }
  }

  return {
    leftPadding: 42,
    rightPadding: 24,
    top: 24,
    bottom: 24,
    stringSpacing: 24,
    fretSpacing: 24,
    visibleFrets: 5,
    fingerRadius: 6.5,
    openRadius: 4.2,
    markerFontSize: 11,
    baseFontSize: 12
  }
})

const stringCount = computed(() => normalizedFrets.value.length)
const baseFret = computed(() => Math.max(1, props.shape?.baseFret ?? 1))
const neckWidth = computed(() => Math.max(0, (stringCount.value - 1) * metrics.value.stringSpacing))

const svgWidth = computed(() => metrics.value.leftPadding + metrics.value.rightPadding + neckWidth.value)
const svgHeight = computed(() => metrics.value.top + metrics.value.visibleFrets * metrics.value.fretSpacing + metrics.value.bottom)

function xForString(index: number) {
  return metrics.value.leftPadding + index * metrics.value.stringSpacing
}

function yForFretLine(index: number) {
  return metrics.value.top + index * metrics.value.fretSpacing
}

function parseFret(rawFret: string) {
  const normalized = rawFret.trim().toLowerCase()

  if (normalized === 'x') {
    return 'x' as const
  }

  const numeric = Number(normalized)

  if (!Number.isFinite(numeric)) {
    return null
  }

  if (numeric < 0) {
    return 'x' as const
  }

  return numeric
}

const markers = computed(() => {
  return normalizedFrets.value.map((rawFret, stringIndex) => {
    const parsed = parseFret(rawFret)
    const x = xForString(stringIndex)

    if (parsed === 'x') {
      return {
        type: 'mute' as const,
        x
      }
    }

    if (parsed === 0) {
      return {
        type: 'open' as const,
        x
      }
    }

    if (typeof parsed === 'number') {
      const fretOnVisibleGrid = parsed
      const finger = normalizedFingers.value[stringIndex] ?? 0

      return {
        type: 'finger' as const,
        x,
        y: yForFretLine(parsed - 0.5),
        finger,
        visible: fretOnVisibleGrid >= 1 && fretOnVisibleGrid <= metrics.value.visibleFrets
      }
    }

    return {
      type: 'none' as const,
      x
    }
  })
})

const barreFrets = computed(() => {
  const rawBarres = props.shape?.barres ?? []

  return rawBarres
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value > 0)
    .map(barre => ({ fretOnVisibleGrid: barre, visible: barre >= 1 && barre <= metrics.value.visibleFrets }))
    .filter(item => item.visible)
})

const stringLabels = computed(() => {
  return Array.from({ length: stringCount.value }, (_, index) => index + 1)
})

const displayedBaseFret = computed(() => {
  return baseFret.value
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <p class="font-title text-lg">
          {{ shape?.chordName ?? 'Sem diagrama' }}
        </p>

        <UBadge
          v-if="shape"
          color="neutral"
          variant="outline"
        >
          Casa {{ displayedBaseFret }}
        </UBadge>
      </div>
    </template>

    <div
      v-if="shape"
      class="space-y-3"
    >
      <div class="rounded-md border border-default bg-elevated/40 p-3 overflow-x-auto">
        <svg
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          :width="props.large ? '100%' : svgWidth"
          :height="props.large ? undefined : svgHeight"
          :class="props.large ? 'mx-auto h-auto w-full' : 'mx-auto'"
          role="img"
          :aria-label="`Diagrama de ${shape.chordName}`"
        >
          <line
            v-for="stringIndex in stringCount"
            :key="`string-${stringIndex}`"
            :x1="xForString(stringIndex - 1)"
            :y1="yForFretLine(0)"
            :x2="xForString(stringIndex - 1)"
            :y2="yForFretLine(metrics.visibleFrets)"
            stroke="currentColor"
            stroke-opacity="0.55"
            stroke-width="1.4"
          />

          <line
            v-for="fretIndex in metrics.visibleFrets + 1"
            :key="`fret-${fretIndex}`"
            :x1="xForString(0)"
            :y1="yForFretLine(fretIndex - 1)"
            :x2="xForString(stringCount - 1)"
            :y2="yForFretLine(fretIndex - 1)"
            stroke="currentColor"
            stroke-opacity="0.6"
            :stroke-width="baseFret === 1 && fretIndex === 1 ? 4 : 1.2"
            stroke-linecap="round"
          />

          <line
            v-for="(barre, barreIndex) in barreFrets"
            :key="`barre-${barreIndex}`"
            :x1="xForString(0) - 2"
            :y1="yForFretLine(barre.fretOnVisibleGrid - 0.5)"
            :x2="xForString(stringCount - 1) + 2"
            :y2="yForFretLine(barre.fretOnVisibleGrid - 0.5)"
            stroke="currentColor"
            stroke-width="7"
            stroke-linecap="round"
            stroke-opacity="0.85"
          />

          <template
            v-for="(marker, markerIndex) in markers"
            :key="`marker-${markerIndex}`"
          >
            <text
              v-if="marker.type === 'mute'"
              :x="marker.x"
              :y="props.large ? 24 : 13"
              text-anchor="middle"
              :font-size="metrics.markerFontSize"
              fill="currentColor"
            >
              x
            </text>

            <circle
              v-else-if="marker.type === 'open'"
              :cx="marker.x"
              :cy="props.large ? 20 : 12"
              :r="metrics.openRadius"
              fill="none"
              stroke="currentColor"
              :stroke-width="props.large ? 2.2 : 1.5"
            />

            <circle
              v-else-if="marker.type === 'finger' && marker.visible"
              :cx="marker.x"
              :cy="marker.y"
              :r="metrics.fingerRadius"
              fill="currentColor"
            />

            <text
              v-if="marker.type === 'finger' && marker.visible && marker.finger > 0"
              :x="marker.x"
              :y="marker.y + (props.large ? 5 : 3.5)"
              text-anchor="middle"
              :font-size="props.large ? 11 : 8"
              fill="white"
              font-weight="700"
            >
              {{ marker.finger }}
            </text>
          </template>

          <text
            v-if="displayedBaseFret > 1"
            :x="metrics.leftPadding - (props.large ? 14 : 8)"
            :y="yForFretLine(1)"
            text-anchor="end"
            :font-size="metrics.baseFontSize"
            fill="currentColor"
            opacity="0.8"
            font-weight="700"
          >
            {{ displayedBaseFret }}ª
          </text>

          <text
            v-for="label in stringLabels"
            :key="`label-${label}`"
            :x="xForString(label - 1)"
            :y="svgHeight - 5"
            text-anchor="middle"
            font-size="10"
            fill="currentColor"
            opacity="0.7"
          >
            {{ label }}
          </text>
        </svg>
      </div>

      <div class="text-sm text-muted space-y-1">
        <p>Fonte: {{ shape.source }}</p>
        <p v-if="shape.tags?.difficulty">
          Dificuldade: {{ shape.tags.difficulty }}
        </p>
      </div>
    </div>

    <p
      v-else
      class="text-muted text-sm"
    >
      Nenhuma forma disponível para este acorde no instrumento selecionado.
    </p>
  </UCard>
</template>
