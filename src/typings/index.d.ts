export interface Options {
	output?: string
	force: boolean
	limit?: 20 | string
	queue?: 20 | string
}

export interface Assignment {
	[key: string]: any
}

export interface Braze {
	apiKey: string
	apiUrl: string
	initialized: boolean
}

export interface ImageStatus {
	code: number
	time: number
}

export interface ImageMeta {
	aperture?: number
	copyright: string
	flashMode?: string
	iso?: number
	make: string
	model: string
	shutterSpeed?: string
	whiteBalance?: string
	orientation: number
	captureDate?: number
	flashValue?: number
	software: string
	fileSize: number
	fileHash: string
}

export interface Image {
	id: string
	gridName: string
	adaptiveBase: string
	siteId: number
	description: string
	descriptionAnchored: string
	copyrightClasses: string[]
	captureDate: number
	captureDateMs: number
	uploadDate: number
	lastUpdated: number
	locationCoords: any
	hasLocation: boolean
	featureLink: any
	isFeatured: boolean
	isVideo: boolean
	permaDomain: string
	permaSubdomain: string
	permalink: string
	shareLink: string
	responsiveUrl: string
	showLocation: number
	imageStatus: ImageStatus
	imageMeta: ImageMeta
	height: number
	width: number
}

export interface Entities {
	images: {
		[key: string]: Image
	}
}

export interface Media {
	type: string
	image: string
}

export interface Site {
	collectionShareLink: string
	description: string
	domain: string
	externalLink: string
	externalLinkDisplayText: string
	gridAlbumId: string
	hasGrid: boolean
	id: number
	isBrand: boolean
	internalSite: boolean
	museum: boolean
	name: string
	password: null
	profileImage: string
	profileImageId: string
	recentlyPublished: string
	responsiveUrl: string
	shareLink: string
	siteCollectionId: string
	status: string
	subdomain: string
	type: number
	userId: number
	siteTitle: string
}

export interface CurrentUser {
	tkn: string
	userId: number
	email: string
	sId: string
	country: string
	lang: {
		language: string
		locale: string
	}
	loggedIn: boolean
	appId: string
}

export interface SiteByUsername {
	reqStatus: number
	error: string
	site: Site
}

export interface MediasBySiteId {
	medias: Media[]
	nextCursor: string
	reqStatus: number
	errorMsg: string
}

export interface Feed {
	medias: any[]
	isFetching: boolean
	hasNext: boolean
	nextCursor?: string
}

export interface Search {
	images: {
		query: string
		type: string
		results: any[]
		page: number
		hasNext: boolean
		reqStatus: number
		error: string
	}
	journal: {
		query: string
		type: string
		results: any[]
		page: number
		hasNext: boolean
		reqStatus: number
		error: string
	}
	people: {
		query: string
		type: string
		results: any[]
		page: number
		hasNext: boolean
		reqStatus: number
		error: string
	}
}

export interface Users {
	currentUser: CurrentUser
	reqStatus: number
	error: string
}

export interface Sites {
	siteByUsername: {
		[username: string]: SiteByUsername
	}
}

export interface Articles {
	bySiteId: any
}

export interface Collections {
	byId: any
}

export interface Follows {
	followsByPage: any
	followRelationship: any
}

export interface UserSubscription {
	userSubscription: any
	reqStatus: number
	error: string
}

export interface Data {
	assignments: Assignment
	braze: Braze
	entities: Entities
	errorMessage: null | string
	feed: Feed
	medias: {
		byId: any
		bySiteId: {
			[siteId: string]: MediasBySiteId
		}
	}
	search: Search
	users: Users
	settings: {
		openInAppPath: string
	}
	sites: Sites
	articles: Articles
	collections: Collections
	reportedContent: any
	follows: Follows
	spaces: any
	toasts: any[]
	comments: any
	posts: any
	userSubscription: UserSubscription
}

export interface MediasResponse {
	media: {
		type: "image"
		image: {
			_id: string
			grid_name: string
			adaptive_base: string
			site_id: number
			description: string
			description_anchored: string
			copyright_classes: string[]
			capture_date: number
			capture_date_ms: number
			upload_date: number
			last_updated: number
			location_coords: null
			has_location: boolean
			feature_link: null
			is_featured: boolean
			is_video: boolean
			video_url?: string
			perma_domain: string
			perma_subdomain: string
			permalink: string
			share_link: string
			responsive_url: string
			show_location: number
			image_status: ImageStatus
			image_meta?: {
				aperture?: number
				copyright: string
				make?: string
				model?: string
				orientation?: number
				software?: string
				file_size?: number
				file_hash?: string
				flash_mode?: string
				iso?: number
				shutter_speed?: string
				white_balance?: string
				capture_date?: number
				flash_value?: number
				edit_stack?: {
					key: string
				}
			}
			height: number
			width: number
			preset?: {
				color: string
				key: string
				short_name: string
			}
		}
	}[]
	previous_cursor?: string
	next_cursor?: string
}
