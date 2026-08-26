# data-ingestion

A web scraping pipeline built on Effect v4 that uses Puppeteer to load JavaScript-rendered pages and extract structured data. Designed to run behind Bright Data's rotating residential proxy, which handles IP rotation and CAPTCHA solving transparently.

## How it works

The pipeline has three layers:

1. **Config** (`src/config.ts`) -- reads environment variables via Effect's `Config` module and packages them into a typed service. Bright Data credentials are optional; when absent, scraping runs without a proxy.

2. **Browser** (`src/browser.ts`) -- manages the Puppeteer lifecycle. Opens a headless Chrome instance, authenticates against the Bright Data proxy if configured, navigates to the target URL, and returns the raw HTML. Navigation failures are classified by HTTP status (429 rate limit, 403 IP block, timeouts) so the retry policy can distinguish transient errors from permanent ones.

3. **Scraper** (`src/scraper.ts`) -- parses the HTML with Cheerio, extracts the page title and all non-empty `<span>` text nodes, and validates the result against an Effect `Schema`. Includes exponential backoff with jitter (starting at 1 second, up to 3 retries) and a 100ms pacing delay between attempts.

The entry point wires these layers together using Effect's `Layer.provide` and runs the program against the Bun runtime.

## Setup

Requires [Bun](https://bun.sh) and Node.js (Puppeteer downloads its own Chromium).

```bash
bun install
```

Copy the environment template and fill in your credentials if you want proxy support:

```bash
cp .env.example .env
```

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TARGET_URL` | No | `https://quotes.toscrape.com/js/` | URL to scrape |
| `BRIGHT_DATA_CUSTOMER_ID` | No | -- | Bright Data customer ID |
| `BRIGHT_DATA_ZONE` | No | -- | Bright Data proxy zone |
| `BRIGHT_DATA_PASSWORD` | No | -- | Bright Data password |

When all three Bright Data variables are set, requests are routed through `brd.superproxy.io:33335`. Otherwise the browser connects directly.

## Usage

```bash
bun run index.ts
```

The output is a JSON object with the page title, an array of extracted text spans, and the source URL.

## Project structure

```
src/
  config.ts    -- EnvConfig service and layer
  errors.ts    -- tagged error types (NetworkError, TimeoutError, etc.)
  browser.ts   -- Puppeteer adapter with proxy support
  scraper.ts   -- Scraper service, HTML parsing, retry policy
index.ts       -- entry point, layer wiring
```

## Scripts

| Command | Description |
|---|---|
| `bun run start` | Run the pipeline |
| `bun run typecheck` | Type-check with effect-tsgo |
| `bun run lint` | Lint with oxlint |
| `bun run format` | Format with Biome |
| `bun run format:check` | Check formatting without writing |

## Error types

All errors extend Effect's `Schema.TaggedError`, so they carry a discriminant tag that pattern matching can switch on:

- `NetworkError` -- HTTP 4xx/5xx responses other than 429 and 403
- `TimeoutError` -- navigation exceeded the configured timeout
- `RateLimitError` -- HTTP 429 response
- `IPBlockError` -- HTTP 403 response (IP blocked by the target)
- `BrowserError` -- Puppeteer launch, page creation, or content extraction failures
- `ParseError` -- HTML extraction or schema validation failure (not retried)


