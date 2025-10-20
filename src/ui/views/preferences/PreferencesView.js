import './PreferencesView.css'

import Element from 'src/ui/Element'
import Tracking from "src/utils/Tracking"
import Router from 'src/utils/Router'
import FigPen from 'src/utils/FigPen'
import CONFIG from 'src/Config'
import 'src/ui/components/select/SelectComponent'

class PreferencesView extends Element {

	beforeMount() {
		this.FP = new FigPen(CONFIG)
	}

	savePreferences() {
		let x_spacing = this.find('#x_spacing').value
		let y_spacing = this.find('#y_spacing').value
		let starting_name = this.find('#starting_name').value
		let pager_variable = this.find('#pager_variable').value
		let wrap_instances = this.find('#wrap_instances').checked
		let rename_trategy = this.find('#rename_strategy [selected]').getAttribute('data-value')
		let layout_paradigm = this.find('#layout_paradigm [selected]').getAttribute('data-value')

		let preferences = {
			spacing: { x: parseInt(x_spacing), y: parseInt(y_spacing) },
			start_name: starting_name,
			wrap_instances: wrap_instances,
			rename_strategy: rename_trategy,
			pager_variable: pager_variable,
			layout_paradigm: layout_paradigm
		}

		Tracking.track('autoSavePreferences', preferences)
		this.FP.notifyEditor({ type: 'preferences', preferences: preferences })
	}

	bind(e) {
		// Auto-save on input changes
		this.find('#x_spacing').addEventListener('input', () => this.savePreferences())
		this.find('#y_spacing').addEventListener('input', () => this.savePreferences())
		this.find('#starting_name').addEventListener('input', () => this.savePreferences())
		this.find('#pager_variable').addEventListener('input', () => this.savePreferences())
		this.find('#wrap_instances').addEventListener('change', () => this.savePreferences())
		this.find('#layout_paradigm').addEventListener('change', () => this.savePreferences())
		this.find('#rename_strategy').addEventListener('change', () => this.savePreferences())
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

				<div class="fake-label">
					<strong>Layout</strong>
					<p>Rows (horizontal flow, good for mobile designs) or Columns (vertical flow, ideal for presentations and wide formats).</p>
					<c-select id="layout_paradigm">
						<option value="rows" ${(this.attrs.layoutparadigm == 'rows' || !this.attrs.layoutparadigm) ? 'selected' : ''}>
							Rows
						</option>
						<option value="columns" ${(this.attrs.layoutparadigm == 'columns') ? 'selected' : ''}>
							Columns
						</option>
					</c-select>
				</div>

				<label>
					<strong>Wrap instances with frames</strong>
					<p>When using the Tidy action, all instances will be wrapped with a frame of the same dimensions.</p>

					<label class="switch">
						<div class="switch__container">
							<input id="wrap_instances" type="checkbox" class="switch__checkbox" ${(this.attrs.wrapinstances == 'true') ? 'checked' : ''}>
							<span class="switch__slider"></span>
						</div>
					</label>
				</label>
				</fieldset>

				<label>
					<strong>Pager variable</strong>
					<p>When using the Pager action, all text layers named with the defined variable will be replaced with a number based on the parent frame order.</p>

					<div class="input-icon">
						<div class="input-icon__icon">
							<div class="icon icon--adjust"></div>
						</div>
						<input id="pager_variable" required type="text" class="input-icon__input" step="1" value="${this.attrs.pager_variable}">
					</div>
				</label>

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
			</form>

		`
	}
}

customElements.define('v-preferences', PreferencesView)
