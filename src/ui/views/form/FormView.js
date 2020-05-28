import './FormView.css'

import Element from 'leo/element'
import Tracking from "src/utils/Tracking";
class FormView extends Element {

	checkSelection(selection) {
		if (selection.length == 0) {
			this.find('[data-select=empty]').removeAttribute('hidden')
			this.find('[data-select=form]').setAttribute('hidden', '')
		} else {
			this.find('[data-select=empty]').setAttribute('hidden', '')
			this.find('[data-select=form]').removeAttribute('hidden')
		}
	}

	bind() {
		window.addEventListener('message', e => {
			let msg = event.data.pluginMessage
			if (msg.type == 'selection') {
				let selection = event.data.pluginMessage.selection
				this.checkSelection(selection)
			}
		})

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

			let trackOptions = Object.assign({}, options)
			delete trackOptions.spacing
			trackOptions.xSpacing = options.spacing.x
			trackOptions.ySpacing = options.spacing.y

			Tracking.track('clickApply', trackOptions)
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
		<section class="empty-selection" data-select="empty" hidden>
			<h1 class="type type--11-pos-bold">Empty selection</h1>
			<p class="type type--11-pos-medium">
				Select some layers first to start using Super Tidy.
			</p>
		</section>
		<form id="form" data-select="form" hidden>
			<fieldset>
				<label class="switch">
					<div class="switch__container">
						<input id="renaming_check" type="checkbox" class="switch__checkbox" checked>
						<span class="switch__slider"></span>
					</div>
					<div class="switch__label">
						<strong>Renaming</strong>
						<p class="type type--11-pos-normal">
							Rename your layers based on their position on the canvas. <em>000, 001, ...</em>
						</p>
					</div>
				</label>
			</fieldset>
			
			<fieldset>
				<label class="switch">
					<div class="switch__container">
						<input id="reorder_check" type="checkbox" class="switch__checkbox" checked>
						<span class="switch__slider"></span>
					</div>
					<div class="switch__label">
						<strong>Reorder</strong>
						<p class="type type--11-pos-normal">
							Reorder your layers on the sidebar based on their position on the canvas. 
						</p>
					</div>
				</label>
			</fieldset>
			
			<fieldset>
				<label class="switch">
					<div class="switch__container">
						<input id="tidy_check" type="checkbox" class="switch__checkbox" checked>
						<span class="switch__slider"></span>
					</div>
					<div class="switch__label">
						<strong>Tidy</strong>
						<p class="type type--11-pos-normal">
							Align the layers on the canvas to a fixed spacing grid.
						</p>
					</div>
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
