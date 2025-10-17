const FIGMA = 'figma'
const PENPOT = 'penpot'

export default class FigPen {
	
    constructor(designTool, name, url) {
		this.designTool = designTool
		this.name = name
		this.url = url
	}

    currentCommand() {
        if (this.designTool === FIGMA) {
            return figma.command
        }
    }

    openPluginUI({width, height, visible}) {
        if (this.designTool === FIGMA) {
            figma.showUI(__html__, { width, height, visible })
        } else if (this.designTool === PENPOT) {
            penpot.ui.open(this.name, this.url, { width, height })
        }
    }

    listenToCanvas(callback) {
        window.addEventListener('message', event => {
            let msg = (this.designTool === FIGMA) ? event.data.pluginMessage : event
            callback(msg)
        })
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