import './PreferencesView.css'

import Element from 'src/ui/Element'
import Tracking from "src/utils/Tracking"
import Router from 'src/utils/Router'

import 'src/ui/components/select/SelectComponent'

class PreferencesView extends Element {

	savePreferences() {
		let x_spacing = this.find('#x_spacing').value
		let y_spacing = this.find('#y_spacing').value
		let starting_name = this.find('#starting_name').value
		let rename_trategy = this.find('#rename_strategy [selected]').getAttribute('data-value')
		
		let preferences = {
			spacing: { x: parseInt(x_spacing), y: parseInt(y_spacing) },
			start_name: starting_name,
			rename_strategy: rename_trategy
		}
		
		Tracking.track('clickSavePreferences', preferences)
		parent.postMessage({ pluginMessage: { type: 'preferences', preferences: preferences } }, '*')
		Router.navigate(Router.routes.index)
	}
	
	bind(e) {
		this.find('#preferences').addEventListener('submit', e => {
			this.savePreferences()
			e.preventDefault()
		})
	}

	render() {
		return `
			<form id="preferences" action="#">
				<fieldset>		
					<strong>Grid spacing</strong>
					<p>Spacing between frames applied when running the Tidy action.</p>

					<label>
						<div class="input-icon">
							<div class="input-icon__icon">
								<div class="icon icon--distribute-horizontal-spacing"></div>
							</div>
							<input id="x_spacing" required type="number" class="input-icon__input" step="1" value="${this.attrs.xspacing}">
						</div>
					</label>
					
					<label>
						<div class="input-icon">
							<div class="input-icon__icon">
								<div class="icon icon--distribute-vertical-spacing"></div>
							</div>
							<input id="y_spacing" required type="number" class="input-icon__input" step="1" value="${this.attrs.yspacing}">
						</div>
					</label>
				</fieldset>
				
				<label>
					<strong>Starting frame number</strong>
					<p>Renames your frames starting from the given number when using the Rename action.</p>
					
					<div class="input-icon">
						<div class="input-icon__icon">
							<div class="icon icon--frame"></div>
						</div>
						<input id="starting_name" required type="number" class="input-icon__input" step="1" value="${this.attrs.startname}">
					</div>
				</label>
				
				<div class="fake-label">
					<strong>Rename strategy</strong>
					<p>Merges or replaces your frame names with numbers based on their position on the canvas. Applied with the Rename action.</p>
					<c-select id="rename_strategy">
						<option value="replace" ${(this.attrs.renamestrategy == 'replace') ? 'selected' : ''}>
							Replace
						</option>
						<option value="merge" ${(this.attrs.renamestrategy == 'merge') ? 'selected' : ''}>
							Merge
						</option>
					</c-select>
				</div>
				
				<button type="submit" id="save" class="button button--primary">Save</button>
			</form>
			
		`
	}
}

customElements.define('v-preferences', PreferencesView)
