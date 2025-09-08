import './FormView.css'

import Element from 'src/ui/Element'
import Tracking from "src/utils/Tracking"
import { shouldShowCountdown, getCountdownSeconds, setCachedLicenseStatus } from 'src/payments/gate'
import '../countdown/CountdownView'

class FormView extends Element {

	beforeMount() {
		// Initialize pending command state
		this.data.pendingCommand = null
		this.data.showingCountdown = false
		
		// Load license status for gate decisions
		this.loadLicenseStatus()
	}

	loadLicenseStatus() {
		// Request license data from Core.js to update gate cache
		parent.postMessage({ 
			pluginMessage: { type: 'get-license-for-gate' } 
		}, '*')
		
		// Listen for license data response (only once)
		const handler = (e) => {
			const msg = e.data.pluginMessage
			if (msg.type === 'license-data-for-gate') {
				setCachedLicenseStatus(msg.license)
				window.removeEventListener('message', handler) // Clean up listener
			}
		}
		window.addEventListener('message', handler)
		
		// Timeout cleanup after 2 seconds
		setTimeout(() => {
			window.removeEventListener('message', handler)
		}, 2000)
	}

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
		var form = document.getElementById('actions')
		var renaming_check = document.getElementById('renaming_check')
		var reorder_check = document.getElementById('reorder_check')
		var tidy_check = document.getElementById('tidy_check')
		var pager_check = document.getElementById('pager_check')
		var tidy = document.getElementById('tidy')

		const applySuperTidy = () => {
			var renamingEnabled = renaming_check.checked;
			var reorderEnabled = reorder_check.checked;
			var tidyEnabled = tidy_check.checked;
			var pagerEnabled = pager_check.checked;
			var options = {
				renaming: renamingEnabled,
				reorder: reorderEnabled,
				tidy: tidyEnabled,
				pager: pagerEnabled
			}

			Tracking.track('clickApply', options)
			this.handleCommandRequest('tidy', options)
		}


		form.onsubmit = (e) => {
			applySuperTidy()
			e.preventDefault()
		}
	}

	handleCommandRequest(commandName, options) {
		if (shouldShowCountdown()) {
			// Store the command for later execution
			this.data.pendingCommand = { commandName, options }
			
			// Start countdown
			const seconds = getCountdownSeconds()
			
			this.startCountdown(seconds, commandName, () => {
				this.executePendingCommand()
			})
		} else {
			// Execute immediately if licensed
			this.executeCommand(commandName, options)
		}
	}
	
	startCountdown(seconds, commandName, onComplete) {
		this.data.showingCountdown = true
		this.render()
		
		// Wait for the view to be rendered, then start countdown
		setTimeout(() => {
			const countdownView = this.querySelector('v-countdown')
			if (countdownView && countdownView.startCountdown) {
				countdownView.startCountdown(seconds, commandName, onComplete)
			}
		}, 100)
	}
	
	executePendingCommand() {
		if (this.data.pendingCommand) {
			this.executeCommand(this.data.pendingCommand.commandName, this.data.pendingCommand.options)
			this.data.pendingCommand = null
			this.data.showingCountdown = false
			this.render()
		}
	}
	
	executeCommand(commandName, options) {
		// Send command to Core.js
		parent.postMessage({ 
			pluginMessage: { 
				type: commandName, 
				options: options 
			} 
		}, '*')
	}


	render() {
		if (this.data.showingCountdown) {
			return '<v-countdown></v-countdown>'
		}

		return `
		<section class="empty-selection" data-select="empty" hidden>
			<h1 class="type type--11-pos-bold">Empty selection</h1>
			<p class="type type--11-pos-medium">
				Select some layers first to start using Super Tidy.
			</p>
		</section>
		<form id="actions" data-select="form" hidden>
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

			<fieldset>
				<label class="switch">
					<div class="switch__container">
						<input id="pager_check" type="checkbox" class="switch__checkbox" checked>
						<span class="switch__slider"></span>
					</div>
					<div class="switch__label">
						<strong>Pager</strong>
						<p class="type type--11-pos-normal">
							Creates a pagination for the given selection using the position in the canvas of each frame. The page number is written inside a layer with the name {current} by default.
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
