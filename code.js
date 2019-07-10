var CMD = figma.command


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
    var rowExist = rows.find(row => row.y + item.height > item.y && row.y - item.height < item.y)
    if (rowExist) {
      rowExist.columns.push(item)
    } else {
      rows.push({ y: item.y, columns: [item] })
    }
  })

  // Sort by Y
  return rows.sort((current, next) => current.y - next.y);
}

function getNameByPosition(row, col) {
  var row_name = row*100
  var col_name = row_name + col
  var name = ''

  function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
  }

  if (col == 0) {
      name = (row == 0) ? zeroPad(row_name, 3) : row_name.toString();
   } else {
      name = (row == 0) ? zeroPad(col_name, 3) : col_name.toString();
   }

   return name
}

// Run with command
if (CMD == 'rename') {
  var allNodes =  figma.currentPage.children
  var selection = figma.currentPage.selection
  var groupedNodes = getNodesGroupedbyPosition(selection)

  groupedNodes.forEach((row, rowidx) => {
    row.columns.forEach((col, colidx) => {
      var name = getNameByPosition(rowidx, colidx)
      var match = allNodes.find(node => node.id === col.id)
      match.name = name
    })
  })
  figma.closePlugin();
} else
if (CMD == 'reorder') {
  var allNodes =  figma.currentPage.children
  var selection = figma.currentPage.selection
  var groupedNodes = getNodesGroupedbyPosition(selection)

  groupedNodes.reverse().forEach(row => {
    row.columns.reverse().forEach(col => {
      var match = allNodes.find(node => node.id === col.id)
      figma.currentPage.appendChild(match)
    })
  })
  figma.closePlugin();
} else
if (CMD == 'tidy') {

  figma.closePlugin();
} else
if (CMD == 'options') {
  figma.showUI(__html__, { width: 320, height: 336 });

  figma.ui.onmessage = msg => {
    if (msg.type === 'tidy') {
      var X_GRID = msg.options.spacing.x || 1
      var Y_GRID = msg.options.spacing.y || 1
      var RENAMING_ENABLED = msg.options.renaming

      // Apply correct spacing
      var output_ids = [];
      (function() {
        var last_y = 0
        var last_height = 0
        rows.map((row, ridx) => {
          var last_x = 0
          var last_width = 0

          // Unify Y spacing for rows
          if (ridx != 0) {
            row.y = last_y + last_height + Y_GRID
          }
          last_y = row.y
          last_height = row.columns[0].height

          row.columns.map((col, cidx) => {
            // Unify X spacing for columns in the same row
            if (cidx != 0) {
              col.x = last_x + last_width + X_GRID
            }
            last_x = col.x
            last_width = col.width

            // Populate Y spacing from row
            col.y = row.y
            output_ids.push(col)

            // Apply renaming
            if (RENAMING_ENABLED) {

            }
          })
        })
      })()

      var layers =  figma.currentPage.children
      output_ids.reverse().map(item => {
        var match = layers.find(layer => layer.id === item.id)
        match.x = item.x
        match.y = item.y
        match.name = item.name
        figma.currentPage.appendChild(match)
      })
    }

    figma.closePlugin();
  };
}

