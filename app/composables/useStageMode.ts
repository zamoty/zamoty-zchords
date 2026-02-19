export function useStageMode() {
  const active = useState<boolean>('stage-mode-active', () => false)

  function setStageMode(value: boolean) {
    active.value = value
  }

  return {
    active,
    setStageMode
  }
}
