interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
}

export function useInstallPrompt() {
  const deferredPrompt = useState<BeforeInstallPromptEvent | null>('install-deferred-prompt', () => null)
  const canInstall = useState<boolean>('install-can-install', () => false)

  async function promptInstall() {
    if (!deferredPrompt.value) {
      return false
    }

    await deferredPrompt.value.prompt()
    const choice = await deferredPrompt.value.userChoice

    deferredPrompt.value = null
    canInstall.value = false

    return choice.outcome === 'accepted'
  }

  function setInstallPrompt(event: BeforeInstallPromptEvent | null) {
    deferredPrompt.value = event
    canInstall.value = Boolean(event)
  }

  return {
    canInstall,
    promptInstall,
    setInstallPrompt
  }
}
