import 'dotenv/config'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { neon } from '@neondatabase/serverless'
import { eq, inArray, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { chordShapes, instruments, songs } from '../server/db/schema'

interface InstrumentSeed {
  id: string
  code: string
  name: string
  tuning: string[]
  stringsCount: number
}

interface SongSeed {
  id: string
  title: string
  artist: string
  key: string
  content: string
}

interface DatasetPosition {
  frets: Array<number | string> | string
  fingers?: Array<number | string> | string
  barres?: number[] | number
  baseFret?: number
  basefret?: number
}

interface DatasetChordEntry {
  key: string
  suffix: string
  positions: DatasetPosition[]
}

interface InstrumentDataset {
  chords: Record<string, DatasetChordEntry[]>
}

interface NormalizedShape {
  id: string
  instrumentId: string
  chordName: string
  frets: (string | number | null)[]
  fingers: number[] | null
  barres: number[] | null
  baseFret: number
  tags: Record<string, unknown>
  source: 'chords-db' | 'manual'
}

const now = new Date().toISOString()

const GUITAR_ID = '8d1faec1-5d32-4ea5-8f89-8f9d5dca1001'
const UKULELE_ID = '8d1faec1-5d32-4ea5-8f89-8f9d5dca1002'

const seedInstruments: InstrumentSeed[] = [
  {
    id: GUITAR_ID,
    code: 'guitar',
    name: 'Violão',
    tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
    stringsCount: 6
  },
  {
    id: UKULELE_ID,
    code: 'ukulele',
    name: 'Ukulele',
    tuning: ['G', 'C', 'E', 'A'],
    stringsCount: 4
  },
  {
    id: '8d1faec1-5d32-4ea5-8f89-8f9d5dca1003',
    code: 'cavaquinho',
    name: 'Cavaquinho',
    tuning: ['D', 'G', 'B', 'D'],
    stringsCount: 4
  },
  {
    id: '8d1faec1-5d32-4ea5-8f89-8f9d5dca1004',
    code: 'viola_cebolao_re',
    name: 'Viola caipira (Cebolão em Ré)',
    tuning: ['D', 'A', 'F#', 'D', 'A', 'D'],
    stringsCount: 6
  },
  {
    id: '8d1faec1-5d32-4ea5-8f89-8f9d5dca1005',
    code: 'viola_cebolao_mi',
    name: 'Viola caipira (Cebolão em Mi)',
    tuning: ['E', 'B', 'G#', 'E', 'B', 'E'],
    stringsCount: 6
  },
  {
    id: '8d1faec1-5d32-4ea5-8f89-8f9d5dca1006',
    code: 'viola_cebolao_si',
    name: 'Viola caipira (Cebolão em Si)',
    tuning: ['B', 'F#', 'D#', 'B', 'F#', 'B'],
    stringsCount: 6
  }
]

const seedSongs: SongSeed[] = [
  {
    id: 'd4f99c03-c2ab-4dad-9470-d4d278dd0001',
    title: 'Asa Branca',
    artist: 'Tradicional',
    key: 'A',
    content: '{title: Asa Branca}\n[A]Quando olhei a terra ardendo\n[D]Qual fogueira de São João\n[E7]Eu perguntei a Deus do céu, ai\n[A]Por que tamanha judiação'
  },
  {
    id: 'd4f99c03-c2ab-4dad-9470-d4d278dd0002',
    title: 'Peixe Vivo',
    artist: 'Tradicional',
    key: 'G',
    content: '{title: Peixe Vivo}\n[G]Como pode o peixe vivo\n[D]Viver fora da água fria\n[D7]Como poderei viver\n[G]Sem a tua companhia'
  },
  {
    id: 'd4f99c03-c2ab-4dad-9470-d4d278dd0003',
    title: 'Cai Cai Balão',
    artist: 'Tradicional',
    key: 'C',
    content: '{title: Cai Cai Balão}\n[C]Cai cai balão\n[G7]Cai cai balão\n[G7]Aqui na minha mão\n[C]Não cai não'
  },
  {
    id: 'd4f99c03-c2ab-4dad-9470-d4d278dd0004',
    title: 'Sapo Cururu',
    artist: 'Tradicional',
    key: 'D',
    content: '{title: Sapo Cururu}\n[D]Sapo cururu\n[A7]Na beira do rio\n[A7]Quando o sapo canta, ó maninha\n[D]É porque tem frio'
  },
  {
    id: 'd4f99c03-c2ab-4dad-9470-d4d278dd0005',
    title: 'Ciranda Cirandinha',
    artist: 'Tradicional',
    key: 'C',
    content: '{title: Ciranda Cirandinha}\n[C]Ciranda, cirandinha\n[G7]Vamos todos cirandar\n[G7]Vamos dar a meia volta\n[C]Volta e meia vamos dar'
  }
]

const minimalManualShapes: Array<Omit<NormalizedShape, 'id'>> = [
  {
    instrumentId: '8d1faec1-5d32-4ea5-8f89-8f9d5dca1003',
    chordName: 'C',
    frets: [0, 0, 0, 3],
    fingers: [0, 0, 0, 3],
    barres: [],
    baseFret: 1,
    tags: { common: true, positionIndex: 0, suffix: '', qualityRank: 0 },
    source: 'manual'
  },
  {
    instrumentId: '8d1faec1-5d32-4ea5-8f89-8f9d5dca1004',
    chordName: 'D',
    frets: [0, 0, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    barres: [],
    baseFret: 1,
    tags: { common: true, positionIndex: 0, suffix: '', qualityRank: 0 },
    source: 'manual'
  },
  {
    instrumentId: '8d1faec1-5d32-4ea5-8f89-8f9d5dca1005',
    chordName: 'E',
    frets: [0, 0, 0, 1, 2, 0],
    fingers: [0, 0, 0, 1, 2, 0],
    barres: [],
    baseFret: 1,
    tags: { common: true, positionIndex: 0, suffix: '', qualityRank: 0 },
    source: 'manual'
  },
  {
    instrumentId: '8d1faec1-5d32-4ea5-8f89-8f9d5dca1006',
    chordName: 'B',
    frets: [0, 0, 0, 1, 2, 0],
    fingers: [0, 0, 0, 1, 2, 0],
    barres: [],
    baseFret: 1,
    tags: { common: true, positionIndex: 0, suffix: '', qualityRank: 0 },
    source: 'manual'
  }
]

function deterministicUuid(seed: string) {
  const hex = createHash('sha1').update(seed).digest('hex').slice(0, 32)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function normalizeSuffix(rawSuffix: string) {
  const suffix = rawSuffix.trim()

  if (suffix === 'major') {
    return ''
  }

  if (suffix === 'minor') {
    return 'm'
  }

  return suffix
}

function suffixRank(normalizedSuffix: string) {
  const priority = [
    '',
    'm',
    '7',
    'maj7',
    'm7',
    'sus4',
    'sus2',
    '6',
    '9'
  ]

  const index = priority.indexOf(normalizedSuffix)
  return index === -1 ? 99 : index
}

function normalizeFretValue(raw: string | number) {
  if (typeof raw === 'number') {
    if (raw < 0) {
      return 'x'
    }

    return raw
  }

  const value = raw.trim().toLowerCase()

  if (!value || value === 'x') {
    return 'x'
  }

  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return 'x'
  }

  if (numeric < 0) {
    return 'x'
  }

  return numeric
}

function normalizeFrets(rawFrets: DatasetPosition['frets']) {
  if (typeof rawFrets === 'string') {
    const compact = rawFrets.trim()
    if (!compact) {
      return []
    }

    if (/[,\s]/.test(compact)) {
      return compact
        .split(/[,\s]+/)
        .map(token => token.trim())
        .filter(Boolean)
        .map(token => normalizeFretValue(token))
    }

    return compact.split('').map(char => normalizeFretValue(char))
  }

  return rawFrets.map(value => normalizeFretValue(value))
}

function normalizeFingers(rawFingers: DatasetPosition['fingers']) {
  if (!rawFingers) {
    return null
  }

  if (Array.isArray(rawFingers)) {
    const parsed = rawFingers
      .map((item) => {
        const numeric = Number(item)
        return Number.isFinite(numeric) ? numeric : 0
      })

    return parsed.length > 0 ? parsed : null
  }

  const compact = rawFingers.trim()
  if (!compact) {
    return null
  }

  const tokens = /[,\s]/.test(compact)
    ? compact.split(/[,\s]+/).map(token => token.trim()).filter(Boolean)
    : compact.split('')

  const parsed = tokens.map((digit) => {
    const numeric = Number(digit)
    return Number.isFinite(numeric) ? numeric : 0
  })

  return parsed.length > 0 ? parsed : null
}

function normalizeBarres(rawBarres: DatasetPosition['barres']) {
  if (Array.isArray(rawBarres)) {
    return rawBarres.filter(value => Number.isFinite(value))
  }

  if (typeof rawBarres === 'number' && Number.isFinite(rawBarres)) {
    return [rawBarres]
  }

  return null
}

function buildChordName(key: string, rawSuffix: string) {
  const suffix = normalizeSuffix(rawSuffix)
  return `${key}${suffix}`
}

function collectShapesFromDataset(dataset: InstrumentDataset, instrumentId: string) {
  const results: NormalizedShape[] = []

  for (const entries of Object.values(dataset.chords)) {
    if (!Array.isArray(entries)) {
      continue
    }

    for (const entry of entries) {
      if (!entry || !Array.isArray(entry.positions)) {
        continue
      }

      const chordName = buildChordName(entry.key, entry.suffix)
      const normalizedSuffix = normalizeSuffix(entry.suffix)
      const qualityRank = suffixRank(normalizedSuffix)

      entry.positions.forEach((position, positionIndex) => {
        const frets = normalizeFrets(position.frets)
        const baseFret = Number.isFinite(position.baseFret)
          ? (position.baseFret as number)
          : Number.isFinite(position.basefret)
            ? (position.basefret as number)
            : 1

        const id = deterministicUuid(
          `${instrumentId}:${chordName}:${positionIndex}:${JSON.stringify(frets)}:${baseFret}`
        )

        results.push({
          id,
          instrumentId,
          chordName,
          frets,
          fingers: normalizeFingers(position.fingers),
          barres: normalizeBarres(position.barres),
          baseFret,
          tags: {
            sourceSet: 'chords-db',
            root: entry.key,
            suffix: normalizedSuffix,
            suffixRaw: entry.suffix,
            qualityRank,
            positionIndex,
            common: positionIndex === 0
          },
          source: 'chords-db'
        })
      })
    }
  }

  return results
}

function chunk<T>(list: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < list.length; index += size) {
    chunks.push(list.slice(index, index + size))
  }

  return chunks
}

async function run() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Set it in .env before running the seed.')
  }

  const sql = neon(connectionString)
  const db = drizzle({ client: sql })

  console.log('[seed] upserting instruments...')

  for (const instrument of seedInstruments) {
    await db.insert(instruments)
      .values({
        ...instrument,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      })
      .onConflictDoUpdate({
        target: instruments.code,
        set: {
          name: instrument.name,
          tuning: instrument.tuning,
          stringsCount: instrument.stringsCount,
          updatedAt: now,
          deletedAt: null
        }
      })
  }

  const require = createRequire(import.meta.url)
  const guitarDataset = require('@tombatossals/chords-db/lib/guitar.json') as InstrumentDataset
  const ukuleleDataset = require('@tombatossals/chords-db/lib/ukulele.json') as InstrumentDataset

  const importedShapes = [
    ...collectShapesFromDataset(guitarDataset, GUITAR_ID),
    ...collectShapesFromDataset(ukuleleDataset, UKULELE_ID)
  ]

  const manualShapes: NormalizedShape[] = minimalManualShapes.map(shape => ({
    ...shape,
    id: deterministicUuid(`${shape.instrumentId}:${shape.chordName}:${JSON.stringify(shape.frets)}:${shape.baseFret}:manual`)
  }))

  const manualShapeIds = manualShapes.map(shape => shape.id)

  console.log(`[seed] parsed shapes: guitar+ukulele=${importedShapes.length}, manual=${manualShapes.length}`)
  console.log('[seed] soft-deleting previous chords-db/manual shapes...')

  await db.update(chordShapes)
    .set({
      deletedAt: now,
      updatedAt: now
    })
    .where(
      or(
        eq(chordShapes.source, 'chords-db'),
        inArray(chordShapes.id, manualShapeIds)
      )
    )

  const allShapes = [...importedShapes, ...manualShapes]
  const shapeBatches = chunk(allShapes, 300)

  console.log(`[seed] inserting ${allShapes.length} chord shapes in ${shapeBatches.length} batches...`)

  for (const [index, batch] of shapeBatches.entries()) {
    for (const shape of batch) {
      await db.insert(chordShapes)
        .values({
          ...shape,
          createdAt: now,
          updatedAt: now,
          deletedAt: null
        })
        .onConflictDoUpdate({
          target: chordShapes.id,
          set: {
            instrumentId: shape.instrumentId,
            chordName: shape.chordName,
            frets: shape.frets,
            fingers: shape.fingers,
            barres: shape.barres,
            baseFret: shape.baseFret,
            tags: shape.tags,
            source: shape.source,
            updatedAt: now,
            deletedAt: null
          }
        })
    }

    if ((index + 1) % 10 === 0 || index + 1 === shapeBatches.length) {
      console.log(`[seed] chord batch ${index + 1}/${shapeBatches.length}`)
    }
  }

  console.log('[seed] upserting songs...')

  for (const song of seedSongs) {
    await db.insert(songs)
      .values({
        id: song.id,
        title: song.title,
        artist: song.artist,
        contentFormat: 'chordpro',
        content: song.content,
        key: song.key,
        capo: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      })
      .onConflictDoUpdate({
        target: songs.id,
        set: {
          title: song.title,
          artist: song.artist,
          content: song.content,
          key: song.key,
          updatedAt: now,
          deletedAt: null
        }
      })
  }

  console.log(`Seed concluído: ${seedInstruments.length} instrumentos, ${allShapes.length} formas de acorde, ${seedSongs.length} músicas.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
