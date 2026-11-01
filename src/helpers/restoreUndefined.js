/** @param {any} object */
export default function restoreUndefined(object){
	if(Array.isArray(object)){
		return object.map(restoreUndefined)
	}

	if(object && typeof object === "object"){
		const result = {}
		for(const key in object){
			if(Object.prototype.hasOwnProperty.call(object, key)){
				if(object[key] === "__UNDEFINED__") result[key] = undefined
				else result[key] = restoreUndefined(object[key])
			}
		}
	}

	return object
}
