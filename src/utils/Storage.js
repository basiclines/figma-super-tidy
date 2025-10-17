/**
 * Storage utility for Figma clientStorage operations
 * Provides a centralized abstraction layer with error tracking
 */

import FigPen from 'src/utils/FigPen'
import CONFIG from 'src/Config'

let singleton = null

class Storage {
	constructor() {
		this.keys = new Map()
		this.initialized = false
		this.FigPen = new FigPen(CONFIG.designTool, CONFIG.name, CONFIG.url)
		
		if (!singleton) singleton = this
		return singleton
	}
	
	/**
	 * Initialize storage with valid keys from Core.js
	 * @param {Object} keyDefinitions - Object with key-value pairs for valid storage keys
	 */
	init(keyDefinitions) {
		this.keys.clear()
		Object.entries(keyDefinitions).forEach(([name, value]) => {
			this.keys.set(name, value)
		})
		this.initialized = true
		console.log('[Storage] Initialized with keys:', Array.from(this.keys.keys()))
	}
	
	/**
	 * Validates that a storage key is defined in the keys Map
	 * @param {string} key - The storage key to validate
	 * @returns {boolean} True if valid, throws error if not
	 */
	validateStorageKey(key) {
		if (!this.initialized) {
			throw new Error('Storage not initialized. Call Storage.init() first.')
		}
		
		const validKeys = Array.from(this.keys.values())
		if (!validKeys.includes(key)) {
			const keyNames = Array.from(this.keys.keys())
			throw new Error(`Invalid storage key: ${key}. Valid keys: ${keyNames.join(', ')}`)
		}
		return true
	}
	
	/**
	 * Get a key value by name
	 * @param {string} keyName - The key name (e.g., 'UUID', 'LICENSE_V1')
	 * @returns {string} The actual storage key value
	 */
	getKey(keyName) {
		if (!this.keys.has(keyName)) {
			throw new Error(`Key name not found: ${keyName}`)
		}
		return this.keys.get(keyName)
	}

	/**
	 * Gets a value from Figma client storage
	 * @param {string} key - Storage key (must be defined in keys Map)
	 * @returns {Promise<any>} The stored value or null if not found/error
	 */
	get(key) {
		this.validateStorageKey(key)
		
		return this.FigPen.getStorageItem(key)
			.then(value => {
				return value
			})
			.catch(error => {
				console.error(`[Storage] Failed to get ${key}:`, error)
				this.emitStorageError('get', key, error)
				return null
			})
	}

	/**
	 * Sets a value in Figma client storage
	 * @param {string} key - Storage key (must be defined in keys Map)
	 * @param {any} value - Value to store (null to remove)
	 * @returns {Promise<boolean>} True if successful, false otherwise
	 */
	set(key, value) {
		this.validateStorageKey(key)
		
		return this.FigPen.setStorageItem(key, value)
			.then(() => {
				return true
			})
			.catch(error => {
				console.error(`[Storage] Failed to set ${key}:`, error)
				this.emitStorageError('set', key, error)
				return false
			})
	}

	/**
	 * Gets multiple storage values in parallel
	 * @param {string[]} keys - Array of storage keys
	 * @returns {Promise<Object>} Object with key-value pairs (failed keys will have null values)
	 */
	getMultiple(keys) {
		// Validate all keys first
		keys.forEach(key => this.validateStorageKey(key))
		
		const promises = keys.map((key) => {
			return this.FigPen.getStorageItem(key)
				.then(value => {
					return { key, value, success: true }
				})
				.catch(error => {
					console.error(`[Storage] Failed to get ${key}:`, error)
					this.emitStorageError('get', key, error)
					return { key, value: null, success: false }
				})
		})
		
		return Promise.all(promises)
			.then(results => {
				// Convert to key-value object
				return results.reduce((acc, result) => {
					acc[result.key] = result.value
					return acc
				}, {})
			})
	}

	/**
	 * Sets multiple storage values in parallel
	 * @param {Object} keyValuePairs - Object with key-value pairs to store
	 * @returns {Promise<Object>} Object with key-success pairs indicating which operations succeeded
	 */
	setMultiple(keyValuePairs) {
		const keys = Object.keys(keyValuePairs)
		
		// Validate all keys first
		keys.forEach(key => this.validateStorageKey(key))
		
		const promises = keys.map((key) => {
			return this.FigPen.setStorageItem(key, keyValuePairs[key])
				.then(() => {
					return { key, success: true }
				})
				.catch(error => {
					console.error(`[Storage] Failed to set ${key}:`, error)
					this.emitStorageError('set', key, error)
					return { key, success: false }
				})
		})
		
		return Promise.all(promises)
			.then(results => {
				// Convert to key-success object
				return results.reduce((acc, result) => {
					acc[result.key] = result.success
					return acc
				}, {})
			})
	}

	/**
	 * Removes a value from storage (sets to null)
	 * @param {string} key - Storage key to remove
	 * @returns {Promise<boolean>} True if successful, false otherwise
	 */
	remove(key) {
		return this.set(key, null)
	}
	
	/**
	 * Emits a tracking event for storage errors
	 * @param {string} operation - 'get' or 'set'
	 * @param {string} key - The storage key that failed
	 * @param {Error} error - The error that occurred
	 */
	emitStorageError(operation, key, error) {
		if (typeof figma !== 'undefined' && figma.ui) {
			figma.ui.postMessage({
				type: 'tracking-event',
				event: 'storage-operation-failed',
				properties: {
					operation: operation,
					key: key,
					error: error.message || error.toString(),
					timestamp: Date.now()
				}
			})
		}
	}
}

// Export singleton instance
export default new Storage()
