import './PreferencesView.css'

import Element from 'src/ui/Element'
import Tracking from "src/utils/Tracking"

class PreferencesView extends Element {

	bind() {
		
	}

	render() {
		return `
			<form action="#">
				<fieldset>		
					<strong>Grid spacing</strong>

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
					<div class="input-icon">
						<div class="input-icon__icon">
							<div class="icon icon--frame"></div>
						</div>
						<input id="starting_name" type="number" class="input-icon__input" step="1" value="${'000'}">
					</div>
				</label>
				
				<label class="switch">
					<div class="switch__container">
						<input id="name_override_check" type="checkbox" class="switch__checkbox" checked>
						<span class="switch__slider"></span>
					</div>
					<div class="switch__label">
						<strong>Replace original name</strong>
					</div>
				</label>
				
				<button type="submit" id="save" class="button button--primary">Save</button>
			</form>
			
		`
	}
}

customElements.define('v-preferences', PreferencesView)
