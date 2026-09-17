const OWNER_KEY_STORAGE = 'protrux_owner_key';

/** Stable per-browser owner id used for private docs and access changes. */
export function getOwnerKey(): string {
  try {
    let key = localStorage.getItem(OWNER_KEY_STORAGE);
    if (!key) {
      key =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? `own-${crypto.randomUUID()}`
          : `own-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(OWNER_KEY_STORAGE, key);
    }
    return key;
  } catch {
    return `own-ephemeral-${Date.now()}`;
  }
}

export function ownerHeaders(): Record<string, string> {
  return { 'X-Owner-Key': getOwnerKey() };
}
