/**
 * Layout utilities for Super Tidy plugin
 * Pure functions for positioning, grouping, and organizing nodes
 */

import FigPen from "src/utils/FigPen"
import CONFIG from "src/Config"

const FP = new FigPen(CONFIG)

/**
 * Groups nodes by their position on the canvas
 * @param {Array} nodes - Array of figma nodes
 * @param {string} layout - 'rows' or 'columns' layout paradigm
 * @returns {Array} Array of grouped nodes
 */
export function getNodesGroupedbyPosition(nodes, layout = 'rows') {
	// Prepare nodes
	var input_ids = nodes.reduce((acc, item) => {
		acc.push({ id: item.id, x: item.x, y: item.y, width: item.width, height: item.height, name: item.name })
		return acc
	}, [])

	if (layout === 'columns') {
		return getNodesGroupedByColumns(input_ids)
	} else {
		return getNodesGroupedByRows(input_ids)
	}
}

/**
 * Groups nodes by rows (original behavior)
 * @param {Array} input_ids - Array of node data
 * @returns {Array} Array of rows with columns
 */
function getNodesGroupedByRows(input_ids) {
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

/**
 * Groups nodes by columns (new feature)
 * @param {Array} input_ids - Array of node data
 * @returns {Array} Array of columns with rows
 */
function getNodesGroupedByColumns(input_ids) {
	// Sort by Y first for column layout
	input_ids.sort((current, next) => {
		return current.y - next.y
	})

	// Create columns and rows
	var columns = []
	input_ids.map(item => {
		var columnExist = columns.find(column => column.x + item.width/2 > item.x && column.x - item.width/2 < item.x)
		if (columnExist) {
			columnExist.rows.push(item)
		} else {
			columns.push({ x: item.x, rows: [item] })
		}
	})

	// Sort by X
	return columns.sort((current, next) => current.x - next.x);
}

/**
 * Generates a name based on position
 * @param {number} primary - Primary index (row or column)
 * @param {number} secondary - Secondary index (column or row)
 * @param {string} startName - Starting name/number
 * @returns {string} Generated name
 */
export function getNameByPosition(primary, secondary, startName) {
	var padLength = startName.length
	var parseStartName = parseInt(startName)
	var primaryName = parseStartName + primary * Math.pow(10, padLength - 1)
	var secondaryName = primaryName + secondary
	var name = ''

	function zeroPad(num, places) {
		var zero = places - num.toString().length + 1;
		return Array(+(zero > 0 && zero)).join("0") + num;
	}

	if (secondary == 0) {
		name = (primary == 0) ? zeroPad(primaryName, padLength) : primaryName.toString();
	} else {
		name = (primary == 0) ? zeroPad(secondaryName, padLength) : secondaryName.toString();
	}

	return name
}

/**
 * Repositions nodes in a tidy grid layout
 * @param {Array} groupedNodes - Grouped nodes from getNodesGroupedbyPosition
 * @param {number} xSpacing - Horizontal spacing
 * @param {number} ySpacing - Vertical spacing
 * @param {boolean} wrapInstances - Whether to wrap instances with frames
 * @param {string} layout - 'rows' or 'columns' layout paradigm
 * @param {Array} allNodes - All nodes in the parent
 * @returns {void}
 */
export function repositionNodes(groupedNodes, xSpacing, ySpacing, wrapInstances, layout, allNodes) {
	if (layout === 'columns') {
		repositionNodesInColumns(groupedNodes, xSpacing, ySpacing, wrapInstances, allNodes)
	} else {
		repositionNodesInRows(groupedNodes, xSpacing, ySpacing, wrapInstances, allNodes)
	}
}

/**
 * Repositions nodes in rows layout (original behavior)
 */
function repositionNodesInRows(groupedNodes, xSpacing, ySpacing, wrapInstances, allNodes) {
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
			if (wrapInstances && match.type == 'INSTANCE') {
				var instanceParent = figma.createFrame()
				instanceParent.x = newXPos
				instanceParent.y = newYPos
				instanceParent.resize(match.width, match.height)
				instanceParent.appendChild(match)
				match.x = 0
				match.y = 0
				figma.currentPage.selection = figma.currentPage.selection.concat(instanceParent)
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

/**
 * Repositions nodes in columns layout (new feature)
 */
function repositionNodesInColumns(groupedNodes, xSpacing, ySpacing, wrapInstances, allNodes) {
	var x0 = 0
	var y0 = 0
	var xPos = 0
	var yPos = 0
	var widestInColumn = []

	// Store widest node per column
	groupedNodes.forEach((column, colidx) => {
		let sortedColumnRows = column.rows.slice()
		sortedColumnRows.sort((prev, next) => {
			return (prev.width > next.width) ? -1 : 1;
		})
		widestInColumn.push(sortedColumnRows[0].width)
	})

	// Reposition nodes
	groupedNodes.forEach((column, colidx) => {
		column.rows.forEach((row, rowidx) => {
			if (colidx == 0 && rowidx == 0) {
				x0 = row.x
				y0 = row.y
				xPos = row.x
				yPos = row.y
			}
			var match = allNodes.find(node => node.id === row.id)
			var newXPos = xPos
			var newYPos = (rowidx == 0) ? yPos : yPos + ySpacing;

			// Wrap instances with a frame around
			if (wrapInstances && match.type == 'INSTANCE') {
				var instanceParent = figma.createFrame()
				instanceParent.x = newXPos
				instanceParent.y = newYPos
				instanceParent.resize(match.width, match.height)
				instanceParent.appendChild(match)
				match.x = 0
				match.y = 0
				figma.currentPage.selection = figma.currentPage.selection.concat(instanceParent)
			} else {
				match.x = newXPos
				match.y = newYPos
			}

			yPos = newYPos + match.height
		})

		yPos = y0
		xPos = xPos + (widestInColumn[colidx] + xSpacing)
	})
}

/**
 * Reorders nodes based on their grouped position
 * @param {Array} groupedNodes - Grouped nodes from getNodesGroupedbyPosition
 * @param {string} layout - 'rows' or 'columns' layout paradigm
 * @param {Object} parent - Parent node
 * @param {Array} allNodes - All nodes in the parent
 * @returns {void}
 */
export function reorderNodes(groupedNodes, layout, parent, allNodes) {
	if (layout === 'columns') {
		// For columns: reverse columns, then reverse rows within each column
		groupedNodes.reverse().forEach(column => {
			column.rows.reverse().forEach(row => {
				var match = allNodes.find(node => node.id === row.id)
				parent.appendChild(match)
			})
		})
	} else {
		// For rows: reverse rows, then reverse columns within each row (original behavior)
		groupedNodes.reverse().forEach(row => {
			row.columns.reverse().forEach(col => {
				var match = allNodes.find(node => node.id === col.id)
				parent.appendChild(match)
			})
		})
	}
}

/**
 * Applies pager numbering to text nodes
 * @param {Array} groupedNodes - Grouped nodes from getNodesGroupedbyPosition
 * @param {string} layout - 'rows' or 'columns' layout paradigm
 * @param {string} pagerVariable - Variable name to replace with numbers
 * @param {Array} allNodes - All nodes in the parent
 * @returns {void}
 */
export function applyPagerNumbers(groupedNodes, layout, pagerVariable, allNodes) {
	var frameIndex = 0

	function searchPagerNodes(node, idx) {
		if (typeof node.children != 'undefined') {
			node.children.forEach(child => {
				searchPagerNodes(child, idx)
			})
		} else if (node.type == 'TEXT' && node.name == pagerVariable) {
			FP.setNodeCharacters(node, idx)
		}
	}

	if (layout === 'columns') {
		groupedNodes.forEach(column => {
			column.rows.forEach(row => {
				var frame = allNodes.find(node => node.id === row.id)
				searchPagerNodes(frame, frameIndex)
				++frameIndex
			})
		})
	} else {
		groupedNodes.forEach(row => {
			row.columns.forEach(col => {
				var frame = allNodes.find(node => node.id === col.id)
				searchPagerNodes(frame, frameIndex)
				++frameIndex
			})
		})
	}
}

/**
 * Applies rename strategy to nodes
 * @param {Array} groupedNodes - Grouped nodes from getNodesGroupedbyPosition
 * @param {string} layout - 'rows' or 'columns' layout paradigm
 * @param {string} renameStrategy - 'merge' or 'replace'
 * @param {string} startName - Starting name/number
 * @param {Array} allNodes - All nodes in the parent
 * @returns {void}
 */
export function applyRenameStrategy(groupedNodes, layout, renameStrategy, startName, allNodes) {
	if (layout === 'columns') {
		groupedNodes.forEach((column, colidx) => {
			column.rows.forEach((row, rowidx) => {
				var name = getNameByPosition(colidx, rowidx, startName)
				var match = allNodes.find(node => node.id === row.id)

				if (renameStrategy == 'merge') {
					match.name = `${name}_${match.name}`
				} else if (renameStrategy == 'replace') {
					match.name = name
				}
			})
		})
	} else {
		groupedNodes.forEach((row, rowidx) => {
			row.columns.forEach((col, colidx) => {
				var name = getNameByPosition(rowidx, colidx, startName)
				var match = allNodes.find(node => node.id === col.id)

				if (renameStrategy == 'merge') {
					match.name = `${name}_${match.name}`
				} else if (renameStrategy == 'replace') {
					match.name = name
				}
			})
		})
	}
}
