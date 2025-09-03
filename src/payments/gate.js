// License gate - Now checks actual stored license
// Global license state loaded on plugin init
let cachedLicenseStatus = null

function getRandomIntInclusive(min, max) {
  const mi = Math.ceil(min), ma = Math.floor(max)
  return Math.floor(Math.random() * (ma - mi + 1)) + mi
}

export function setCachedLicenseStatus(license) {
  cachedLicenseStatus = license
  console.log('[Gate] License status updated:', license ? 'LICENSED' : 'UNLICENSED')
}

export function shouldShowCountdown() {
  // Check actual license status
  const isLicensed = cachedLicenseStatus && cachedLicenseStatus.licensed
  console.log('[Gate] shouldShowCountdown:', !isLicensed, 'cached license:', cachedLicenseStatus)
  return !isLicensed
}

export function getCountdownSeconds() {
  return getRandomIntInclusive(6, 15)
}
