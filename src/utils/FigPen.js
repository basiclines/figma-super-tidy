const FIGMA = 'figma'
const PENPOT = 'penpot'

export default class FigPen {
	
    constructor({designTool, name, url, width, height}) {
		this.designTool = designTool
		this.name = name
		this.url = url
        this.width = width
        this.height = height
	}

    currentCommand() {
        if (this.designTool === FIGMA) {
            return figma.command
        } else if (this.designTool === PENPOT) {
            return null
        }
    }

    openUI() {
        if (this.designTool === FIGMA) {
            figma.showUI(__html__, { width: this.width, height: this.height })
        } else if (this.designTool === PENPOT) {
            penpot.ui.open(this.name, this.url, { width: this.width, height: this.height })
        }
    }

    openUIHidden() {
        if (this.designTool === FIGMA) {
            figma.showUI(__html__, { visible: false })
        } else if (this.designTool === PENPOT) {
            penpot.ui.open(this.name, this.url, { width: this.width, height: this.height })
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