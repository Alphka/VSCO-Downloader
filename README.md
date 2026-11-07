<h1 align="center">VSCO Downloader</h1>

<p align="center">
	Command-line tool to download images and videos from a VSCO profile.
</p>

<p align="center">
	<a href="LICENSE.md">
		<img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-5271FF?style=for-the-badge">
	</a>
</p>

> [!IMPORTANT]
> **Responsible use.** This is an unofficial tool and is not affiliated with, endorsed by or sponsored by VSCO. It accesses a third-party service, so you are responsible for complying with VSCO's Terms of Service and with the laws that apply to you. Use it for personal purposes, such as keeping a copy of your own content or of content you have permission to save. The photos and videos belong to their creators: do not redistribute or republish them without permission, and respect people's privacy. Keep the `--queue` and `--limit` values reasonable so you do not overload the service.

> [!NOTE]
> The tool depends on the structure of VSCO's website and on an unofficial, undocumented API endpoint. VSCO can change either at any time, which may break the tool.

## Features

- Downloads the images and videos of a VSCO profile, paginating through the whole gallery.
- Videos can be skipped with `--novideo` (the still image is downloaded instead).
- Images are re-encoded as JPEG (quality 100) with [sharp](https://sharp.pixelplumbing.com/), keeping their EXIF metadata.
- Sets each file's modification date to the earliest of the media timestamps provided by VSCO.
- Configurable page size (`--limit`) and number of simultaneous downloads (`--queue`).

## Tech stack

- Node.js (ES modules, plain JavaScript with JSDoc types checked by TypeScript)
- [axios](https://github.com/axios/axios) for HTTP requests
- [commander](https://github.com/tj/commander.js) for the command-line interface
- [sharp](https://sharp.pixelplumbing.com/) for image processing
- [chalk](https://github.com/chalk/chalk) for colored output
- ESLint and TypeScript (`tsc`) for linting and type checking

## Requirements

- [Node.js](https://nodejs.org/) 22.18.0 or newer.
- [pnpm](https://pnpm.io/) 12. The repository pins pnpm 12.10.1 in `packageManager`, so `pnpm-lock.yaml` must not be regenerated with another version.

## Installation

```sh
git clone https://github.com/Alphka/VSCO-Downloader.git
cd VSCO-Downloader
pnpm install
```

The package is marked as `private` and is not published to the npm registry. To get the `vscodl` command available in your shell, you can optionally link the package globally, for example with `pnpm link --global`. This step is not required: you can run the tool directly with Node.js.

## Usage

```sh
# From the repository folder
node src/index.js [options] <username>

# After linking the package
vscodl [options] <username>
```

`<username>` is the VSCO profile name, i.e. the `username` in `https://vsco.co/username`.

Example:

```sh
node src/index.js --output ./downloads --force username
```

Files are saved to `<output>/<username>/`.

### Options

```
Usage: vscodl [options] <username>

Download images and videos from a VSCO profile

Options:
  -v, --version         Display program version
  -o, --output [path]   Output directory
  -f, --force           Force creation of output directory (default: false)
  -l, --limit <number>  Set content limit to fetch from VSCO API (default: 20)
  -q, --queue <number>  Set max queue to download content (default: 20)
  -nv, --novideo        Disable video downloading (default: false)
  -d, --debug           Verbose output
  -h, --help            Display help
```

- **Output directory:** when `--output` is omitted, the current working directory is used. If the output directory does not exist, the command fails unless `--force` is given. An output path inside the repository folder is redirected to `output/` in the repository root.
- **Image format:** images are never saved as the original file. Each image is decoded and re-encoded as JPEG (quality 100), which can change the file size, and only EXIF metadata is kept. File names are taken from the media URL and are not renamed to `.jpg`. Videos are saved as downloaded, without re-encoding.
- **`--limit`:** how many items are requested per page from the VSCO API.
- **`--queue`:** how many items are downloaded at the same time.

## Development

| Script | Description |
|---|---|
| `pnpm lint` | Runs ESLint |
| `pnpm lint:tsc` | Type checks the JavaScript code with `tsc -p jsconfig.json` |

## Project structure

```
src/
  index.js          CLI entry point (options, output directory)
  config.js         Argument and option definitions
  Downloader.js     Profile data fetching, pagination and downloads
  helpers/          Logging and small utilities
  typings/          JSDoc type definitions for the VSCO responses
```

## License

[ISC](LICENSE.md) © 2023 Kayo Souza
