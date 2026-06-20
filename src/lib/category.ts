// Junk values that must never be shown as a real category or saved to a
// transaction. These leaked into older data (e.g. a category literally named
// "undefined") and are filtered out on the client as a defensive measure in
// addition to the server-side cleanup.
const INVALID_CATEGORY_NAMES = ["undefined", "null"];

/**
 * Returns true when `name` is a usable category name (non-empty and not a
 * known junk placeholder). Comparison is trimmed and case-insensitive.
 *
 * Note: "Uncategorized" is intentionally allowed — the API uses it as the
 * fallback category for transactions whose category was deleted.
 */
export const isValidCategoryName = (name?: string | null): boolean => {
  const normalized = (name ?? "").trim().toLowerCase();
  return normalized.length > 0 && !INVALID_CATEGORY_NAMES.includes(normalized);
};
