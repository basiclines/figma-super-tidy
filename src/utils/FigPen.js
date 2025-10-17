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

    onEditorMessage(callback) {
        window.addEventListener('message', event => {
            console.log('onEditorMessage', event)
            let msg = (this.designTool === FIGMA) ? event.data.pluginMessage : event.data
            callback(msg)
        })
    }

    onUIMessage(callback) {
        console.log('onUIMessage', callback)
        if (this.designTool === FIGMA) {
            figma.ui.onmessage = callback
        } else if (this.designTool === PENPOT) {
            penpot.ui.onMessage((message) => { callback(message) });
        }
    }

    onSelectionChange(callback) {
        let selection = this.currentSelection()
        if (this.designTool === FIGMA) {
            figma.on('selectionchange', () => { callback(this.currentSelection()) })
        } else if (this.designTool === PENPOT) {
            penpot.on('selectionchange', () => { callback(this.currentSelection()) })
        }
    }

    currentSelection() {
        if (this.designTool === FIGMA) {
            return figma.currentPage.selection
        } else if (this.designTool === PENPOT) {
            return penpot.selection
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

    notifyEditor(message) {
        console.log('notifyCanvas', message)
        if (this.designTool === FIGMA) {
            parent.postMessage({ pluginMessage: message }, '*')
        } else if (this.designTool === PENPOT) {
            parent.postMessage(message, '*')
        }
    }

    waitForUIReady() {
        this.openUIHidden()

        return new Promise((resolve, reject) => {
            this.onUIMessage(msg => {
                if (msg.type === 'ui-ready') {
                    resolve()
                }
            })
        })
    }

    initializeUI() {
        this.notifyEditor({ type: 'ui-ready' })
    }

    resizeUI(width, height) {
        if (this.designTool === FIGMA) {
            figma.ui.resize(width, height)
        } else if (this.designTool === PENPOT) {
            penpot.ui.resize(width, height)
        }
    }

    closePlugin() {
        if (this.designTool === FIGMA) {
            figma.closePlugin()
        } else if (this.designTool === PENPOT) {
            penpot.closePlugin()
        }
    }

    getStorageItem(key) {
        return new Promise((resolve, reject) => {
            if (this.designTool === FIGMA) {
                figma.clientStorage.getAsync(key).then(resolve).catch(reject)
            } else if (this.designTool === PENPOT) {
                let item = penpot.localStorage.getItem(key)
                console.log('getStorageItem', key, item)
                resolve(item)
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

    currentPage() {
        if (this.designTool === FIGMA) {
            return figma.currentPage
        } else if (this.designTool === PENPOT) {
            return penpot.currentPage
        }
    }

    showNotification(text) {
        if (this.designTool === FIGMA) {
            figma.notify(text)
        } else if (this.designTool === PENPOT) {
            console.warn("showNotification not supported for PenPot:", text)
        }
    }

}