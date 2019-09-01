const parse = <T>(input: string): T | null => {
	try {
		const res = JSON.parse(input)

		if (!res) {
			return null
		}

		return res
	} catch (_) {
		return null
	}
}
export default parse
