export const INSTALL_DISMISSED_KEY = 'pv-install-prompt-dismissed-v1'

export function mobileInstallPlatform({ userAgent, maxTouchPoints, viewportWidth }) {
  const ipad = /Macintosh/i.test(userAgent) && maxTouchPoints > 1
  if (/iPad|iPhone|iPod/i.test(userAgent) || ipad) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'

  const mobileBrowser = /Mobile|Tablet/i.test(userAgent)
  const touchScreen = maxTouchPoints > 0 && viewportWidth <= 767
  return mobileBrowser || touchScreen ? 'other' : null
}

export function canOfferInstall({ pathname, platform, installed, dismissed }) {
  const installPage = pathname === '/' || pathname.startsWith('/passaporte/')
  return installPage && Boolean(platform) && !installed && !dismissed
}

export function installPromptMode(platform, hasNativePrompt, fallbackReady) {
  if (hasNativePrompt) return 'native'
  if (platform === 'ios') return 'ios'
  if (platform && fallbackReady) return 'browser-menu'
  return null
}
