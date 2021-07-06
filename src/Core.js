import Tracking from 'src/utils/Tracking'

const cmd = figma.command
figma.showUI(__html__, { visible: false })

function getNodesGroupedbyPosition(nodes) {
	// Prepare nodes
	var input_ids = nodes.reduce((acc, item) => {
		acc.push({ id: item.id, x: item.x, y: item.y, width: item.width, height: item.height, name: item.name })
		return acc
	}, [])

	// Sort by X
	input_ids.sort((current, next) => {
		return current.x - next.x
	})

	// Create rows and columns
	var rows = []
	input_ids.map(item => {
		var rowExist = rows.find(row => row.y + item.height/2 > item.y && row.y - item.height/2 < item.y)
		if (rowExist) {
			rowExist.columns.push(item)
		} else {
			rows.push({ y: item.y, columns: [item] })
		}
	})

	// Sort by Y
	return rows.sort((current, next) => current.y - next.y);
}

function getNameByPosition(row, col, startName) {
	
	var padLength = startName.length
	var parseStartName = parseInt(startName)
	var rowName = parseStartName + row * Math.pow(10, padLength - 1)
	var colName = rowName + col
	var name = ''

	function zeroPad(num, places) {
		var zero = places - num.toString().length + 1;
		return Array(+(zero > 0 && zero)).join("0") + num;
	}

	if (col == 0) {
		name = (row == 0) ? zeroPad(rowName, padLength) : rowName.toString();
	} else {
		name = (row == 0) ? zeroPad(colName, padLength) : colName.toString();
	}

	return name
}

function cmdRename(renameStrategy, startName) {
	var selection = figma.currentPage.selection
	var parent = (selection[0].type == 'PAGE') ? figma.currentPage : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection)

	groupedNodes.forEach((row, rowidx) => {
		row.columns.forEach((col, colidx) => {
			var name = getNameByPosition(rowidx, colidx, startName)
			var match = allNodes.find(node => node.id === col.id)
			
			if (renameStrategy == 'merge') {
				match.name = `${name}_${match.name}`
			} else
			if (renameStrategy == 'replace') {
				match.name = name
			}
		})
	})
}

function cmdReorder() {
	var selection = figma.currentPage.selection
	var parent = (selection[0].type == 'PAGE') ? figma.currentPage : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection)

	groupedNodes.reverse().forEach(row => {
		row.columns.reverse().forEach(col => {
			var match = allNodes.find(node => node.id === col.id)
			parent.appendChild(match)
		})
	})
}

function cmdTidy(xSpacing, ySpacing) {
	var selection = figma.currentPage.selection
	var parent = (selection[0].type == 'PAGE') ? figma.currentPage : selection[0].parent
	var allNodes = parent.children
	var groupedNodes = getNodesGroupedbyPosition(selection)

	var x0 = 0
	var y0 = 0
	var xPos = 0
	var yPos = 0
	var tallestInRow = []

	// Store tallest node per row
	groupedNodes.forEach((row, rowidx) => {
		let sortedRowColumns = row.columns.slice()
		sortedRowColumns.sort((prev, next) => {
			return (prev.height > next.height) ? -1 : 1;
		})
		tallestInRow.push(sortedRowColumns[0].height)
	})

	// Reposition nodes
	groupedNodes.forEach((row, rowidx) => {
		row.columns.forEach((col, colidx) => {
			if (rowidx == 0 && colidx == 0) {
				x0 = col.x
				y0 = col.y
				xPos = col.x
				yPos = col.y
			}
			var match = allNodes.find(node => node.id === col.id)	
			var newXPos =	(colidx == 0) ? xPos : xPos + xSpacing;
			var newYPos = yPos
			
			// Wrap instances with a frame around
			if (match.type == 'INSTANCE') {
				var instanceParent = figma.createFrame()
				instanceParent.x = newXPos
				instanceParent.y = newYPos
				instanceParent.resize(match.width, match.height)
				instanceParent.appendChild(match)
				match.x = 0
				match.y = 0
				figma.currentPage.selection = selection.concat(instanceParent)
			} else {
				match.x = newXPos
				match.y = newYPos
			}
				
			xPos = newXPos + match.width
		})

		xPos = x0
		yPos = yPos + (tallestInRow[rowidx] + ySpacing)
	})
}

// Obtain UUID and preferences then trigger init event
Promise.all([
	figma.clientStorage.getAsync('UUID'),
	figma.clientStorage.getAsync('preferences'),
	figma.clientStorage.getAsync('spacing') // legacy
]).then(values => {
	let UUID = values[0]
	let preferences = values[1]
	let spacing = values[2]
	
	let SPACING = { x: 100, y: 200 }
	let START_NAME = '000'
	let RENAME_STRATEGY_REPLACE = 'replace'
	let RENAME_STRATEGY_MERGE = 'merge'
	let PREFERENCES = {
		spacing: SPACING,
		start_name: START_NAME,
		rename_strategy: RENAME_STRATEGY_REPLACE
	}
	
	if (!UUID) {
		UUID = Tracking.createUUID()
		figma.clientStorage.setAsync('UUID', UUID)
	}
	
	// legacy spacing preference
	if (typeof spacing != 'undefined') {
		PREFERENCES.spacing = spacing
	}
	
	if (typeof preferences == 'undefined') {
		preferences = PREFERENCES
	}
	
	figma.ui.postMessage({ type: 'init', UUID: UUID, cmd: cmd, preferences: preferences })
	
	// Command triggered by user
	if (cmd == 'rename') {
		// RUNS WITHOUT UI
		cmdRename(preferences.rename_strategy, preferences.start_name)
		figma.notify('Super Tidy: Rename')
		setTimeout(() => figma.closePlugin(), 100)
	} else
	if (cmd == 'reorder') {
		// RUNS WITHOUT UI
		cmdReorder()
		figma.notify('Super Tidy: Reorder')
		setTimeout(() => figma.closePlugin(), 100)
	} else
	if (cmd == 'tidy') {
		// RUNS WITHOUT UI
		cmdTidy(preferences.spacing.x, preferences.spacing.y)
		figma.notify('Super Tidy: Tidy')
		setTimeout(() => figma.closePlugin(), 100)
	} else
	if (cmd == 'all') {
		// RUNS WITHOUT UI
		cmdTidy(preferences.spacing.x, preferences.spacing.y)
		cmdReorder()
		cmdRename(preferences.rename_strategy, preferences.start_name)
		figma.notify('Super Tidy')
		setTimeout(() => figma.closePlugin(), 100)
	} else
	if (cmd == 'options') {
		// OPEN UI
		figma.showUI(__html__, { width: 320, height: 460 })
		figma.ui.postMessage({ type: 'init', UUID: UUID, cmd: cmd, preferences: preferences })
		figma.ui.postMessage({ type: 'selection', selection: figma.currentPage.selection })

		figma.on('selectionchange', () => {
			figma.ui.postMessage({ type: 'selection', selection: figma.currentPage.selection })
		})

		figma.ui.onmessage = msg => {
			if (msg.type === 'tidy') {
				var RENAMING_ENABLED = msg.options.renaming
				var REORDER_ENABLED = msg.options.reorder
				var TIDY_ENABLED = msg.options.tidy

				if (TIDY_ENABLED) cmdTidy(preferences.spacing.x, preferences.spacing.y)
				if (RENAMING_ENABLED) cmdRename(preferences.rename_strategy, preferences.start_name)
				if (REORDER_ENABLED) cmdReorder()
				figma.notify('Super Tidy')
				figma.closePlugin()
			} else
			if (msg.type === 'preferences') {
				preferences = msg.preferences
				figma.clientStorage.setAsync('preferences', preferences)
				figma.notify('Preferences saved')
			}
		}
	}
})
