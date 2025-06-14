/** @param {any} object */
export default function RestoreUndefined(object){
	if(Array.isArray(object)){
		return object.map(RestoreUndefined)
	}

	if(object && typeof object === "object"){
		const result = {}
		for(const key in object){
			if(Object.prototype.hasOwnProperty.call(object, key)){
				if(object[key] === "__UNDEFINED__") result[key] = undefined
				else result[key] = RestoreUndefined(object[key])
			}
		}
	}

	return object
}
