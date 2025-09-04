import './LicenseView.css'
import Element from 'src/ui/Element'
import Tracking from 'src/utils/Tracking'

const GUMROAD_PRODUCT_ID = 'WAwyZR5nPmxDKE6_y3rjog=='

class LicenseView extends Element {

	beforeMount() {
		this.data.isValidating = false
		this.data.statusMessage = ''
		this.data.statusType = '' // 'success', 'error', or ''
		this.data.isLicensed = false
		this.data.licenseInfo = null
		this.loadCurrentLicense()
	}

	loadCurrentLicense() {
		// Check if user already has a license
		this.getStoredLicense()
			.then(license => {
				if (license && license.licensed) {
					this.data.isLicensed = true
					this.data.licenseInfo = license
					this.render()
				}
			})
			.catch(e => {
				console.log('[LicenseView] No existing license found')
			})
	}

	getStoredLicense() {
		// This would normally use figma.clientStorage, but we're in UI context
		// We'll need to request this from Core.js via postMessage
		return new Promise((resolve) => {
			parent.postMessage({ 
				pluginMessage: { type: 'get-license' } 
			}, '*')
			
			// Listen for response (simplified for now)
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

	verifyGumroadLicense(licenseKey) {
		return fetch('https://api.gumroad.com/v2/licenses/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				product_id: GUMROAD_PRODUCT_ID,
				license_key: licenseKey,
				increment_uses_count: true
			})
		})
		.then(response => response.json())
		.then(data => {
			if (!data.success) {
				return { ok: false, error: 'Invalid license key' }
			}
			
			const purchase = data.purchase || {}
			if (purchase.refunded || purchase.chargebacked || purchase.license_disabled) {
				return { ok: false, error: 'License is no longer valid' }
			}
			
			return { ok: true, purchase }
		})
		.catch(error => {
			return { ok: false, error: 'Unable to verify license. Please check your connection.' }
		})
	}

	activateLicense() {
		const licenseInput = this.find('#license-key')
		const licenseKey = licenseInput.value.trim()
		
		if (!licenseKey) {
			this.showStatus('Please enter a license key', 'error')
			return
		}
		
		this.data.isValidating = true
		this.showStatus('Validating license...', '')
		this.render()
		
		this.verifyGumroadLicense(licenseKey)
			.then(result => {
				if (result.ok) {
					// Send license data to Core.js for storage
					parent.postMessage({
						pluginMessage: {
							type: 'activate-license',
							licenseKey: licenseKey,
							purchase: result.purchase
						}
					}, '*')
					
					// Update state to show licensed view
					this.data.isLicensed = true
					this.data.licenseInfo = {
						licensed: true,
						purchase: result.purchase,
						activatedAt: Date.now(),
						licenseKey: licenseKey // Store the actual license key for display
					}
					
					Tracking.track('licenseActivated', { email: result.purchase.email })
				} else {
					this.showStatus(result.error, 'error')
					Tracking.track('licenseActivationFailed', { error: result.error })
				}
				
				this.data.isValidating = false
				this.render()
			})
			.catch(error => {
				this.showStatus('Validation failed. Please try again.', 'error')
				this.data.isValidating = false
				this.render()
			})
	}

	showStatus(message, type) {
		this.data.statusMessage = message
		this.data.statusType = type
		this.render()
	}

	openSupportForm() {
		window.open('https://forms.gle/xZTBvrq8aW26r1m8A', '_blank')
		Tracking.track('supportFormOpened')
	}

	unlinkLicense() {
		console.log('[LicenseView] Unlinking license')
		
		// Send message to Core.js to remove license
		parent.postMessage({
			pluginMessage: { type: 'remove-license' }
		}, '*')
		
		// Update local state
		this.data.isLicensed = false
		this.data.licenseInfo = null
		this.data.statusMessage = ''
		this.data.statusType = ''
		
		Tracking.track('licenseUnlinked')
		this.render()
	}

	bind() {
		this.addEventListener('submit', (e) => {
			if (e.target.id === 'license-form') {
				e.preventDefault()
				this.activateLicense()
			}
		})
		
		this.addEventListener('click', (e) => {
			if (e.target.id === 'support-link') {
				e.preventDefault()
				this.openSupportForm()
			}
			if (e.target.id === 'unlink-license') {
				this.unlinkLicense()
			}
		})
	}

	renderLicensedView() {
		const purchase = this.data.licenseInfo.purchase || {}
		const email = purchase.email || 'Unknown'
		const licenseKey = this.data.licenseInfo.licenseKey || 'Unknown'
		const activatedDate = this.data.licenseInfo.activatedAt ? 
			new Date(this.data.licenseInfo.activatedAt).toLocaleDateString() : 'Unknown'
		
		return `
			<div class="license-container">
				<h1>Super Tidy Pro Activated</h1>
				<p>
					Your license is active! You can now run all commands instantly without any countdown delays.
				</p>
				
				<div class="license-info">
					<div class="license-detail">
						<strong>Licensed to:</strong> ${email}
					</div>
					<div class="license-detail">
						<strong>License Key:</strong> ${licenseKey}
					</div>
					<div class="license-detail">
						<strong>Activated:</strong> ${activatedDate}
					</div>
				</div>
				
				<button 
					id="unlink-license" 
					class="button button--secondary"
				>
					Unlink License
				</button>
				
				${this.renderSupportSection()}
			</div>
		`
	}

	renderUnlicensedView() {
		return `
			<div class="license-container">
				<h1>Activate Super Tidy Pro</h1>
				<p>
					Enter your license key from Gumroad to unlock instant runs and skip all countdowns.
				</p>
				
				<form id="license-form" class="license-form">
					<div class="license-input">
						<input 
							id="license-key" 
							type="text" 
							class="input" 
							placeholder="Enter your license key"
							${this.data.isValidating ? 'disabled' : ''}
						>
					</div>
					
					<div class="license-status ${this.data.statusType}">
						${this.data.statusMessage}
					</div>
					
					<button 
						type="submit" 
						class="button button--primary"
						${this.data.isValidating ? 'disabled' : ''}
					>
						${this.data.isValidating ? 'Validating...' : 'Activate'}
					</button>
				</form>
				
				${this.renderSupportSection()}
			</div>
		`
	}

	renderSupportSection() {
		return `
			<div class="support-section">
				<p>
					Need help or have feedback? 
					<a href="#" id="support-link">Contact support</a>
				</p>
			</div>
		`
	}

	render() {
		if (this.data.isLicensed && this.data.licenseInfo) {
			return this.renderLicensedView()
		}
		
		return this.renderUnlicensedView()
	}
}

customElements.define('v-license', LicenseView)
