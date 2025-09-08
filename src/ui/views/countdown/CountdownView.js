import './CountdownView.css'
import Element from 'src/ui/Element'
import Tracking from 'src/utils/Tracking'
import './AnalogChronometer'

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
		this.data.seconds = seconds
		this.data.totalSeconds = seconds
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
			this.render() // This will update the chronometer via attributes

			if (this.data.seconds <= 0) {
				this.finishCountdown()
			}
		}, 1000)
	}

	finishCountdown() {
		// Track countdown completion
		Tracking.track('countdownCompleted', {
			commandName: this.data.commandName,
			totalSeconds: this.data.totalSeconds,
			completionRate: 1.0
		})

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
		// Track "Run Now" button click
		Tracking.track('runNowClicked', {
			commandName: this.data.commandName,
			waitTime: this.data.totalSeconds
		})

		// Call the completion callback directly
		if (this.data.onComplete) {
			this.data.onComplete()
		}
	}

	handleGetPro() {
		// Track "Get Super Tidy Pro" click from countdown
		Tracking.track('getProClickedFromCountdown', {
			commandName: this.data.commandName,
			secondsRemaining: this.data.seconds,
			source: 'countdown'
		})

		window.open('https://basiclines.gumroad.com/l/super-tidy-pro', '_blank')
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
				<analog-chrono 
					total-seconds="${this.data.totalSeconds || 0}" 
					current-seconds="${this.data.seconds || 0}">
				</analog-chrono>
				<span class="countdown-timer">${this.data.seconds > 0 ? this.data.seconds + 's' : 'Ready'}</span>
				<p class="countdown-timer-hint">
					You are on the free plan, you need to wait before running your command.
				</p>
				<button id="run-now" class="button button--secondary" ${this.data.countdownFinished ? '' : 'disabled'}>Run now</button>
				<button id="get-pro" class="button button--primary">Get Super Tidy Pro</button>
			</section>
		`
	}
}

customElements.define('v-countdown', CountdownView)
