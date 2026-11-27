import { serverErrorCopy } from "./server-error-copy";
import i18n from "i18next";
import englishErrors from "../i18n/errors/en.json";

/**
 * Shared error classification and user-facing copy.
 *
 * Every surface that reacts to a failed request asks two questions: "is this a
 * blip that will fix itself?" and "what do I tell the user?". This module is
 * the single answer to both, so retry policy, the connectivity banner, toasts,
 * and inline errors agree with each other.
 *
 * Classification is structural on purpose: it reads `status`, `code`, `body`,
 * and `name` instead of importing `ApiError`/`ApiUnavailableError`, so the API
 * client can depend on this module without an import cycle, and errors thrown
 * by hand-rolled fetches (health, uploads) classify the same way.
 */

export type ErrorKind =
  | "transient"
  | "auth"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "invalid"
  | "aborted"
  | "unknown";

export interface ErrorDescription {
  title: string;
  body: string;
  /** True when trying the same request again later can succeed. */
  retryable: boolean;
}

export interface DescribeErrorOptions {
  /** What the user was doing, as a verb phrase: "save the comment". */
  action?: string;
}

/** HTTP statuses that mean "the server or a proxy will likely recover". */
const TRANSIENT_STATUSES = new Set([408, 425, 429, 502, 503, 504]);

/**
 * Error codes that mean "temporarily unavailable" regardless of the HTTP status
 * they arrive with. The Cloud gateway has sent `tenant_app_unavailable` with
 * non-5xx statuses, so these are matched by code, never by status alone.
 */
const TRANSIENT_CODES = new Set([
  "tenant_app_unavailable",
  "tenant_app_starting",
  // Plugin bridge (`PluginBridgeErrorCode`).
  "WORKER_UNAVAILABLE",
  "TIMEOUT",
]);

/** Transient errors that say "the whole server is unreachable", not one route. */
const CONNECTIVITY_STATUSES = new Set([502, 503, 504]);
const CONNECTIVITY_CODES = new Set(["tenant_app_unavailable", "tenant_app_starting"]);

// --- Copy table ---------------------------------------------------------------
//
// The only place user-facing error copy lives. Keys are server error codes (the
// raw `body.error`/`body.code`) or an `ErrorKind` fallback. Never return a raw
// code to the user: anything not in this table falls back to its kind's copy.

const CODE_KEYS = new Set(["tenant_app_unavailable", "tenant_app_starting", "WORKER_UNAVAILABLE", "TIMEOUT", "interaction_audience_denied", "interaction_forbidden", "interaction_settled", "interaction_submit_failed"]);
const KIND_KEYS = new Set<ErrorKind>(["transient", "auth", "forbidden", "not_found", "conflict", "invalid", "aborted", "unknown"]);

function errorText(key: string, fallback: string): string {
  return i18n.isInitialized ? i18n.t(key, { ns: "errors", defaultValue: fallback }) : fallback;
}

export function retryErrorText(): string {
  return errorText("retry", englishErrors.retry);
}

export function errorCopy(key: string): { title: string; body: string } {
  type CopyKey = Exclude<keyof typeof englishErrors, "actions" | "actionFailed" | "retry">;
  const known = CODE_KEYS.has(key) || KIND_KEYS.has(key as ErrorKind) ? key as CopyKey : "unknown";
  return {
    title: errorText(`${known}.title`, englishErrors[known].title),
    body: errorText(`${known}.body`, englishErrors[known].body),
  };
}

function failedActionTitle(action: string): string {
  if (!i18n.isInitialized) return `Couldn't ${action}`;
  const label = Object.hasOwn(englishErrors.actions, action) ? errorText(`actions.${action}`, action) : action;
  return i18n.t("actionFailed", { ns: "errors", defaultValue: englishErrors.actionFailed, action: label });
}

// --- Field extraction -------------------------------------------------------------

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** The HTTP status an error carries, if any. */
export function errorStatus(err: unknown): number | null {
  const status = record(err)?.status;
  return typeof status === "number" && Number.isFinite(status) ? status : null;
}

/**
 * Every server-provided code on an error: `ApiError.code` (the raw
 * `body.error`), `body.code`, and `body.details.code`. Plugin bridge errors put
 * their code on `body.code`; HttpErrors put a machine code on `details.code`.
 */
export function errorCodes(err: unknown): string[] {
  const error = record(err);
  if (!error) return [];
  const body = record(error.body);
  const codes = [
    stringField(error.code),
    stringField(body?.error),
    stringField(body?.code),
    stringField(record(body?.details)?.code),
  ];
  return [...new Set(codes.filter((code): code is string => code !== null))];
}

/**
 * True for a machine code (`tenant_app_unavailable`, `WORKER_UNAVAILABLE`,
 * `TIMEOUT`) rather than a sentence a person wrote. Single readable words such
 * as "Forbidden" are not codes.
 */
export function isRawErrorCode(value: string): boolean {
  const text = value.trim();
  if (!text || /\s/.test(text)) return false;
  return KIND_KEYS.has(text as ErrorKind) || text === "unauthorized"
    || /^[A-Za-z0-9]+(?:[_.][A-Za-z0-9]+)+$/.test(text) || /^[A-Z][A-Z0-9_]{2,}$/.test(text);
}

/** A server message that is safe to show: not a raw code, not a generic status line. */
function readableServerMessage(err: unknown): string | null {
  const error = record(err);
  const response = record(error?.body);
  const raw = stringField(response?.error);
  const status = errorStatus(err);
  const candidates = [
    stringField(response?.message),
    raw && status !== null ? serverErrorCopy(status, raw) : raw,
  ];
  if (err instanceof Error) candidates.push(stringField(err.message));
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (isRawErrorCode(candidate)) continue;
    if (/^Request failed: \d+$/.test(candidate)) continue;
    if (candidate === englishErrors.transient.body) continue;
    return candidate;
  }
  return null;
}

// --- Classification ---------------------------------------------------------------

function isAbortError(err: unknown): boolean {
  const name = record(err)?.name;
  return name === "AbortError" || name === "CancelledError";
}

function isNetworkTypeError(err: unknown): boolean {
  // Fetch uses different network-failure messages across browsers. Do not
  // classify arbitrary TypeErrors (programming bugs) as outages.
  return err instanceof TypeError && /fetch|network|load failed/i.test(err.message);
}

function isApiUnavailableError(err: unknown): boolean {
  return record(err)?.name === "ApiUnavailableError";
}

export function classifyError(err: unknown): ErrorKind {
  if (err === null || err === undefined) return "unknown";
  if (isAbortError(err)) return "aborted";
  if (isApiUnavailableError(err) || isNetworkTypeError(err)) return "transient";
  if (errorCodes(err).some((code) => TRANSIENT_CODES.has(code))) return "transient";

  const status = errorStatus(err);
  if (status === null) return "unknown";
  if (TRANSIENT_STATUSES.has(status)) return "transient";
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404 || status === 410) return "not_found";
  if (status === 409 || status === 412) return "conflict";
  if (status >= 400 && status < 500) return "invalid";
  return "unknown";
}

export function isTransientError(err: unknown): boolean {
  return classifyError(err) === "transient";
}

/**
 * A transient error that means the server as a whole is unreachable (network
 * drop, proxy 5xx, gateway "app unavailable"), as opposed to one route being
 * busy (429, a plugin worker restarting). Only these move the app-wide
 * connectivity state; per-route blips are left to query retry.
 */
export function isConnectivityError(err: unknown): boolean {
  if (isApiUnavailableError(err) || isNetworkTypeError(err)) return true;
  if (errorCodes(err).some((code) => CONNECTIVITY_CODES.has(code))) return true;
  const status = errorStatus(err);
  if (status === null || !CONNECTIVITY_STATUSES.has(status)) return false;
  // A plugin worker 503 is one route, not the server.
  return !errorCodes(err).some((code) => TRANSIENT_CODES.has(code) && !CONNECTIVITY_CODES.has(code));
}

/** HTTP 4xx other than the transient ones; retrying the same request cannot help. */
export function isClientError(err: unknown): boolean {
  const kind = classifyError(err);
  return kind === "auth" || kind === "forbidden" || kind === "not_found" || kind === "conflict" || kind === "invalid";
}

// --- Retry-After --------------------------------------------------------------------

const MAX_RETRY_AFTER_MS = 5 * 60_000;

/** Parse an HTTP `Retry-After` value (delta-seconds or HTTP-date) into milliseconds. */
export function parseRetryAfter(value: string | null | undefined, now = Date.now()): number | null {
  if (!value) return null;
  const text = value.trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return Math.min(Math.round(Number(text) * 1000), MAX_RETRY_AFTER_MS);
  }
  const date = Date.parse(text);
  if (Number.isNaN(date)) return null;
  return Math.min(Math.max(0, date - now), MAX_RETRY_AFTER_MS);
}

/** The server-requested delay carried by an error, if any. */
export function errorRetryAfterMs(err: unknown): number | null {
  const value = record(err)?.retryAfterMs;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

// --- Copy -----------------------------------------------------------------------------

/**
 * User-facing copy for any error. Never returns a raw `snake_case` code:
 * known codes use the table above, readable server messages pass through for
 * client errors, and everything else uses the copy for its kind.
 */
export function describeError(err: unknown, options: DescribeErrorOptions = {}): ErrorDescription {
  const kind = classifyError(err);
  const retryable = kind === "transient" || kind === "unknown";
  const code = errorCodes(err).find((entry) => CODE_KEYS.has(entry));
  const coded = code ? errorCopy(code) : undefined;
  const fallback = errorCopy(kind);

  let body: string;
  if (coded) body = coded.body;
  else if (kind === "transient" || kind === "aborted") body = fallback.body;
  else body = readableServerMessage(err) ?? fallback.body;

  const title = options.action && kind !== "transient"
    ? failedActionTitle(options.action)
    : (coded?.title ?? fallback.title);
  return { title, body, retryable };
}

/**
 * The `message` for an `ApiError` built from an HTTP response: the server's own
 * text when it is readable, otherwise copy from the table. Keeps raw codes out
 * of every `{error.message}` render and `toast(err.message)` call.
 */
export function apiErrorMessage(status: number, body: unknown): string {
  const raw = stringField(record(body)?.error);
  if (raw && !isRawErrorCode(raw)) return serverErrorCopy(status, raw);
  return describeError({ status, body, code: raw }).body;
}
