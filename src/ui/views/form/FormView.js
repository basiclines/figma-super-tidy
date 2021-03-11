import './FormView.css'

import Element from 'src/ui/Element'
import Tracking from "src/utils/Tracking"
import Router from 'src/utils/Router'

class FormView extends Element {

	handleEmptyState(selection) {
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
				this.handleEmptyState(selection)
			}
		})

		// PLUGIN UI CONTROLS
		var form = document.getElementById('form')
		var renaming_check = document.getElementById('renaming_check')
		var reorder_check = document.getElementById('reorder_check')
		var tidy_check = document.getElementById('tidy_check')
		var tidy = document.getElementById('tidy')

		function applySuperTidy() {
			var renamingEnabled = renaming_check.checked;
			var reorderEnabled = reorder_check.checked;
			var tidyEnabled = tidy_check.checked;
			var options = {
				renaming: renamingEnabled,
				reorder: reorderEnabled,
				tidy: tidyEnabled,
			}

			Tracking.track('clickApply', options)
			parent.postMessage({ pluginMessage: { type: 'tidy', options: options } }, '*')
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
			</fieldset>
			
			<button type="submit" id="tidy" class="button button--primary">Run</button>
		</form>
		`
	}
}

customElements.define('v-form', FormView)
