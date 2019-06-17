// This shows the HTML page in "ui.html". UI is completely optional. Feel free
// to delete this if you don't want your plugin to have any UI. In that case
// you can just call methods directly on the "figma" object in your plugin.
figma.showUI(__html__, { width: 320, height: 380 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'tidy') {
    var X_GRID = msg.options.spacing.x || 100
    var Y_GRID = msg.options.spacing.y || 200
    var RENAMING_ENABLED = msg.options.renaming

    // Prepare nodes
    var selection = figma.currentPage.selection
    var input_ids = selection.reduce((acc, item) => {
      acc.push({ id: item.id, x: item.x, y: item.y, width: item.width, height: item.height, name: item.name })
      return acc
    }, [])

    // Round to grid
    input_ids.map(item => {
      item.x = Math.round(item.x / X_GRID) * X_GRID
      item.y = Math.round(item.y / Y_GRID) * Y_GRID
    })

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
    rows.sort((current, next) => current.y - next.y);

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
            var row_name = ridx*100
            var col_name = row_name + cidx

            function zeroPad(num, places) {
              var zero = places - num.toString().length + 1;
              return Array(+(zero > 0 && zero)).join("0") + num;
            }

            if (cidx == 0) {
                col.name = (ridx == 0) ? zeroPad(row_name, 3) : row_name.toString();
             } else {
                col.name = (ridx == 0) ? zeroPad(col_name, 3) : col_name.toString();
             }
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

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};
