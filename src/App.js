import 'src/ui/Bulletproof.css'
import 'src/App.css'
import 'src/ui/FigmaUI.css'

import Tracking from 'src/utils/Tracking'
import Router from 'src/utils/Router'
import Element from 'src/ui/Element'

import 'src/ui/components/toolbar/ToolbarComponent'
import 'src/ui/views/form/FormView'
import 'src/ui/views/preferences/PreferencesView'


class ui extends Element {

	beforeMount() {
		window.addEventListener('message', e => {
			let msg = event.data.pluginMessage
			if (msg.type == 'init') {
				this.data.preferences = msg.preferences
				console.log('preferences', this.data.preferences)
				Tracking.setup(WP_AMPLITUDE_KEY, msg.UUID)
				Tracking.track('openPlugin', { cmd: msg.cmd })
			}
		})
		
		Router.setup({
			index: '#index',
			preferences: '#preferences'
		})
	}
	
	bind() {
		Router.on('change:url', url => this.showActiveView(url))
	}
	
	showActiveView(url) {
		let view = url.replace('#', '')
		this.findAll('[data-view]').forEach(view => view.classList.add('hidden'))
		this.find(`[data-view="${view}"]`).classList.remove('hidden')
	}

	render() {
		if (!this.data.preferences) return '';
		return`
			<c-toolbar></c-toolbar>
			<v-form data-view="index"></v-form>
			<v-preferences class="hidden" data-view="preferences"
				xspacing="${this.data.preferences.spacing.x}"
				yspacing="${this.data.preferences.spacing.y}"
				startname="${this.data.preferences.start_name}"
				renamestrategy="${this.data.preferences.rename_strategy}"
			>
			</v-form>
		`
	}
}

customElements.define('root-ui', ui)
