import type { LocalInstrument } from '#shared/types/domain'
import { getSelectedInstrumentId, setSelectedInstrumentId } from '~/services/db/metaRepository.client'
import { listInstruments } from '~/services/db/repositories.client'

export function useInstrument() {
  const db = useDb()
  const selectedInstrumentId = useState<string | null>('selected-instrument-id', () => null)
  const instruments = useState<LocalInstrument[]>('available-instruments', () => [])

  async function refreshInstruments() {
    instruments.value = await listInstruments(db)

    if (!selectedInstrumentId.value) {
      const saved = await getSelectedInstrumentId(db)
      selectedInstrumentId.value = saved ?? instruments.value[0]?.id ?? null
    }

    if (selectedInstrumentId.value && !instruments.value.some(item => item.id === selectedInstrumentId.value)) {
      selectedInstrumentId.value = instruments.value[0]?.id ?? null
    }

    if (selectedInstrumentId.value) {
      await setSelectedInstrumentId(db, selectedInstrumentId.value)
    }
  }

  async function setInstrument(id: string) {
    selectedInstrumentId.value = id
    await setSelectedInstrumentId(db, id)
  }

  return {
    instruments,
    selectedInstrumentId,
    refreshInstruments,
    setInstrument
  }
}
