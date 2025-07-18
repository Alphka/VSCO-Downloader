import { createWriteStream } from "fs"
import { mkdir, utimes } from "fs/promises"
import { join, parse } from "path"
import { BASE_URL } from "./config.js"
import SafelyReplaceUndefined from "./helpers/SafelyReplaceUndefined.js"
import RestoreUndefined from "./helpers/RestoreUndefined.js"
import Debug from "./helpers/Debug.js"
import axios from "axios"
import sharp from "sharp"
import Log from "./helpers/Log.js"

const profileDataRegex = /window\.__PRELOADED_STATE__\s*=\s*(\{.+?\})<\/script>/

Object.assign(axios.defaults.headers.common, {
	"Sec-Ch-Prefers-Color-Scheme": "dark",
	"Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
	"Sec-Ch-Ua-Mobile": "?0",
	"Sec-Ch-Ua-Platform": '"Windows"',
	"Sec-Fetch-Site": "same-origin",
	"Sec-Fetch-Dest": "empty",
	"Sec-Fetch-Mode": "cors",
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
})

Object.assign(axios.defaults.headers.get, {
	Priority: "i",
	Referer: BASE_URL + "/",
	"Sec-Fetch-Site": "same-site",
	"Sec-Fetch-Mode": "no-cors"
})

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

	/** @param {Pick<import("./typings/index.d.ts").Options, "debug" | "output" | "novideo">} data */
	async Init({ debug, output, novideo }){
		Log("Initializing")

		if(!this.profile) return "No profile was given"

		this.debug = debug

		const { sites, users: { currentUser } } = await this.GetProfileData()
		const { site } = sites.siteByUsername[this.profile]

		Log(`Got user data, id: ${site.userId}`)
		this.token = currentUser.tkn

		Log("Starting download")
		const folder = join(output, this.profile)

		await this.DownloadProfile(site.id, folder, novideo)
	}
	async GetProfileData(){
		const url = new URL(`/${this.profile}/gallery`, BASE_URL)
		const response = await axios.get(url.href, { responseType: "text" })

		if(this.debug) Debug("GetProfileData:", response.data)

		let data = response.data.match(profileDataRegex)?.[1]

		if(!data) Log(new Error("No profile data found"))

		try{
			data = SafelyReplaceUndefined(data)

			return /** @type {import("./typings/index.d.ts").Data} */ (RestoreUndefined(JSON.parse(data)))
		}catch(error){
			if(this.debug) Debug("Profile data:", data)
			throw error
		}
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

		return /** @type {import("./typings/index.d.ts").MediasResponse} */ (response.data)
	}
	/**
	 * @param {number} siteId
	 * @param {string} folder
	 * @param {boolean} [novideo]
	 */
	async DownloadProfile(siteId, folder, novideo = false){
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
					promises.push(this.DownloadMedia(media, folder, novideo))
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
	 * @param {string} url
	 * @param {"http" | "https"} protocol
	 */
	GetURL(url, protocol = "https"){
		return /^https?:\/\//.test(url) ? url : `${protocol}://` + url
	}
	/**
	 * @param {import("./typings/index.d.ts").MediasResponse["media"][number]} media
	 * @param {string} folder
	 * @param {boolean} novideo
	 */
	async DownloadMedia({
		image: {
			is_video,
			video_url,
			responsive_url,
			last_updated,
			upload_date,
			image_status: { time }
		}
	}, folder, novideo){
		const shouldDownloadVideos = !novideo
		const url = this.GetURL(shouldDownloadVideos && is_video ? video_url : responsive_url)

		let filename = /** @type {string} */ (url.split("/").at(-1))

		const { name, ext } = parse(filename)

		for(let i = 1; this.filenames.has(filename); i++){
			filename = `${name} (${i})${ext}`
		}

		this.filenames.add(filename)

		const path = join(folder, filename)

		if(shouldDownloadVideos && is_video){
			/** @type {import("axios").AxiosResponse<import("stream").Writable>} */
			const response = await axios.get(url, {
				headers: {
					Accept: "*/*",
					Range: "bytes=0-",
					"Accept-Encoding": "identity;q=1, *;q=0",
					"Sec-Fetch-Dest": "video"
				},
				responseType: "stream"
			})

			await new Promise((resolve, reject) => {
				response.data.pipe(createWriteStream(path))
					.on("close", () => resolve())
					.on("error", reject)
			})
		}else{
			const response = await axios.get(url, {
				headers: {
					Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
					Pragma: "no-cache",
					Priority: "i",
					"Cache-Control": "no-cache",
					"Sec-Fetch-Dest": "image",
					"Sec-Fetch-Mode": "cors",
					"Sec-Fetch-Site": "cross-site"
				},
				responseType: "arraybuffer",
				maxRedirects: 3
			})

			await sharp(response.data, { failOnError: false })
				.keepExif()
				.jpeg({ quality: 100 })
				.toFile(path)
		}

		await utimes(path, new Date, new Date(Math.min(time, last_updated, upload_date)))
	}
}
