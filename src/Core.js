import Tracking from 'src/utils/Tracking'
import { shouldShowCountdown, getCountdownSeconds, setCachedLicenseStatus } from 'src/payments/gate'
import { 
	getNodesGroupedbyPosition, 
	getNameByPosition, 
	repositionNodes, 
	reorderNodes, 
	applyPagerNumbers, 
	applyRenameStrategy 
} from 'src/utils/LayoutUtils'

const UI_HEIGHT = 540

const cmd = figma.command
figma.showUI(__html__, { visible: false })

// Simple hash function for license keys (don't store raw keys)
function hashLicenseKey(key) {
	try {
		return String(key).split('').reduce((a,c) => ((a<<5)-a+c.charCodeAt(0))|0, 0).toString(16)
	} catch (e) {
		return 'hash-error'
	}
}

// Helper function to handle gating for direct menu commands
function ensureDirectCommandGate(commandName, executeCommand, preferences, UUID) {
	if (shouldShowCountdown()) {
		// Show UI with countdown for unlicensed users
		figma.showUI(__html__, { width: 360, height: UI_HEIGHT })
		
		const seconds = getCountdownSeconds()
		
		// Send init message first so UI components are ready
		figma.ui.postMessage({
			type: 'init-direct',
			UUID: UUID,
			cmd: commandName,
			preferences: preferences
		})
		
		// Then send countdown start message
		setTimeout(() => {
			figma.ui.postMessage({
				type: 'start-direct-countdown',
				seconds: seconds,
				commandName: commandName
			})
		}, 50)
		
		// Handle countdown completion
		figma.ui.onmessage = (msg) => {
			if (msg.type === 'direct-countdown-complete') {
				executeCommand()
				figma.closePlugin()
			}
		}
	} else {
		// Execute immediately if licensed
		executeCommand()
		figma.closePlugin()
	}
}



function cmdRename(renameStrategy, startName, layoutParadigm = 'rows') {
	var selection = figma.currentPage.selection
	var parent = (selection[0].type == 'PAGE') ? figma.currentPage : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection, layoutParadigm)

	applyRenameStrategy(groupedNodes, layoutParadigm, renameStrategy, startName, allNodes)
}

function cmdReorder(layoutParadigm = 'rows') {
	var selection = figma.currentPage.selection
	var parent = (selection[0].type == 'PAGE') ? figma.currentPage : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection, layoutParadigm)

	reorderNodes(groupedNodes, layoutParadigm, parent, allNodes)
}

function cmdTidy(xSpacing, ySpacing, wrapInstances, layoutParadigm = 'rows') {
	var selection = figma.currentPage.selection
	var parent = (selection[0].type == 'PAGE') ? figma.currentPage : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection, layoutParadigm)

	repositionNodes(groupedNodes, xSpacing, ySpacing, wrapInstances, layoutParadigm, allNodes)
}

function cmdPager(pager_variable, layoutParadigm = 'rows') {
	var selection = figma.currentPage.selection
	var parent = (selection[0].type == 'PAGE') ? figma.currentPage : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection, layoutParadigm)

	applyPagerNumbers(groupedNodes, layoutParadigm, pager_variable, allNodes)
}

// Obtain UUID, preferences, and license then trigger init event
Promise.all([
	figma.clientStorage.getAsync('UUID'),
	figma.clientStorage.getAsync('preferences'),
	figma.clientStorage.getAsync('AD_LAST_SHOWN_DATE'),
	figma.clientStorage.getAsync('AD_LAST_SHOWN_IMPRESSION'),
	figma.clientStorage.getAsync('spacing'), // legacy
	figma.clientStorage.getAsync('LICENSE_V1') // license data
]).then(values => {
	let UUID = values[0]
	let preferences = values[1]
	let AD_LAST_SHOWN_DATE = values[2] || 572083200 // initial date, if no date was saved previously
	let AD_LAST_SHOWN_IMPRESSION = values[3] || 0 // initial impressions
	let spacing = values[4]
	let license = values[5] // license data

	let SPACING = { x: 100, y: 200 }
	let START_NAME = '000'
	let PAGER_VARIABLE = '{current}'
	let WRAP_INSTANCES = true
	let RENAME_STRATEGY_REPLACE = 'replace'
	let RENAME_STRATEGY_MERGE = 'merge'
	let LAYOUT_PARADIGM = 'rows'
	let PREFERENCES = {
		spacing: SPACING,
		start_name: START_NAME,
		pager_variable: PAGER_VARIABLE,
		wrap_instances: WRAP_INSTANCES,
		rename_strategy: RENAME_STRATEGY_REPLACE,
		layout_paradigm: LAYOUT_PARADIGM
	}

	if (!UUID) {
		UUID = Tracking.createUUID()
		figma.clientStorage.setAsync('UUID', UUID)
	}

	// Cache license status for gate decisions
	setCachedLicenseStatus(license)

	// legacy spacing preference
	if (typeof spacing != 'undefined') {
		PREFERENCES.spacing = spacing
	}

	if (typeof preferences == 'undefined') {
		preferences = PREFERENCES
	}

	figma.ui.postMessage({
		type: 'init-hidden',
		UUID: UUID,
		cmd: cmd,
		preferences: preferences
	})

	// Command triggered by user
	if (cmd == 'rename') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('rename', () => {
			cmdRename(preferences.rename_strategy, preferences.start_name, preferences.layout_paradigm || 'rows')
			figma.notify('Super Tidy: Rename')
		}, preferences, UUID)
	} else
	if (cmd == 'reorder') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('reorder', () => {
			cmdReorder(preferences.layout_paradigm || 'rows')
			figma.notify('Super Tidy: Reorder')
		}, preferences, UUID)
	} else
	if (cmd == 'tidy') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('tidy', () => {
			cmdTidy(preferences.spacing.x, preferences.spacing.y, preferences.wrap_instances, preferences.layout_paradigm || 'rows')
			figma.notify('Super Tidy: Tidy')
		}, preferences, UUID)
	} else
	if (cmd == 'pager') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('pager', () => {
			cmdPager(preferences.pager_variable, preferences.layout_paradigm || 'rows')
			figma.notify('Super Tidy: Pager')
		}, preferences, UUID)
	} else
	if (cmd == 'all') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('all', () => {
			cmdTidy(preferences.spacing.x, preferences.spacing.y, preferences.wrap_instances, preferences.layout_paradigm || 'rows')
			cmdReorder(preferences.layout_paradigm || 'rows')
			cmdRename(preferences.rename_strategy, preferences.start_name, preferences.layout_paradigm || 'rows')
			cmdPager(preferences.pager_variable, preferences.layout_paradigm || 'rows')
			figma.notify('Super Tidy')
		}, preferences, UUID)
	} else
	if (cmd == 'options') {
		// OPEN UI
		figma.showUI(__html__, { width: 320, height: UI_HEIGHT })
		figma.ui.postMessage({
			type: 'init',
			UUID: UUID,
			cmd: cmd,
			preferences: preferences,
			AD_LAST_SHOWN_DATE: AD_LAST_SHOWN_DATE,
			AD_LAST_SHOWN_IMPRESSION: AD_LAST_SHOWN_IMPRESSION
		})
		figma.ui.postMessage({ type: 'selection', selection: figma.currentPage.selection })

		figma.on('selectionchange', () => {
			figma.ui.postMessage({ type: 'selection', selection: figma.currentPage.selection })
		})

		figma.ui.onmessage = msg => {
			if (msg.type === 'tidy') {
				var RENAMING_ENABLED = msg.options.renaming
				var REORDER_ENABLED = msg.options.reorder
				var TIDY_ENABLED = msg.options.tidy
				var PAGER_ENABLED = msg.options.pager

				if (TIDY_ENABLED) cmdTidy(preferences.spacing.x, preferences.spacing.y, preferences.wrap_instances, preferences.layout_paradigm || 'rows')
				if (RENAMING_ENABLED) cmdRename(preferences.rename_strategy, preferences.start_name, preferences.layout_paradigm || 'rows')
				if (REORDER_ENABLED) cmdReorder(preferences.layout_paradigm || 'rows')
				if (PAGER_ENABLED) cmdPager(preferences.pager_variable, preferences.layout_paradigm || 'rows')
				figma.notify('Super Tidy')
				setTimeout(() => figma.closePlugin(), 100)
			} else
			if (msg.type === 'preferences') {
				preferences = msg.preferences
				figma.clientStorage.setAsync('preferences', preferences)
				figma.notify('Preferences saved')
			} else
			if (msg.type === 'displayImpression') {
				figma.ui.resize(320, 540+124)
				figma.clientStorage.setAsync('AD_LAST_SHOWN_DATE', Date.now())
				figma.clientStorage.setAsync('AD_LAST_SHOWN_IMPRESSION', parseInt(AD_LAST_SHOWN_IMPRESSION)+1)
			}

			if (msg.type === 'resetImpression') {
				figma.clientStorage.setAsync('AD_LAST_SHOWN_IMPRESSION', 0)
			} else
			if (msg.type === 'get-license') {
				// Return stored license data to UI
				figma.clientStorage.getAsync('LICENSE_V1')
					.then(license => {
						figma.ui.postMessage({
							type: 'license-data',
							license: license || null
						})
					})
					.catch(error => {
						console.error('[Core] Failed to retrieve license:', error)
						figma.ui.postMessage({
							type: 'license-data',
							license: null
						})
					})
			} else
			if (msg.type === 'get-license-for-gate') {
				// Return license data specifically for gate cache updates
				figma.clientStorage.getAsync('LICENSE_V1')
					.then(license => {
						figma.ui.postMessage({
							type: 'license-data-for-gate',
							license: license || null
						})
					})
					.catch(error => {
						console.error('[Core] Failed to retrieve license for gate:', error)
						figma.ui.postMessage({
							type: 'license-data-for-gate',
							license: null
						})
					})
			} else
			if (msg.type === 'activate-license') {
				// Store license data from UI
				const licenseData = {
					licensed: true,
					productId: msg.productId || 'gumroad',
					licenseKeyHash: msg.licenseKey ? hashLicenseKey(msg.licenseKey) : null,
					licenseKey: msg.licenseKey, // Store actual key for display
					deviceId: UUID,
					activatedAt: Date.now(),
					purchase: msg.purchase || {},
					uses: msg.uses || 1 // Include usage count from activation
				}
				
				figma.clientStorage.setAsync('LICENSE_V1', licenseData)
					.then(() => {
						setCachedLicenseStatus(licenseData) // Update cache
					figma.notify('You now have Super Tidy Pro')
					})
					.catch(error => {
						console.error('[Core] Failed to store license data:', error)
						figma.notify('Failed to save license. Please try again.')
					})
			} else
			if (msg.type === 'remove-license') {
				// Remove stored license
				figma.clientStorage.setAsync('LICENSE_V1', null)
					.then(() => {
						setCachedLicenseStatus(null) // Update cache
						figma.notify('License unlinked from this device')
						})
					.catch(error => {
						console.error('[Core] Failed to remove license:', error)
						figma.notify('Failed to unlink license. Please try again.')
					})
			}
		}
	}
})
