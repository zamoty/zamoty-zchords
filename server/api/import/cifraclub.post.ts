import { parseCifraClubHtml } from '#server/utils/import/cifraclub'
import type { CifraClubImportResponse } from '#shared/types/import'

interface ImportBody {
  url?: unknown
}

function normalizeUrl(rawUrl: string) {
  let candidate = rawUrl.trim()

  if (!candidate) {
    return null
  }

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`
  }

  let parsed: URL

  try {
    parsed = new URL(candidate)
  } catch {
    return null
  }

  const hostname = parsed.hostname.toLowerCase()
  const allowedHost = hostname === 'cifraclub.com.br' || hostname.endsWith('.cifraclub.com.br')

  if (!allowedHost) {
    return null
  }

  parsed.hash = ''

  return parsed
}

export default defineEventHandler(async (event): Promise<CifraClubImportResponse> => {
  const body = await readBody<ImportBody>(event)
  const rawUrl = typeof body?.url === 'string' ? body.url : ''

  const normalizedUrl = normalizeUrl(rawUrl)

  if (!normalizedUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL inválida. Informe um link do Cifra Club.'
    })
  }

  const html = await $fetch<string>(normalizedUrl.toString(), {
    responseType: 'text',
    headers: {
      'user-agent': 'ZChords Importer/1.0 (+https://zchords.app)'
    }
  })

  const parsed = parseCifraClubHtml(html)

  if (!parsed) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Não foi possível extrair a cifra deste link.'
    })
  }

  return {
    provider: 'cifraclub',
    sourceUrl: normalizedUrl.toString(),
    title: parsed.title,
    artist: parsed.artist,
    key: parsed.key,
    content: parsed.content
  }
})
