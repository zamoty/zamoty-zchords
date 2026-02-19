export interface CifraClubImportResponse {
  provider: 'cifraclub'
  sourceUrl: string
  title: string
  artist: string | null
  key: string | null
  content: string
}
