# Kiji

A simple blogging framework.

## Features
- Server-side rendering
- Works on Bun, Cloudflare Workers, etc.
- RSS feed
- Search articles (Full text search is not currently supported)

## Get Started

**Download this repository**
```bash
$ git clone https://github.com/shinosaki/kiji
$ cd ./kiji
```

**Install depends**
```bash
$ npm i
```

**Customize config file**
Config file location is `./config.js`.
- `lang`: Blog's language (Default: `'en'`)
- `onion`: Onion Service's address  
  If you set onion address, append `Onion-Location` header for response.
- `cache`
  - `maxAge`: `Cache-Control` header's `max-age` value (Default: Undefined)
- `menus`: Links for header's menu.
- `links`: Links for side or footer's menu.
- `app`
  - `name`: Blog title
  - `description`: Blog description
  - `copy`: Copyright in footer
    - `name`: Copyright name
    - `link`: Copyright name's link

**Create new post**
Create new Markdown file to `./asset/posts/` directory.  

or Add articles repository as a git submodule.
```bash
$ git submodule add posts.git ./assets/posts
```

**Generate index file**
```bash
$ npm run posts
```
Generated `posts.json` file in `./asstes` directory.

**Start dev server in local**
**Wrangler (Cloudflare Workers)**
```bash
$ npm run dev
```
and Open `http://localhost:8787` in the browser.

**Bun**:
```bash
$ npm run dev:bun
```
and Open `http://localhost:3000` in the browser.

**Deploying**
**Cloudflare Workers**
```bash
$ npm run deploy
```

**Bun**
1. Building standalone binary
```bash
$ npm run build
```

2. Execution binary
```bash
$ npm run production
```

## Author
[Shinosaki](https://shinosaki.com/)

## Dependencies
- hono
- js-yaml
- marked
- zod
- tailwindcss
- wrangler

## License
[MIT](./LICENSE)
