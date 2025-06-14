/** @param {string} json */
export default function SafelyReplaceUndefined(json){
	let inString = false
	let result = ""

	for(let i = 0, { length } = json; i < length; i++){
		const char = json[i]

		if(char === '"' && json[i - 1] !== "\\"){
			inString = !inString
		}

		if(!inString && json.substring(i, i + 9) === "undefined"){
			const prevChar = json[i - 1]
			const nextChar = json[i + 9]
			const isWordBoundary = !/\w/.test(prevChar) && !/\w/.test(nextChar)

			if(isWordBoundary){
				result += '"__UNDEFINED__"'
				i += 8
				continue
			}
		}

		result += char
	}

	return result
}
