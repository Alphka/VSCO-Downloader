/** @param {any} number */
export default function IsNumber(number){
	if(number === 0) return true
	if(!number) return false
	if(typeof number !== "number") number = Number(number)

	return Number.isFinite(number) && !Number.isNaN(number)
}
