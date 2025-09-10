// License verification and management API module
// Handles all Gumroad API interactions and license operations

const GUMROAD_PRODUCT_ID = WP_GUMROAD_PRODUCT_ID
const MAX_USAGE_LIMIT = 2

/**
 * Manually encodes form data for x-www-form-urlencoded requests
 * @param {object} data - Key-value pairs to encode
 * @returns {string} Encoded form data string
 */
function encodeFormData(data) {
	return Object.keys(data)
		.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
		.join('&')
}

/**
 * Validates a Gumroad license key (shared validation logic)
 * @param {string} licenseKey - The license key to validate
 * @param {boolean} incrementUsage - Whether to increment usage count
 * @returns {Promise<{ok: boolean, error?: string, purchase?: object, uses?: number}>}
 * 
 * NOTE: Gumroad's API has inconsistent behavior - it may increment usage count
 * even when increment_uses_count=false. Only call this once per activation.
 */
export function validateGumroadLicense(licenseKey, incrementUsage = false) {
	return fetch('https://api.gumroad.com/v2/licenses/verify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: encodeFormData({
			product_id: GUMROAD_PRODUCT_ID,
			license_key: licenseKey,
			increment_uses_count: incrementUsage.toString()
		})
	})
	.then(response => {
		// Check if response is ok (status 200-299)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		return response.json()
	})
	.then(data => {
		// We got a valid JSON response from the API
		if (!data.success) {
			return { ok: false, error: 'Invalid license key', isLicenseError: true }
		}
		
		const purchase = data.purchase || {}
		if (purchase.refunded || purchase.chargebacked || purchase.license_disabled) {
			return { ok: false, error: 'License is no longer valid', isLicenseError: true }
		}
		
		// Check usage limit (max 2 devices: work and personal)
		const currentUses = data.uses || 0
		if (currentUses >= MAX_USAGE_LIMIT) {
			return { 
				ok: false, 
				error: 'License limit reached. Maximum 2 devices allowed (work and personal). Unlink from another device first.',
				isLicenseError: true
			}
		}
		
		return { ok: true, purchase: purchase, uses: data.uses }
	})
	.catch(error => {
		console.warn('[License] Network/API error during validation:', error)
		// This is a network error, not a license validation error
		// Don't invalidate the license, just return a network error
		return { 
			ok: false, 
			error: 'Unable to verify license. Please check your connection.',
			isNetworkError: true 
		}
	})
}

/**
 * Verifies a Gumroad license key and manages usage count (for user activation)
 * @param {string} licenseKey - The license key to verify
 * @returns {Promise<{ok: boolean, error?: string, purchase?: object, uses?: number}>}
 */
export function verifyGumroadLicense(licenseKey) {
	// FIXED: Only call once with increment=true to avoid double increment
	// Gumroad's API increments usage even when increment_uses_count=false
	return validateGumroadLicense(licenseKey, true)
		.then(result => {
			if (result.ok) {
				return { ok: true, purchase: result.purchase, uses: result.uses }
			} else {
				return result // Return validation error as-is
			}
		})
}

/**
 * Decrements the usage count for a license key using Netlify proxy
 * @param {string} licenseKey - The license key to decrement usage for
 * @returns {Promise<{ok: boolean, error?: string, uses?: number}>}
 */
export function decrementLicenseUsage(licenseKey) {
	return fetch('https://figma-plugins-display-network.netlify.app/api/licenses/decrement_uses_count', {
		method: 'PUT',
		headers: { 
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			license_key: licenseKey,
			product_id: GUMROAD_PRODUCT_ID
		})
	})
	.then(response => response.json())
	.then(data => {
		if (data.success) {
			console.log('[License] Usage count decremented successfully, uses now:', data.uses)
			return { ok: true, uses: data.uses }
		} else {
			console.warn('[License] Failed to decrement usage count:', data.message || data.error)
			return { ok: false, error: data.message || data.error }
		}
	})
	.catch(error => {
		console.warn('[License] Failed to decrement usage count:', error)
		return { ok: false, error: 'Network error' }
	})
}

/**
 * Validates a license key without incrementing usage count (for startup validation)
 * Includes device usage validation as requested
 * @param {string} licenseKey - The license key to validate
 * @returns {Promise<{ok: boolean, error?: string, purchase?: object, uses?: number}>}
 */
export function validateLicenseOnly(licenseKey) {
	return validateGumroadLicense(licenseKey, false) // Use shared validation logic without incrementing
}

/**
 * Retrieves stored license data from Figma client storage via postMessage
 * @returns {Promise<object|null>} License data or null if not found
 */
export function getStoredLicense() {
	return new Promise((resolve) => {
		parent.postMessage({ 
			pluginMessage: { type: 'get-license' } 
		}, '*')
		
		// Listen for response
		const handler = (e) => {
			const msg = e.data.pluginMessage
			if (msg.type === 'license-data') {
				window.removeEventListener('message', handler)
				resolve(msg.license)
			}
		}
		window.addEventListener('message', handler)
		
		// Timeout after 1 second
		setTimeout(() => {
			window.removeEventListener('message', handler)
			resolve(null)
		}, 1000)
	})
}

/**
 * Activates a license by storing it via postMessage to Core.js
 * @param {string} licenseKey - The license key
 * @param {object} purchase - Purchase data from Gumroad
 * @param {number} uses - Current usage count
 */
export function activateLicense(licenseKey, purchase, uses) {
	parent.postMessage({
		pluginMessage: {
			type: 'activate-license',
			licenseKey: licenseKey,
			purchase: purchase,
			uses: uses
		}
	}, '*')
}

/**
 * Removes/unlinks a license by sending message to Core.js
 */
export function removeLicense() {
	parent.postMessage({
		pluginMessage: { type: 'remove-license' }
	}, '*')
}

/**
 * Creates license info object for UI display
 * @param {string} licenseKey - The license key
 * @param {object} purchase - Purchase data from Gumroad
 * @param {number} uses - Current usage count
 * @returns {object} License info object
 */
export function createLicenseInfo(licenseKey, purchase, uses) {
	return {
		licensed: true,
		purchase: purchase,
		activatedAt: Date.now(),
		licenseKey: licenseKey,
		uses: uses || 1 // Default to 1 if not specified
	}
}
