const FIGMA = 'figma'
const PENPOT = 'penpot'

export default class FigPen {
	
    constructor(designTool) {
		this.designTool = designTool || WP_DESIGN_TOOL
	}

    currentCommand() {
        if (this.designTool === FIGMA) {
            return figma.command
        }
    }

    openPlugin({name, width, height}) {
        if (this.designTool === FIGMA) {
            figma.showUI(__html__, { width: width, height: height })
        } else if (this.designTool === PENPOT) {
            penpot.ui.open(name, "", { width: width, height: height })
        }
    }

    notifyUI(message) {
        if (this.designTool === FIGMA) {
            figma.ui.postMessage(message)
        } else if (this.designTool === PENPOT) {
            penpot.ui.sendMessage(message)
        }
    }

    getStorageItem(key) {
        return new Promise((resolve, reject) => {
            if (this.designTool === FIGMA) {
                figma.clientStorage.getAsync(key).then(resolve).catch(reject)
            } else if (this.designTool === PENPOT) {
                resolve(context.LocalStorage.get(key))
            }
        })
    }

    setStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            if (this.designTool === FIGMA) {
                figma.clientStorage.setAsync(key, value).then(resolve).catch(reject)
            } else if (this.designTool === PENPOT) {
                resolve(context.LocalStorage.set(key, value))
            }
        })
    }

    currentSelection() {
        if (this.designTool === FIGMA) {
            return figma.currentPage.selection
        } else if (this.designTool === PENPOT) {
            return context.selection
        }
    }

}