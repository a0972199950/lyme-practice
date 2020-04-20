const globalDebug = true

class LogHelper {
	prefixText = ''
	prefixStyle = 'background: grey; color: white'
	debug = false

	constructor(prefixText: string, customDebug?: boolean) {
		this.prefixText = "%c" + prefixText
		this.debug = customDebug === undefined ? globalDebug : customDebug
	}

	group() {
		if (this.debug) {
			console.group()
		}

		return this
	}

	groupEnd() {
		if (this.debug) {
			console.groupEnd()
		}

		return this
	}

	table(payload: any) {
		if (this.debug) {
			console.table(payload)
		}

		return this
	}

	log(...payload: any[]) {
		if (this.debug) {
			console.log(this.prefixText, this.prefixStyle, ...payload)
		}

		return this
	}

	warn(...payload: any[]) {
		if (this.debug) {
			console.warn(this.prefixText, this.prefixStyle, ...payload)
		}

		return this
	}

	error(...payload: any[]) {
		if (this.debug) {
			console.error(this.prefixText, this.prefixStyle, ...payload)
		}

		return this
	}
}

export default LogHelper
