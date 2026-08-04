/**
 * Recursively enriches JSON objects and arrays with a `lastUpdatedAt` ISO date field
 * on every object and section level so SEO indexing and time tracking is accurate.
 */
export function enrichJsonWithTimestamps(
  data: unknown,
  timestamp?: string | Date | null
): any {
  if (data === null || data === undefined) {
    return data;
  }

  const isoString = timestamp
    ? typeof timestamp === "string"
      ? timestamp
      : timestamp.toISOString()
    : new Date().toISOString();

  if (Array.isArray(data)) {
    return data.map((item) => enrichJsonWithTimestamps(item, isoString));
  }

  if (typeof data === "object" && !(data instanceof Date)) {
    const rawObj = data as Record<string, any>;
    const result: Record<string, any> = {};

    // Keep existing timestamp or use current fallback
    const currentTimestamp =
      rawObj.lastUpdatedAt || rawObj.updatedAt || isoString;

    result.lastUpdatedAt =
      typeof currentTimestamp === "string" ? currentTimestamp : isoString;

    for (const [key, value] of Object.entries(rawObj)) {
      if (key === "lastUpdatedAt" || key === "updatedAt") continue;

      if (value !== null && typeof value === "object") {
        result[key] = enrichJsonWithTimestamps(value, isoString);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return data;
}
