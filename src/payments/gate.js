// License gate - Manages license status in current JavaScript context
// Note: Core.js (main thread) and UI (iframe) have separate instances of this cache
let cachedLicenseStatus = null

function getRandomIntInclusive(min, max) {
  const mi = Math.ceil(min), ma = Math.floor(max)
  return Math.floor(Math.random() * (ma - mi + 1)) + mi
}

export function setCachedLicenseStatus(license) {
  cachedLicenseStatus = license
  const context = typeof figma !== 'undefined' ? 'Core' : 'UI'
  console.log(`[Gate:${context}] License status updated:`, license ? 'LICENSED' : 'UNLICENSED')
}

export function shouldShowCountdown() {
  // Check actual license status in current context
  const isLicensed = cachedLicenseStatus && cachedLicenseStatus.licensed
  const context = typeof figma !== 'undefined' ? 'Core' : 'UI'
  console.log(`[Gate:${context}] shouldShowCountdown:`, !isLicensed, 'cached license:', cachedLicenseStatus)
  return !isLicensed
}

export function getCountdownSeconds() {
  return getRandomIntInclusive(6, 15)
}
