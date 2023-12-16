#!/usr/bin/env node

import { dirname, join, parse, relative } from "path"
import { mkdir, utimes, writeFile } from "fs/promises"
import { fileURLToPath } from "url"
import { readFileSync } from "fs"
import yargs from "yargs"
import axios from "axios"
import chalk from "chalk"
import sharp from "sharp"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const cwd = process.cwd()
const root = join(__dirname, "..")
const output = cwd === root && relative(root, cwd).startsWith("..") ? join(root, "output") : cwd

/** @type {import("../package.json")} */
const Package = JSON.parse(readFileSync(join(root, "package.json")))

const { argv } = yargs(process.argv.slice(2))
	.usage("vscodl <profile>")
	.version(Package.version)
	.option("limit", {
		alias: "l",
		type: "number",
		description: "Set content limit to fetch from VSCO",
		default: 20
	})
	.option("queue", {
		alias: "q",
		type: "number",
		description: "Set max queue to download content",
		default: 20
	})
	.option("verbose", {
		alias: "v",
		type: "boolean",
		description: "Run with verbose logging",
		default: false
	})
	.demandCommand(1, 1, "No profile was given", "Only one profile is supported")

Object.assign(axios.defaults.headers.common, {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
})

/** @param {number | string | Date} date */
function ExifDate(date){
	return new Date(date).toISOString().substring(0, 19).split("T").join(" ").replaceAll("-", ":")
}

new class Downloader {
	endpoint = "https://vsco.co/"
	profile = argv._[0]
	limit = argv.limit
	queue = argv.queue

	/** @type {Set<string>} */
	filenames = new Set

	constructor(){
		this.output = join(output, this.profile)
		this.Debug("Initiating application")
		this.Init()
	}

	async Init(){
		const { sites, users: { currentUser } } = await this.GetProfileData()
		const { site } = sites.siteByUsername[this.profile]

		this.Debug(`Got user data, id: ${site.userId}`)
		this.token = currentUser.tkn

		this.Debug("Starting download")
		await mkdir(this.output, { recursive: true })
		await this.DownloadProfile(site.id)
	}
	async GetProfileData(){
		const dataRegex = /(?<=window\.__PRELOADED_STATE__ = ){.+?}(?=<\/script>)/
		const response = await axios.get(`${this.endpoint + this.profile}/gallery`, { responseType: "text" })

		const data = response.data.match(dataRegex)?.[0]

		if(!data) throw new Error("No data found")

		await writeFile(join(root, "output.json"), JSON.stringify(JSON.parse(data), null, "\t"))

		return /** @type {import("../typings/index.js").Data} */ (JSON.parse(data))
	}
	/**
	 * @param {number} id
	 * @param {number} [limit]
	 * @param {?string} [cursor]
	 */
	async GetMedia(id, limit, cursor){
		const url = new URL("/api/3.0/medias/profile", this.endpoint)

		url.searchParams.append("site_id", id)
		url.searchParams.append("limit", limit)

		if(cursor) url.searchParams.append("cursor", cursor)

		const response = await axios.get(url.href, {
			headers: {
				Accept: "*/*",
				Authorization: `Bearer ${this.token}`,
				"Content-Type": "application/json",
				"X-Client-Build": "1",
				"X-Client-Platform": "web",
				Referer: `${this.endpoint + this.profile}/gallery`
			},
			responseType: "json"
		})

		return /** @type {import("../typings/index.js").MediasResponse} */ (response.data)
	}
	/** @param {number} siteId */
	async DownloadProfile(siteId){
		/** @type {string | undefined} */
		let cursor
		/** @type {Awaited<ReturnType<typeof this.GetMedia>>} */
		let response

		do{
			response = await this.GetMedia(siteId, this.limit, cursor)
			cursor = response.next_cursor

			while(response.media.length){
				const medias = response.media.splice(0, this.queue)
				const promises = /** @type {ReturnType<typeof this.DownloadMedia>[]} */ (new Array)

				for(const media of medias) promises.push(this.DownloadMedia(media))

				this.Debug.call("#324AB2", `Downloading ${promises.length} items…`)
				await Promise.all(promises)
			}
		}while(response.next_cursor)

		this.Debug("Finished downloading profile contents")
	}
	/** @param {import("../typings/index.js").MediasResponse["media"][number]} media */
	async DownloadMedia({
		image: {
			responsive_url,
			capture_date_ms,
			description,
			last_updated,
			upload_date,
			image_status: { time },
			image_meta: {
				orientation,
				copyright,
				aperture,
				capture_date,
				flash_value,
				iso,
				make,
				model,
				shutter_speed,
				software,
				white_balance,
			},
			width,
			height
		}
	}){
		let filename = responsive_url.split("/").at(-1)
		const { name, ext } = parse(filename)

		for(let i = 1; this.filenames.has(filename); i++){
			filename = `${name} (${i})${ext}`
		}

		this.filenames.add(filename)

		const path = join(this.output, filename)

		/** @type {import("sharp").WriteableMetadata} */
		const metadata = {
			exif: {
				IFD0: {
					Copyright: copyright,
					ImageDescription: description,
					ModifyDate: ExifDate(last_updated),
					Software: software,
					Model: model,
					Make: make
				},
				IFD2: {
					ISO: String(iso),
					Flash: String(flash_value),
					CreateDate: String(capture_date || capture_date_ms),
					WhiteBalance: white_balance && (white_balance === "Auto" ? "0" : "1"),
					ApertureValue: String(aperture),
					ShutterSpeedValue: shutter_speed && shutter_speed.split("/").map(Number).reduce((a, b) => a / b).toString()
				}
			},
			orientation
		}

		for(const group of Object.keys(metadata.exif)){
			for(const [key, value] of Object.entries(metadata.exif[group])){
				if(!value || value === "undefined") delete metadata.exif[group][key]
			}
		}

		const response = await axios.get(`https://${responsive_url}`, { responseType: "arraybuffer" })
		const image = await sharp(response.data, { failOnError: false })
			.jpeg({ quality: 100 })
			.resize(width, height)
			.withMetadata(metadata)
			.toBuffer(path)

		await writeFile(path, image)
		await utimes(path, new Date, new Date(Math.min(time, last_updated, upload_date)))
	}
	/**
	 * @this {this | `#${string}`}
	 * @param {...string} args
	 */
	Debug(...args){
		if(!argv.verbose) return

		const date = new Date().toLocaleTimeString("pt-BR")
		const message = (typeof this === "string" ? chalk.hex(this) : chalk.greenBright)(`[${date}]`, ...args)
		console.log(message)
	}
}
