import './FormView.css'

import Element from 'leo/element'
class FormView extends Element {

	bind() {
		// PLUGIN UI CONTROLS
		var form = document.getElementById('form')
		var renaming_check = document.getElementById('renaming_check')
		var reorder_check = document.getElementById('reorder_check')
		var tidy_check = document.getElementById('tidy_check')
		var x_spacing = document.getElementById('x_spacing')
		var y_spacing = document.getElementById('y_spacing')
		var tidy = document.getElementById('tidy')

		function applySuperTidy() {
			var renamingEnabled = renaming_check.checked;
			var reorderEnabled = reorder_check.checked;
			var tidyEnabled = tidy_check.checked;
			var options = {
				renaming: renamingEnabled,
				reorder: reorderEnabled,
				tidy: tidyEnabled,
				spacing: { x: parseInt(x_spacing.value), y: parseInt(y_spacing.value) }
			}

			parent.postMessage({ pluginMessage: { type: 'tidy', options: options } }, '*')
		}

		tidy_check.onchange = e => {
			document.querySelector('[data-node="tidy-options"]').classList.toggle('hidden')
		}

		form.onsubmit = (e) => {
			applySuperTidy()
			e.preventDefault()
		}
	}

	render() {
		return `
		<form id="form">
			<p class="type type--11-pos-medium">
				Super Tidy renames your frames and reorders them in the layers list by their position in the canvas.
			</p>
			<p class="type type--11-pos-medium">
				It also replicates the Figma Tidy feature so you can run it all at once: Rename, Reorder and Tidy.
			</p>
			
			<fieldset>
				<label class="switch">
					<div class="switch__container">
						<input id="renaming_check" type="checkbox" class="switch__checkbox" checked>
						<span class="switch__slider"></span>
					</div>
					<div class="switch__label">Renaming</div>
				</label>
			</fieldset>
			
			<fieldset>
				<label class="switch">
					<div class="switch__container">
						<input id="reorder_check" type="checkbox" class="switch__checkbox" checked>
						<span class="switch__slider"></span>
					</div>
					<div class="switch__label">Reorder</div>
				</label>
			</fieldset>
			
			<fieldset>
				<label class="switch">
					<div class="switch__container">
						<input id="tidy_check" type="checkbox" class="switch__checkbox" checked>
						<span class="switch__slider"></span>
					</div>
					<div class="switch__label">Tidy</div>
				</label>
				<section class="tidy-options" data-node="tidy-options">
					<div class="input-icon">
						<div class="input-icon__icon">
							<div class="icon icon--text icon--black-3">X</div>
						</div>
						<input id="x_spacing" type="number" class="input-icon__input" placeholder="Horizontal" step="1" value="100">
					</div>
					<div class="input-icon">
						<div class="input-icon__icon">
							<div class="icon icon--text icon--black-3">Y</div>
						</div>
						<input id="y_spacing" type="number" class="input-icon__input" placeholder="Vertical" step="1" value="200">
					</div>
				</section>
			</fieldset>
			<button type="submit" id="tidy" class="button button--primary">Apply</button>
		</form>
		`
	}
}

customElements.define('v-form', FormView)