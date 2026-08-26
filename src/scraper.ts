import { Context, Effect, Layer, Schedule, Schema } from "effect"
import * as cheerio from "cheerio"
import { buildProxyConfig, fetchHtml } from "./browser"
import { EnvConfig } from "./config"
import { ParseError, type ScrapingError } from "./errors"

const PACING_DELAY_MILLIS = 100
const DEFAULT_TIMEOUT_MILLIS = 30_000

export const ScrapingResult = Schema.Struct({
  title: Schema.String,
  spans: Schema.Array(Schema.String),
  url: Schema.String,
})

export interface ScrapingResult extends Schema.Schema.Type<typeof ScrapingResult> {}

const extractCandidate = (html: string, url: string) => {
  const $ = cheerio.load(html)
  return {
    title: $("h1").text().trim(),
    spans: $("span")
      .map((_index, element) => $(element).text().trim())
      .get()
      .filter((text) => text.length > 0),
    url,
  }
}

const parseHtml = (html: string, url: string): Effect.Effect<ScrapingResult, ParseError> =>
  Effect.gen(function* () {
    const candidate = yield* Effect.try({
      try: () => extractCandidate(html, url),
      catch: (cause) => new ParseError({ message: "Failed to parse HTML", cause }),
    })

    return yield* Schema.decodeEffect(ScrapingResult)(candidate).pipe(
      Effect.mapError(
        (issue) =>
          new ParseError({
            message: "Parsed HTML does not match ScrapingResult",
            cause: issue,
          }),
      ),
    )
  })

// Exponential backoff starting at 1s, capped at 3 retries. Jitter avoids synchronized retry storms.
const retryPolicy = Schedule.max([Schedule.exponential("1 seconds"), Schedule.recurs(3)]).pipe(Schedule.jittered)

// Network errors, timeouts, rate limits, IP blocks, and browser errors are transient.
// The scrape step's error channel excludes ParseError, so only transient failures reach the schedule.
const fetchHtmlWithPacingAndRetry = (url: string, proxyConfig: Parameters<typeof fetchHtml>[0]["proxyConfig"]) =>
  fetchHtml({ url, proxyConfig, timeoutMillis: DEFAULT_TIMEOUT_MILLIS }).pipe(
    Effect.delay(PACING_DELAY_MILLIS),
    Effect.retry(retryPolicy),
  )

export class Scraper extends Context.Service<
  Scraper,
  {
    readonly fetchPage: (url?: string) => Effect.Effect<ScrapingResult, ScrapingError>
  }
>()("data-ingestion/scraper/Scraper") {}

export const ScraperLive = Layer.effect(
  Scraper,
  Effect.gen(function* () {
    const env = yield* EnvConfig

    const fetchPage = Effect.fn("Scraper.fetchPage")(function* (requestedUrl?: string) {
      const url = requestedUrl ?? env.targetUrl
      const html = yield* fetchHtmlWithPacingAndRetry(url, buildProxyConfig(env))
      return yield* parseHtml(html, url)
    })

    return Scraper.of({ fetchPage })
  }),
)
