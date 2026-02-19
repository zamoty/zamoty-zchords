export default defineNuxtPlugin(() => {
  const { setInstallPrompt } = useInstallPrompt()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    setInstallPrompt(event as Parameters<typeof setInstallPrompt>[0])
  })

  window.addEventListener('appinstalled', () => {
    setInstallPrompt(null)
  })
})
