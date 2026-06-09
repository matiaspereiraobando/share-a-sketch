const STORAGE_KEY = "sas:anonId";

/**
 * Get-or-create the anonymous browser id. Persisted in localStorage so the
 * same browser is consistent across reloads (which lets the server dedupe
 * votes and enforce share rate-limits). Falls back to an in-memory id if
 * storage is unavailable.
 */
let memoryId: string | null = null;

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

export function getAnonId(): string {
  if (typeof window === "undefined") {
    if (!memoryId) memoryId = generateId();
    return memoryId;
  }
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    if (!memoryId) memoryId = generateId();
    return memoryId;
  }
}
