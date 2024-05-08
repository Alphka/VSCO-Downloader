import { dirname, join, parse } from "path"
import { fileURLToPath } from "url"
import { mkdir, utimes } from "fs/promises"
import { BASE_URL } from "./config.js"
import axios from "axios"
import sharp from "sharp"
import Log from "./helpers/Log.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const root = join(__dirname, "..")

const profileDataRegex = /(?<=window\.__PRELOADED_STATE__ = ){.+?}(?=<\/script>)/

Object.assign(axios.defaults.headers.common, {
	"Sec-Ch-Prefers-Color-Scheme": "dark",
	"Sec-Ch-Ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
	"Sec-Ch-Ua-Full-version-list": '"Not A(Brand";v="99.0.0.0", "Google Chrome";v="121.0.6167.185", "Chromium";v="121.0.6167.185"',
	"Sec-Ch-Ua-Mobile": "?0",
	"Sec-Ch-Ua-Model": '""',
	"Sec-Ch-Ua-Platform": '"Windows"',
	"Sec-Ch-Ua-Platform-version": '"15.0.0"',
	"Sec-Fetch-Site": "same-origin",
	"Sec-Fetch-Dest": "empty",
	"Sec-Fetch-Mode": "cors",
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
})

/** @param {number | string | Date} date */
function ExifDate(date){
	return new Date(date).toISOString().substring(0, 19).split("T").join(" ").replaceAll("-", ":")
}

export default class Downloader {
	/** @type {string} */ profile
	/** @type {string} */ output
	/** @type {number} */ limit
	/** @type {number} */ queue

	/** @type {Set<string>} */ filenames = new Set

	/**
	 * @param {string} profile
	 * @param {number} [queue]
	 * @param {number} [limit]
	 */
	constructor(profile, queue, limit){
		this.profile = profile
		this.queue = queue
		this.limit = limit
	}

	/**
	 * @param {{
	 * 	output: string
	 * }} data
	 */
	async Init({ output }){
		Log("Initializing")

		if(!this.profile) return "No profile was given"

		const { sites, users: { currentUser } } = await this.GetProfileData()
		const { site } = sites.siteByUsername[this.profile]

		Log(`Got user data, id: ${site.userId}`)
		this.token = currentUser.tkn

		Log("Starting download")
		const folder = join(output, this.profile)

		await this.DownloadProfile(site.id, folder)
	}
	async GetProfileData(){
		const url = new URL(`/${this.profile}/gallery`, BASE_URL)
		const response = await axios.get(url.href, { responseType: "text" })

		const data = response.data.match(profileDataRegex)?.[0]

		if(!data) Log(new Error("No profile data found"))

		return /** @type {import("./typings/index.js").Data} */ (JSON.parse(data))
	}
	/**
	 * @param {number} id
	 * @param {number} [limit]
	 * @param {?string} [cursor]
	 */
	async GetMedia(id, limit, cursor){
		const url = new URL("/api/3.0/medias/profile", BASE_URL)

		url.searchParams.append("site_id", id.toString())
		if(limit) url.searchParams.append("limit", limit.toString())
		if(cursor) url.searchParams.append("cursor", cursor)

		const response = await axios.get(url.href, {
			headers: {
				Origin: url.origin,
				Accept: "*/*",
				Authorization: `Bearer ${this.token}`,
				"Content-Type": "application/json",
				"X-Client-Build": "1",
				"X-Client-Platform": "web",
				Referer: new URL(`/${this.profile}/gallery`, BASE_URL).href
			},
			responseType: "json"
		})

		return /** @type {import("./typings/index.js").MediasResponse} */ (response.data)
	}
	/**
	 * @param {number} siteId
	 * @param {string} folder
	 */
	async DownloadProfile(siteId, folder){
		/** @type {string | undefined} */
		let cursor
		/** @type {Awaited<ReturnType<typeof this.GetMedia>>} */
		let response
		let first = true

		const folderPromise = mkdir(folder, { recursive: true })

		do{
			response = await this.GetMedia(siteId, this.limit, cursor)
			cursor = response.next_cursor

			while(response.media.length){
				const medias = response.media.splice(0, this.queue)
				const promises = /** @type {ReturnType<typeof this.DownloadMedia>[]} */ (new Array)

				await folderPromise
				for(const media of medias){
					promises.push(this.DownloadMedia(media, folder))
				}

				if(first){
					Log("Downloading profile")
					first = false
				}

				await Promise.all(promises)
			}
		}while(response.next_cursor)
	}
	/**
	 * @param {import("./typings/index.js").MediasResponse["media"][number]} media
	 * @param {string} folder
	 */
	async DownloadMedia({
		image: {
			responsive_url,
			last_updated,
			upload_date,
			image_status: { time },
			width,
			height
		}
	}, folder){
		/** @type {string} */
		let filename = responsive_url.split("/").at(-1)
		const { name, ext } = parse(filename)

		for(let i = 1; this.filenames.has(filename); i++){
			filename = `${name} (${i})${ext}`
		}

		this.filenames.add(filename)

		const path = join(folder, filename)

		const response = await axios.get(`https://${responsive_url}`, {
			responseType: "arraybuffer"
		})

		await sharp(response.data, { failOnError: false })
			.keepExif()
			.jpeg({ quality: 100 })
			.toFile(path)

		await utimes(path, new Date, new Date(Math.min(time, last_updated, upload_date)))
	}
}