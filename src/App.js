import 'src/ui/Bulletproof.css'
import 'src/App.css'
import 'src/ui/FigmaUI.css'

import Tracking from 'src/utils/Tracking'
import 'src/ui/views/form/FormView'
import Element from 'src/ui/Element'

class ui extends Element {

	beforeMount() {
		window.addEventListener('message', e => {
			let msg = event.data.pluginMessage
			if (msg.type == 'init') {
				this.data.spacing = msg.spacing
				Tracking.setup(WP_AMPLITUDE_KEY, msg.UUID)
				Tracking.track('openPlugin', { cmd: msg.cmd })
			}
		})
	}

	render() {
		if (!this.data.spacing) return '';
		return`
			<v-form xspacing="${this.data.spacing.x}" yspacing="${this.data.spacing.y}"></v-form>
		`
	}
}

customElements.define('root-ui', ui)
