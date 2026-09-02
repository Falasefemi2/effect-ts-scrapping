# effect-ts-scrapping

A production-ready web scraping pipeline built on Effect v4 that uses Puppeteer to load JavaScript-rendered pages and extract structured data. Designed to run behind Bright Data's rotating residential proxy for robust, scalable scraping.

## Features

✨ **Effect-TS Framework**: Functional, type-safe error handling and dependency injection  
🔄 **Automatic Retry Logic**: Smart retry policies for transient failures  
🌍 **Proxy Support**: Seamless integration with Bright Data rotating proxies  
🔐 **Type Safety**: Full TypeScript support with schema validation  
⚡ **Bun Runtime**: Fast execution with Bun.js  
🛠️ **Production Ready**: Comprehensive error handling and logging  

## How it works

The pipeline is organized into three main layers:

1. **Config** (`src/config.ts`)
   - Reads and validates environment variables
   - Provides a typed `EnvConfig` service
   - Bright Data credentials are optional

2. **Browser** (`src/browser.ts`)
   - Manages Puppeteer lifecycle (launch, authentication, navigation)
   - Handles proxy authentication if Bright Data credentials are provided
   - Manages page creation and cleanup

3. **Scraper** (`src/scraper.ts`)
   - Parses HTML with Cheerio
   - Extracts page title and text content
   - Validates results against Effect Schema
   - Implements retry policies for resilience

The entry point (`index.ts`) wires these layers using Effect's `Layer.provide` and runs against the Bun runtime.

## Setup

### Requirements
- [Bun](https://bun.sh) (v1.0+)
- Node.js (Puppeteer downloads its own Chromium)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/samuelfemi/effect-ts-scrapping.git
cd effect-ts-scrapping

# Install dependencies
bun install

# Copy environment template
cp .env.example .env
```

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TARGET_URL` | No | `https://quotes.toscrape.com/js/` | URL to scrape |
| `BRIGHT_DATA_CUSTOMER_ID` | No | -- | Bright Data customer ID |
| `BRIGHT_DATA_ZONE` | No | -- | Bright Data proxy zone |
| `BRIGHT_DATA_PASSWORD` | No | -- | Bright Data password |

**Note**: When all three Bright Data variables are set, requests route through `brd.superproxy.io:33335`. Otherwise, the browser connects directly.

## Usage

### Quick Start

```bash
bun run start
```

The output is a JSON object containing:
- Page title
- Array of extracted text spans
- Source URL

### Example Output

```json
{
  "title": "Quotes to Scrape",
  "spans": ["Quote text 1", "Quote text 2"],
  "url": "https://quotes.toscrape.com/js/"
}
```

## Project Structure

```
effect-ts-scrapping/
├── src/
│   ├── config.ts       # Configuration service and environment handling
│   ├── errors.ts       # Tagged error types
│   ├── browser.ts      # Puppeteer adapter with proxy support
│   └── scraper.ts      # Scraper service with retry logic
├── tools/
│   └── oxlint/         # Custom linting rules
├── index.ts            # Entry point
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript configuration
├── biome.json          # Code formatting config
└── oxlint.config.ts    # Linting configuration
```

## Scripts

| Command | Description |
|---|---|
| `bun run start` | Run the scraper pipeline |
| `bun run typecheck` | Type-check with effect-tsgo |
| `bun run lint` | Lint with Oxlint |
| `bun run format` | Format code with Biome |
| `bun run format:check` | Check formatting without modifying files |

## Error Handling

All errors extend Effect's `Schema.TaggedError`, enabling safe pattern matching:

- **NetworkError** — HTTP 4xx/5xx responses (except 429, 403)
- **TimeoutError** — Navigation timeout exceeded
- **RateLimitError** — HTTP 429 response
- **IPBlockError** — HTTP 403 response (IP blocked)
- **BrowserError** — Puppeteer launch or page creation failures
- **ParseError** — HTML extraction or schema validation failure

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Troubleshooting

Encounter issues? Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions to common problems.

## License

MIT
