import 'src/ui/Bulletproof.css'
import 'src/App.css'
import 'src/ui/FigmaUI.css'

import Tracking from 'src/utils/Tracking'
import Router from 'src/utils/Router'
import Element from 'src/ui/Element'

import 'src/ui/components/toolbar/ToolbarComponent'
import 'src/ui/views/form/FormView'
import 'src/ui/views/preferences/PreferencesView'
import 'src/ui/views/license/LicenseView'
import 'src/ui/components/display/DisplayComponent'


class ui extends Element {

	beforeMount() {
		window.addEventListener('message', e => {
			let msg = event.data.pluginMessage
			if (msg.type == 'init-hidden' || msg.type == 'init' || msg.type == 'init-direct') {
				this.data.preferences = msg.preferences
				Tracking.setup(WP_AMPLITUDE_KEY, msg.UUID)
				Tracking.track('openPlugin', { cmd: msg.cmd })
			}

			if (msg.type == 'init') {
				this.insertDisplay(msg.AD_LAST_SHOWN_DATE, msg.AD_LAST_SHOWN_IMPRESSION)
			}

			// Handle direct countdown from Core.js (for menu commands)
			if (msg.type == 'start-direct-countdown') {
				this.handleDirectCountdown(msg.seconds, msg.commandName)
			}
		})

		Router.setup({
			index: '#index',
			preferences: '#preferences',
			license: '#license'
		})
	}

	bind() {
		Router.on('change:url', url => this.showActiveView(url))
	}

	insertDisplay(lastShownDate, lastShownImpression) {
		let elem = document.createElement('c-display')
		elem.setAttribute('lastshowndate', lastShownDate)
		elem.setAttribute('lastshownimpression', lastShownImpression)
		elem.setAttribute('hidden', '')
		document.body.insertBefore(elem, document.body.querySelector('root-ui'))
	}

	handleDirectCountdown(seconds, commandName) {
		// Navigate to index view (FormView) and call startCountdown directly
		Router.navigate(Router.routes.index)
		
		// Wait for the view to be rendered, then start countdown
		setTimeout(() => {
			const formView = document.querySelector('[data-view="index"]')
			if (formView && formView.startCountdown) {
				formView.startCountdown(seconds, commandName, () => {
					// Send completion message back to Core.js
					parent.postMessage({ 
						pluginMessage: { type: 'direct-countdown-complete' } 
					}, '*')
				})
			} else {
				console.error('[App] FormView not found or startCountdown method not available')
			}
		}, 100)
	}



	showActiveView(url) {
		let viewName = url.replace('#', '')
		this.findAll('[data-view]').forEach(view => view.setAttribute('hidden', ''))
		const targetView = this.find(`[data-view="${viewName}"]`)
		if (targetView) {
			targetView.removeAttribute('hidden')
		}
	}

	render() {
		if (!this.data.preferences) return '';
		return`
			<c-toolbar></c-toolbar>
			<v-form data-view="index" class="view"></v-form>
			<v-preferences class="view" hidden data-view="preferences"
				xspacing="${this.data.preferences.spacing.x}"
				yspacing="${this.data.preferences.spacing.y}"
				startname="${this.data.preferences.start_name}"
				pager_variable="${this.data.preferences.pager_variable}"
				wrapinstances="${this.data.preferences.wrap_instances}"
				renamestrategy="${this.data.preferences.rename_strategy}"
				layoutparadigm="${this.data.preferences.layout_paradigm || 'rows'}"
			></v-preferences>
			<v-license class="view" hidden data-view="license"></v-license>
		`
	}
}

customElements.define('root-ui', ui)
