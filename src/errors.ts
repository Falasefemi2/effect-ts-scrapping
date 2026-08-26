import { Schema } from "effect"

export class NetworkError extends Schema.TaggedError<NetworkError>()("NetworkError", {
  message: Schema.String,
  url: Schema.String,
  cause: Schema.optionalKey(Schema.Defect()),
}) {}

export class TimeoutError extends Schema.TaggedError<TimeoutError>()("TimeoutError", {
  message: Schema.String,
  url: Schema.String,
  timeout: Schema.optionalKey(Schema.Finite),
}) {}

export class RateLimitError extends Schema.TaggedError<RateLimitError>()("RateLimitError", {
  message: Schema.String,
  url: Schema.String,
  retryAfter: Schema.optionalKey(Schema.Finite),
}) {}

export class IPBlockError extends Schema.TaggedError<IPBlockError>()("IPBlockError", {
  message: Schema.String,
  url: Schema.String,
  proxyId: Schema.optionalKey(Schema.String),
}) {}

export class ParseError extends Schema.TaggedError<ParseError>()("ParseError", {
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

export class BrowserError extends Schema.TaggedError<BrowserError>()("BrowserError", {
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

export type ScrapingError = NetworkError | TimeoutError | RateLimitError | IPBlockError | BrowserError | ParseError
