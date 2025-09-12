/**
 * MessageBus utility for managing multiple figma.ui.onmessage listeners
 * Prevents listener overwriting by maintaining a registry of callbacks
 */

import FigPen from 'src/utils/FigPen'
import CONFIG from 'src/Config'

let singleton = null

class MessageBus {
	constructor() {
		this.listeners = new Map()
		this.isAttached = false
		this.FP = new FigPen(CONFIG)
		
		if (!singleton) singleton = this
		return singleton
	}
	
	/**
	 * Binds a callback to a specific message name
	 * If a listener already exists for this message name, it will be replaced
	 * @param {string} messageName - The message name to listen for (e.g., 'activate-license')
	 * @param {Function} callback - The callback function to execute
	 */
	bind(messageName, callback) {
		if (!messageName || typeof callback !== 'function') {
			throw new Error('MessageBus.bind() requires messageName and callback function')
		}
		
		// Set the listener (this will overwrite any existing listener for this message name)
		this.listeners.set(messageName, callback)
		
		// Attach the main message handler if not already attached
		this.attachMainHandler()
		
		console.log(`[MessageBus] Bound listener for '${messageName}'`)
	}
	
	/**
	 * Unbinds the listener for a specific message name
	 * @param {string} messageName - The message name to unbind
	 * @returns {boolean} True if listener was found and removed
	 */
	unbind(messageName) {
		if (!this.listeners.has(messageName)) {
			console.warn(`[MessageBus] No listener found for: ${messageName}`)
			return false
		}
		
		this.listeners.delete(messageName)
		console.log(`[MessageBus] Unbound listener for '${messageName}'`)
		
		// Detach main handler if no listeners remain
		if (this.listeners.size === 0) {
			this.detachMainHandler()
		}
		
		return true
	}
	
	/**
	 * Unbinds all listeners and detaches the main handler
	 * @returns {number} Total number of listeners removed
	 */
	unbindAll() {
		const totalCount = this.listeners.size
		
		this.listeners.clear()
		this.detachMainHandler()
		
		console.log(`[MessageBus] Unbound all ${totalCount} listeners`)
		return totalCount
	}
	
	/**
	 * Gets information about current listeners (for debugging)
	 * @returns {Array} Array of message names with listeners
	 */
	getListenerInfo() {
		return Array.from(this.listeners.keys())
	}
	
	/**
	 * Attaches the main figma.ui.onmessage handler
	 * @private
	 */
	attachMainHandler() {
		if (this.isAttached) return
		
		this.FP.onUIMessage(msg => {
			this.handleMessage(msg)
		})
		
		this.isAttached = true
		console.log('[MessageBus] Main message handler attached')
	}
	
	/**
	 * Detaches the main figma.ui.onmessage handler
	 * @private
	 */
	detachMainHandler() {
		if (!this.isAttached) return
		
		this.FP.clearUIListeners()
		this.isAttached = false
		console.log('[MessageBus] Main message handler detached')
	}
	
	/**
	 * Handles incoming messages and distributes to registered listeners
	 * @param {Object} msg - The message object from figma.ui
	 * @private
	 */
	handleMessage(msg) {
		if (!msg || !msg.type) {
			console.warn('[MessageBus] Received message without type:', msg)
			return
		}
		
		const messageName = msg.type
		const callback = this.listeners.get(messageName)
		
		if (!callback) {
			console.log(`[MessageBus] No listener for message name: ${messageName}`)
			return
		}
		
		console.log(`[MessageBus] Executing listener for '${messageName}'`)
		
		// Execute the listener for this message name
		try {
			callback(msg)
		} catch (error) {
			console.error(`[MessageBus] Error in listener for '${messageName}':`, error)
		}
	}
}

// Export singleton instance
export default new MessageBus()
