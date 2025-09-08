import './LicenseView.css'
import Element from 'src/ui/Element'
import Tracking from 'src/utils/Tracking'
import { setCachedLicenseStatus } from 'src/payments/gate'
import { 
	verifyGumroadLicense, 
	decrementLicenseUsage, 
	getStoredLicense, 
	activateLicense, 
	removeLicense, 
	createLicenseInfo 
} from 'src/payments/license'

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
		getStoredLicense()
			.then(license => {
				if (license && license.licensed) {
					this.data.isLicensed = true
					this.data.licenseInfo = license
					// If no uses info is stored, default to 1 (this device)
					if (!this.data.licenseInfo.uses) {
						this.data.licenseInfo.uses = 1
					}
					this.render()
				}
			})
			.catch(e => {
				// No existing license found
			})
	}

	activateLicense() {
		const licenseInput = this.find('#license-key')
		const licenseKey = licenseInput.value.trim()
		
		if (!licenseKey) {
			this.showStatus('Please enter a license key', 'error')
			return
		}
		
		// Track license validation started
		Tracking.track('licenseValidationStarted', {
			keyLength: licenseKey.length,
			source: 'license-tab'
		})
		
		this.data.isValidating = true
		this.data.statusMessage = '' // Clear any previous error messages
		this.data.statusType = ''
		this.render()
		
		verifyGumroadLicense(licenseKey)
			.then(result => {
				if (result.ok) {
					// Send license data to Core.js for storage
					activateLicense(licenseKey, result.purchase, result.uses)
					
					// IMMEDIATELY update the gate cache to ensure instant effect
					const licenseData = createLicenseInfo(licenseKey, result.purchase, result.uses)
					setCachedLicenseStatus(licenseData)
					console.log('[LicenseView] Gate cache updated immediately:', licenseData)
					
					// Update state to show licensed view
					this.data.isLicensed = true
					this.data.licenseInfo = licenseData
					
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
		const licenseKey = this.data.licenseInfo ? this.data.licenseInfo.licenseKey : null
		
		if (licenseKey) {
			// First decrement the usage count on Gumroad
			decrementLicenseUsage(licenseKey)
				.then(result => {
					if (result.ok) {
						// Usage count decremented successfully
					} else {
						console.warn('[LicenseView] Failed to decrement usage count, but proceeding with unlink')
					}
				})
		}
		
		// Send message to Core.js to remove license
		removeLicense()
		
		// IMMEDIATELY clear the gate cache to ensure instant effect
		setCachedLicenseStatus(null)
		console.log('[LicenseView] Gate cache cleared immediately')
		
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
				<h1>Super Tidy Pro</h1>
				<p>
					You can now run all commands instantly without any countdown delays.
				</p>
				
				<div class="license-info">
					<div class="license-detail">
						<strong>Licensed to</strong><br/>
						${email}
					</div>
					<div class="license-detail">
						<strong>License Key</strong><br/>
						${licenseKey}
					</div>
					<div class="license-detail">
						<strong>Activated</strong><br/>
						${activatedDate}
					</div>
					<div class="license-detail">
						<strong>Device Usage</strong><br/>
						${this.data.licenseInfo.uses || 1}/2 devices
					</div>
				</div>
				
				<button 
					id="unlink-license" 
					class="button button--secondary"
				>
					Unlink from this device
				</button>
				<p class="license-info-hint">
					Unlinking will return you to the free plan and reset this device usage.
				</p>
				
				${this.renderSupportSection()}
			</div>
		`
	}

	renderUnlicensedView() {
		return `
			<div class="license-container">
				<h1>Activate Super Tidy Pro</h1>
				<p>
					Enter your license key to unlock instant runs and skip all countdowns.
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
					
					<button 
					type="submit" 
					class="button button--primary"
					${this.data.isValidating ? 'disabled' : ''}
					>
					${this.data.isValidating ? 'Validating...' : 'Activate'}
					</button>
					
					${this.data.statusType === 'error' ? `
					<div class="license-status ${this.data.statusType}">
						${this.data.statusMessage}
					</div>
					` : ''}
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