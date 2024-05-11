export const BASE_URL = "https://vsco.co"

const config = {
	argument: {
		name: "<username>"
	},
	options: [
		{
			option: "output",
			alternative: "o",
			description: "Output directory",
			syntax: "[path]"
		},
		{
			option: "force",
			alternative: "f",
			description: "Force creation of output directory",
			defaultValue: false
		},
		{
			option: "limit",
			alternative: "l",
			description: "Set content limit to fetch from VSCO API",
			syntax: "<number>",
			defaultValue: 20
		},
		{
			option: "queue",
			alternative: "q",
			syntax: "<number>",
			description: "Set max queue to download content",
			defaultValue: 20
		},
		{
			option: "novideo",
			alternative: "nv",
			description: "Disable video downloading",
			defaultValue: false
		}
	]
}

export default config
