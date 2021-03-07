import './PreferencesView.css'

import Element from 'src/ui/Element'
import Tracking from "src/utils/Tracking"

import 'src/ui/components/select/SelectComponent'

class PreferencesView extends Element {

	bind() {
		
	}

	render() {
		return `
			<form action="#">
				<fieldset>		
					<strong>Grid spacing</strong>
					<p>Spacing between frames applied when running the Tidy action.</p>

					<label>
						<div class="input-icon">
							<div class="input-icon__icon">
								<div class="icon icon--distribute-horizontal-spacing"></div>
							</div>
							<input id="x_spacing" type="number" class="input-icon__input" step="1" value="${this.attrs.xspacing}">
						</div>
					</label>
					
					<label>
						<div class="input-icon">
							<div class="input-icon__icon">
								<div class="icon icon--distribute-vertical-spacing"></div>
							</div>
							<input id="y_spacing" type="number" class="input-icon__input" step="1" value="${this.attrs.yspacing}">
						</div>
					</label>
				</fieldset>
				
				<label>
					<strong>Starting frame number</strong>
					<p>Renames your frames starting from this number when using the Rename action.</p>
					
					<div class="input-icon">
						<div class="input-icon__icon">
							<div class="icon icon--frame"></div>
						</div>
						<input id="starting_name" type="number" class="input-icon__input" step="1" value="${'VALUE'}">
					</div>
				</label>
				
				<div class="fake-label">
					<strong>Rename strategy</strong>
					<p>Merges or replaces your frame names with numbers based on their position on the canvas. Applied with the Rename action.</p>
					<c-select>
						<option selected>Replace</option>
						<option>Merge</option>
					</c-select>
				</div>
				
				<button type="submit" id="save" class="button button--primary">Save</button>
			</form>
			
		`
	}
}

customElements.define('v-preferences', PreferencesView)
