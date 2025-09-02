import './AnalogChronometer.css'
import Element from 'src/ui/Element'

class AnalogChronometer extends Element {

	beforeMount() {
		this.data.totalSeconds = 0
		this.data.currentSeconds = 0
	}

	mount() {
		// Update hand position when component mounts
		this.updateFromAttrs()
		this.updateHand()
	}


	updateFromAttrs() {
		this.data.totalSeconds = parseInt(this.attrs['total-seconds']) || 0
		this.data.currentSeconds = parseInt(this.attrs['current-seconds']) || 0
	}

	updateHand() {
		// Calculate rotation: starts at 0deg (12 o'clock), completes full circle
		const progress = this.data.totalSeconds > 0 ? 
			1 - (this.data.currentSeconds / this.data.totalSeconds) : 0
		const rotation = 0 + (progress * 360)
		
		const hand = this.find('.chrono-hand')
		if (hand) {
			hand.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`
		}
	}

	generateTicks() {
		const totalSeconds = this.data.totalSeconds || 15
		let ticks = ''
		
		// Generate one tick for each second position where the needle will stop
		for (let i = 0; i < totalSeconds; i++) {
			const angle = (i / totalSeconds) * 360 // Evenly distribute around circle
			ticks += `<div class="chrono-tick" style="transform: translateX(-50%) rotate(${angle}deg);"></div>`
		}
		
		return ticks
	}

	render() {
		return `
			<div class="analog-chrono">
				<div class="chrono-face">
					${this.generateTicks()}
					<div class="chrono-hand"></div>
				</div>
			</div>
		`
	}
}

customElements.define('analog-chrono', AnalogChronometer)

