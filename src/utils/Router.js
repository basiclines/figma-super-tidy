import LEOObject from 'leo/object'

let singleton = null
class Router extends LEOObject {
	constructor() {
		super()
		this.url = window.location.hash
		this.routes = {}
		this.bind()

		if (!singleton) singleton = this
		return singleton
	}

	get root() { return '' }

	setup(routes) {
		this.routes = routes
	}

	updateURLBar(url) {
		window.location.hash = url
	}

	reload() {
		this.trigger('change:url', this.url)
	}

	navigate(url) {
		this.updateURLBar(url)
	}

	back() {
		window.history.back()
	}

	bind() {
		window.addEventListener('hashchange', (e) => this.url = window.location.hash)
	}
}

export default new Router()
