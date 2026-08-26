import { Config, Context, Effect, Layer, Option, Redacted } from "effect"

const DEFAULT_TARGET_URL = "https://quotes.toscrape.com/js/"
const BRIGHT_DATA_PROXY_HOST = "brd.superproxy.io"
const BRIGHT_DATA_PROXY_PORT = 33335

export interface BrightDataCredentials {
  readonly customerId: string
  readonly zone: string
  readonly password: Redacted.Redacted
}

export class EnvConfig extends Context.Service<
  EnvConfig,
  {
    readonly targetUrl: string
    readonly proxyHost: string
    readonly proxyPort: number
    readonly brightDataCredentials: Option.Option<BrightDataCredentials>
  }
>()("data-ingestion/config/EnvConfig") {}

export const EnvConfigLive = Layer.effect(
  EnvConfig,
  Effect.gen(function* () {
    const targetUrl = yield* Config.nonEmptyString("TARGET_URL").pipe(Config.withDefault(DEFAULT_TARGET_URL))
    const brightDataCustomerId = yield* Config.option(Config.nonEmptyString("BRIGHT_DATA_CUSTOMER_ID"))
    const brightDataZone = yield* Config.option(Config.nonEmptyString("BRIGHT_DATA_ZONE"))
    const brightDataPassword = yield* Config.option(Config.redacted("BRIGHT_DATA_PASSWORD"))

    const brightDataCredentials = Option.all({
      customerId: brightDataCustomerId,
      zone: brightDataZone,
      password: brightDataPassword,
    })

    return EnvConfig.of({
      targetUrl,
      proxyHost: BRIGHT_DATA_PROXY_HOST,
      proxyPort: BRIGHT_DATA_PROXY_PORT,
      brightDataCredentials,
    })
  }),
)
