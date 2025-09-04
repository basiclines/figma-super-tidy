// License verification and management API module
// Handles all Gumroad API interactions and license operations

const GUMROAD_PRODUCT_ID = 'WAwyZR5nPmxDKE6_y3rjog=='

/**
 * Verifies a Gumroad license key and manages usage count
 * @param {string} licenseKey - The license key to verify
 * @returns {Promise<{ok: boolean, error?: string, purchase?: object, uses?: number}>}
 */
export async function verifyGumroadLicense(licenseKey) {
	try {
		// First check usage without incrementing
		const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				product_id: GUMROAD_PRODUCT_ID,
				license_key: licenseKey,
				increment_uses_count: 'false' // Check first without incrementing
			})
		})
		
		const data = await response.json()
		
		if (!data.success) {
			return { ok: false, error: 'Invalid license key' }
		}
		
		const purchase = data.purchase || {}
		if (purchase.refunded || purchase.chargebacked || purchase.license_disabled) {
			return { ok: false, error: 'License is no longer valid' }
		}
		
		// Check usage limit (max 2 devices: work and personal)
		const currentUses = data.uses || 0
		if (currentUses >= 2) {
			return { 
				ok: false, 
				error: 'License limit reached. Maximum 2 devices allowed (work and personal). Unlink from another device first.' 
			}
		}
		
		// If under limit, increment usage and return success
		const incrementResult = await incrementLicenseUsage(licenseKey)
		if (incrementResult.ok) {
			return { ok: true, purchase: incrementResult.purchase, uses: incrementResult.uses }
		} else {
			return { ok: false, error: 'Failed to activate license. Please try again.' }
		}
	} catch (error) {
		console.error('[License] Error verifying license:', error)
		return { ok: false, error: 'Unable to verify license. Please check your connection.' }
	}
}

/**
 * Increments the usage count for a license key
 * @param {string} licenseKey - The license key to increment usage for
 * @returns {Promise<{ok: boolean, purchase?: object, uses?: number}>}
 */
export async function incrementLicenseUsage(licenseKey) {
	try {
		const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				product_id: GUMROAD_PRODUCT_ID,
				license_key: licenseKey,
				increment_uses_count: 'true' // Actually increment this time
			})
		})
		
		const data = await response.json()
		
		if (data.success) {
			return { ok: true, purchase: data.purchase, uses: data.uses }
		} else {
			return { ok: false }
		}
	} catch (error) {
		console.error('[License] Error incrementing usage:', error)
		return { ok: false }
	}
}

/**
 * Decrements the usage count for a license key using Netlify proxy
 * @param {string} licenseKey - The license key to decrement usage for
 * @returns {Promise<{ok: boolean, error?: string, uses?: number}>}
 */
export async function decrementLicenseUsage(licenseKey) {
	try {
		const response = await fetch('https://figma-plugins-display-network.netlify.app/api/licenses/decrement_uses_count', {
			method: 'PUT',
			headers: { 
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				license_key: licenseKey,
				product_id: GUMROAD_PRODUCT_ID
			})
		})
		
		const data = await response.json()
		
		if (data.success) {
			console.log('[License] Usage count decremented successfully, uses now:', data.uses)
			return { ok: true, uses: data.uses }
		} else {
			console.warn('[License] Failed to decrement usage count:', data.message || data.error)
			return { ok: false, error: data.message || data.error }
		}
	} catch (error) {
		console.warn('[License] Failed to decrement usage count:', error)
		return { ok: false, error: 'Network error' }
	}
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
			purchase: purchase
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