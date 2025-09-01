import './CountdownView.css'
import Element from 'src/ui/Element'

class CountdownView extends Element {

	beforeMount() {
		// Initialize countdown state
		this.data.seconds = 0
		this.data.commandName = ''
		this.data.intervalId = null
		this.data.onComplete = null
	}

	startCountdown(seconds, commandName, onComplete) {
		console.log(`[CountdownView] Starting countdown: ${seconds}s for ${commandName}`)
		
		this.data.seconds = seconds
		this.data.commandName = commandName
		this.data.onComplete = onComplete
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
				this.completeCountdown()
			}
		}, 1000)
	}

	completeCountdown() {
		console.log('[CountdownView] Countdown complete!')
		
		// Clear interval
		if (this.data.intervalId) {
			clearInterval(this.data.intervalId)
			this.data.intervalId = null
		}

		// Call the completion callback directly
		if (this.data.onComplete) {
			this.data.onComplete()
		}
	}

	dismount() {
		// Clean up interval if component is removed
		if (this.data.intervalId) {
			clearInterval(this.data.intervalId)
		}
	}

	render() {
		if (!this.data.seconds && !this.data.commandName) {
			return '<div class="countdown-container">Loading...</div>'
		}

		return `
			<div class="countdown-container">
				<div class="countdown-title">Free mode: starting soon</div>
				<div class="countdown-description">
					Your command will start automatically in:
				</div>
				<div class="countdown-timer">${this.data.seconds}s</div>
				<div class="countdown-command">${this.data.commandName}</div>
			</div>
		`
	}
}

customElements.define('v-countdown', CountdownView)
