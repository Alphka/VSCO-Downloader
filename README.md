<h1 align="center">VSCO Downloader</h1>

### Description
A program written in JavaScript to download images and videos from VSCO.

<hr>

### Usage

```
vscodl [options] profile
```

<hr>

### Supported options

```
Usage: vscodl [options] <string>

Arguments:
  string                Profile

Options:
  -v, --version         Display program version
  -o, --output [path]   Output directory
  -f, --force           Force creation of output directory (default: false)
  -l, --limit <number>  Set content limit to fetch from VSCO API (default: 20)
  -q, --queue <number>  Set how many items will be downloaded at the same time (default: 20)
  -h, --help            Display help
```

<hr>

### Installation

```
npm install
npm link
```

### License

[ISC](LICENSE.md) © 2024 Kayo Souza
