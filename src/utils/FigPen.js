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
        console.log('openUIHidden')
        if (this.designTool === FIGMA) {
            figma.showUI(__html__, { visible: false })
        } else if (this.designTool === PENPOT) {
            penpot.ui.open(this.name, this.url, { width: this.width, height: this.height })
        }
    }

    listenToCanvas(callback) {
        window.addEventListener('message', event => {
            console.log('listenToCanvas', event)
            let msg = (this.designTool === FIGMA) ? event.data.pluginMessage : event
            callback(msg)
        })
    }

    listenToUI(callback) {
        if (this.designTool === FIGMA) {
            figma.ui.onmessage = callback
        } else if (this.designTool === PENPOT) {
            penpot.ui.onMessage((message) => { callback(message) });
        }
    }

    notifyUI(message) {
        console.log('notifyUI', message)
        if (this.designTool === FIGMA) {
            figma.ui.postMessage(message)
        } else if (this.designTool === PENPOT) {
            penpot.ui.sendMessage(message)
        }
    }

    notifyCanvas(message) {
        console.log('notifyCanvas', message)
        if (this.designTool === FIGMA) {
            parent.postMessage(message)
        } else if (this.designTool === PENPOT) {
            parent.postMessage(message, '*')
        }
    }

    getStorageItem(key) {
        return new Promise((resolve, reject) => {
            if (this.designTool === FIGMA) {
                figma.clientStorage.getAsync(key).then(resolve).catch(reject)
            } else if (this.designTool === PENPOT) {
                resolve(penpot.localStorage.getItem(key))
            }
        })
    }

    setStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            if (this.designTool === FIGMA) {
                figma.clientStorage.setAsync(key, value).then(resolve).catch(reject)
            } else if (this.designTool === PENPOT) {
                resolve(penpot.localStorage.setItem(key, value))
            }
        })
    }

    currentSelection() {
        if (this.designTool === FIGMA) {
            return figma.currentPage.selection
        } else if (this.designTool === PENPOT) {
            return penpot.selection
        }
    }

}