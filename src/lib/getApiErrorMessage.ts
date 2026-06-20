/**
 * Centralized API-error → friendly-message mapping.
 *
 * Turns ANY error coming out of RTK Query (`FetchBaseQueryError`, a thrown
 * `Error`, a string, or a serialized error) into a short, human-readable
 * message safe to show the user. It deliberately NEVER surfaces raw transport
 * noise such as "Aborted", "AbortError", "Network request failed" or
 * "TypeError: ..." — those become a clear "can't reach the server" message.
 *
 * The server already returns friendly `{ message, errorCode }` bodies, so for
 * real HTTP responses we prefer the backend's own message.
 */

/** Raw low-level transport strings that must never reach the user verbatim. */
const TRANSPORT_NOISE =
  /^(aborted|abort(ed)?error|the network connection was lost|network request failed|failed to fetch|load failed|typeerror|the request timed out)\b/i;

const NETWORK_MESSAGE =
  "Can't reach the server. Check your internet connection and try again.";
const TIMEOUT_MESSAGE =
  "The request timed out. Check your connection and try again.";
const SERVER_MESSAGE =
  "The server ran into a problem. Please try again in a moment.";

function messageForStatus(status: number, fallback: string): string {
  if (status >= 500) return SERVER_MESSAGE;
  switch (status) {
    case 400:
      return "Some of the details aren't valid. Please check and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 408:
      return TIMEOUT_MESSAGE;
    case 409:
      return "That conflicts with something that already exists.";
    case 413:
      return "That request is too large.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return fallback;
  }
}

/** Pull the backend's own message out of a response body, if it's usable. */
function pickBackendMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const raw = d.message ?? d.error ?? d.detail;

  if (Array.isArray(raw)) {
    const joined = raw
      .map((x) => (typeof x === "string" ? x : (x as any)?.message))
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .join("\n");
    return joined || undefined;
  }
  if (typeof raw === "string" && raw.trim() && !TRANSPORT_NOISE.test(raw.trim())) {
    return raw;
  }
  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error == null) return fallback;

  if (typeof error === "string") {
    return TRANSPORT_NOISE.test(error.trim()) ? NETWORK_MESSAGE : error;
  }

  const err = error as Record<string, any>;
  const status = err.status;

  // Transport-level failures (no HTTP response was received).
  if (status === "FETCH_ERROR") return NETWORK_MESSAGE;
  if (status === "TIMEOUT_ERROR") return TIMEOUT_MESSAGE;
  if (status === "PARSING_ERROR") {
    const original = err.originalStatus as number | undefined;
    if (original === 401) return "Your session has expired. Please sign in again.";
    if (typeof original === "number" && original >= 500) return SERVER_MESSAGE;
    return fallback;
  }

  // HTTP response with a body — prefer the backend's own message.
  const backendMessage = pickBackendMessage(err.data);
  if (backendMessage) return backendMessage;

  if (typeof status === "number") return messageForStatus(status, fallback);

  // Plain Error / unknown shape — sanitize any transport noise.
  const raw = err?.data?.message ?? err?.message ?? err?.error;
  if (typeof raw === "string" && raw.trim()) {
    return TRANSPORT_NOISE.test(raw.trim()) ? NETWORK_MESSAGE : raw;
  }

  return fallback;
}

/**
 * Extract server-side field-level validation errors (the Zod handler returns
 * `errors: [{ field, message }]`) into a `{ field: message }` map. Returns an
 * empty object when there are none — callers use this for inline field errors
 * and fall back to a toast for everything else.
 */
export function getServerFieldErrors(error: unknown): Record<string, string> {
  const err = error as Record<string, any>;
  const list =
    err?.data?.errors ??
    err?.errors ??
    (Array.isArray(err?.data?.message) ? err.data.message : []);

  const out: Record<string, string> = {};
  if (!Array.isArray(list)) return out;

  for (const item of list) {
    const rawField = item?.field ?? item?.path ?? item?.param;
    const field = Array.isArray(rawField) ? rawField.join(".") : rawField;
    const message = item?.message ?? item?.msg;
    if (typeof field === "string" && typeof message === "string") {
      out[field] = message;
    }
  }
  return out;
}
