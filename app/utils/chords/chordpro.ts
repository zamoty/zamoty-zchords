import { transposeChordSymbol } from './transpose'

export interface ParsedChordLine {
  raw: string
  lyric: string
  chordLine: string
  placements: ChordPlacement[]
}

export interface ChordPlacement {
  chord: string
  original: string
  start: number
}

const CHORD_TOKEN_REGEX = /\[([^\]]+)\]/g

export function parseChordPro(content: string, semitones = 0): ParsedChordLine[] {
  return content.split('\n').map((line) => {
    const placements: ChordPlacement[] = []
    let lyric = ''
    let cursor = 0
    let pendingChord: { display: string, original: string } | null = null

    function flushChunk(chunk: string) {
      if (!chunk && !pendingChord) {
        return
      }

      const start = lyric.length
      lyric += chunk

      if (pendingChord) {
        placements.push({
          chord: pendingChord.display,
          original: pendingChord.original,
          start
        })
        pendingChord = null
      }
    }

    for (const match of line.matchAll(CHORD_TOKEN_REGEX)) {
      const matchIndex = match.index ?? 0
      const token = match[1]?.trim() ?? ''
      const chunk = line.slice(cursor, matchIndex)

      flushChunk(chunk)
      pendingChord = {
        display: transposeChordSymbol(token, semitones),
        original: token
      }

      cursor = matchIndex + match[0].length
    }

    flushChunk(line.slice(cursor))

    if (pendingChord) {
      placements.push({
        chord: pendingChord.display,
        original: pendingChord.original,
        start: lyric.length
      })
    }

    const chordChars: string[] = []

    for (const placement of placements) {
      for (let index = 0; index < placement.chord.length; index++) {
        chordChars[placement.start + index] = placement.chord[index] ?? ' '
      }
    }

    const maxLength = Math.max(lyric.length, chordChars.length)
    const chordLine = Array.from({ length: maxLength }, (_, index) => chordChars[index] ?? ' ').join('')

    return {
      raw: line,
      lyric,
      chordLine,
      placements
    }
  })
}
