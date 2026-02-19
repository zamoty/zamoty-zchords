const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: '\'',
  nbsp: ' '
}

const CHORD_TOKEN_SOURCE = 'N\\.C\\.|[A-G](?:#|b)?(?:maj|min|m|sus|add|dim|aug|M)?[0-9+#b/()º°ø-]*'

function chordTokenRegex() {
  return new RegExp(CHORD_TOKEN_SOURCE, 'g')
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-zA-Z]+);/g, (_, entity) => HTML_ENTITY_MAP[entity] ?? `&${entity};`)
}

function stripTags(input: string) {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ''))
}

function normalizeWhitespace(line: string) {
  return line
    .replace(/\u00A0/g, ' ')
    .replace(/\t/g, '    ')
    .replace(/\s+$/g, '')
}

function htmlToPlainText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')

  const withLineBreaks = withoutScripts
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|li|ul|ol|h1|h2|h3|h4|h5|h6|pre|table|tr)>/gi, '\n')

  const plain = decodeHtmlEntities(withLineBreaks.replace(/<[^>]+>/g, ''))

  return plain
    .split('\n')
    .map(normalizeWhitespace)
}

function isTablatureLine(line: string) {
  const trimmed = line.trim()

  if (!trimmed) {
    return false
  }

  if (/^[A-Ga-g](?:\||:).*[-0-9hHpPbBrR/\\]+/.test(trimmed)) {
    return true
  }

  if (/\|/.test(trimmed) && /-/.test(trimmed)) {
    return true
  }

  return false
}

function isChordCandidateLine(line: string) {
  const trimmed = line.trim()

  if (!trimmed || isTablatureLine(trimmed)) {
    return false
  }

  const matches = Array.from(trimmed.matchAll(chordTokenRegex()))

  if (matches.length === 0) {
    return false
  }

  const residue = trimmed
    .replace(chordTokenRegex(), '')
    .replace(/[\s\-|/\\()[\].,:;!?'"*+]+/g, '')

  return residue.length === 0
}

function mergeChordLineWithLyricLine(chordLine: string, lyricLine: string) {
  const tokens = Array.from(chordLine.matchAll(chordTokenRegex()))

  if (tokens.length === 0) {
    return lyricLine
  }

  let result = lyricLine
  let offset = 0

  for (const token of tokens) {
    const chord = token[0]?.trim() ?? ''
    const start = token.index ?? 0

    if (!chord) {
      continue
    }

    const insertionPoint = Math.min(Math.max(0, start + offset), result.length)
    result = `${result.slice(0, insertionPoint)}[${chord}]${result.slice(insertionPoint)}`
    offset += chord.length + 2
  }

  return result
}

function compactBlankLines(lines: string[]) {
  const output: string[] = []

  for (const line of lines) {
    const isBlank = line.trim().length === 0
    const previousBlank = output.length > 0 && output[output.length - 1]?.trim().length === 0

    if (isBlank && previousBlank) {
      continue
    }

    output.push(line)
  }

  while (output[0]?.trim().length === 0) {
    output.shift()
  }

  while (output[output.length - 1]?.trim().length === 0) {
    output.pop()
  }

  return output
}

function extractContentLines(lines: string[]) {
  const startMarkers = [
    /^tom\s*:/i,
    /^\[intro/i,
    /^\[primeira parte/i,
    /^\[refr[aã]o/i,
    /^\[verso/i
  ]

  const endMarkers = [
    /repetir modo teatro/i,
    /outros v[ií]deos desta m[úu]sica/i,
    /mais acessadas de/i,
    /conseguiu tocar\?/i,
    /acordes de [a-z0-9]/i,
    /^publicidade$/i
  ]

  const startIndex = lines.findIndex((line) => {
    const normalized = line.trim().toLowerCase()

    if (!normalized) {
      return false
    }

    return startMarkers.some(marker => marker.test(normalized))
  })

  const initialSlice = startIndex >= 0
    ? lines.slice(startIndex)
    : lines

  const endIndex = initialSlice.findIndex((line) => {
    const normalized = line.trim().toLowerCase()
    return endMarkers.some(marker => marker.test(normalized))
  })

  const cropped = endIndex >= 0
    ? initialSlice.slice(0, endIndex)
    : initialSlice

  const withoutTablature = cropped.filter(line => !isTablatureLine(line))

  return compactBlankLines(withoutTablature)
}

function toChordPro(lines: string[]) {
  const chordProLines: string[] = []

  for (let index = 0; index < lines.length; index++) {
    const current = lines[index] ?? ''
    const next = lines[index + 1] ?? ''

    if (
      isChordCandidateLine(current)
      && next.trim().length > 0
      && !isChordCandidateLine(next)
      && !isTablatureLine(next)
    ) {
      chordProLines.push(mergeChordLineWithLyricLine(current, next))
      index++
      continue
    }

    chordProLines.push(current)
  }

  return compactBlankLines(chordProLines)
}

function extractMeta(html: string, lines: string[]) {
  const ogTitleMatch
    = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)

  const titleCandidate = stripTags(ogTitleMatch?.[1] ?? '') || stripTags(h1Match?.[1] ?? '')
  const cleanedTitle = titleCandidate
    .replace(/\s*-\s*cifra club\s*$/i, '')
    .replace(/\s*cifra club\s*$/i, '')
    .trim()

  let title = cleanedTitle
  let artist: string | null = null

  if (cleanedTitle.includes('-')) {
    const [left, right] = cleanedTitle.split('-').map(part => part.trim())

    if (left && right) {
      title = left
      artist = right
    }
  }

  const h2Artist = stripTags(h2Match?.[1] ?? '').trim()

  if (!artist && h2Artist) {
    artist = h2Artist
  }

  if (!title) {
    title = lines.find(line => line.trim().length > 0)?.trim() ?? 'Música importada'
  }

  const keyMatch = lines
    .map(line => line.trim())
    .find(line => /^tom\s*:/i.test(line))
    ?.match(/^tom\s*:\s*([^\s]+(?:\s+[^\s]+)?)/i)

  const key = keyMatch?.[1]?.trim() ?? null

  return {
    title,
    artist,
    key
  }
}

export function parseCifraClubHtml(html: string) {
  const lines = htmlToPlainText(html)
  const extractedLines = extractContentLines(lines)

  if (extractedLines.length === 0) {
    return null
  }

  const metadata = extractMeta(html, extractedLines)
  const chordProContent = toChordPro(extractedLines)

  if (chordProContent.length === 0) {
    return null
  }

  const content = chordProContent.join('\n')

  return {
    ...metadata,
    content
  }
}
