import { Interval, Note } from '@tonaljs/tonal'

function transposeRoot(note: string, semitones: number) {
  const interval = Interval.fromSemitones(semitones)
  const transposed = Note.transpose(note, interval)
  return Note.simplify(transposed)
}

function transposeChordPart(part: string, semitones: number) {
  const match = part.match(/^([A-G](?:#|b)?)(.*)$/)

  if (!match) {
    return part
  }

  const root = match[1]
  const suffix = match[2] ?? ''

  if (!root) {
    return part
  }

  return `${transposeRoot(root, semitones)}${suffix}`
}

export function transposeChordSymbol(chord: string, semitones: number) {
  if (semitones === 0) {
    return chord
  }

  const normalized = chord.trim()

  if (!normalized || normalized.toUpperCase() === 'N.C.') {
    return chord
  }

  const [mainPart, bassPart] = normalized.split('/')
  const main = mainPart ?? ''

  if (!main) {
    return chord
  }

  const transposedMain = transposeChordPart(main, semitones)

  if (!bassPart) {
    return transposedMain
  }

  return `${transposedMain}/${transposeChordPart(bassPart, semitones)}`
}
