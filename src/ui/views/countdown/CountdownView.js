import './CountdownView.css'
import Element from 'src/ui/Element'

class CountdownView extends Element {

	beforeMount() {
		// Initialize countdown state
		this.data.seconds = 0
		this.data.commandName = ''
		this.data.intervalId = null
		this.data.onComplete = null
		this.data.countdownFinished = false
	}

	startCountdown(seconds, commandName, onComplete) {
		console.log(`[CountdownView] Starting countdown: ${seconds}s for ${commandName}`)
		
		this.data.seconds = seconds
		this.data.commandName = commandName
		this.data.onComplete = onComplete
		this.data.countdownFinished = false
		this.render()

		// Clear any existing interval
		if (this.data.intervalId) {
			clearInterval(this.data.intervalId)
		}

		// Start countdown timer
		this.data.intervalId = setInterval(() => {
			this.data.seconds--
			this.render()

			if (this.data.seconds <= 0) {
				this.finishCountdown()
			}
		}, 1000)
	}

	finishCountdown() {
		console.log('[CountdownView] Countdown finished - showing button')
		
		// Clear interval
		if (this.data.intervalId) {
			clearInterval(this.data.intervalId)
			this.data.intervalId = null
		}

		// Mark countdown as finished and show button
		this.data.countdownFinished = true
		this.data.seconds = 0
		this.render()
	}

	executeCommand() {
		console.log('[CountdownView] User clicked Run Now button')
		
		// Call the completion callback directly
		if (this.data.onComplete) {
			this.data.onComplete()
		}
	}

	handleGetPro() {
		console.log('[CountdownView] User clicked Get Pro button')
		// TODO: Implement Gumroad checkout in future iterations
		// For now, just log the action
		console.log('Get Pro functionality will be implemented in Iteration 3')
	}

	bind() {
		// Handle button clicks
		this.addEventListener('click', (e) => {
			if (e.target.id === 'run-now') {
				this.executeCommand()
			}
			if (e.target.id === 'get-pro') {
				this.handleGetPro()
			}
		})
	}

	dismount() {
		// Clean up interval if component is removed
		if (this.data.intervalId) {
			clearInterval(this.data.intervalId)
		}
	}

	render() {
		if (!this.data.seconds && !this.data.commandName && !this.data.countdownFinished) {
			return '<div class="countdown-container">Loading...</div>'
		}

		return `
			<section class="countdown-container">
				<h1 class="countdown-title">Get Super Tidy Pro to skip the countdown</h1>
				<p class="countdown-description">
					Super Tidy Pro is a lifetime one-time purchase. No recurring charges or subscriptions.
				</p>
				<div class="countdown-timer">
					${this.data.seconds}s
					<p class="countdown-timer-hint">
					You are on the free plan, you need to wait before running your command.
					</p>
				</div>
				<button id="run-now" class="button button--secondary" ${this.data.countdownFinished ? '' : 'disabled'}>Run now</button>
				<button id="get-pro" class="button button--primary">Get Super Tidy Pro</button>
			</section>
		`
	}
}

customElements.define('v-countdown', CountdownView)
