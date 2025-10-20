import Tracking from 'src/utils/Tracking'
import Storage from 'src/utils/Storage'

import FigPen from 'src/utils/FigPen'
import MessageBus from 'src/utils/MessageBus'

import { shouldShowCountdown, getCountdownSeconds, setCachedLicenseStatus } from 'src/payments/gate'
import { 
	getNodesGroupedbyPosition, 
	getNameByPosition, 
	repositionNodes, 
	reorderNodes, 
	applyPagerNumbers, 
	applyRenameStrategy 
} from 'src/utils/LayoutUtils'
import CONFIG from 'src/Config'

const UI_HEIGHT = 540

// Initialize Storage with valid keys
const STORAGE_KEYS = {
	UUID: 'UUID',
	PREFERENCES: 'preferences', 
	AD_LAST_SHOWN_DATE: 'AD_LAST_SHOWN_DATE',
	AD_LAST_SHOWN_IMPRESSION: 'AD_LAST_SHOWN_IMPRESSION',
	LICENSE_V1: 'LICENSE_V1',
	SPACING: 'spacing' // legacy key
}

Storage.init(STORAGE_KEYS)
const FP = new FigPen(CONFIG)
const cmd = FP.currentCommand()
const theme = FP.currentTheme()

// Simple hash function for license keys (don't store raw keys)
function hashLicenseKey(key) {
	try {
		return String(key).split('').reduce((a,c) => ((a<<5)-a+c.charCodeAt(0))|0, 0).toString(16)
	} catch (e) {
		return 'hash-error'
	}
}

// Helper function to validate selection for direct commands
function validateSelectionForCommand(commandName) {
	const selection = FP.currentSelection()
	if (selection.length === 0) {
		FP.showNotification('Select some layers first to start using Super Tidy.')
		FP.closePlugin()
		return false
	}
	return true
}

// Helper function to handle gating for direct menu commands
function ensureDirectCommandGate(commandName, executeCommand, preferences, UUID, license) {
	// First validate selection - skip everything if no selection
	if (!validateSelectionForCommand(commandName)) {
		return // Exit early, user already notified
	}
	
	if (shouldShowCountdown()) {
		// Show UI with countdown for unlicensed users
		FP.openUI()
		
		const seconds = getCountdownSeconds()
		
		// Send init message first so UI components are ready
		FP.notifyUI({
			type: 'init-direct',
			UUID: UUID,
			cmd: commandName,
			preferences: preferences,
			license: license
		})
		
		// Then send countdown start message
		setTimeout(() => {
			FP.notifyUI({
				type: 'start-direct-countdown',
				seconds: seconds,
				commandName: commandName
			})
		}, 50)
		

		// Bind direct countdown completion handler
		MessageBus.bind('direct-countdown-complete', (msg) => {
			let historyId = FP.startUndoBlock()
			executeCommand()
			FP.finishUndoBlock(historyId)
			FP.closePlugin()
		})
	} else {
		// Execute immediately if licensed
		let historyId = FP.startUndoBlock()
		executeCommand()
		FP.finishUndoBlock(historyId)
		FP.closePlugin()
	}
}



function cmdRename(renameStrategy, startName, layoutParadigm = 'rows') {
	var selection = FP.currentSelection()
	var parent = (selection[0].type == 'PAGE') ? FP.currentPage() : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection, layoutParadigm)

	applyRenameStrategy(groupedNodes, layoutParadigm, renameStrategy, startName, allNodes)
}

function cmdReorder(layoutParadigm = 'rows') {
	var selection = FP.currentSelection()
	var parent = (selection[0].type == 'PAGE') ? FP.currentPage() : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection, layoutParadigm)

	reorderNodes(groupedNodes, layoutParadigm, parent, allNodes)
}

function cmdTidy(xSpacing, ySpacing, wrapInstances, layoutParadigm = 'rows') {
	var selection = FP.currentSelection()
	var parent = (selection[0].type == 'PAGE') ? FP.currentPage() : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection, layoutParadigm)

	repositionNodes(groupedNodes, xSpacing, ySpacing, wrapInstances, layoutParadigm, allNodes)
}

function cmdPager(pager_variable, layoutParadigm = 'rows') {
	var selection = FP.currentSelection()
	var parent = (selection[0].type == 'PAGE') ? FP.currentPage() : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection, layoutParadigm)

	applyPagerNumbers(groupedNodes, layoutParadigm, pager_variable, allNodes)
}

// Obtain UUID, preferences, and license then trigger init event
Storage.getMultiple([
	Storage.getKey('UUID'),
	Storage.getKey('PREFERENCES'),
	Storage.getKey('AD_LAST_SHOWN_DATE'),
	Storage.getKey('AD_LAST_SHOWN_IMPRESSION'),
	Storage.getKey('SPACING'), // legacy
	Storage.getKey('LICENSE_V1') // license data
]).then(storageData => {
	let UUID = storageData[Storage.getKey('UUID')]
	let preferencesSaved = storageData[Storage.getKey('PREFERENCES')]
	let AD_LAST_SHOWN_DATE = storageData[Storage.getKey('AD_LAST_SHOWN_DATE')] || 572083200 // initial date, if no date was saved previously
	let AD_LAST_SHOWN_IMPRESSION = storageData[Storage.getKey('AD_LAST_SHOWN_IMPRESSION')] || 0 // initial impressions
	let license = storageData[Storage.getKey('LICENSE_V1')] // license data

	let SPACING = { x: 100, y: 200 }
	let START_NAME = '000'
	let PAGER_VARIABLE = '{current}'
	let WRAP_INSTANCES = true
	let RENAME_STRATEGY_REPLACE = 'replace'
	let RENAME_STRATEGY_MERGE = 'merge'
	let LAYOUT_PARADIGM = 'rows'
	let DEFAULT_PREFERENCES = {
		spacing: SPACING,
		start_name: START_NAME,
		pager_variable: PAGER_VARIABLE,
		wrap_instances: WRAP_INSTANCES,
		rename_strategy: RENAME_STRATEGY_REPLACE,
		layout_paradigm: LAYOUT_PARADIGM
	}
	let preferences = preferencesSaved || DEFAULT_PREFERENCES

	if (!UUID) {
		UUID = Tracking.createUUID()
		Storage.set(Storage.getKey('UUID'), UUID)
	}

	// Cache license status for gate decisions
	setCachedLicenseStatus(license)

	FP.waitForUIReady().then(() => {
		FP.notifyUI({
			type: 'init-hidden',
			theme: theme,
			UUID: UUID,
			cmd: cmd,
			preferences: preferences,
			license: license
		})
		// Make sure initial selection is sent to the UI
		FP.notifyUI({ type: 'selection', selection: FP.currentSelection() })
	})

	// Set up selection change listener using FigPen
	FP.onSelectionChange((selection) => {
		FP.notifyUI({ type: 'selection', selection: selection })
	})

	// Bind all message handlers using MessageBus
	MessageBus.bind('tidy', (msg) => {
		var RENAMING_ENABLED = msg.options.renaming
		var REORDER_ENABLED = msg.options.reorder
		var TIDY_ENABLED = msg.options.tidy
		var PAGER_ENABLED = msg.options.pager

		let historyId = FP.startUndoBlock()
		if (TIDY_ENABLED) cmdTidy(preferences.spacing.x, preferences.spacing.y, preferences.wrap_instances, preferences.layout_paradigm || 'rows')
		if (RENAMING_ENABLED) cmdRename(preferences.rename_strategy, preferences.start_name, preferences.layout_paradigm || 'rows')
		if (REORDER_ENABLED) cmdReorder(preferences.layout_paradigm || 'rows')
		if (PAGER_ENABLED) cmdPager(preferences.pager_variable, preferences.layout_paradigm || 'rows')
		FP.finishUndoBlock(historyId)
		FP.showNotification('Super Tidy')
		setTimeout(() => FP.closePlugin(), 100)
	})

	MessageBus.bind('preferences', (msg) => {
		preferences = msg.preferences
		Storage.set(Storage.getKey('PREFERENCES'), preferences).then((success) => {
			if (success) {
				FP.showNotification('Preferences saved')
			} else {
				FP.showNotification('Failed to save preferences. Please try again.')
			}
		})
	})

	MessageBus.bind('displayImpression', (msg) => {
		FP.resizeUI(320, 540+124)
		Storage.setMultiple({
			[Storage.getKey('AD_LAST_SHOWN_DATE')]: Date.now(),
			[Storage.getKey('AD_LAST_SHOWN_IMPRESSION')]: parseInt(AD_LAST_SHOWN_IMPRESSION)+1
		})
	})

	MessageBus.bind('resetImpression', (msg) => {
		Storage.set(Storage.getKey('AD_LAST_SHOWN_IMPRESSION'), 0)
	})

	MessageBus.bind('activate-license', (msg) => {
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
		
		Storage.set(Storage.getKey('LICENSE_V1'), licenseData)
			.then((success) => {
				if (success) {
					setCachedLicenseStatus(licenseData) // Update cache
					FP.showNotification('You now have Super Tidy Pro')
				} else {
					FP.showNotification('Failed to save license. Please try again.')
				}
			})
	})

	MessageBus.bind('remove-license', (msg) => {
		// Remove stored license
		Storage.remove(Storage.getKey('LICENSE_V1'))
			.then((success) => {
				if (success) {
					setCachedLicenseStatus(null) // Update cache
					FP.showNotification('License unlinked from this device')
				} else {
					FP.showNotification('Failed to unlink license. Please try again.')
				}
			})
	})
	// Command triggered by user
	if (cmd == 'rename') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('rename', () => {
			cmdRename(preferences.rename_strategy, preferences.start_name, preferences.layout_paradigm || 'rows')
			FP.showNotification('Super Tidy: Rename')
		}, preferences, UUID, license)
	} else
	if (cmd == 'reorder') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('reorder', () => {
			cmdReorder(preferences.layout_paradigm || 'rows')
			FP.showNotification('Super Tidy: Reorder')
		}, preferences, UUID, license)
	} else
	if (cmd == 'tidy') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('tidy', () => {
			cmdTidy(preferences.spacing.x, preferences.spacing.y, preferences.wrap_instances, preferences.layout_paradigm || 'rows')
			FP.showNotification('Super Tidy: Tidy')
		}, preferences, UUID, license)
	} else
	if (cmd == 'pager') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('pager', () => {
			cmdPager(preferences.pager_variable, preferences.layout_paradigm || 'rows')
			FP.showNotification('Super Tidy: Pager')
		}, preferences, UUID, license)
	} else
	if (cmd == 'all') {
		// RUNS WITH COUNTDOWN GATE
		ensureDirectCommandGate('all', () => {
			cmdTidy(preferences.spacing.x, preferences.spacing.y, preferences.wrap_instances, preferences.layout_paradigm || 'rows')
			cmdReorder(preferences.layout_paradigm || 'rows')
			cmdRename(preferences.rename_strategy, preferences.start_name, preferences.layout_paradigm || 'rows')
			cmdPager(preferences.pager_variable, preferences.layout_paradigm || 'rows')
			FP.showNotification('Super Tidy')
		}, preferences, UUID, license)
	} else
	if (cmd == 'options' || cmd == null) {
		// OPEN UI
		FP.openUI()
		FP.notifyUI({
			type: 'init',
			UUID: UUID,
			cmd: cmd,
			preferences: preferences,
			license: license,
			AD_LAST_SHOWN_DATE: AD_LAST_SHOWN_DATE,
			AD_LAST_SHOWN_IMPRESSION: AD_LAST_SHOWN_IMPRESSION
		})
		FP.notifyUI({ type: 'selection', selection: FP.currentSelection() })
	}
})
