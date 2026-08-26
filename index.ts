/**
 * Proof of concept data ingestion pipeline using Effect v4 with Puppeteer and Bright Data.
 *
 * Modules:
 * - src/config.ts   EnvConfig service (Config recipes + layer)
 * - src/errors.ts   typed tagged errors
 * - src/browser.ts  Puppeteer adapter (browser/page lifecycle, proxy auth)
 * - src/scraper.ts  Scraper service (pacing, retry policy, parsing)
 *
 * CAPTCHA solving and proxy rotation are handled automatically by Bright Data.
 */

import { BunRuntime } from "@effect/platform-bun"
import { Effect, Layer } from "effect"
import { config as loadDotenv } from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { EnvConfigLive } from "./src/config"
import { Scraper, ScraperLive } from "./src/scraper"

// Load .env before the ConfigProvider reads the environment (startup boundary only).
const __dirname = dirname(fileURLToPath(import.meta.url))
loadDotenv({ path: join(__dirname, "../../.env") })

const program = Effect.gen(function* () {
  const scraper = yield* Scraper
  const result = yield* scraper.fetchPage()

  yield* Effect.logInfo("Scraping successful!")
  yield* Effect.log(JSON.stringify(result, null, 2))
})

const MainLive = ScraperLive.pipe(Layer.provide(EnvConfigLive))

program.pipe(Effect.provide(MainLive), BunRuntime.runMain)
