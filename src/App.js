import 'src/ui/Bulletproof.css'
import 'src/App.css'
import 'src/ui/FigmaUI.css'

import Tracking from 'src/utils/Tracking'
import Router from 'src/utils/Router'
import Element from 'src/ui/Element'

import 'src/ui/components/toolbar/ToolbarComponent'
import 'src/ui/views/form/FormView'
import 'src/ui/views/preferences/PreferencesView'
import 'src/ui/views/countdown/CountdownView'
import 'src/ui/components/display/DisplayComponent'


class ui extends Element {

	beforeMount() {
		window.addEventListener('message', e => {
			let msg = event.data.pluginMessage
			if (msg.type == 'init-hidden' || msg.type == 'init') {
				this.data.preferences = msg.preferences
				Tracking.setup(WP_AMPLITUDE_KEY, msg.UUID)
				Tracking.track('openPlugin', { cmd: msg.cmd })
			}

			if (msg.type == 'init') {
				this.insertDisplay(msg.AD_LAST_SHOWN_DATE, msg.AD_LAST_SHOWN_IMPRESSION)
			}
		})

		Router.setup({
			index: '#index',
			preferences: '#preferences',
			countdown: '#countdown'
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



	showActiveView(url) {
		let view = url.replace('#', '')
		this.findAll('[data-view]').forEach(view => view.setAttribute('hidden', ''))
		this.find(`[data-view="${view}"]`).removeAttribute('hidden')
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
			></v-preferences>
			<v-countdown class="view" hidden data-view="countdown"></v-countdown>
		`
	}
}

customElements.define('root-ui', ui)
