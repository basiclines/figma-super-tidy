// Basic countdown gate - Iteration 1 (UI-side)
// Always shows countdown for now, no license checking yet

function getRandomIntInclusive(min, max) {
  const mi = Math.ceil(min), ma = Math.floor(max)
  return Math.floor(Math.random() * (ma - mi + 1)) + mi
}

export function shouldShowCountdown() {
  // Always show countdown for now - no license checking in iteration 1
  return true
}

export function getCountdownSeconds() {
  return getRandomIntInclusive(6, 15)
}
