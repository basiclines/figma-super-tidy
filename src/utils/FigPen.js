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
            figma.showUI(__html__, { themeColors: true, width: this.width, height: this.height })
        } else if (this.designTool === PENPOT) {
            penpot.ui.open(this.name, this.url, { width: this.width, height: this.height })
        }
    }

    openUIHidden() {
        if (this.designTool === FIGMA) {
            figma.showUI(__html__, { themeColors: true, visible: false })
        } else if (this.designTool === PENPOT) {
            penpot.ui.open(this.name, this.url, { width: this.width, height: this.height })
        }
    }

    onEditorMessage(callback) {
        window.addEventListener('message', event => {
            let msg = (this.designTool === FIGMA) ? event.data.pluginMessage : event.data
            callback(msg)
        })
    }

    onUIMessage(callback) {
        if (this.designTool === FIGMA) {
            figma.ui.onmessage = callback
        } else if (this.designTool === PENPOT) {
            penpot.ui.onMessage((message) => { callback(message) });
        }
    }

    onSelectionChange(callback) {
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
        if (this.designTool === FIGMA) {
            figma.ui.postMessage(message)
        } else if (this.designTool === PENPOT) {
            penpot.ui.sendMessage(message)
        }
    }

    notifyEditor(message) {
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
                let item = JSON.parse(penpot.localStorage.getItem(key))
                resolve(item)
            }
        })
    }

    setStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            if (this.designTool === FIGMA) {
                figma.clientStorage.setAsync(key, value).then(resolve).catch(reject)
            } else if (this.designTool === PENPOT) {
                let item = JSON.stringify(value)
                resolve(penpot.localStorage.setItem(key, item))
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

    currentTheme() {
        if (this.designTool === FIGMA) {
            console.warn('currentTheme not supported in Figma. More info: https://developers.figma.com/docs/plugins/css-variables/')
        } else if (this.designTool === PENPOT) {
            return penpot.theme
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