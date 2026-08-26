import { Effect, Option, Redacted } from "effect"
import puppeteer, { type Browser, type Page } from "puppeteer"
import { EnvConfig } from "./config"
import { BrowserError, IPBlockError, NetworkError, RateLimitError, TimeoutError, type ScrapingError } from "./errors"

export interface ProxyConfig {
  readonly host: string
  readonly port: number
  readonly username: string
  readonly password: string
}

// Bright Data automatically rotates IPs on each request, so retrying on IP block gets a new IP.
// If credentials are not fully configured, scraping runs without proxy.
export const buildProxyConfig = (env: EnvConfig["Service"]): ProxyConfig | null => {
  if (Option.isNone(env.brightDataCredentials)) {
    return null
  }
  const { customerId, zone, password } = env.brightDataCredentials.value
  return {
    host: env.proxyHost,
    port: env.proxyPort,
    username: `brd-customer-${customerId}-zone-${zone}`,
    password: Redacted.value(password),
  }
}

const launchBrowser = (proxyConfig: ProxyConfig | null): Effect.Effect<Browser, BrowserError> =>
  Effect.tryPromise({
    try: async () => {
      const args = ["--no-sandbox", "--disable-setuid-sandbox"]

      if (proxyConfig) {
        // disable SSL validation for the Bright Data proxy
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
        args.push(`--proxy-server=${proxyConfig.host}:${proxyConfig.port}`)
      }

      return await puppeteer.launch({
        headless: true,
        args,
        acceptInsecureCerts: !!proxyConfig,
      })
    },
    catch: (cause) =>
      new BrowserError({
        message: proxyConfig ? "Failed to launch browser with Bright Data proxy" : "Failed to launch browser",
        cause,
      }),
  })

const openPage = (browser: Browser, proxyConfig: ProxyConfig | null): Effect.Effect<Page, BrowserError> =>
  Effect.tryPromise({
    try: async () => {
      const page = await browser.newPage()
      if (proxyConfig) {
        await page.authenticate({
          username: proxyConfig.username,
          password: proxyConfig.password,
        })
      }
      return page
    },
    catch: (cause) =>
      new BrowserError({
        message: "Failed to create page or authenticate",
        cause,
      }),
  })

const navigationTimeoutPattern = /timeout/i

const classifyNavigationFailure = (cause: unknown, url: string, timeoutMillis: number): ScrapingError => {
  if (cause instanceof Error && navigationTimeoutPattern.test(cause.message)) {
    return new TimeoutError({
      message: `Navigation timeout after ${timeoutMillis}ms`,
      url,
      timeout: timeoutMillis,
    })
  }
  return new BrowserError({
    message: "Failed to navigate or get content",
    cause,
  })
}

const MIN_PROXY_NAVIGATION_TIMEOUT_MILLIS = 30_000

const navigateAndGetContent = (page: Page, url: string, timeoutMillis: number) =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        page.goto(url, {
          waitUntil: "networkidle2", // use 'load' if 'networkidle2' fails - proxies can have background requests that never stop
          timeout: Math.max(timeoutMillis, MIN_PROXY_NAVIGATION_TIMEOUT_MILLIS),
        }),
      catch: (cause) => classifyNavigationFailure(cause, url, timeoutMillis),
    })

    if (response) {
      const status = response.status()
      if (status === 429) {
        return yield* new RateLimitError({ message: `Rate limited: ${url}`, url })
      }
      if (status === 403) {
        return yield* new IPBlockError({ message: `IP blocked: ${url}`, url })
      }
      if (status >= 400) {
        return yield* new NetworkError({ message: `HTTP error ${status}: ${url}`, url })
      }
    }

    return yield* Effect.tryPromise({
      try: () => page.content(),
      catch: (cause) => new BrowserError({ message: "Failed to get page content", cause }),
    })
  })

const quietly = <A>(effect: Effect.Effect<A, unknown>): Effect.Effect<void> =>
  effect.pipe(Effect.catch(() => Effect.void))

const closePageQuietly = (page: Page): Effect.Effect<void> =>
  quietly(
    Effect.tryPromise({
      try: () => page.close(),
      catch: (cause) => new BrowserError({ message: "Failed to close page", cause }),
    }),
  )

const closeBrowserQuietly = (browser: Browser): Effect.Effect<void> =>
  quietly(
    Effect.tryPromise({
      try: () => browser.close(),
      catch: (cause) => new BrowserError({ message: "Failed to close browser", cause }),
    }),
  )

const pageContent = (browser: Browser, url: string, proxyConfig: ProxyConfig | null, timeoutMillis: number) =>
  Effect.acquireUseRelease(
    openPage(browser, proxyConfig),
    (page) => navigateAndGetContent(page, url, timeoutMillis),
    closePageQuietly,
  )

export interface FetchHtmlOptions {
  readonly url: string
  readonly proxyConfig: ProxyConfig | null
  readonly timeoutMillis?: number | undefined
}

// Fetches raw HTML for a URL. Manages the browser lifecycle via acquireUseRelease:
// acquire launches the browser, use navigates and reads content, release always closes it.
export const fetchHtml = Effect.fn("Browser.fetchHtml")(function* (options: FetchHtmlOptions) {
  const { url, proxyConfig, timeoutMillis = 10_000 } = options

  return yield* Effect.acquireUseRelease(
    launchBrowser(proxyConfig),
    (browser) => pageContent(browser, url, proxyConfig, timeoutMillis),
    closeBrowserQuietly,
  )
})
