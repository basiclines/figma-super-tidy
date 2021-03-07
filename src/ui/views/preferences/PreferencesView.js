import './PreferencesView.css'

import Element from 'src/ui/Element'
import Tracking from "src/utils/Tracking"

class PreferencesView extends Element {

	bind() {
		
	}

	render() {
		return `
			Preferences view
			${this.attrs.xspacing}
			${this.attrs.yspacing}
		`
	}
}

customElements.define('v-preferences', PreferencesView)
