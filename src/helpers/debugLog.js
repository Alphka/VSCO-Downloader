/* eslint-disable no-console */

import chalk from "chalk"

/** @param {any[]} args */
export default function debugLog(...args){
	console.log(chalk.redBright("[DEBUG]"), ...args)
}
